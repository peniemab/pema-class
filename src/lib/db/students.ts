import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StudentGender, StudentStatus } from '@/lib/school/students/constants';
import { normalizeStudentNamePart } from '@/lib/school/students/constants';

export type StudentRow = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  birth_date: string | null;
  lieu_naissance: string | null;
  ecole_provenance: string | null;
  gender: StudentGender | string | null;
  photo_url: string | null;
  address: string | null;
  status: StudentStatus | string;
  created_at: string;
  updated_at: string;
};

export type EmergencyContactRow = {
  id: string;
  student_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  note: string | null;
  created_at: string;
};

export type StudentEnrollmentRow = {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  enrolled_at: string | null;
  class_name: string;
  class_level: string;
  class_cycle: string | null;
  academic_year_name: string;
};

export type StudentDirectoryRow = {
  id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  gender: string | null;
  birth_date: string | null;
  status: string;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
  class_cycle: string | null;
};

export type StudentsDirectoryFilters = {
  search?: string;
  classId?: string;
  status?: StudentStatus | 'all';
  unassignedOnly?: boolean;
};

export type StudentsDirectoryResult = {
  rows: StudentDirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
};

const STUDENT_COLUMNS =
  'id, school_id, first_name, last_name, matricule, birth_date, lieu_naissance, ecole_provenance, gender, photo_url, address, status, created_at, updated_at';

function schoolMatriculeCode(slug: string | null, schoolId: string): string {
  const base = (slug ?? schoolId.slice(0, 8))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  return base || 'ECOLE';
}

function matchesSearch(row: StudentDirectoryRow, term: string): boolean {
  const tokens = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = [
    row.first_name,
    row.last_name,
    row.matricule ?? '',
    row.class_level ?? '',
    row.class_name ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const matriculeNorm = (row.matricule ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

  return tokens.every((token) => {
    if (haystack.includes(token)) return true;
    const tokenNorm = token.replace(/[^a-z0-9]/g, '');
    return tokenNorm.length >= 2 && matriculeNorm.includes(tokenNorm);
  });
}

function escapeIlikePattern(raw: string): string {
  return raw.replace(/[%_\\]/g, '\\$&');
}

export async function suggestStudents(
  schoolId: string,
  academicYearId: string,
  term: string,
  limit = 8,
): Promise<StudentDirectoryRow[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const pattern = `%${escapeIlikePattern(q)}%`;

  const { data: students, error } = await admin
    .from('students')
    .select('id, first_name, last_name, matricule, gender, birth_date, status')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .or(
      `last_name.ilike.${pattern},first_name.ilike.${pattern},matricule.ilike.${pattern}`,
    )
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(Math.min(limit * 4, 32));
  if (error) throw new Error(error.message);
  if (!students?.length) return [];

  const studentIds = students.map((s) => (s as { id: string }).id);
  const { data: enrollments, error: enrollError } = await admin
    .from('student_classes')
    .select('student_id, class_id, classes!inner(id, name, level, cycle)')
    .eq('academic_year_id', academicYearId)
    .in('student_id', studentIds);
  if (enrollError) throw new Error(enrollError.message);

  const enrollmentByStudent = new Map<
    string,
    { class_id: string; name: string; level: string; cycle: string | null }
  >();
  for (const row of enrollments ?? []) {
    const raw = row as {
      student_id: string;
      class_id: string;
      classes:
        | { id: string; name: string; level: string; cycle: string | null }
        | { id: string; name: string; level: string; cycle: string | null }[];
    };
    const cls = Array.isArray(raw.classes) ? raw.classes[0] : raw.classes;
    if (!cls) continue;
    enrollmentByStudent.set(raw.student_id, {
      class_id: raw.class_id,
      name: cls.name,
      level: cls.level,
      cycle: cls.cycle,
    });
  }

  let rows: StudentDirectoryRow[] = students.map((s) => {
    const st = s as {
      id: string;
      first_name: string;
      last_name: string;
      matricule: string | null;
      gender: string | null;
      birth_date: string | null;
      status: string;
    };
    const en = enrollmentByStudent.get(st.id);
    return {
      id: st.id,
      first_name: st.first_name,
      last_name: st.last_name,
      matricule: st.matricule,
      gender: st.gender,
      birth_date: st.birth_date,
      status: st.status,
      class_id: en?.class_id ?? null,
      class_name: en?.name ?? null,
      class_level: en?.level ?? null,
      class_cycle: en?.cycle ?? null,
    };
  });

  rows = rows.filter((r) => matchesSearch(r, q.toLowerCase()));
  return rows.slice(0, limit);
}

/** Matricule unique par établissement (SaaS) — ex. LYCEE1-0042 */
export async function generateMatricule(schoolId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: school, error: schoolError } = await admin
    .from('schools')
    .select('slug')
    .eq('id', schoolId)
    .maybeSingle();
  if (schoolError) throw new Error(schoolError.message);

  const code = schoolMatriculeCode(
    (school as { slug: string | null } | null)?.slug ?? null,
    schoolId,
  );
  const prefix = `${code}-`;

  const { data: rows, error } = await admin
    .from('students')
    .select('matricule')
    .eq('school_id', schoolId)
    .not('matricule', 'is', null);
  if (error) throw new Error(error.message);

  let maxSeq = 0;
  for (const row of rows ?? []) {
    const matricule = (row as { matricule: string }).matricule;
    if (!matricule.startsWith(prefix)) continue;
    const seq = Number.parseInt(matricule.slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
  }

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export async function pickClassSectionForLevel(input: {
  schoolId: string;
  academicYearId: string;
  level: string;
}): Promise<{ id: string; name: string; level: string; max_capacity: number; current_count: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('classes')
    .select('id, name, level, max_capacity, current_count')
    .eq('school_id', input.schoolId)
    .eq('academic_year_id', input.academicYearId)
    .eq('level', input.level.trim())
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);

  const available = ((data ?? []) as {
    id: string;
    name: string;
    level: string;
    max_capacity: number;
    current_count: number;
  }[]).filter((c) => c.current_count < c.max_capacity);

  if (available.length === 0) {
    throw new Error(
      `Toutes les sections de « ${input.level} » sont pleines. Créez une section ou augmentez la capacité.`,
    );
  }

  return available[0];
}

export async function listStudentsDirectory(
  schoolId: string,
  academicYearId: string,
  filters: StudentsDirectoryFilters = {},
  page = 1,
  pageSize = 30,
): Promise<StudentsDirectoryResult> {
  const admin = createAdminClient();

  const { data: students, error: studentsError } = await admin
    .from('students')
    .select(STUDENT_COLUMNS)
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });
  if (studentsError) throw new Error(studentsError.message);

  const { data: enrollments, error: enrollError } = await admin
    .from('student_classes')
    .select(
      'student_id, class_id, classes!inner(id, name, level, cycle)',
    )
    .eq('academic_year_id', academicYearId);
  if (enrollError) throw new Error(enrollError.message);

  const enrollmentByStudent = new Map<
    string,
    { class_id: string; name: string; level: string; cycle: string | null }
  >();
  for (const row of enrollments ?? []) {
    const raw = row as {
      student_id: string;
      class_id: string;
      classes: { id: string; name: string; level: string; cycle: string | null } | { id: string; name: string; level: string; cycle: string | null }[];
    };
    const cls = Array.isArray(raw.classes) ? raw.classes[0] : raw.classes;
    if (!cls) continue;
    enrollmentByStudent.set(raw.student_id, {
      class_id: raw.class_id,
      name: cls.name,
      level: cls.level,
      cycle: cls.cycle,
    });
  }

  let rows: StudentDirectoryRow[] = ((students ?? []) as StudentRow[]).map(
    (s) => {
      const en = enrollmentByStudent.get(s.id);
      return {
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        matricule: s.matricule,
        gender: s.gender,
        birth_date: s.birth_date,
        status: s.status,
        class_id: en?.class_id ?? null,
        class_name: en?.name ?? null,
        class_level: en?.level ?? null,
        class_cycle: en?.cycle ?? null,
      };
    },
  );

  const search = filters.search ? filters.search.trim().toLowerCase() : '';
  if (search) {
    rows = rows.filter((r) => matchesSearch(r, search));
  }

  if (filters.classId) {
    rows = rows.filter((r) => r.class_id === filters.classId);
  }

  if (filters.unassignedOnly) {
    rows = rows.filter((r) => !r.class_id);
  }

  if (filters.status && filters.status !== 'all') {
    rows = rows.filter((r) => r.status === filters.status);
  }

  const total = rows.length;
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return { rows: paged, total, page: safePage, pageSize };
}

export async function countStudentsForYear(
  schoolId: string,
  academicYearId: string,
): Promise<{ total: number; enrolled: number; unassigned: number }> {
  const admin = createAdminClient();
  const { count: total, error: totalError } = await admin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'active');
  if (totalError) throw new Error(totalError.message);

  const { count: enrolled, error: enrolledError } = await admin
    .from('student_classes')
    .select('student_id', { count: 'exact', head: true })
    .eq('academic_year_id', academicYearId);
  if (enrolledError) throw new Error(enrolledError.message);

  const totalN = total ?? 0;
  const enrolledN = enrolled ?? 0;
  return {
    total: totalN,
    enrolled: enrolledN,
    unassigned: Math.max(0, totalN - enrolledN),
  };
}

async function fetchStudentById(
  schoolId: string,
  studentId: string,
): Promise<StudentRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('students')
    .select(STUDENT_COLUMNS)
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StudentRow | null) ?? null;
}

export const getStudentById = cache(fetchStudentById);

export async function getStudentEnrollmentForYear(
  schoolId: string,
  studentId: string,
  academicYearId: string,
): Promise<StudentEnrollmentRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_classes')
    .select(
      `
      id, student_id, class_id, academic_year_id, enrolled_at,
      classes!inner(name, level, cycle, school_id),
      academic_years!inner(name)
    `,
    )
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const raw = data as {
    id: string;
    student_id: string;
    class_id: string;
    academic_year_id: string;
    enrolled_at: string | null;
    classes:
      | { name: string; level: string; cycle: string | null; school_id: string }
      | { name: string; level: string; cycle: string | null; school_id: string }[];
    academic_years: { name: string } | { name: string }[];
  };
  const cls = Array.isArray(raw.classes) ? raw.classes[0] : raw.classes;
  const year = Array.isArray(raw.academic_years)
    ? raw.academic_years[0]
    : raw.academic_years;
  if (!cls || !year) return null;
  if (cls.school_id !== schoolId) return null;

  return {
    id: raw.id,
    student_id: raw.student_id,
    class_id: raw.class_id,
    academic_year_id: raw.academic_year_id,
    enrolled_at: raw.enrolled_at,
    class_name: cls.name,
    class_level: cls.level,
    class_cycle: cls.cycle,
    academic_year_name: year.name,
  };
}

export async function listEmergencyContacts(
  studentId: string,
): Promise<EmergencyContactRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_emergency_contacts')
    .select('id, student_id, full_name, relationship, phone, note, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmergencyContactRow[];
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  patch: {
    first_name: string;
    last_name: string;
    matricule?: string | null;
    birth_date?: string | null;
    lieu_naissance?: string | null;
    ecole_provenance?: string | null;
    gender?: StudentGender | null;
    address?: string | null;
    status: StudentStatus;
  },
): Promise<StudentRow> {
  const first_name = normalizeStudentNamePart(patch.first_name);
  const last_name = normalizeStudentNamePart(patch.last_name);
  if (!first_name || !last_name) {
    throw new Error('Le prénom et le nom sont obligatoires.');
  }

  const matricule = patch.matricule?.trim().toUpperCase() || null;

  const admin = createAdminClient();
  if (matricule) {
    const { data: dup, error: dupError } = await admin
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('matricule', matricule)
      .neq('id', studentId)
      .maybeSingle();
    if (dupError) throw new Error(dupError.message);
    if (dup) throw new Error(`Le matricule « ${matricule} » est déjà utilisé.`);
  }

  const { data, error } = await admin
    .from('students')
    .update({
      first_name,
      last_name,
      matricule,
      birth_date: patch.birth_date || null,
      lieu_naissance: patch.lieu_naissance?.trim() || null,
      ecole_provenance: patch.ecole_provenance?.trim() || null,
      gender: patch.gender ?? null,
      address: patch.address?.trim() || null,
      status: patch.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .select(STUDENT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as StudentRow;
}

export async function replaceEmergencyContacts(
  schoolId: string,
  studentId: string,
  contacts: {
    full_name: string;
    relationship: string;
    phone: string;
    note?: string | null;
  }[],
): Promise<void> {
  const student = await getStudentById(schoolId, studentId);
  if (!student) throw new Error('Élève introuvable.');

  const cleaned = contacts
    .map((c) => ({
      full_name: c.full_name.trim(),
      relationship: c.relationship.trim(),
      phone: c.phone.trim(),
      note: c.note?.trim() || null,
    }))
    .filter((c) => c.full_name && c.phone);

  if (cleaned.length === 0) {
    throw new Error('Au moins un contact d’urgence est requis.');
  }

  const admin = createAdminClient();
  const { error: delError } = await admin
    .from('student_emergency_contacts')
    .delete()
    .eq('student_id', studentId);
  if (delError) throw new Error(delError.message);

  const { error: insError } = await admin
    .from('student_emergency_contacts')
    .insert(
      cleaned.map((c) => ({
        student_id: studentId,
        full_name: c.full_name,
        relationship: c.relationship || 'Autre',
        phone: c.phone,
        note: c.note,
      })),
    );
  if (insError) throw new Error(insError.message);
}

export async function enrollStudent(input: {
  schoolId: string;
  academicYearId: string;
  classId?: string;
  level?: string;
  student: {
    first_name: string;
    last_name: string;
    matricule?: string | null;
    autoMatricule?: boolean;
    birth_date?: string | null;
    lieu_naissance?: string | null;
    ecole_provenance?: string | null;
    gender?: StudentGender | null;
    address?: string | null;
  };
  contacts: {
    full_name: string;
    relationship: string;
    phone: string;
    note?: string | null;
  }[];
}): Promise<{ studentId: string; matricule: string; className: string; classLevel: string }> {
  const first_name = normalizeStudentNamePart(input.student.first_name);
  const last_name = normalizeStudentNamePart(input.student.last_name);
  if (!first_name || !last_name) {
    throw new Error('Le prénom et le nom sont obligatoires.');
  }

  const admin = createAdminClient();

  let resolvedClassId: string;
  let cls: {
    id: string;
    name: string;
    level: string;
    max_capacity: number;
    current_count: number;
  };

  if (input.level?.trim()) {
    const picked = await pickClassSectionForLevel({
      schoolId: input.schoolId,
      academicYearId: input.academicYearId,
      level: input.level,
    });
    resolvedClassId = picked.id;
    cls = picked;
  } else if (input.classId) {
    const { data, error: classError } = await admin
      .from('classes')
      .select('id, school_id, academic_year_id, max_capacity, current_count, name, level')
      .eq('id', input.classId)
      .eq('school_id', input.schoolId)
      .maybeSingle();
    if (classError) throw new Error(classError.message);
    if (!data) throw new Error('Classe introuvable.');
    if (data.academic_year_id !== input.academicYearId) {
      throw new Error('Cette classe n’appartient pas à l’année active.');
    }
    resolvedClassId = data.id as string;
    cls = data as typeof cls;
  } else {
    throw new Error('Sélectionnez un niveau scolaire.');
  }

  if (cls.current_count >= cls.max_capacity) {
    throw new Error(
      `La section ${cls.level} ${cls.name} est pleine (${cls.max_capacity} places).`,
    );
  }

  let matricule = input.student.matricule?.trim().toUpperCase() || null;
  if (input.student.autoMatricule || !matricule) {
    matricule = await generateMatricule(input.schoolId);
  }

  if (matricule) {
    const { data: dup, error: dupError } = await admin
      .from('students')
      .select('id')
      .eq('school_id', input.schoolId)
      .eq('matricule', matricule)
      .maybeSingle();
    if (dupError) throw new Error(dupError.message);
    if (dup) throw new Error(`Le matricule « ${matricule} » est déjà utilisé.`);
  }

  const { data: created, error: createError } = await admin
    .from('students')
    .insert({
      school_id: input.schoolId,
      first_name,
      last_name,
      matricule,
      birth_date: input.student.birth_date || null,
      lieu_naissance: input.student.lieu_naissance?.trim() || null,
      ecole_provenance: input.student.ecole_provenance?.trim() || null,
      gender: input.student.gender ?? null,
      address: input.student.address?.trim() || null,
      status: 'active',
    })
    .select('id')
    .single();
  if (createError || !created) {
    throw new Error(createError?.message ?? 'Création élève impossible.');
  }

  const studentId = created.id as string;

  try {
    await replaceEmergencyContacts(input.schoolId, studentId, input.contacts);

    const { error: enrollError } = await admin.from('student_classes').insert({
      student_id: studentId,
      class_id: resolvedClassId,
      academic_year_id: input.academicYearId,
      enrolled_at: new Date().toISOString().slice(0, 10),
    });
    if (enrollError) throw new Error(enrollError.message);
  } catch (e) {
    await admin.from('student_emergency_contacts').delete().eq('student_id', studentId);
    await admin.from('students').delete().eq('id', studentId);
    throw e;
  }

  return {
    studentId,
    matricule: matricule!,
    className: cls.name,
    classLevel: cls.level,
  };
}

export async function transferStudentClass(input: {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  newClassId: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: cls, error: classError } = await admin
    .from('classes')
    .select('id, school_id, academic_year_id, max_capacity, current_count, name, level')
    .eq('id', input.newClassId)
    .eq('school_id', input.schoolId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!cls) throw new Error('Classe introuvable.');
  if (cls.academic_year_id !== input.academicYearId) {
    throw new Error('Cette classe n’appartient pas à l’année active.');
  }
  if ((cls.current_count as number) >= (cls.max_capacity as number)) {
    throw new Error(`La classe ${cls.level} ${cls.name} est pleine.`);
  }

  const { data: existing, error: fetchError } = await admin
    .from('student_classes')
    .select('id, class_id')
    .eq('student_id', input.studentId)
    .eq('academic_year_id', input.academicYearId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  if (existing) {
    if (existing.class_id === input.newClassId) return;
    const { error } = await admin
      .from('student_classes')
      .update({ class_id: input.newClassId })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('student_classes').insert({
      student_id: input.studentId,
      class_id: input.newClassId,
      academic_year_id: input.academicYearId,
      enrolled_at: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
  }
}
