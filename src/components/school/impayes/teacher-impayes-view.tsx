'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { TeacherImpayesPageData } from '@/lib/db/teacher-impayes-page';
import { WaAvatar } from '@/components/school/mobile/wa-avatar';
import { WaList, WaListRow, WaListSection } from '@/components/school/mobile/wa-list-row';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import {
  formatDualMoney,
  type FeeCurrency,
} from '@/lib/school/fee-currencies';

type Props = {
  data: TeacherImpayesPageData;
  feeCurrencies: FeeCurrency[];
  onFiltersChange?: (patch: Record<string, string | undefined>) => void;
};

export function TeacherImpayesView({ data, feeCurrencies, onFiltersChange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    if (onFiltersChange) {
      onFiltersChange({ [key]: value || undefined });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/app/impayes?${params.toString()}`);
  }

  if (!data.activeYear) {
    return (
      <Alert className="mx-4 mt-4">
        <AlertDescription>
          Aucune année scolaire active. Contactez la direction.
        </AlertDescription>
      </Alert>
    );
  }

  if (data.classes.length === 0) {
    return (
      <Alert className="mx-4 mt-4">
        <AlertDescription>
          Aucune classe ne vous est assignée. Contactez la direction pour
          configurer vos classes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-0 pb-6">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-3">
        <p className="text-sm text-wa-text-secondary">
          Élèves impayés dans{' '}
          <span className="font-medium text-wa-text-primary">vos classes</span>{' '}
          — {data.activeYear.name}. Liste pour relance en salle (lecture seule).
        </p>
      </div>

      <div className="space-y-3 border-b border-wa-divider bg-wa-panel px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-secondary"
            aria-hidden
          />
          <input
            type="search"
            defaultValue={data.filters.search ?? ''}
            onChange={(e) => updateFilter('q', e.target.value)}
            placeholder="Rechercher un élève…"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Rechercher un élève"
          />
        </div>
        {data.classes.length > 1 ? (
          <select
            value={data.filters.classId ?? ''}
            onChange={(e) => updateFilter('classe', e.target.value)}
            aria-label="Filtrer par classe"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Toutes mes classes</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classDisplayLabel(c.level, c.name)}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {data.rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-wa-text-secondary">
          Aucun impayé dans vos classes avec ces filtres.
        </p>
      ) : (
        <WaListSection
          title={`${data.rows.length} élève${data.rows.length > 1 ? 's' : ''} à relancer`}
        >
          <WaList>
            {data.rows.map((row) => {
              const name = studentFullName(row.last_name, row.first_name);
              const amount = formatDualMoney(
                { cdf: row.remaining_cdf, usd: row.remaining_usd },
                feeCurrencies,
              );
              const classLabel = classDisplayLabel(
                row.class_level,
                row.class_name,
              );
              return (
                <WaListRow
                  key={row.student_id}
                  avatar={<WaAvatar name={name} size="md" />}
                  title={name}
                  subtitle={
                    <>
                      <span className="block truncate">
                        {row.matricule ?? 'Sans matricule'} · {classLabel}
                      </span>
                      <span className="block text-xs">
                        {row.unpaid_fee_count} frais en attente
                      </span>
                    </>
                  }
                  trailing={
                    <span className="text-sm font-semibold tabular-nums text-destructive">
                      {amount}
                    </span>
                  }
                />
              );
            })}
          </WaList>
        </WaListSection>
      )}
    </div>
  );
}
