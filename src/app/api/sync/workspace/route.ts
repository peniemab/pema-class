import { NextRequest, NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getImpayesPageData, getImpayesRecouvrementPageData } from '@/lib/db/impayes-page';
import {
  getCashJournalReport,
  getEnrollmentReport,
  getImpayesReportData,
  getRapportsHubPreview,
} from '@/lib/db/finance-reports';
import { getAttendanceReportData } from '@/lib/db/attendance-reports';
import {
  getRepeatedAbsencesReport,
  getStudentAttendanceHistory,
  getWeeklyAttendanceReport,
} from '@/lib/db/attendance-reports-ext';
import { loadReferentialsPageData } from '@/lib/school/referentials-actions';
import { loadSchoolSettingsForDirection } from '@/lib/school/settings-actions';
import { loadTeamPageData } from '@/lib/school/team-actions';
import { isWorkspaceOverlayHref, normalizeWorkspaceHref } from '@/lib/navigation/workspace-overlay-routes';

export const dynamic = 'force-dynamic';

/** Charge les données d'une route workspace (rapports, paramètres, etc.). */
export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get('href') ?? '';
  const path = normalizeWorkspaceHref(href);

  if (!isWorkspaceOverlayHref(href)) {
    return NextResponse.json({ error: 'Route non supportée' }, { status: 404 });
  }

  const { schoolId } = await requireSchoolDirection();
  const params = Object.fromEntries(
    new URL(href, 'http://local').searchParams.entries(),
  );

  try {
    switch (path) {
      case '/school/rapports': {
        const preview = await getRapportsHubPreview(schoolId);
        const todayPresences = await getAttendanceReportData(schoolId, {});
        const presencesIssues = todayPresences
          ? todayPresences.totals.absent +
            todayPresences.totals.late +
            todayPresences.totals.unmarked
          : null;
        return NextResponse.json({
          view: 'rapports-hub',
          data: { ...preview, presencesIssues },
        });
      }
      case '/school/rapports/effectifs': {
        const data = await getEnrollmentReport(schoolId);
        return NextResponse.json({ view: 'effectifs', data });
      }
      case '/school/rapports/caisse/journal': {
        const data = await getCashJournalReport(schoolId, params);
        return NextResponse.json({ view: 'cash-journal', data });
      }
      case '/school/rapports/impayes/synthese': {
        const data = await getImpayesReportData(schoolId, params);
        return NextResponse.json({ view: 'impayes-synthese', data });
      }
      case '/school/rapports/impayes/liste': {
        const data = await getImpayesReportData(schoolId, params);
        return NextResponse.json({ view: 'impayes-liste', data, search: params.q });
      }
      case '/school/rapports/presences': {
        const data = await getAttendanceReportData(schoolId, params);
        return NextResponse.json({ view: 'presences-hub', data });
      }
      case '/school/rapports/presences/jour': {
        const data = await getAttendanceReportData(schoolId, params);
        return NextResponse.json({ view: 'presences-jour', data });
      }
      case '/school/rapports/presences/hebdo': {
        const data = await getWeeklyAttendanceReport(schoolId, params);
        return NextResponse.json({ view: 'presences-hebdo', data });
      }
      case '/school/rapports/presences/absences-repetees': {
        const data = await getRepeatedAbsencesReport(schoolId, params);
        return NextResponse.json({ view: 'presences-absences', data });
      }
      case '/school/rapports/presences/eleve': {
        const data = await getStudentAttendanceHistory(schoolId, params);
        return NextResponse.json({ view: 'presences-eleve', data });
      }
      case '/school/parametres': {
        const [school, referentials, team] = await Promise.all([
          loadSchoolSettingsForDirection(),
          loadReferentialsPageData(),
          loadTeamPageData(),
        ]);
        return NextResponse.json({ view: 'parametres', data: { school, referentials, team } });
      }
      case '/school/impayes': {
        const data = await getImpayesPageData(schoolId, params);
        return NextResponse.json({ view: 'impayes', data });
      }
      default: {
        if (path.startsWith('/school/impayes/recouvrement')) {
          const data = await getImpayesRecouvrementPageData(schoolId, params);
          if (!data) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
          }
          return NextResponse.json({ view: 'recouvrement', data });
        }
        return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Échec du chargement' }, { status: 500 });
  }
}
