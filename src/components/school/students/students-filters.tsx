'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { ClassRow } from '@/lib/db/classes';
import { StudentSearchField } from '@/components/school/students/student-search-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Props = {
  classes: ClassRow[];
  filters: {
    search?: string;
    classId?: string;
    status?: string;
    unassignedOnly?: boolean;
  };
};

export function StudentsFilters({ classes, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.search ?? '');
  const [classId, setClassId] = useState(filters.classId ?? '');
  const [status, setStatus] = useState(filters.status ?? 'all');
  const [unassignedOnly, setUnassignedOnly] = useState(
    filters.unassignedOnly ?? false,
  );
  const skipSearchApply = useRef(false);

  useEffect(() => {
    skipSearchApply.current = true;
    setSearch(filters.search ?? '');
    setClassId(filters.classId ?? '');
    setStatus(filters.status ?? 'all');
    setUnassignedOnly(filters.unassignedOnly ?? false);
  }, [filters.search, filters.classId, filters.status, filters.unassignedOnly]);

  const apply = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      params.delete('page');
      router.push(`/school/eleves?${params.toString()}`);
    },
    [router, searchParams],
  );

  const applySearchFilter = useCallback(
    (q: string) => {
      apply({
        q: q.trim() || undefined,
        classe: classId || undefined,
        statut: status !== 'all' ? status : undefined,
        sans_classe: unassignedOnly ? '1' : undefined,
      });
    },
    [apply, classId, status, unassignedOnly],
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
    apply({
      q: search.trim() || undefined,
      classe: classId || undefined,
      statut: status !== 'all' ? status : undefined,
      sans_classe: unassignedOnly ? '1' : undefined,
    });
  }

  function clearFilters() {
    router.push('/school/eleves');
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.classId) ||
    filters.status !== 'all' ||
    filters.unassignedOnly;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border bg-muted/20 p-4"
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
          <Label htmlFor="classe">Classe</Label>
          <select
            id="classe"
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
          <Label htmlFor="statut">Statut</Label>
          <select
            id="statut"
            name="statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sans_classe"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
            className="size-4 accent-primary"
          />
          Sans classe cette année
        </label>
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
