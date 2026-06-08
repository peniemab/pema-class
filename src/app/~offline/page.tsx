import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <BrandMark orientation="center" />
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">Vous êtes hors ligne</h1>
        <p className="text-sm text-muted-foreground">
          Cette page a été mise en cache. Reconnectez-vous à Internet pour
          synchroniser les données.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
        Réessayer
      </Link>
    </main>
  );
}
