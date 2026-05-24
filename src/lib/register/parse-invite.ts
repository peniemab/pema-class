import { appBaseUrl } from '@/lib/env';

/** Extrait le token depuis une URL complète, un chemin relatif ou une valeur brute. */
export function extractInviteToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  try {
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    ) {
      const url = trimmed.startsWith('/')
        ? new URL(trimmed, appBaseUrl())
        : new URL(trimmed);
      const fromQuery = url.searchParams.get('invite');
      if (fromQuery) return fromQuery.trim();
    }
  } catch {
  }

  return trimmed;
}
