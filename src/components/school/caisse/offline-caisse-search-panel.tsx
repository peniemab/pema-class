'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  filterLocalStudents,
  toDirectoryRow,
} from '@/lib/offline/students-filter';
import { readLocalStudents } from '@/lib/offline/students-repo';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';

type Props = {
  schoolId: string;
  caisseBasePath: '/school/caisse' | '/app/caisse';
  onSelectStudent: (studentId: string) => void;
};

export function OfflineCaisseSearchPanel({
  schoolId,
  caisseBasePath,
  onSelectStudent,
}: Props) {
  const [search, setSearch] = useState('');

  const students = useLiveQuery(
    () => readLocalStudents(schoolId),
    [schoolId],
  );

  const suggestions = useMemo(() => {
    if (!students) return [];
    const q = search.trim();
    if (q.length < 2) return [];
    return filterLocalStudents(students, { search: q, status: 'active' })
      .filter((s) => s.class_id)
      .slice(0, 12)
      .map(toDirectoryRow);
  }, [students, search]);

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <label htmlFor="offline-caisse-search" className="text-sm font-medium">
        Rechercher un élève à encaisser
      </label>
      <div className="relative mt-2">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="offline-caisse-search"
          type="search"
          inputMode="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom, post-nom ou matricule…"
          className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {suggestions.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-lg border bg-background text-sm">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                onClick={() => onSelectStudent(s.id)}
              >
                <span className="min-w-0 truncate font-medium">
                  {studentFullName(s.last_name, s.first_name)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.matricule ?? '—'}
                  {s.class_level
                    ? ` · ${classDisplayLabel(s.class_level, s.class_name)}`
                    : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : search.trim().length >= 2 && students ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Aucun élève inscrit trouvé dans le cache local.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Lecture locale — {caisseBasePath}. Cliquez sur une suggestion pour
        encaisser.
      </p>
    </div>
  );
}
