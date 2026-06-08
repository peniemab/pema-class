import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type SchoolRow = {
  id: string;
  name: string;
  display_name: string | null;
  slug: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  logo_url: string | null;
  school_type: string;
  status: string;
  rccm: string | null;
  tax_number: string | null;
  national_id: string | null;
  offered_cycles: string[] | null;
};

export function slugifySchoolName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base || 'ecole';
}

export async function createSchool(input: {
  name: string;
  slug?: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
}): Promise<{ id: string; slug: string }> {
  const admin = createAdminClient();
  const slugBase = slugifySchoolName(input.name);
  const slug =
    input.slug?.trim() ||
    `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await admin
    .from('schools')
    .insert({
      name: input.name.trim(),
      display_name: input.name.trim(),
      slug,
      phone: input.phone,
      email: input.email,
      address: input.address ?? null,
      school_type: 'primary',
      status: 'active',
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, slug: data.slug };
}

/** @deprecated Utiliser createSchool */
export async function createSchoolForOnboarding(input: {
  name: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
}): Promise<{ id: string; slug: string }> {
  return createSchool(input);
}

export async function getSchoolByIdForStaff(
  schoolId: string,
): Promise<SchoolRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select(
      'id, name, display_name, slug, address, phone, email, description, logo_url, school_type, status, rccm, tax_number, national_id, offered_cycles',
    )
    .eq('id', schoolId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SchoolRow;
}

export async function updateSchoolSettings(
  schoolId: string,
  patch: Partial<
    Pick<
      SchoolRow,
      | 'name'
      | 'display_name'
      | 'phone'
      | 'email'
      | 'address'
      | 'description'
      | 'rccm'
      | 'tax_number'
      | 'national_id'
    >
  >,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('schools')
    .update(patch)
    .eq('id', schoolId);
  if (error) throw new Error(error.message);
}

export async function updateSchoolOfferedCycles(
  schoolId: string,
  cycles: string[],
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('schools')
    .update({ offered_cycles: cycles })
    .eq('id', schoolId);
  if (error) throw new Error(error.message);
}
