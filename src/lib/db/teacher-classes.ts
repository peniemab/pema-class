import { createAdminClient } from '@/lib/supabase/admin';

/** Classes assignées à un enseignant pour l'année active. */
export async function listTeacherClassIds(
  schoolId: string,
  academicYearId: string,
  staffId: string,
): Promise<string[]> {
  void schoolId;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('teacher_classes')
    .select('class_id')
    .eq('staff_id', staffId)
    .eq('academic_year_id', academicYearId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => (r as { class_id: string }).class_id);
}

export async function listTeacherClassIdsForStaff(
  staffIds: string[],
  academicYearId: string,
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (staffIds.length === 0) return map;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('teacher_classes')
    .select('staff_id, class_id')
    .in('staff_id', staffIds)
    .eq('academic_year_id', academicYearId);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const staffId = (row as { staff_id: string }).staff_id;
    const classId = (row as { class_id: string }).class_id;
    const list = map.get(staffId) ?? [];
    list.push(classId);
    map.set(staffId, list);
  }

  return map;
}

export async function setTeacherClasses(input: {
  staffId: string;
  academicYearId: string;
  classIds: string[];
}): Promise<void> {
  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from('teacher_classes')
    .delete()
    .eq('staff_id', input.staffId)
    .eq('academic_year_id', input.academicYearId);

  if (deleteError) throw new Error(deleteError.message);

  if (input.classIds.length === 0) return;

  const rows = input.classIds.map((classId) => ({
    staff_id: input.staffId,
    class_id: classId,
    academic_year_id: input.academicYearId,
  }));

  const { error: insertError } = await admin.from('teacher_classes').insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export async function saveInvitationTeacherClasses(
  invitationId: string,
  classIds: string[],
): Promise<void> {
  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from('invitation_teacher_classes')
    .delete()
    .eq('invitation_id', invitationId);

  if (deleteError) throw new Error(deleteError.message);

  if (classIds.length === 0) return;

  const rows = classIds.map((classId) => ({
    invitation_id: invitationId,
    class_id: classId,
  }));

  const { error: insertError } = await admin
    .from('invitation_teacher_classes')
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
}

export async function applyInvitationTeacherClasses(input: {
  invitationId: string;
  staffId: string;
  academicYearId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('invitation_teacher_classes')
    .select('class_id')
    .eq('invitation_id', input.invitationId);

  if (error) throw new Error(error.message);

  const classIds = (data ?? []).map((row) => (row as { class_id: string }).class_id);
  if (classIds.length === 0) return;

  await setTeacherClasses({
    staffId: input.staffId,
    academicYearId: input.academicYearId,
    classIds,
  });

  await admin
    .from('invitation_teacher_classes')
    .delete()
    .eq('invitation_id', input.invitationId);
}
