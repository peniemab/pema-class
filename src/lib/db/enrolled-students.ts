import { createAdminClient } from '@/lib/supabase/admin';

export type EnrolledStudent = {
  id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
};

export async function listEnrolledStudentsForYear(
  schoolId: string,
  academicYearId: string,
): Promise<EnrolledStudent[]> {
  const admin = createAdminClient();

  const { data: enrollments, error: enrollError } = await admin
    .from('student_classes')
    .select('student_id, class_id, classes!inner(id, name, level)')
    .eq('academic_year_id', academicYearId);
  if (enrollError) throw new Error(enrollError.message);

  const studentIds = (enrollments ?? []).map(
    (row) => (row as { student_id: string }).student_id,
  );
  if (studentIds.length === 0) return [];

  const { data: students, error: studentsError } = await admin
    .from('students')
    .select('id, first_name, last_name, matricule, status')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .in('id', studentIds);
  if (studentsError) throw new Error(studentsError.message);

  const studentById = new Map(
    ((students ?? []) as {
      id: string;
      first_name: string;
      last_name: string;
      matricule: string | null;
    }[]).map((s) => [s.id, s]),
  );

  const rows: EnrolledStudent[] = [];
  for (const raw of enrollments ?? []) {
    const row = raw as {
      student_id: string;
      class_id: string;
      classes:
        | { id: string; name: string; level: string }
        | { id: string; name: string; level: string }[];
    };
    const student = studentById.get(row.student_id);
    const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    if (!student || !cls) continue;
    rows.push({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_id: row.class_id,
      class_name: cls.name,
      class_level: cls.level,
    });
  }

  rows.sort((a, b) => {
    const byLast = a.last_name.localeCompare(b.last_name, 'fr');
    if (byLast !== 0) return byLast;
    return a.first_name.localeCompare(b.first_name, 'fr');
  });

  return rows;
}
