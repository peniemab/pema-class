'use client';

import { useState } from 'react';
import { useReferentialsRefresh } from '@/hooks/use-referentials-refresh';
import { Check, Pencil, Plus } from 'lucide-react';
import {
  activateAcademicYearAction,
  createAcademicYearAction,
  updateAcademicYearAction,
} from '@/lib/school/referentials-actions';
import type { AcademicYearRow, PeriodRow } from '@/lib/db/academic-years';
import {
  CYCLE_DISPLAY_ORDER,
  CYCLE_PERIOD_TYPE,
  normalizeSchoolCycles,
  SCHOOL_CYCLE_LABELS,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';
import type { SchoolRow } from '@/lib/db/schools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  academicYears: AcademicYearRow[];
  activeYear: AcademicYearRow | null;
  periods: PeriodRow[];
};

type PanelMode = null | 'create' | 'edit';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupPeriodsByCycle(periods: PeriodRow[]): Map<string, PeriodRow[]> {
  const map = new Map<string, PeriodRow[]>();
  for (const p of periods) {
    const key = p.cycle ?? 'primaire';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

export function AcademicYearSection({
  school,
  academicYears,
  activeYear,
  periods,
}: Props) {
  const { refresh } = useReferentialsRefresh();
  const schoolCycles = normalizeSchoolCycles(school.offered_cycles);
  const [panel, setPanel] = useState<PanelMode>(
    academicYears.length === 0 ? 'create' : null,
  );
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [yearCycles, setYearCycles] = useState<SchoolCycle[]>(schoolCycles);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const periodsByCycle = groupPeriodsByCycle(periods);
  const activeYearCycles = activeYear
    ? normalizeSchoolCycles(activeYear.cycles ?? schoolCycles)
    : [];

  function toggleCycle(cycle: SchoolCycle) {
    setYearCycles((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle],
    );
  }

  function resetForm() {
    setName('');
    setStartDate('');
    setEndDate('');
    setYearCycles(schoolCycles);
  }

  function openCreate() {
    resetForm();
    setError(null);
    setSuccess(null);
    setPanel('create');
  }

  function openEdit() {
    if (!activeYear) return;
    setName(activeYear.name);
    setStartDate(activeYear.start_date);
    setEndDate(activeYear.end_date);
    setYearCycles(normalizeSchoolCycles(activeYear.cycles ?? schoolCycles));
    setError(null);
    setSuccess(null);
    setPanel('edit');
  }

  function closePanel() {
    setPanel(null);
    setError(null);
    resetForm();
  }

  async function handleCreate() {
    if (yearCycles.length === 0) {
      setError('Sélectionnez au moins un cycle pour cette année.');
      return;
    }
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await createAcademicYearAction({
      name,
      startDate,
      endDate,
      cycles: yearCycles,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    closePanel();
    setSuccess('Année scolaire créée.');
    refresh();
  }

  async function handleUpdate() {
    if (!activeYear) return;
    if (yearCycles.length === 0) {
      setError('Sélectionnez au moins un cycle pour cette année.');
      return;
    }
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await updateAcademicYearAction({
      academicYearId: activeYear.id,
      name,
      startDate,
      endDate,
      cycles: yearCycles,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    closePanel();
    setSuccess(result.message ?? 'Année scolaire mise à jour.');
    refresh();
  }

  async function handleActivate(id: string) {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await activateAcademicYearAction(id);
    setPending(false);
    if (!result.ok) setError(result.error);
    else refresh();
  }

  const formTitle =
    panel === 'edit' ? 'Modifier l’année active' : 'Nouvelle année scolaire';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Année scolaire</CardTitle>
          <CardDescription>
            Une année active — périodes par cycle (trimestres ou semestres).
          </CardDescription>
        </div>
        {academicYears.length > 0 && panel === null ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {activeYear ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openEdit}
              >
                <Pencil className="size-3.5" aria-hidden />
                Modifier
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={openCreate}
            >
              <Plus className="size-4" aria-hidden />
              Nouvelle année
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && panel === null && (
          <Alert>
            <AlertDescription className="flex items-center gap-1.5">
              <Check className="size-4 text-secondary" aria-hidden />
              {success}
            </AlertDescription>
          </Alert>
        )}

        {activeYear && panel === null ? (
          <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">
                  Année active : {activeYear.name}
                </p>
                <p className="text-muted-foreground">
                  {formatDate(activeYear.start_date)} →{' '}
                  {formatDate(activeYear.end_date)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeYearCycles.map((cycle) => (
                  <Badge key={cycle} variant="outline" className="font-normal">
                    {SCHOOL_CYCLE_LABELS[cycle]}
                  </Badge>
                ))}
              </div>
            </div>

            {periods.length > 0 ? (
              <div className="mt-4 space-y-3">
                {CYCLE_DISPLAY_ORDER.filter((c) => periodsByCycle.has(c)).map(
                  (cycle) => (
                    <div key={cycle}>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {SCHOOL_CYCLE_LABELS[cycle]} (
                        {CYCLE_PERIOD_TYPE[cycle] === 'trimester'
                          ? 'trimestres'
                          : 'semestres'}
                        )
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {periodsByCycle.get(cycle)!.map((p) => (
                          <li key={p.id}>
                            {p.label} ({formatDate(p.start_date)} –{' '}
                            {formatDate(p.end_date)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </div>
        ) : panel === null ? (
          <p className="text-sm text-muted-foreground">
            Aucune année active. Enregistrez d&apos;abord les cycles de
            l&apos;établissement, puis créez l&apos;année scolaire.
          </p>
        ) : null}

        {academicYears.length > 1 && panel === null ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Autres années</p>
            <ul className="divide-y rounded-lg border text-sm">
              {academicYears
                .filter((y) => y.id !== activeYear?.id)
                .map((y) => (
                  <li
                    key={y.id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>
                      {y.name}{' '}
                      <span className="text-muted-foreground">
                        ({formatDate(y.start_date)} – {formatDate(y.end_date)})
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleActivate(y.id)}
                    >
                      Activer
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {panel ? (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{formTitle}</p>
              {academicYears.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closePanel}
                  disabled={pending}
                >
                  Annuler
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="yearName">Libellé (ex. 2026-2027)</Label>
                <Input
                  id="yearName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="2026-2027"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cycles concernés par cette année</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {schoolCycles.map((cycle) => (
                  <label
                    key={cycle}
                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={yearCycles.includes(cycle)}
                      onChange={() => toggleCycle(cycle)}
                      className="size-4 accent-primary"
                    />
                    {SCHOOL_CYCLE_LABELS[cycle]}
                    <span className="text-xs text-muted-foreground">
                      (
                      {CYCLE_PERIOD_TYPE[cycle] === 'trimester'
                        ? '3 trim.'
                        : '2 sem.'}
                      )
                    </span>
                  </label>
                ))}
              </div>
              {schoolCycles.length === 0 ? (
                <p className="text-xs text-destructive">
                  Enregistrez les cycles de l&apos;établissement ci-dessus.
                </p>
              ) : null}
            </div>

            {panel === 'edit' ? (
              <p className="text-xs text-muted-foreground">
                Les dates et cycles seront recalculés — les périodes (trimestres
                / semestres) seront régénérées.
              </p>
            ) : null}

            <Button
              type="button"
              onClick={panel === 'edit' ? handleUpdate : handleCreate}
              disabled={pending}
            >
              {pending
                ? 'Enregistrement…'
                : panel === 'edit'
                  ? 'Enregistrer les modifications'
                  : 'Créer l’année scolaire'}
            </Button>
          </div>
        ) : null}

        {activeYear && academicYears.length === 1 && panel === null ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5 text-secondary" aria-hidden />
            Année unique — active par défaut
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
