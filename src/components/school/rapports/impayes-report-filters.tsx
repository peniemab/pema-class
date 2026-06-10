'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { ClassRow } from '@/lib/db/classes';
import type { FeeRow } from '@/lib/db/fees';
import { StudentSearchField } from '@/components/school/students/student-search-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { classDisplayLabel } from '@/lib/school/students/constants';

type Props = {
  basePath: string;
  classes: ClassRow[];
  fees: FeeRow[];
  selectedClassId: string | null;
  selectedFeeId: string | null;
  search?: string;
};

export function ImpayesReportFilters({
  basePath,
  classes,
  fees,
  selectedClassId,
  selectedFeeId,
  search: initialSearch = '',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [classId, setClassId] = useState(selectedClassId ?? '');
  const [feeId, setFeeId] = useState(selectedFeeId ?? '');
  const skipSearchApply = useRef(false);

  useEffect(() => {
    skipSearchApply.current = true;
    setSearch(initialSearch);
    setClassId(selectedClassId ?? '');
    setFeeId(selectedFeeId ?? '');
  }, [initialSearch, selectedClassId, selectedFeeId]);

  const apply = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      const q = params.toString();
      router.push(q ? `${basePath}?${q}` : basePath);
    },
    [router, searchParams, basePath],
  );

  const buildParams = useCallback(
    (overrides?: Partial<{ q: string; classe: string; frais: string }>) => ({
      q: (overrides?.q ?? search).trim() || undefined,
      classe: (overrides?.classe ?? classId) || undefined,
      frais: (overrides?.frais ?? feeId) || undefined,
    }),
    [search, classId, feeId],
  );

  const applySearchFilter = useCallback(
    (q: string) => {
      apply(buildParams({ q }));
    },
    [apply, buildParams],
  );

  const handleDebouncedSearch = useCallback(
    (q: string) => {
      if (skipSearchApply.current) {
        skipSearchApply.current = false;
        return;
      }
      applySearchFilter(q);
    },
    [applySearchFilter],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply(buildParams());
  }

  function clearFilters() {
    router.push(basePath);
  }

  const hasFilters =
    Boolean(initialSearch) || Boolean(selectedClassId) || Boolean(selectedFeeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <StudentSearchField
            value={search}
            onChange={setSearch}
            onDebouncedChange={handleDebouncedSearch}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-impayes-classe">Classe</Label>
          <select
            id="report-impayes-classe"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classDisplayLabel(c.level, c.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-impayes-frais">Type de frais</Label>
          <select
            id="report-impayes-frais"
            value={feeId}
            onChange={(e) => setFeeId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Tous les frais</option>
            {fees.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" className="gap-1.5">
          <Search className="size-4" aria-hidden />
          Filtrer
        </Button>
        {hasFilters ? (
          <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
            Effacer
          </Button>
        ) : null}
      </div>
    </form>
  );
}
