export const LOGO_BUCKET = 'logos';
export const MAX_SCHOOL_LOGO_BYTES = 2 * 1024 * 1024;

export const ALLOWED_SCHOOL_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_SCHOOL_LOGO_ACCEPT = ALLOWED_SCHOOL_LOGO_TYPES.join(',');

export function formatLogoMaxSize(): string {
  return '2 Mo';
}

export function validateSchoolLogoFile(file: File): string | null {
  if (!ALLOWED_SCHOOL_LOGO_TYPES.includes(file.type as (typeof ALLOWED_SCHOOL_LOGO_TYPES)[number])) {
    return 'Format accepté : JPEG, PNG, WebP ou SVG.';
  }
  if (file.size > MAX_SCHOOL_LOGO_BYTES) {
    return `Le fichier dépasse ${formatLogoMaxSize()}. Choisissez une image plus légère.`;
  }
  return null;
}
