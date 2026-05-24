import { appBaseUrl } from '@/lib/env';

export function buildOnboardingUrl(rawToken: string): string {
  const baseUrl = appBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/register?invite=${rawToken}`;
}
