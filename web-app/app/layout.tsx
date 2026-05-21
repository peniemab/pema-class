import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pema Class',
  description: 'Gestion scolaire — inscription, caisse, annuaire élèves',
  applicationName: 'Pema Class',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Pema Class',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
