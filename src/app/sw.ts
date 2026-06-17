import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist } from 'serwist';

/** Pages authentifiées / redirections : jamais en cache SW (sinon déconnexion fantôme en PWA). */
const AUTH_NAV_PREFIXES = [
  '/platform',
  '/school',
  '/app',
  '/post-login',
  '/logout',
  '/register',
  '/join',
  '/auth',
] as const;

function isAuthSensitiveNavigation(url: URL, request: Request): boolean {
  if (request.mode !== 'navigate') return false;
  const { pathname } = url;
  if (pathname === '/') return true;
  return AUTH_NAV_PREFIXES.some(
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
      matcher: ({ url, request }) => isAuthSensitiveNavigation(url, request),
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
