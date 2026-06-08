/** Cycles proposés par l'établissement (peut en cumuler plusieurs). */
export const SCHOOL_CYCLES = [
  'maternelle',
  'primaire',
  'secondaire',
  'humanites',
] as const;

export type SchoolCycle = (typeof SCHOOL_CYCLES)[number];

export type PeriodType = 'trimester' | 'semester';

export const SCHOOL_CYCLE_LABELS: Record<SchoolCycle, string> = {
  maternelle: 'Maternelle',
  primaire: 'Primaire',
  secondaire: 'Secondaire',
  humanites: 'Humanités',
};

/** Maternelle + primaire → 3 trimestres ; secondaire + humanités → 2 semestres. */
export const CYCLE_PERIOD_TYPE: Record<SchoolCycle, PeriodType> = {
  maternelle: 'trimester',
  primaire: 'trimester',
  secondaire: 'semester',
  humanites: 'semester',
};

export const CLASS_LEVELS = [
  'Maternelle 1',
  'Maternelle 2',
  'Maternelle 3',
  '1ère primaire',
  '2ème primaire',
  '3ème primaire',
  '4ème primaire',
  '5ème primaire',
  '6ème primaire',
  '7ème EB',
  '8ème EB',
  '1ère humanités',
  '2ème humanités',
  '3ème humanités',
  '4ème humanités',
] as const;

export function levelToCycle(level: string): SchoolCycle {
  const l = level.toLowerCase();
  if (l.includes('maternelle')) return 'maternelle';
  if (l.includes('humanité') || l.includes('humanite')) return 'humanites';
  if (l.includes('eb')) return 'secondaire';
  if (l.includes('primaire')) return 'primaire';
  return 'primaire';
}

export function classLevelsForCycle(cycle: SchoolCycle): readonly string[] {
  return CLASS_LEVELS.filter((level) => levelToCycle(level) === cycle);
}

export function normalizeSchoolCycles(raw: string[] | null | undefined): SchoolCycle[] {
  if (!raw?.length) return ['primaire'];
  const valid = raw.filter((c): c is SchoolCycle =>
    (SCHOOL_CYCLES as readonly string[]).includes(c),
  );
  return valid.length > 0 ? valid : ['primaire'];
}

export function periodLabelsForCycle(cycle: SchoolCycle): string[] {
  const type = CYCLE_PERIOD_TYPE[cycle];
  if (type === 'semester') return ['1er semestre', '2e semestre'];
  return ['1er trimestre', '2e trimestre', '3e trimestre'];
}

export const CYCLE_DISPLAY_ORDER: SchoolCycle[] = [
  'maternelle',
  'primaire',
  'secondaire',
  'humanites',
];

/** Sections courantes pour une même année de niveau (A, B, C…). */
export const CLASS_SECTION_PRESETS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export type ClassSectionPreset = (typeof CLASS_SECTION_PRESETS)[number];

export function sameSchoolCycles(a: SchoolCycle[], b: SchoolCycle[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((c, i) => c === sortedB[i]);
}

export function formatClassLabel(level: string, section: string): string {
  return `${level} ${section}`;
}

export const FEE_CURRENCIES = ['CDF', 'USD'] as const;

export type FeeCurrency = (typeof FEE_CURRENCIES)[number];

export const FEE_CURRENCY_LABELS: Record<FeeCurrency, string> = {
  CDF: 'Franc congolais (CDF)',
  USD: 'Dollar US (USD)',
};

export function formatFeeAmount(amount: number, currency: FeeCurrency | string): string {
  const code = currency === 'USD' ? 'USD' : 'CDF';
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'USD' ? 2 : 0,
  }).format(amount);
}

export function normalizeFeeCurrency(raw: string | null | undefined): FeeCurrency {
  return raw === 'USD' ? 'USD' : 'CDF';
}

/** Frais fixes connus dès le départ (hors scolarité par tranches). */
export const FEE_FIXED_PRESETS = [
  "Frais d'inscription",
  'Uniforme',
  'Fournitures',
  'Cantine',
] as const;

/** Paiement annuel unique (legacy — affichage liste uniquement). */
export const FEE_ANNUAL_LUMP_LABEL = 'Scolarité annuelle';

export type InstallmentMode = 'trimester' | 'semester' | 'monthly';

export const INSTALLMENT_MODE_LABELS: Record<InstallmentMode, string> = {
  trimester: 'Trimestres',
  semester: 'Semestres',
  monthly: 'Mensuel',
};

export const MONTHLY_INSTALLMENT_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12] as const;

export const SEMESTER_INSTALLMENT_OPTIONS = [2, 3] as const;

export const FEE_TRIMESTER_LABELS = [
  'Scolarité T1',
  'Scolarité T2',
  'Scolarité T3',
] as const;

export function semesterLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Scolarité S${i + 1}`);
}

export function installmentLabels(
  mode: InstallmentMode,
  count = 10,
): string[] {
  if (mode === 'trimester') return [...FEE_TRIMESTER_LABELS];
  if (mode === 'semester') return semesterLabels(count);
  return Array.from({ length: count }, (_, i) => `Scolarité M${i + 1}`);
}

export function isScolariteFeeName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith('scolarité') || n.startsWith('scolarite');
}

export function feeTrancheSortOrder(name: string): number {
  const n = name.toLowerCase();
  const match = n.match(/\b([tsm])(\d+)\b/);
  if (match) {
    const base = match[1] === 't' ? 0 : match[1] === 's' ? 100 : 200;
    return base + Number.parseInt(match[2], 10);
  }
  if (n.includes('annuelle')) return 500;
  return 999;
}

export type FeeDisplayGroup = {
  id: 'scolarite' | 'fixed';
  label: string;
  hint: string;
  fees: { amount: number; currency: string; name: string; id: string }[];
};

export function groupFeesForDisplay<
  T extends { id: string; name: string; amount: number; currency: string },
>(fees: T[]): FeeDisplayGroup[] {
  const scolarite: T[] = [];
  const fixed: T[] = [];
  for (const fee of fees) {
    if (isScolariteFeeName(fee.name)) scolarite.push(fee);
    else fixed.push(fee);
  }
  scolarite.sort(
    (a, b) =>
      feeTrancheSortOrder(a.name) - feeTrancheSortOrder(b.name) ||
      a.name.localeCompare(b.name, 'fr'),
  );
  fixed.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const groups: FeeDisplayGroup[] = [];
  if (scolarite.length > 0) {
    groups.push({
      id: 'scolarite',
      label: 'Scolarité (tranches)',
      hint: 'Paiements échelonnés par trimestre, semestre ou mois.',
      fees: scolarite,
    });
  }
  if (fixed.length > 0) {
    groups.push({
      id: 'fixed',
      label: 'Frais fixes',
      hint: 'Inscription, uniforme, fournitures… payés une fois.',
      fees: fixed,
    });
  }
  return groups;
}

export function groupFeesByCurrency<T extends { amount: number; currency: string }>(
  fees: T[],
): Record<FeeCurrency, { items: T[]; total: number }> {
  const result: Record<FeeCurrency, { items: T[]; total: number }> = {
    CDF: { items: [], total: 0 },
    USD: { items: [], total: 0 },
  };
  for (const fee of fees) {
    const code = normalizeFeeCurrency(fee.currency);
    result[code].items.push(fee);
    result[code].total += fee.amount;
  }
  return result;
}
