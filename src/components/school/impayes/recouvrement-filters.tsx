'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { ClassRow } from '@/lib/db/classes';
import type { FeeRow } from '@/lib/db/fees';
import { StudentSearchField } from '@/components/school/students/student-search-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Props = {
  classes: ClassRow[];
  fees: FeeRow[];
  feeId: string;
  filters: {
    search?: string;
    classId?: string;
  };
};

export function RecouvrementFilters({ classes, fees, feeId, filters }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState(filters.search ?? '');
  const [classId, setClassId] = useState(filters.classId ?? '');
  const [selectedFeeId, setSelectedFeeId] = useState(feeId);
  const skipSearchApply = useRef(false);

  useEffect(() => {
    skipSearchApply.current = true;
    setSearch(filters.search ?? '');
    setClassId(filters.classId ?? '');
    setSelectedFeeId(feeId);
  }, [filters.search, filters.classId, feeId]);

  const apply = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const frais = next.frais ?? feeId;
      params.set('frais', frais);
      if (next.q) params.set('q', next.q);
      if (next.classe) params.set('classe', next.classe);
      router.push(`/school/impayes/recouvrement?${params.toString()}`);
    },
    [router, feeId],
  );

  const buildParams = useCallback(
    (overrides?: Partial<{ q: string; classe: string; frais: string }>) => ({
      frais: overrides?.frais ?? selectedFeeId,
      q: (overrides?.q ?? search).trim() || undefined,
      classe: (overrides?.classe ?? classId) || undefined,
    }),
    [search, classId, selectedFeeId],
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
    router.push(`/school/impayes/recouvrement?frais=${feeId}`);
  }

  const hasFilters = Boolean(filters.search) || Boolean(filters.classId);

  return (
    <form
      onSubmit={handleSubmit}
      className="no-print space-y-3 rounded-lg border bg-muted/20 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <StudentSearchField
            value={search}
            onChange={setSearch}
            onDebouncedChange={handleDebouncedSearch}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recouvrement-classe">Classe</Label>
          <select
            id="recouvrement-classe"
            name="classe"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.level} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recouvrement-frais">Type de frais</Label>
          <select
            id="recouvrement-frais"
            name="frais"
            value={selectedFeeId}
            onChange={(e) => {
              setSelectedFeeId(e.target.value);
              apply(buildParams({ frais: e.target.value }));
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
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
            Effacer filtres
          </Button>
        ) : null}
      </div>
    </form>
  );
}
