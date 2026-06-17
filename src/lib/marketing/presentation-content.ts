import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Smartphone,
  Users,
  Wallet,
  WifiOff,
} from 'lucide-react';

export type AudienceCard = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  tone: 'blue' | 'teal' | 'indigo';
};

export type FeatureBlock = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  href: string;
  icon: LucideIcon;
  reverse?: boolean;
};

export const presentationNav = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Profils', href: '#profils' },
  { label: 'Mobilité', href: '#mobilite' },
  { label: 'Contact', href: '#contact' },
] as const;

export const audienceCards: AudienceCard[] = [
  {
    id: 'direction',
    title: 'Direction & administration',
    description:
      'Tableau de bord, impayés, rapports et paramètres de l’établissement — pilotez votre école en un clic.',
    cta: 'Explorer la direction',
    href: '#direction',
    icon: Building2,
    tone: 'blue',
  },
  {
    id: 'personnel',
    title: 'Secrétariat & caisse',
    description:
      'Inscriptions, annuaire élèves, encaissement et reçus imprimables. Moins de paperasse, plus de clarté.',
    cta: 'Voir la caisse',
    href: '#caisse',
    icon: Wallet,
    tone: 'teal',
  },
  {
    id: 'enseignants',
    title: 'Enseignants',
    description:
      'Présences par classe, suivi des absences et outils du quotidien — simple sur mobile comme sur ordinateur.',
    cta: 'Découvrir les présences',
    href: '#presences',
    icon: ClipboardCheck,
    tone: 'indigo',
  },
];

export const featureBlocks: FeatureBlock[] = [
  {
    id: 'direction',
    eyebrow: 'Direction',
    title: 'Gérez votre établissement avec une vue d’ensemble claire',
    description:
      'Effectifs, impayés, synthèses et paramètres scolaires : tout est centralisé pour la direction et l’administration.',
    bullets: [
      'Dashboard et indicateurs clés',
      'Suivi des impayés et recouvrement',
      'Rapports prêts à l’emploi',
      'Paramètres multi-cycles (maternelle → humanités)',
    ],
    cta: 'Se connecter',
    href: '/',
    icon: BarChart3,
  },
  {
    id: 'caisse',
    eyebrow: 'Caisse & scolarité',
    title: 'Encaissez, imprimez, archivez — sans ressaisie',
    description:
      'De l’inscription au reçu de paiement, Pema Class suit chaque élève et chaque frais scolaire.',
    bullets: [
      'Fiche élève et matricule par école',
      'Caisse avec frais en CDF / USD',
      'Reçus et fiches d’inscription imprimables',
      'Journal de caisse et rapports financiers',
    ],
    cta: 'Accéder à la caisse',
    href: '/',
    icon: GraduationCap,
    reverse: true,
  },
  {
    id: 'presences',
    eyebrow: 'Présences',
    title: 'Faites l’appel en classe, suivez les absences',
    description:
      'Interface rapide pour les enseignants : présents, absents, retards — avec rapports hebdomadaires pour la direction.',
    bullets: [
      'Appel par classe en quelques taps',
      'Rapports absences répétées',
      'Historique par élève',
      'Mode personnel sur mobile',
    ],
    cta: 'Rejoindre l’équipe',
    href: '/join',
    icon: Users,
  },
];

export const mobilityPoints = [
  {
    icon: Smartphone,
    title: 'Sur téléphone, tablette ou ordinateur',
    text: 'Une seule application, la même expérience sur tous vos appareils.',
  },
  {
    icon: WifiOff,
    title: 'Pensée pour le terrain',
    text: 'Installez Pema Class sur l’écran d’accueil et travaillez même avec une connexion instable.',
  },
] as const;
