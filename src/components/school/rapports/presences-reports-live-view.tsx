'use client';

import { PresencesReportsHub } from '@/components/school/rapports/presences-reports-hub';
import { PresencesReportPageView } from '@/components/school/rapports/presences-report-page-view';
import { WeeklyPresencesReportView } from '@/components/school/rapports/weekly-presences-report-view';
import { RepeatedAbsencesReportView } from '@/components/school/rapports/repeated-absences-report-view';
import { StudentHistoryReportView } from '@/components/school/rapports/student-history-report-view';
import type { AttendanceReportData } from '@/lib/db/attendance-reports';
import type {
  RepeatedAbsencesReportData,
  StudentAttendanceHistoryData,
  WeeklyAttendanceReportData,
} from '@/lib/db/attendance-reports-ext';
import { todayIsoDate } from '@/lib/date-utils';
import { useAppData } from '@/lib/offline/app-data-context';
import {
  buildAttendanceReportFromAppData,
  buildRepeatedAbsencesReportFromAppData,
  buildStudentAttendanceHistoryFromAppData,
  buildWeeklyAttendanceReportFromAppData,
} from '@/lib/offline/attendance-report-local';
import {
  parseHrefParams,
  useWorkspaceReportData,
} from '@/lib/offline/use-workspace-report';
import { cn } from '@/lib/utils';

function ReportSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-wa-divider/80" />
      <div className={cn('h-24 animate-pulse rounded-2xl bg-wa-divider/80')} />
      <div className="h-64 animate-pulse rounded-2xl bg-wa-divider/80" />
    </div>
  );
}

type Props = {
  schoolId: string;
};

export function PresencesHubLiveView({ schoolId }: Props) {
  const appData = useAppData();
  const data = useWorkspaceReportData<AttendanceReportData>({
    schoolId,
    metaScope: 'school-presences-hub',
    workspaceHref: '/school/rapports/presences',
    view: 'presences-hub',
    buildLocal: () =>
      buildAttendanceReportFromAppData(appData, { date: todayIsoDate() }),
  });

  if (!data) return <ReportSkeleton />;
  return <PresencesReportsHub todayPreview={data} />;
}

type HrefProps = Props & { href: string };

export function PresencesJourLiveView({ schoolId, href }: HrefProps) {
  const appData = useAppData();
  const params = parseHrefParams(href);
  const date = params.get('date') ?? undefined;
  const classId = params.get('classe') ?? undefined;

  const data = useWorkspaceReportData<AttendanceReportData>({
    schoolId,
    metaScope: `school-presences-jour:${params.toString()}`,
    workspaceHref: href,
    view: 'presences-jour',
    buildLocal: () =>
      buildAttendanceReportFromAppData(appData, { date, classId }),
    deps: [date, classId],
  });

  if (!data) return <ReportSkeleton />;
  return <PresencesReportPageView data={data} />;
}

export function PresencesHebdoLiveView({ schoolId, href }: HrefProps) {
  const appData = useAppData();
  const params = parseHrefParams(href);
  const date = params.get('date') ?? undefined;
  const classId = params.get('classe') ?? undefined;

  const data = useWorkspaceReportData<WeeklyAttendanceReportData>({
    schoolId,
    metaScope: `school-presences-hebdo:${params.toString()}`,
    workspaceHref: href,
    view: 'presences-hebdo',
    buildLocal: () =>
      buildWeeklyAttendanceReportFromAppData(appData, { date, classId }),
    deps: [date, classId],
  });

  if (!data) return <ReportSkeleton />;
  return <WeeklyPresencesReportView data={data} />;
}

export function PresencesAbsencesLiveView({ schoolId, href }: HrefProps) {
  const appData = useAppData();
  const params = parseHrefParams(href);
  const periodDays = Number(params.get('periode') ?? '30');
  const minAbsences = Number(params.get('min') ?? '2');
  const classId = params.get('classe') ?? undefined;

  const data = useWorkspaceReportData<RepeatedAbsencesReportData>({
    schoolId,
    metaScope: `school-presences-absences:${params.toString()}`,
    workspaceHref: href,
    view: 'presences-absences',
    buildLocal: () =>
      buildRepeatedAbsencesReportFromAppData(appData, {
        periodDays,
        minAbsences,
        classId,
      }),
    deps: [periodDays, minAbsences, classId],
  });

  if (!data) return <ReportSkeleton />;
  return <RepeatedAbsencesReportView data={data} />;
}

export function PresencesEleveLiveView({ schoolId, href }: HrefProps) {
  const appData = useAppData();
  const params = parseHrefParams(href);
  const studentId = params.get('eleve') ?? undefined;
  const startDate = params.get('debut') ?? undefined;
  const endDate = params.get('fin') ?? undefined;

  const data = useWorkspaceReportData<StudentAttendanceHistoryData>({
    schoolId,
    metaScope: `school-presences-eleve:${params.toString()}`,
    workspaceHref: href,
    view: 'presences-eleve',
    buildLocal: () =>
      buildStudentAttendanceHistoryFromAppData(appData, {
        studentId,
        startDate,
        endDate,
      }),
    deps: [studentId, startDate, endDate],
  });

  if (!data) return <ReportSkeleton />;
  return <StudentHistoryReportView data={data} />;
}
