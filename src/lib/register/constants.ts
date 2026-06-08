/** Communes de Kinshasa (RDC) — liste représentative. */
export const KINSHASA_COMMUNES = [
  'Bandalungwa',
  'Barumbu',
  'Bumbu',
  'Gombe',
  'Kalamu',
  'Kasa-Vubu',
  'Kimbanseke',
  'Kinshasa',
  'Kintambo',
  'Kisenso',
  'Lemba',
  'Limete',
  'Lingwala',
  'Makala',
  'Maluku',
  'Masina',
  'Matete',
  'Mont-Ngafula',
  'Ndjili',
  'Ngaba',
  'Ngaliema',
  'Ngiri-Ngiri',
  'Nsele',
  'Selembao',
] as const;

export type DisciplineGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export const SCHOOL_DISCIPLINES: DisciplineGroup[] = [
  {
    label: 'Enseignement général',
    options: [
      { value: 'francais', label: 'Français' },
      { value: 'mathematiques', label: 'Mathématiques' },
      { value: 'sciences', label: 'Sciences' },
      { value: 'histoire_geo', label: 'Histoire-Géographie' },
      { value: 'eps', label: 'Éducation physique' },
    ],
  },
  {
    label: 'Langues',
    options: [
      { value: 'anglais', label: 'Anglais' },
      { value: 'lingala', label: 'Lingala' },
      { value: 'swahili', label: 'Swahili' },
    ],
  },
  {
    label: 'Maternelle / primaire',
    options: [
      { value: 'maternelle', label: 'Maternelle' },
      { value: 'primaire', label: 'Primaire' },
    ],
  },
  {
    label: 'Administration & pilotage',
    options: [
      { value: 'direction', label: 'Direction' },
      { value: 'coordination_pedagogique', label: 'Coordination pédagogique' },
      { value: 'secretariat_direction', label: 'Secrétariat de direction' },
    ],
  },
  {
    label: 'Vie scolaire',
    options: [
      { value: 'surveillant', label: 'Surveillant' },
      { value: 'orientation', label: 'Orientation' },
      { value: 'parascolaire', label: 'Activités parascolaires' },
    ],
  },
  {
    label: 'Support',
    options: [
      { value: 'comptabilite', label: 'Comptabilité' },
      { value: 'informatique', label: 'Informatique' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
  {
    label: 'Autre',
    options: [{ value: 'autre', label: 'Autre discipline' }],
  },
];

export const SCHOOL_ADMIN_FUNCTION = {
  value: 'school_admin',
  label: 'Direction / propriétaire',
} as const;
