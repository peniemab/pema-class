'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  buildWorkspaceHref,
  reportsBaseForHref,
} from '@/lib/navigation/workspace-route-utils';
import { reportHref } from '@/lib/navigation/reports-paths';
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
  href: string;
};

export function PresencesHubLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const reportsBase = reportsBaseForHref(href);
  const workspaceHref = reportHref(reportsBase, 'presences');

  const data = useWorkspaceReportData<AttendanceReportData>({
    schoolId,
    metaScope: 'school-presences-hub',
    workspaceHref,
    view: 'presences-hub',
    buildLocal: () =>
      buildAttendanceReportFromAppData(appData, { date: todayIsoDate() }),
  });

  if (!data) return <ReportSkeleton />;
  return <PresencesReportsHub todayPreview={data} reportsBase={reportsBase} />;
}

type DateClassFilters = {
  date?: string;
  classId?: string;
};

function parseDateClassFilters(href: string): DateClassFilters {
  const params = parseHrefParams(href);
  return {
    date: params.get('date') ?? undefined,
    classId: params.get('classe') ?? undefined,
  };
}

function DateClassReportLive<T>({
  schoolId,
  href,
  segment,
  view,
  metaPrefix,
  buildLocal,
  render,
}: {
  schoolId: string;
  href: string;
  segment: string;
  view: string;
  metaPrefix: string;
  buildLocal: (filters: DateClassFilters) => T | null;
  render: (
    data: T,
    reportsBase: string,
    onFiltersChange: (p: { date?: string; classe?: string }) => void,
  ) => ReactNode;
}) {
  const reportsBase = reportsBaseForHref(href);
  const basePath = reportHref(reportsBase, 'presences', segment);
  const [filters, setFilters] = useState<DateClassFilters>(() =>
    parseDateClassFilters(href),
  );

  useEffect(() => {
    setFilters(parseDateClassFilters(href));
  }, [href]);

  const workspaceHref = useMemo(
    () =>
      buildWorkspaceHref(basePath, {
        date: filters.date,
        classe: filters.classId,
      }),
    [basePath, filters],
  );

  const data = useWorkspaceReportData<T>({
    schoolId,
    metaScope: `${metaPrefix}:${JSON.stringify(filters)}`,
    workspaceHref,
    view,
    buildLocal: () => buildLocal(filters),
    deps: [filters.date, filters.classId],
  });

  const onFiltersChange = useCallback((next: { date?: string; classe?: string }) => {
    setFilters((prev) => ({
      date: next.date !== undefined ? next.date : prev.date,
      classId: next.classe !== undefined ? next.classe : prev.classId,
    }));
  }, []);

  if (!data) return <ReportSkeleton />;
  return <>{render(data, reportsBase, onFiltersChange)}</>;
}

export function PresencesJourLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  return (
    <DateClassReportLive<AttendanceReportData>
      schoolId={schoolId}
      href={href}
      segment="jour"
      view="presences-jour"
      metaPrefix="school-presences-jour"
      buildLocal={(filters) =>
        buildAttendanceReportFromAppData(appData, {
          date: filters.date,
          classId: filters.classId,
        })
      }
      render={(data, reportsBase, onFiltersChange) => (
        <PresencesReportPageView
          data={data}
          reportsBase={reportsBase}
          onFiltersChange={onFiltersChange}
        />
      )}
    />
  );
}

export function PresencesHebdoLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  return (
    <DateClassReportLive<WeeklyAttendanceReportData>
      schoolId={schoolId}
      href={href}
      segment="hebdo"
      view="presences-hebdo"
      metaPrefix="school-presences-hebdo"
      buildLocal={(filters) =>
        buildWeeklyAttendanceReportFromAppData(appData, {
          date: filters.date,
          classId: filters.classId,
        })
      }
      render={(data, reportsBase, onFiltersChange) => (
        <WeeklyPresencesReportView
          data={data}
          reportsBase={reportsBase}
          onFiltersChange={onFiltersChange}
        />
      )}
    />
  );
}

export function PresencesAbsencesLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const reportsBase = reportsBaseForHref(href);
  const basePath = reportHref(reportsBase, 'presences', 'absences-repetees');
  const [filters, setFilters] = useState(() => parseAbsencesFilters(href));

  useEffect(() => {
    setFilters(parseAbsencesFilters(href));
  }, [href]);

  const workspaceHref = useMemo(
    () =>
      buildWorkspaceHref(basePath, {
        periode: String(filters.periodDays),
        min: String(filters.minAbsences),
        classe: filters.classId,
      }),
    [basePath, filters],
  );

  const data = useWorkspaceReportData<RepeatedAbsencesReportData>({
    schoolId,
    metaScope: `school-presences-absences:${JSON.stringify(filters)}`,
    workspaceHref,
    view: 'presences-absences',
    buildLocal: () =>
      buildRepeatedAbsencesReportFromAppData(appData, {
        periodDays: filters.periodDays,
        minAbsences: filters.minAbsences,
        classId: filters.classId,
      }),
    deps: [filters.periodDays, filters.minAbsences, filters.classId],
  });

  const onFiltersChange = useCallback(
    (params: { periode?: number; min?: number; classe?: string }) => {
      setFilters((prev) => ({
        periodDays: params.periode ?? prev.periodDays,
        minAbsences: params.min ?? prev.minAbsences,
        classId: params.classe !== undefined ? params.classe : prev.classId,
      }));
    },
    [],
  );

  if (!data) return <ReportSkeleton />;
  return (
    <RepeatedAbsencesReportView
      data={data}
      reportsBase={reportsBase}
      onFiltersChange={onFiltersChange}
    />
  );
}

function parseAbsencesFilters(href: string) {
  const params = parseHrefParams(href);
  return {
    periodDays: Number(params.get('periode') ?? '30'),
    minAbsences: Number(params.get('min') ?? '2'),
    classId: params.get('classe') ?? undefined,
  };
}

export function PresencesEleveLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const reportsBase = reportsBaseForHref(href);
  const basePath = reportHref(reportsBase, 'presences', 'eleve');
  const [filters, setFilters] = useState(() => parseHistoryFilters(href));

  useEffect(() => {
    setFilters(parseHistoryFilters(href));
  }, [href]);

  const workspaceHref = useMemo(
    () =>
      buildWorkspaceHref(basePath, {
        eleve: filters.studentId,
        debut: filters.startDate,
        fin: filters.endDate,
      }),
    [basePath, filters],
  );

  const data = useWorkspaceReportData<StudentAttendanceHistoryData>({
    schoolId,
    metaScope: `school-presences-eleve:${JSON.stringify(filters)}`,
    workspaceHref,
    view: 'presences-eleve',
    buildLocal: () =>
      buildStudentAttendanceHistoryFromAppData(appData, {
        studentId: filters.studentId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    deps: [filters.studentId, filters.startDate, filters.endDate],
  });

  const onFiltersChange = useCallback(
    (params: { eleve?: string; debut?: string; fin?: string }) => {
      setFilters((prev) => ({
        studentId: params.eleve !== undefined ? params.eleve : prev.studentId,
        startDate: params.debut !== undefined ? params.debut : prev.startDate,
        endDate: params.fin !== undefined ? params.fin : prev.endDate,
      }));
    },
    [],
  );

  if (!data) return <ReportSkeleton />;
  return (
    <StudentHistoryReportView
      data={data}
      reportsBase={reportsBase}
      onFiltersChange={onFiltersChange}
    />
  );
}

function parseHistoryFilters(href: string) {
  const params = parseHrefParams(href);
  return {
    studentId: params.get('eleve') ?? undefined,
    startDate: params.get('debut') ?? undefined,
    endDate: params.get('fin') ?? undefined,
  };
}
