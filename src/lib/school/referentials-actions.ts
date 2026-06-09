'use server';

import { revalidatePath } from 'next/cache';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import {
  createAcademicYear,
  getActiveAcademicYearLite,
  setActiveAcademicYear,
  updateAcademicYear,
} from '@/lib/db/academic-years';
import { createClass, createClasses, deleteClass } from '@/lib/db/classes';
import { createFees, deleteFee, updateFee } from '@/lib/db/fees';
import {
  getReferentialsPageData,
  type ReferentialsPageData,
} from '@/lib/db/referentials-page';
import { updateSchoolOfferedCycles } from '@/lib/db/schools';
import { uploadSchoolLogo, validateSchoolLogoFile } from '@/lib/db/school-logo';
import {
  normalizeSchoolCycles,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export type { ReferentialsPageData };

export async function loadReferentialsPageData(): Promise<ReferentialsPageData> {
  const { schoolId } = await requireSchoolDirection();
  return getReferentialsPageData(schoolId);
}

function revalidateReferentials() {
  revalidatePath('/school/parametres');
  revalidatePath('/school/parametres/referentiels');
  revalidatePath('/school');
}

export async function createAcademicYearAction(input: {
  name: string;
  startDate: string;
  endDate: string;
  cycles: SchoolCycle[];
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const cycles = normalizeSchoolCycles(input.cycles);
    if (cycles.length === 0) {
      return { ok: false, error: 'Sélectionnez au moins un cycle.' };
    }
    await createAcademicYear({
      schoolId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      cycles,
    });
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Création impossible.',
    };
  }
}

export async function updateAcademicYearAction(input: {
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  cycles: SchoolCycle[];
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const cycles = normalizeSchoolCycles(input.cycles);
    if (cycles.length === 0) {
      return { ok: false, error: 'Sélectionnez au moins un cycle.' };
    }
    await updateAcademicYear({
      schoolId,
      academicYearId: input.academicYearId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      cycles,
    });
    revalidateReferentials();
    return { ok: true, message: 'Année scolaire mise à jour.' };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Mise à jour impossible.',
    };
  }
}

export async function saveSchoolCyclesAction(
  cycles: SchoolCycle[],
): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const normalized = normalizeSchoolCycles(cycles);
    if (normalized.length === 0) {
      return { ok: false, error: 'Sélectionnez au moins un cycle.' };
    }
    await updateSchoolOfferedCycles(schoolId, normalized);
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Enregistrement impossible.',
    };
  }
}

export async function activateAcademicYearAction(
  academicYearId: string,
): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    await setActiveAcademicYear(schoolId, academicYearId);
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Activation impossible.',
    };
  }
}

export async function createClassesAction(input: {
  level: string;
  sections: string[];
  maxCapacity?: number;
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const activeYear = await getActiveAcademicYearLite(schoolId);
    if (!activeYear) {
      return {
        ok: false,
        error: 'Créez et activez une année scolaire avant d’ajouter des classes.',
      };
    }

    const sections = [...new Set(input.sections.map((s) => s.trim()).filter(Boolean))];
    if (sections.length === 0) {
      return { ok: false, error: 'Sélectionnez au moins une section.' };
    }

    const { created, skipped } = await createClasses({
      schoolId,
      academicYearId: activeYear.id,
      level: input.level,
      sectionNames: sections,
      maxCapacity: input.maxCapacity,
    });

    revalidateReferentials();

    const count = created.length;
    if (skipped.length > 0) {
      return {
        ok: true,
        message:
          count === 1
            ? `1 classe créée (${skipped.join(', ')} existait déjà).`
            : `${count} classes créées (${skipped.join(', ')} existaient déjà).`,
      };
    }

    return {
      ok: true,
      message: count === 1 ? '1 classe créée.' : `${count} classes créées.`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Création impossible.',
    };
  }
}

export async function createClassAction(input: {
  name: string;
  level: string;
  maxCapacity?: number;
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const activeYear = await getActiveAcademicYearLite(schoolId);
    if (!activeYear) {
      return {
        ok: false,
        error: 'Créez et activez une année scolaire avant d’ajouter des classes.',
      };
    }
    await createClass({
      schoolId,
      academicYearId: activeYear.id,
      name: input.name,
      level: input.level,
      maxCapacity: input.maxCapacity,
    });
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Création impossible.',
    };
  }
}

export async function deleteClassAction(classId: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    await deleteClass(schoolId, classId);
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Suppression impossible.',
    };
  }
}

export async function createFeesAction(input: {
  items: { name: string; amount: string; currency: string }[];
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const activeYear = await getActiveAcademicYearLite(schoolId);
    if (!activeYear) {
      return {
        ok: false,
        error: 'Créez et activez une année scolaire avant de définir des frais.',
      };
    }

    const items = input.items
      .map((item) => ({
        name: item.name.trim(),
        amount: Number.parseFloat(item.amount.replace(',', '.')),
        currency: (item.currency === 'USD' ? 'USD' : 'CDF') as 'CDF' | 'USD',
      }))
      .filter((item) => item.name);

    if (items.length === 0) {
      return { ok: false, error: 'Ajoutez au moins un frais.' };
    }

    const { created, skipped } = await createFees({
      schoolId,
      academicYearLabel: activeYear.name,
      items,
    });

    revalidateReferentials();

    const count = created.length;
    if (skipped.length > 0) {
      return {
        ok: true,
        message:
          count === 1
            ? `1 frais ajouté (${skipped.join(', ')} existait déjà).`
            : `${count} frais ajoutés (${skipped.join(', ')} existaient déjà).`,
      };
    }

    return {
      ok: true,
      message: count === 1 ? '1 frais ajouté.' : `${count} frais ajoutés.`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Création impossible.',
    };
  }
}

export async function createFeeAction(input: {
  name: string;
  amount: string;
  currency: string;
}): Promise<ActionResult> {
  const result = await createFeesAction({
    items: [
      {
        name: input.name,
        amount: input.amount,
        currency: input.currency,
      },
    ],
  });
  if (result.ok && !result.message) {
    return { ok: true, message: '1 frais ajouté.' };
  }
  return result;
}

export async function updateFeeAction(input: {
  feeId: string;
  name: string;
  amount: string;
  currency: string;
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const amount = Number.parseFloat(input.amount.replace(',', '.'));
    await updateFee({
      schoolId,
      feeId: input.feeId,
      name: input.name.trim(),
      amount,
      currency: input.currency === 'USD' ? 'USD' : 'CDF',
    });
    revalidateReferentials();
    return { ok: true, message: 'Frais modifié.' };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Modification impossible.',
    };
  }
}

export async function deleteFeeAction(feeId: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    await deleteFee(schoolId, feeId);
    revalidateReferentials();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Suppression impossible.',
    };
  }
}

export async function uploadSchoolLogoAction(
  formData: FormData,
): Promise<ActionResult & { logoUrl?: string }> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const file = formData.get('logo');
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Sélectionnez un fichier image.' };
    }
    const validationError = validateSchoolLogoFile(file);
    if (validationError) {
      return { ok: false, error: validationError };
    }
    const logoUrl = await uploadSchoolLogo({ schoolId, file });
    revalidateReferentials();
    revalidatePath('/school/parametres');
    return { ok: true, logoUrl };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Téléversement impossible.',
    };
  }
}
