'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import type { StudentDirectoryRow } from '@/lib/db/students';
import { suggestStudentsAction } from '@/lib/school/students-actions';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  onSelectStudent?: (studentId: string) => void;
  debounceMs?: number;
  label?: string;
  inputId?: string;
};

export function StudentSearchField({
  value,
  onChange,
  onDebouncedChange,
  onSelectStudent,
  debounceMs = 350,
  label = 'Rechercher un élève',
  inputId = 'q',
}: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<StudentDirectoryRow[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!onDebouncedChange) return;
    const timer = window.setTimeout(() => {
      onDebouncedChange(value);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [value, debounceMs, onDebouncedChange]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(() => {
      void suggestStudentsAction(q).then((rows) => {
        if (cancelled) return;
        setSuggestions(rows);
        setLoading(false);
        setActiveIndex(-1);
        setOpen(true);
      });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function selectSuggestion(row: StudentDirectoryRow) {
    setOpen(false);
    if (onSelectStudent) {
      onSelectStudent(row.id);
      return;
    }
    router.push(`/school/eleves/${row.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showPanel = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative mt-1.5">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          name={inputId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Nom, post-nom ou matricule…"
          className="h-10 pl-9"
        />
        {loading ? (
          <Loader2
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover py-1 shadow-md"
        >
          {suggestions.length === 0 && !loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Aucun élève pour « {value.trim()} »
            </li>
          ) : (
            suggestions.map((row, index) => {
              const name = studentFullName(row.last_name, row.first_name);
              const classe = row.class_id
                ? classDisplayLabel(row.class_level, row.class_name)
                : 'Sans classe';
              return (
                <li key={row.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/60',
                      index === activeIndex && 'bg-muted/60',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(row)}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.matricule ?? '—'} · {classe}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
