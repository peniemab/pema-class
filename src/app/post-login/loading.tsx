import { Loader2 } from 'lucide-react';
import { brand } from '@/lib/brand';

export default function PostLoginLoading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">Connexion en cours</p>
        <p className="text-sm text-muted-foreground">
          Préparation de votre espace {brand.name}…
        </p>
      </div>
    </main>
  );
}
