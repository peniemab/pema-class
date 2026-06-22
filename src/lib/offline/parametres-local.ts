import type { AcademicYearRow } from '@/lib/db/academic-years';
import type { ClassRow } from '@/lib/db/classes';
import type { FeeRow } from '@/lib/db/fees';
import type { ReferentialsPageData } from '@/lib/db/referentials-page';
import type { SchoolRow } from '@/lib/db/schools';
import type { TeamPageData } from '@/lib/db/team-page';
import type { AppDataValue } from '@/lib/offline/app-data-context';

export type ParametresBundle = {
  school: SchoolRow;
  referentials: ReferentialsPageData;
  team: TeamPageData;
};

function toClassRow(c: AppDataValue['classes'][number]): ClassRow {
  return {
    id: c.id,
    school_id: c.school_id,
    academic_year_id: c.academic_year_id,
    name: c.name,
    level: c.level,
    cycle: c.cycle,
    max_capacity: c.max_capacity,
    current_count: c.current_count,
    created_at: '',
  };
}

function toFeeRow(f: AppDataValue['fees'][number]): FeeRow {
  return {
    id: f.id,
    school_id: f.school_id,
    name: f.name,
    amount: f.amount,
    currency: f.currency,
    academic_year: f.academic_year,
    created_at: '',
  };
}

function stubSchool(data: AppDataValue, schoolName: string): SchoolRow {
  return {
    id: data.schoolId,
    name: schoolName || 'Établissement',
    display_name: schoolName || null,
    slug: null,
    address: null,
    phone: null,
    email: null,
    description: null,
    logo_url: null,
    school_type: 'school',
    status: 'active',
    rccm: null,
    tax_number: null,
    national_id: null,
    offered_cycles: null,
  };
}

function stubActiveYear(
  data: AppDataValue,
  activeYear: { id: string; name: string },
): AcademicYearRow {
  return {
    id: activeYear.id,
    school_id: data.schoolId,
    name: activeYear.name,
    start_date: '',
    end_date: '',
    period_type: 'trimester',
    cycles: null,
    is_active: true,
    created_at: '',
  };
}

/**
 * Aperçu paramètres depuis AppData (menu principal instantané).
 * Les formulaires détaillés arrivent via cache/API (données complètes).
 */
export function buildParametresPartialFromAppData(
  data: AppDataValue,
  schoolName: string,
): ParametresBundle {
  const school = stubSchool(data, schoolName);
  const activeYearLite =
    data.studentsState?.activeYear ??
    data.caisseState?.activeYear ??
    data.attendanceState?.activeYear ??
    null;

  if (!activeYearLite) {
    return {
      school,
      referentials: {
        school,
        academicYears: [],
        activeYear: null,
        periods: [],
        classes: [],
        fees: [],
      },
      team: { activeYear: null, classes: [], staff: [] },
    };
  }

  const classes = data.classes
    .filter((c) => c.academic_year_id === activeYearLite.id)
    .map(toClassRow);

  const fees = data.fees
    .filter((f) => f.academic_year === activeYearLite.name)
    .map(toFeeRow);

  const activeYear = stubActiveYear(data, activeYearLite);

  return {
    school,
    referentials: {
      school,
      academicYears: [activeYear],
      activeYear,
      periods: [],
      classes,
      fees,
    },
    team: {
      activeYear: { id: activeYearLite.id, name: activeYearLite.name },
      classes,
      staff: [],
    },
  };
}
