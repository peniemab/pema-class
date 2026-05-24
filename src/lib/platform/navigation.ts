import {
  Building2,
  History,
  LayoutDashboard,
  Link2,
} from 'lucide-react';

export const platformNavItems = [
  {
    title: 'Tableau de bord',
    href: '/platform',
    icon: LayoutDashboard,
  },
  {
    title: 'Établissements',
    href: '/platform/schools',
    icon: Building2,
  },
  {
    title: 'Liens onboarding',
    href: '/platform/onboarding',
    icon: History,
  },
  {
    title: 'Nouveau lien',
    href: '/platform/onboarding/new',
    icon: Link2,
  },
] as const;
