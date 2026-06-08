'use client';

import { useEffect, useState } from 'react';
import { useReferentialsRefresh } from '@/hooks/use-referentials-refresh';
import { Check, Pencil } from 'lucide-react';
import { saveSchoolCyclesAction } from '@/lib/school/referentials-actions';
import {
  CYCLE_DISPLAY_ORDER,
  CYCLE_PERIOD_TYPE,
  normalizeSchoolCycles,
  sameSchoolCycles,
  SCHOOL_CYCLES,
  SCHOOL_CYCLE_LABELS,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';
import type { SchoolRow } from '@/lib/db/schools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  school: SchoolRow;
};

function cyclePeriodLabel(cycle: SchoolCycle): string {
  return CYCLE_PERIOD_TYPE[cycle] === 'trimester' ? 'Trimestres' : 'Semestres';
}

function cyclePeriodCount(cycle: SchoolCycle): string {
  return CYCLE_PERIOD_TYPE[cycle] === 'trimester' ? '3 périodes' : '2 périodes';
}

export function SchoolCyclesSection({ school }: Props) {
  const { refresh } = useReferentialsRefresh();
  const savedCycles = normalizeSchoolCycles(school.offered_cycles);
  const [editing, setEditing] = useState(savedCycles.length <= 1);
  const [selected, setSelected] = useState<SchoolCycle[]>(savedCycles);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isDirty = !sameSchoolCycles(selected, savedCycles);

  useEffect(() => {
    setSelected(savedCycles);
  }, [school.offered_cycles]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  function toggle(cycle: SchoolCycle) {
    setJustSaved(false);
    setSelected((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle],
    );
  }

  function handleCancel() {
    setSelected(savedCycles);
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError('Sélectionnez au moins un cycle.');
      return;
    }
    setError(null);
    setPending(true);
    const result = await saveSchoolCyclesAction(selected);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setJustSaved(true);
    setEditing(false);
    refresh();
  }

  const orderedSaved = CYCLE_DISPLAY_ORDER.filter((c) => savedCycles.includes(c));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Cycles de l&apos;établissement</CardTitle>
          <CardDescription>
            Définissez les sections que votre école couvre. Chaque cycle a son
            propre découpage (trimestres ou semestres).
          </CardDescription>
        </div>
        {!editing && savedCycles.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => {
              setSelected(savedCycles);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
            Modifier
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!editing && savedCycles.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {orderedSaved.map((cycle) => (
                <Badge
                  key={cycle}
                  variant="secondary"
                  className="h-auto px-3 py-1.5 text-sm font-normal"
                >
                  <span className="font-medium">{SCHOOL_CYCLE_LABELS[cycle]}</span>
                  <span className="text-muted-foreground">
                    · {cyclePeriodCount(cycle)}
                  </span>
                </Badge>
              ))}
            </div>
            {justSaved ? (
              <p className="flex items-center gap-1.5 text-sm text-secondary">
                <Check className="size-4" aria-hidden />
                Cycles enregistrés
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ces cycles seront proposés lors de la création de l&apos;année
                scolaire et des classes.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCHOOL_CYCLES.map((cycle) => {
                const active = selected.includes(cycle);
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => toggle(cycle)}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background'
                      }`}
                      aria-hidden
                    >
                      {active ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {SCHOOL_CYCLE_LABELS[cycle]}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {cyclePeriodLabel(cycle)}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {cyclePeriodCount(cycle)} par année scolaire
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={pending || !isDirty}
              >
                {pending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {savedCycles.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={pending}
                >
                  Annuler
                </Button>
              ) : null}
              {!isDirty && savedCycles.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Aucune modification
                </span>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
