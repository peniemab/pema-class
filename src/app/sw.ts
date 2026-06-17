import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist';

/**
 * Stratégie PWA « Schoolap » : installer l'app + assets en cache,
 * mais JAMAIS les pages HTML / RSC / session (évite les faux logout).
 */
const APP_PATH_PREFIXES = [
  '/platform',
  '/school',
  '/app',
  '/post-login',
  '/logout',
  '/register',
  '/join',
  '/auth',
  '/print',
  '/presentation',
] as const;

function isAppPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAppRequest(url: URL, request: Request, sameOrigin: boolean): boolean {
  if (!sameOrigin) return false;
  if (url.pathname.startsWith('/api/')) return true;
  if (isAppPath(url.pathname)) return true;
  if (request.headers.get('RSC') === '1') return true;
  if (request.mode === 'navigate') return true;
  return false;
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
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url, request, sameOrigin }) =>
        isAppRequest(url, request, sameOrigin),
      handler: new NetworkOnly(),
    },
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new CacheFirst({ cacheName: 'pema-next-static' }),
    },
    {
      matcher: /\/icons\/.*/i,
      handler: new CacheFirst({ cacheName: 'pema-icons' }),
    },
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new StaleWhileRevalidate({ cacheName: 'pema-images' }),
    },
    {
      matcher: /\.(?:woff2?|ttf)$/i,
      handler: new CacheFirst({ cacheName: 'pema-fonts' }),
    },
    {
      matcher: /\/manifest\.webmanifest$/i,
      handler: new StaleWhileRevalidate({ cacheName: 'pema-manifest' }),
    },
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
