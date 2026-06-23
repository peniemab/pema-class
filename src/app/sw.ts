import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

/**
 * PWA WhatsApp + session Facebook :
 * - shell workspace (/boot, /app, /school) en cache pour ouverture hors ligne
 * - API / RSC toujours réseau (pas de faux logout sur les mutations)
 */
const APP_PATH_PREFIXES = [
  '/platform',
  '/school',
  '/app',
  '/boot',
  '/post-login',
  '/logout',
  '/register',
  '/join',
  '/auth',
  '/print',
  '/presentation',
] as const;

const WORKSPACE_SHELL_PATHS = ['/boot', '/app', '/school'] as const;

function isAppPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isWorkspaceShellDocument(url: URL, request: Request): boolean {
  if (request.mode !== 'navigate' && request.destination !== 'document') {
    return false;
  }
  return WORKSPACE_SHELL_PATHS.some((prefix) => url.pathname === prefix);
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
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request }) => request.headers.get('RSC') === '1',
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) => isWorkspaceShellDocument(url, request),
      handler: new NetworkFirst({
        cacheName: 'pema-workspace-shell',
        networkTimeoutSeconds: 4,
      }),
    },
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
        url: '/boot',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
