import { createAdminClient } from '@/lib/supabase/admin';
import type { FeeCurrency } from '@/lib/school/referentials/constants';
import { normalizeFeeCurrency } from '@/lib/school/referentials/constants';

export type FeeRow = {
  id: string;
  school_id: string;
  name: string;
  amount: number;
  currency: string;
  academic_year: string;
  created_at: string;
};

export async function listFeesForSchool(schoolId: string): Promise<FeeRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('fees')
    .select('*')
    .eq('school_id', schoolId)
    .order('academic_year', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeeRow[];
}

export async function listFeesForAcademicYearLabel(
  schoolId: string,
  academicYearLabel: string,
): Promise<FeeRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('fees')
    .select('id, school_id, name, amount, currency, academic_year, created_at')
    .eq('school_id', schoolId)
    .eq('academic_year', academicYearLabel)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeeRow[];
}

export async function createFee(input: {
  schoolId: string;
  name: string;
  amount: number;
  academicYearLabel: string;
  currency: FeeCurrency;
}): Promise<FeeRow> {
  const { created } = await createFees({
    schoolId: input.schoolId,
    academicYearLabel: input.academicYearLabel,
    items: [
      {
        name: input.name,
        amount: input.amount,
        currency: input.currency,
      },
    ],
  });
  return created[0];
}

export async function createFees(input: {
  schoolId: string;
  academicYearLabel: string;
  items: { name: string; amount: number; currency: FeeCurrency }[];
}): Promise<{ created: FeeRow[]; skipped: string[] }> {
  const academicYearLabel = input.academicYearLabel.trim();
  if (!academicYearLabel) {
    throw new Error('Sélectionnez une année scolaire active.');
  }

  const items = input.items
    .map((item) => ({
      name: item.name.trim(),
      amount: item.amount,
      currency: normalizeFeeCurrency(item.currency),
    }))
    .filter((item) => item.name);

  if (items.length === 0) {
    throw new Error('Ajoutez au moins un frais.');
  }

  const admin = createAdminClient();
  const { data: existingRows, error: fetchError } = await admin
    .from('fees')
    .select('name')
    .eq('school_id', input.schoolId)
    .eq('academic_year', academicYearLabel);
  if (fetchError) throw new Error(fetchError.message);

  const existingNames = new Set(
    (existingRows ?? []).map((row) =>
      (row as { name: string }).name.trim().toLowerCase(),
    ),
  );

  const toCreate = items.filter(
    (item) => !existingNames.has(item.name.toLowerCase()),
  );
  const skipped = items
    .filter((item) => existingNames.has(item.name.toLowerCase()))
    .map((item) => item.name);

  if (toCreate.length === 0) {
    throw new Error('Ces frais existent déjà pour cette année.');
  }

  for (const item of toCreate) {
    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      throw new Error(`Montant invalide pour « ${item.name} ».`);
    }
  }

  const { data, error } = await admin
    .from('fees')
    .insert(
      toCreate.map((item) => ({
        school_id: input.schoolId,
        name: item.name,
        amount: item.amount,
        currency: item.currency,
        academic_year: academicYearLabel,
      })),
    )
    .select('*');

  if (error) {
    if (error.message.includes('currency') || error.message.includes('column')) {
      throw new Error(
        'Colonne currency absente. Exécutez supabase/migrations/20260525000003_fees_currency.sql sur Supabase.',
      );
    }
    throw new Error(error.message);
  }

  return { created: (data ?? []) as FeeRow[], skipped };
}

export async function updateFee(input: {
  schoolId: string;
  feeId: string;
  name: string;
  amount: number;
  currency: FeeCurrency;
}): Promise<FeeRow> {
  const name = input.name.trim();
  const currency = normalizeFeeCurrency(input.currency);
  if (!name) throw new Error('Le libellé du frais est obligatoire.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Le montant doit être supérieur à zéro.');
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from('fees')
    .select('id, school_id, academic_year')
    .eq('id', input.feeId)
    .eq('school_id', input.schoolId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error('Frais introuvable.');

  const { count, error: countError } = await admin
    .from('payments_history')
    .select('*', { count: 'exact', head: true })
    .eq('fee_id', input.feeId);
  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error(
      'Ce frais a déjà des paiements — modification impossible.',
    );
  }

  const { data: siblings, error: dupError } = await admin
    .from('fees')
    .select('id, name')
    .eq('school_id', input.schoolId)
    .eq('academic_year', existing.academic_year as string)
    .neq('id', input.feeId);
  if (dupError) throw new Error(dupError.message);
  const duplicate = (siblings ?? []).find(
    (row) =>
      (row as { name: string }).name.trim().toLowerCase() ===
      name.toLowerCase(),
  );
  if (duplicate) {
    throw new Error(`« ${name} » existe déjà pour cette année.`);
  }

  const { data, error } = await admin
    .from('fees')
    .update({ name, amount: input.amount, currency })
    .eq('id', input.feeId)
    .eq('school_id', input.schoolId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as FeeRow;
}

export async function deleteFee(
  schoolId: string,
  feeId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { count, error: countError } = await admin
    .from('payments_history')
    .select('*', { count: 'exact', head: true })
    .eq('fee_id', feeId);
  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error('Ce frais a déjà des paiements enregistrés.');
  }

  const { error } = await admin
    .from('fees')
    .delete()
    .eq('id', feeId)
    .eq('school_id', schoolId);
  if (error) throw new Error(error.message);
}
