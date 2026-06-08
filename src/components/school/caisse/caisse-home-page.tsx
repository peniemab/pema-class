import { Wallet } from 'lucide-react';
import { CaisseSearchPanel } from '@/components/school/caisse/caisse-search-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

export function CaisseHomePage({ caisseBasePath }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Caisse</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encaissement des frais scolaires — recherche par nom ou matricule.
        </p>
      </div>

      <Alert>
        <AlertDescription className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sélectionnez un élève inscrit pour l&apos;année active, puis encaissez
          chaque poste de frais (inscription, scolarité, etc.).
        </AlertDescription>
      </Alert>

      <CaisseSearchPanel caisseBasePath={caisseBasePath} />
    </div>
  );
}
