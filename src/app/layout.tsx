import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Geist, Edu_AU_VIC_WA_NT_Hand } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const signature = Edu_AU_VIC_WA_NT_Hand({
  subsets: ['latin'],
  variable: '--font-signature',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Pema Class',
  description: 'Gestion scolaire — inscription, caisse, annuaire élèves',
  applicationName: 'Pema Class',
  appleWebApp: {
    capable: true,
    title: 'Pema Class',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0077B6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={cn('font-sans', geist.variable, signature.variable)}
    >
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
