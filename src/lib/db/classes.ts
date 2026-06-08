import { createAdminClient } from '@/lib/supabase/admin';

import { levelToCycle, type SchoolCycle } from '@/lib/school/referentials/constants';

export type ClassRow = {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  level: string;
  cycle: string | null;
  max_capacity: number;
  current_count: number;
  created_at: string;
};

export async function listClassesForYear(
  schoolId: string,
  academicYearId: string,
): Promise<ClassRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('classes')
    .select(
      'id, school_id, academic_year_id, name, level, cycle, max_capacity, current_count, created_at',
    )
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .order('level', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClassRow[];
}

export async function createClass(input: {
  schoolId: string;
  academicYearId: string;
  name: string;
  level: string;
  maxCapacity?: number;
}): Promise<ClassRow> {
  const { created } = await createClasses({
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    level: input.level,
    sectionNames: [input.name],
    maxCapacity: input.maxCapacity,
  });
  return created[0];
}

export async function createClasses(input: {
  schoolId: string;
  academicYearId: string;
  level: string;
  sectionNames: string[];
  maxCapacity?: number;
}): Promise<{ created: ClassRow[]; skipped: string[] }> {
  const level = input.level.trim();
  const sectionNames = [
    ...new Set(
      input.sectionNames.map((n) => n.trim().toUpperCase()).filter(Boolean),
    ),
  ];

  if (!level) {
    throw new Error('Le niveau de la classe est obligatoire.');
  }
  if (sectionNames.length === 0) {
    throw new Error('Sélectionnez au moins une section (A, B, C…).');
  }

  const admin = createAdminClient();
  const { data: existingRows, error: fetchError } = await admin
    .from('classes')
    .select('name')
    .eq('school_id', input.schoolId)
    .eq('academic_year_id', input.academicYearId)
    .eq('level', level);
  if (fetchError) throw new Error(fetchError.message);

  const existingNames = new Set(
    (existingRows ?? []).map((row) =>
      (row as { name: string }).name.trim().toUpperCase(),
    ),
  );
  const toCreate = sectionNames.filter((name) => !existingNames.has(name));
  const skipped = sectionNames.filter((name) => existingNames.has(name));

  if (toCreate.length === 0) {
    throw new Error(
      `Toutes ces sections existent déjà pour ${level} cette année.`,
    );
  }

  const cycle = levelToCycle(level);
  const maxCapacity = input.maxCapacity ?? 30;

  const { data, error } = await admin
    .from('classes')
    .insert(
      toCreate.map((name) => ({
        school_id: input.schoolId,
        academic_year_id: input.academicYearId,
        name,
        level,
        cycle,
        max_capacity: maxCapacity,
      })),
    )
    .select('*');

  if (error) {
    if (
      error.code === '23505' ||
      error.message.includes('idx_classes_school_year_level_name') ||
      error.message.includes('classes_school_id_academic_year_id_name_key')
    ) {
      throw new Error(
        `Une ou plusieurs sections existent déjà pour ${level} cette année.`,
      );
    }
    throw new Error(error.message);
  }

  return { created: (data ?? []) as ClassRow[], skipped };
}

export async function deleteClass(
  schoolId: string,
  classId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: row, error: fetchError } = await admin
    .from('classes')
    .select('id, current_count')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!row) throw new Error('Classe introuvable.');
  if ((row.current_count as number) > 0) {
    throw new Error('Impossible de supprimer une classe avec des élèves inscrits.');
  }

  const { error } = await admin
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('school_id', schoolId);
  if (error) throw new Error(error.message);
}
