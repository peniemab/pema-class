import { createAdminClient } from '@/lib/supabase/admin';
import {
  CYCLE_PERIOD_TYPE,
  CYCLE_DISPLAY_ORDER,
  normalizeSchoolCycles,
  periodLabelsForCycle,
  type PeriodType,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';

export type AcademicYearRow = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: PeriodType;
  cycles: string[] | null;
  is_active: boolean;
  created_at: string;
};

export type PeriodRow = {
  id: string;
  academic_year_id: string;
  cycle: string | null;
  number: number;
  label: string;
  start_date: string;
  end_date: string;
};

function splitDateRange(
  start: Date,
  end: Date,
  parts: number,
): { start: Date; end: Date }[] {
  const totalMs = end.getTime() - start.getTime();
  const segmentMs = totalMs / parts;
  const ranges: { start: Date; end: Date }[] = [];
  for (let i = 0; i < parts; i++) {
    const segStart = new Date(start.getTime() + segmentMs * i);
    const segEnd =
      i === parts - 1 ? end : new Date(start.getTime() + segmentMs * (i + 1) - 86400000);
    ranges.push({ start: segStart, end: segEnd });
  }
  return ranges;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function deriveLegacyPeriodType(cycles: SchoolCycle[]): PeriodType {
  const types = new Set(cycles.map((c) => CYCLE_PERIOD_TYPE[c]));
  if (types.size === 1) {
    return [...types][0];
  }
  return 'trimester';
}

export async function listAcademicYears(
  schoolId: string,
): Promise<AcademicYearRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('academic_years')
    .select(
      'id, school_id, name, start_date, end_date, period_type, cycles, is_active, created_at',
    )
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AcademicYearRow[];
}

export async function getActiveAcademicYear(
  schoolId: string,
): Promise<AcademicYearRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('academic_years')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AcademicYearRow | null) ?? null;
}

/** Id + libellé uniquement — mutations référentiels (léger). */
export async function getActiveAcademicYearLite(
  schoolId: string,
): Promise<{ id: string; name: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('academic_years')
    .select('id, name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { id: string; name: string } | null;
}

export async function listPeriodsForYear(
  academicYearId: string,
): Promise<PeriodRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('periods')
    .select(
      'id, academic_year_id, cycle, number, label, start_date, end_date',
    )
    .eq('academic_year_id', academicYearId)
    .order('cycle', { ascending: true })
    .order('number', { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PeriodRow[];
  return rows.sort((a, b) => {
    const ai = CYCLE_DISPLAY_ORDER.indexOf((a.cycle ?? 'primaire') as SchoolCycle);
    const bi = CYCLE_DISPLAY_ORDER.indexOf((b.cycle ?? 'primaire') as SchoolCycle);
    if (ai !== bi) return ai - bi;
    return a.number - b.number;
  });
}

function buildPeriodRows(
  academicYearId: string,
  start: Date,
  end: Date,
  cycles: SchoolCycle[],
): {
  academic_year_id: string;
  cycle: string;
  number: number;
  label: string;
  start_date: string;
  end_date: string;
}[] {
  const periodRows: {
    academic_year_id: string;
    cycle: string;
    number: number;
    label: string;
    start_date: string;
    end_date: string;
  }[] = [];

  for (const cycle of cycles) {
    const labels = periodLabelsForCycle(cycle);
    const ranges = splitDateRange(start, end, labels.length);
    const cycleLabel =
      cycles.length > 1
        ? `${cycle.charAt(0).toUpperCase()}${cycle.slice(1)} — `
        : '';
    labels.forEach((label, index) => {
      periodRows.push({
        academic_year_id: academicYearId,
        cycle,
        number: index + 1,
        label: `${cycleLabel}${label}`,
        start_date: toDateString(ranges[index].start),
        end_date: toDateString(ranges[index].end),
      });
    });
  }

  return periodRows;
}

function validateYearDates(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Dates invalides.');
  }
  if (start >= end) {
    throw new Error('La date de fin doit être postérieure à la date de début.');
  }
  return { start, end };
}

export async function createAcademicYear(input: {
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  cycles: SchoolCycle[];
  setActive?: boolean;
}): Promise<AcademicYearRow> {
  const cycles = normalizeSchoolCycles(input.cycles);
  const { start, end } = validateYearDates(input.startDate, input.endDate);

  const admin = createAdminClient();
  const hasActive = await getActiveAcademicYear(input.schoolId);
  const shouldActivate = input.setActive ?? !hasActive;

  if (shouldActivate) {
    await admin
      .from('academic_years')
      .update({ is_active: false })
      .eq('school_id', input.schoolId);
  }

  const periodType = deriveLegacyPeriodType(cycles);

  const { data: year, error: yearError } = await admin
    .from('academic_years')
    .insert({
      school_id: input.schoolId,
      name: input.name.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      period_type: periodType,
      cycles,
      is_active: shouldActivate,
    })
    .select('*')
    .single();

  if (yearError || !year) {
    if (yearError?.message.includes('cycles')) {
      throw new Error(
        'Colonne cycles absente. Exécutez supabase/migrations/20260525000004_school_cycles.sql.',
      );
    }
    throw new Error(yearError?.message ?? 'Création année impossible.');
  }

  const periodRows = buildPeriodRows(year.id, start, end, cycles);

  const { error: periodsError } = await admin.from('periods').insert(periodRows);
  if (periodsError) {
    await admin.from('academic_years').delete().eq('id', year.id);
    if (periodsError.message.includes('cycle')) {
      throw new Error(
        'Colonne periods.cycle absente. Exécutez supabase/migrations/20260525000004_school_cycles.sql.',
      );
    }
    throw new Error(periodsError.message);
  }

  return year as AcademicYearRow;
}

export async function updateAcademicYear(input: {
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  cycles: SchoolCycle[];
}): Promise<AcademicYearRow> {
  const cycles = normalizeSchoolCycles(input.cycles);
  const name = input.name.trim();
  if (!name) throw new Error('Le libellé de l’année est obligatoire.');

  const { start, end } = validateYearDates(input.startDate, input.endDate);

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from('academic_years')
    .select('*')
    .eq('id', input.academicYearId)
    .eq('school_id', input.schoolId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error('Année scolaire introuvable.');

  const { data: duplicate, error: dupError } = await admin
    .from('academic_years')
    .select('id')
    .eq('school_id', input.schoolId)
    .eq('name', name)
    .neq('id', input.academicYearId)
    .maybeSingle();
  if (dupError) throw new Error(dupError.message);
  if (duplicate) {
    throw new Error(`Une année « ${name} » existe déjà.`);
  }

  const periodType = deriveLegacyPeriodType(cycles);
  const oldName = (existing as AcademicYearRow).name;

  const { data: year, error: yearError } = await admin
    .from('academic_years')
    .update({
      name,
      start_date: input.startDate,
      end_date: input.endDate,
      period_type: periodType,
      cycles,
    })
    .eq('id', input.academicYearId)
    .eq('school_id', input.schoolId)
    .select('*')
    .single();

  if (yearError || !year) {
    throw new Error(yearError?.message ?? 'Mise à jour impossible.');
  }

  const { error: deletePeriodsError } = await admin
    .from('periods')
    .delete()
    .eq('academic_year_id', input.academicYearId);
  if (deletePeriodsError) throw new Error(deletePeriodsError.message);

  const periodRows = buildPeriodRows(input.academicYearId, start, end, cycles);
  const { error: periodsError } = await admin.from('periods').insert(periodRows);
  if (periodsError) throw new Error(periodsError.message);

  if (oldName !== name) {
    const { error: feesError } = await admin
      .from('fees')
      .update({ academic_year: name })
      .eq('school_id', input.schoolId)
      .eq('academic_year', oldName);
    if (feesError) throw new Error(feesError.message);
  }

  return year as AcademicYearRow;
}

export async function setActiveAcademicYear(
  schoolId: string,
  academicYearId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: year, error: fetchError } = await admin
    .from('academic_years')
    .select('id')
    .eq('id', academicYearId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!year) throw new Error('Année scolaire introuvable.');

  await admin
    .from('academic_years')
    .update({ is_active: false })
    .eq('school_id', schoolId);

  const { error } = await admin
    .from('academic_years')
    .update({ is_active: true })
    .eq('id', academicYearId);
  if (error) throw new Error(error.message);
}
