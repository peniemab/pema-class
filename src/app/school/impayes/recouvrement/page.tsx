import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RecouvrementFilters } from '@/components/school/impayes/recouvrement-filters';
import { RecouvrementPrintButton } from '@/components/school/impayes/recouvrement-print-button';
import { RecouvrementTable } from '@/components/school/impayes/recouvrement-table';
import { ButtonLink } from '@/components/ui/button-link';
import { loadImpayesRecouvrementPage } from '@/lib/school/load-impayes-page';
import { formatFeeAmount } from '@/lib/school/referentials/constants';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ImpayesRecouvrementPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.frais) {
    redirect('/school/impayes');
  }

  const data = await loadImpayesRecouvrementPage(params);
  if (!data) notFound();

  const totalRemaining = data.rows.reduce((s, r) => s + r.amount_remaining, 0);
  const generatedAt = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="recouvrement-view mx-auto max-w-5xl space-y-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <ButtonLink
            variant="ghost"
            size="sm"
            href="/school/impayes"
            className="-ml-2 mb-2 gap-1.5"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Impayés
          </ButtonLink>
          <h1 className="text-2xl font-semibold tracking-tight">Recouvrement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.fee.name} — Année {data.activeYear.name}
          </p>
        </div>
        <RecouvrementPrintButton />
      </div>

      <div className="recouvrement-print-header hidden print:block">
        <h1 className="text-lg font-bold">Liste de recouvrement — {data.fee.name}</h1>
        <p className="text-sm text-black/70">
          {data.schoolName} · Année {data.activeYear.name} · {generatedAt}
        </p>
      </div>

      <div className="no-print grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {data.rows.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Élèves inscrits · {data.feeStat.student_count} impayé
            {data.feeStat.student_count > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-lg font-semibold tabular-nums">
            {formatFeeAmount(data.feeStat.total_collected, data.fee.currency)}
            <span className="mx-1 font-normal text-muted-foreground">/</span>
            {formatFeeAmount(data.feeStat.total_expected, data.fee.currency)}
          </p>
          <p className="text-xs text-muted-foreground">Encaissé / attendu (tous inscrits)</p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {formatFeeAmount(totalRemaining, data.fee.currency)}
          </p>
          <p className="text-xs text-muted-foreground">Reste sur cette liste</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <RecouvrementFilters
          classes={data.classes}
          fees={data.fees}
          feeId={data.fee.id}
          filters={{
            search: data.filters.search,
            classId: data.filters.classId,
          }}
        />
      </Suspense>

      <div className="recouvrement-print-area space-y-2">
        <p className="text-sm text-muted-foreground print:text-black/70">
          {data.rows.length} inscrit{data.rows.length > 1 ? 's' : ''}
          {data.feeStat.student_count > 0
            ? ` · ${data.feeStat.student_count} impayé${data.feeStat.student_count > 1 ? 's' : ''}`
            : ' · tous soldés'}
          {data.filters.classId ? ' · classe filtrée' : ''}
          {data.filters.search ? ` · recherche « ${data.filters.search} »` : ''}
        </p>
        <RecouvrementTable rows={data.rows} feeName={data.fee.name} />
      </div>

      <p className="no-print text-center text-xs text-muted-foreground">
        Cliquez sur un élève pour la fiche, ou{' '}
        <Link href="/school/caisse" className="text-primary underline">
          ouvrir la caisse
        </Link>{' '}
        pour encaisser.
      </p>
    </div>
  );
}
