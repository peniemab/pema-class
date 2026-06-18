import {
  BarChart3,
  Briefcase,
  CircleAlert,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
  ClipboardList,
  FileBarChart,
} from 'lucide-react';
import type { ComponentType } from 'react';

import type { WaShellConfig } from '@/lib/navigation/wa-shell-context';

export type SchoolNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export type SchoolToolItem = {
  href: string;
  label: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'green' | 'teal' | 'blue' | 'orange' | 'indigo' | 'pink';
};

export type SchoolToolSection = {
  title: string;
  items: SchoolToolItem[];
};

export const SCHOOL_SIDEBAR_NAV: SchoolNavItem[] = [
  { href: '/school', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/school/eleves', label: 'Élèves', icon: GraduationCap },
  { href: '/school/presences', label: 'Présences', icon: ClipboardCheck },
  { href: '/school/caisse', label: 'Caisse', icon: Wallet },
  { href: '/school/impayes', label: 'Impayés', icon: CircleAlert },
  { href: '/school/rapports', label: 'Rapports', icon: BarChart3 },
  { href: '/school/parametres', label: 'Paramètres', icon: Settings },
];

/** WhatsApp Business — 5 onglets : Accueil, Élèves, Présences, Caisse, Outils. */
export const SCHOOL_BOTTOM_NAV: SchoolNavItem[] = [
  { href: '/school', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/school/eleves', label: 'Élèves', icon: GraduationCap },
  { href: '/school/presences', label: 'Présences', icon: ClipboardCheck },
  { href: '/school/caisse', label: 'Caisse', icon: Wallet },
  { href: '/school/outils', label: 'Outils', icon: Briefcase, exact: true },
];

export const SCHOOL_TOOL_SECTIONS: SchoolToolSection[] = [
  {
    title: 'Finances',
    items: [
      {
        href: '/school/impayes',
        label: 'Impayés',
        description: 'Relances et soldes dus',
        icon: CircleAlert,
        tone: 'orange',
      },
      {
        href: '/school/rapports/caisse/journal',
        label: 'Journal caisse',
        description: 'Encaissements du jour',
        icon: ClipboardList,
        tone: 'teal',
      },
      {
        href: '/school/rapports/impayes/synthese',
        label: 'Synthèse finances',
        description: 'KPIs recouvrement',
        icon: FileBarChart,
        tone: 'green',
      },
    ],
  },
  {
    title: 'Pédagogie',
    items: [
      {
        href: '/school/rapports/presences',
        label: 'Rapports présences',
        description: 'Jour, hebdo, absences',
        icon: ClipboardCheck,
        tone: 'green',
      },
      {
        href: '/school/rapports/effectifs',
        label: 'Effectifs',
        description: 'Inscrits par classe',
        icon: Users,
        tone: 'blue',
      },
    ],
  },
  {
    title: 'Gérer l\'établissement',
    items: [
      {
        href: '/school/rapports',
        label: 'Tous les rapports',
        description: 'Hub des synthèses',
        icon: BarChart3,
        tone: 'indigo',
      },
      {
        href: '/school/parametres',
        label: 'Paramètres',
        description: 'Classes, frais, équipe',
        icon: Settings,
        tone: 'pink',
      },
      {
        href: '/school/parametres#etablissement',
        label: 'Profil établissement',
        description: 'Nom, cycles, logo',
        icon: GraduationCap,
        tone: 'blue',
      },
    ],
  },
];

export const SCHOOL_LOGOUT_ITEM = {
  href: '/logout',
  label: 'Déconnexion',
  icon: LogOut,
};

export function isSchoolNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return (
    pathname === href ||
    (href !== '/school' && pathname.startsWith(`${href}/`))
  );
}

const BOTTOM_TAB_PATHS = new Set([
  '/school',
  '/school/eleves',
  '/school/presences',
  '/school/caisse',
  '/school/outils',
]);

export function shouldShowSchoolBottomNav(pathname: string): boolean {
  return BOTTOM_TAB_PATHS.has(pathname);
}

export const SCHOOL_WA_SHELL_CONFIG: WaShellConfig = {
  homeHref: '/school',
  bottomNav: SCHOOL_BOTTOM_NAV,
  getPageMeta: getSchoolMobilePageMeta,
  shouldShowBottomNav: shouldShowSchoolBottomNav,
  isNavActive: isSchoolNavActive,
};

type PageMeta = {
  title: string;
  backHref?: string;
};

const PAGE_TITLES: Record<string, PageMeta> = {
  '/school': { title: 'Accueil' },
  '/school/eleves': { title: 'Élèves' },
  '/school/presences': { title: 'Présences' },
  '/school/caisse': { title: 'Caisse' },
  '/school/outils': { title: 'Outils' },
  '/school/impayes': { title: 'Impayés', backHref: '/school/outils' },
  '/school/rapports': { title: 'Rapports', backHref: '/school/outils' },
  '/school/parametres': { title: 'Paramètres', backHref: '/school/outils' },
  '/school/eleves/nouveau': { title: 'Nouvelle inscription', backHref: '/school/eleves' },
  '/school/impayes/recouvrement': { title: 'Recouvrement', backHref: '/school/impayes' },
  '/school/rapports/presences': { title: 'Rapports présences', backHref: '/school/rapports' },
  '/school/rapports/caisse': { title: 'Rapports caisse', backHref: '/school/rapports' },
  '/school/rapports/impayes': { title: 'Rapports impayés', backHref: '/school/rapports' },
  '/school/rapports/effectifs': { title: 'Effectifs', backHref: '/school/rapports' },
};

const REPORT_SUBTITLES: Record<string, PageMeta> = {
  '/school/rapports/presences/jour': { title: 'Rapport du jour', backHref: '/school/rapports/presences' },
  '/school/rapports/presences/hebdo': { title: 'Synthèse hebdo', backHref: '/school/rapports/presences' },
  '/school/rapports/presences/absences-repetees': {
    title: 'Absences répétées',
    backHref: '/school/rapports/presences',
  },
  '/school/rapports/presences/eleve': { title: 'Historique élève', backHref: '/school/rapports/presences' },
  '/school/rapports/caisse/journal': { title: 'Journal de caisse', backHref: '/school/rapports/caisse' },
  '/school/rapports/impayes/synthese': { title: 'Synthèse impayés', backHref: '/school/rapports/impayes' },
  '/school/rapports/impayes/liste': { title: 'Liste impayés', backHref: '/school/rapports/impayes' },
};

export function getSchoolMobilePageMeta(pathname: string): PageMeta {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]!;
  if (REPORT_SUBTITLES[pathname]) return REPORT_SUBTITLES[pathname]!;

  const eleveMatch = pathname.match(/^\/school\/eleves\/([^/]+)$/);
  if (eleveMatch && eleveMatch[1] !== 'nouveau') {
    return { title: 'Fiche élève', backHref: '/school/eleves' };
  }

  const caisseMatch = pathname.match(/^\/school\/caisse\/([^/]+)$/);
  if (caisseMatch) {
    return { title: 'Encaissement', backHref: '/school/caisse' };
  }

  if (pathname.startsWith('/school/rapports/presences/')) {
    return { title: 'Rapports présences', backHref: '/school/rapports/presences' };
  }
  if (pathname.startsWith('/school/rapports/')) {
    return { title: 'Rapports', backHref: '/school/outils' };
  }

  return { title: 'Pema Class' };
}
