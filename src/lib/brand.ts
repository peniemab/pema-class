/** Identité produit Pema Class (UI login, PWA, marketing). */
export const brand = {
  name: 'Pema Class',
  shortName: 'Pema',
  initial: 'P',
  colors: {
    primary: '#0077B6',
    primaryDark: '#023E8A',
    primaryLight: '#90E0EF',
    secondary: '#2A9D8F',
    primaryForeground: '#ffffff',
    background: '#F0F7FB',
    surface: '#FFFFFF',
    text: '#1A3A4A',
    textMuted: '#5C7A8A',
    border: '#C5DCE8',
  },
  login: {
    title: 'Identifiez-vous',
    emailPlaceholder: 'vous@ecole.cd',
    partnerLabel: 'Accès établissements',
    headline:
      'Pilotez votre établissement scolaire avec une plateforme pensée pour les équipes pédagogiques et administratives.',
    modulesLine:
      'Élèves, classes, notes, présences, facturation et rapports dans un environnement privé.',
    offersCard:
      'Une solution complète pour la direction, le secrétariat et les enseignants.',
    offersLinkLabel: 'Découvrir la plateforme',
  },
  texts: {
    logoutButton: 'Se déconnecter',
  },
} as const;

export const legalLinks = [
  { label: 'Conditions générales', href: '/legal/cgu' },
  { label: 'Mentions légales', href: '/legal/mentions' },
  { label: 'Politique de cookies', href: '/legal/cookies' },
  { label: 'Confidentialité', href: '/legal/confidentialite' },
  { label: 'Gestion des cookies', href: '/legal/gestion-cookies' },
] as const;
