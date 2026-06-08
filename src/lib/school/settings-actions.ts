'use server';

import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getSchoolByIdForStaff, updateSchoolSettings } from '@/lib/db/schools';

export type SchoolSettingsInput = {
  name: string;
  displayName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  rccm: string;
  taxNumber: string;
  nationalId: string;
};

export type SaveSchoolSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveSchoolSettings(
  input: SchoolSettingsInput,
): Promise<SaveSchoolSettingsResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    if (!input.name.trim()) {
      return { ok: false, error: 'Le nom de l’établissement est obligatoire.' };
    }
    await updateSchoolSettings(schoolId, {
      name: input.name.trim(),
      display_name: input.displayName.trim() || input.name.trim(),
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      address: input.address.trim() || null,
      description: input.description.trim() || null,
      rccm: input.rccm.trim() || null,
      tax_number: input.taxNumber.trim() || null,
      national_id: input.nationalId.trim() || null,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Enregistrement impossible.',
    };
  }
}

export async function loadSchoolSettingsForDirection() {
  const { schoolId } = await requireSchoolDirection();
  const school = await getSchoolByIdForStaff(schoolId);
  if (!school) {
    throw new Error('Établissement introuvable.');
  }
  return school;
}
