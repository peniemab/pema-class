import { Wallet } from 'lucide-react';
import { CaisseSearchPanel } from '@/components/school/caisse/caisse-search-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

export function CaisseHomePage({ caisseBasePath }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-0">
      <Alert className="mx-4 mt-4 border-0 bg-wa-panel">
        <AlertDescription className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0 text-wa-accent" aria-hidden />
          Sélectionnez un élève inscrit pour l&apos;année active, puis encaissez
          chaque poste de frais (inscription, scolarité, etc.).
        </AlertDescription>
      </Alert>

      <div className="mt-4 border-y border-wa-divider bg-wa-panel px-4 py-4">
        <CaisseSearchPanel caisseBasePath={caisseBasePath} />
      </div>
    </div>
  );
}
