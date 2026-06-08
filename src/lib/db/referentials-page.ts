import { cache } from 'react';
import { listAcademicYears, listPeriodsForYear, type AcademicYearRow, type PeriodRow } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listFeesForAcademicYearLabel, type FeeRow } from '@/lib/db/fees';
import { getSchoolByIdForStaff, type SchoolRow } from '@/lib/db/schools';

export type ReferentialsPageData = {
  school: SchoolRow;
  academicYears: AcademicYearRow[];
  activeYear: AcademicYearRow | null;
  periods: PeriodRow[];
  classes: ClassRow[];
  fees: FeeRow[];
};

function pickActiveYear(years: AcademicYearRow[]): AcademicYearRow | null {
  return years.find((y) => y.is_active) ?? null;
}

/** Chargement parallèle — une passe auth, puis 2 vagues de requêtes max. */
async function fetchReferentialsPageData(
  schoolId: string,
): Promise<ReferentialsPageData> {
  const [school, academicYears] = await Promise.all([
    getSchoolByIdForStaff(schoolId),
    listAcademicYears(schoolId),
  ]);

  if (!school) {
    throw new Error('Établissement introuvable.');
  }

  const activeYear = pickActiveYear(academicYears);

  if (!activeYear) {
    return {
      school,
      academicYears,
      activeYear: null,
      periods: [],
      classes: [],
      fees: [],
    };
  }

  const [periods, classes, fees] = await Promise.all([
    listPeriodsForYear(activeYear.id),
    listClassesForYear(schoolId, activeYear.id),
    listFeesForAcademicYearLabel(schoolId, activeYear.name),
  ]);

  return { school, academicYears, activeYear, periods, classes, fees };
}

/** Dédupliqué par requête serveur (React cache). */
export const getReferentialsPageData = cache(fetchReferentialsPageData);
