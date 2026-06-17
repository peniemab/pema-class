import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.SUPABASE_ANON_KEY
) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  /** Désactivé en dev : évite conflits webpack + cache SW obsolète. Prod : PWA active. */
  disable:
    process.env.SERWIST_DISABLE === 'true' ||
    process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    /** Évite de réutiliser une vieille réponse RSC (redirect login) entre onglets. */
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withSerwist(nextConfig);
