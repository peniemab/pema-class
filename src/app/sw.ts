import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist } from 'serwist';

/**
 * Routes applicatives (session Supabase) : jamais en cache SW.
 * Couvre navigations document ET soft-nav Next.js (en-tête RSC).
 * Sans cela, la PWA sert une vieille réponse (souvent redirect login) sur Élèves, Écoles, etc.
 */
const AUTH_PATH_PREFIXES = [
  '/platform',
  '/school',
  '/app',
  '/post-login',
  '/logout',
  '/register',
  '/join',
  '/auth',
  '/print',
] as const;

function isAuthSensitivePath(pathname: string): boolean {
  if (pathname === '/') return true;
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  /** navigationPreload + redirects middleware cassent la session en PWA mobile. */
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        isAuthSensitivePath(url.pathname) &&
        !url.pathname.startsWith('/api/'),
      method: 'GET',
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
