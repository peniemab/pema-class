export const SCHOOL_REPORTS_BASE = '/school/rapports';
export const APP_REPORTS_BASE = '/app/rapports';

export function reportHref(base: string, ...segments: string[]): string {
  const path = [base, ...segments].filter(Boolean).join('/');
  return path.replace(/\/+/g, '/');
}
