'use client';

import { useMemo, useState } from 'react';
import { useReferentialsRefresh } from '@/hooks/use-referentials-refresh';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  createClassesAction,
  deleteClassAction,
} from '@/lib/school/referentials-actions';
import type { ClassRow } from '@/lib/db/classes';
import type { AcademicYearRow } from '@/lib/db/academic-years';
import {
  CLASS_SECTION_PRESETS,
  classLevelsForCycle,
  CYCLE_DISPLAY_ORDER,
  formatClassLabel,
  levelToCycle,
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
  activeYear: AcademicYearRow | null;
  classes: ClassRow[];
};

type LevelGroup = {
  level: string;
  cycle: SchoolCycle;
  items: ClassRow[];
};

function groupClassesByLevel(classes: ClassRow[]): LevelGroup[] {
  const map = new Map<string, LevelGroup>();
  for (const c of classes) {
    const cycle = (c.cycle ?? levelToCycle(c.level)) as SchoolCycle;
    if (!map.has(c.level)) {
      map.set(c.level, { level: c.level, cycle, items: [] });
    }
    map.get(c.level)!.items.push(c);
  }
  return [...map.values()].sort((a, b) => {
    const ai = CYCLE_DISPLAY_ORDER.indexOf(a.cycle);
    const bi = CYCLE_DISPLAY_ORDER.indexOf(b.cycle);
    if (ai !== bi) return ai - bi;
    return a.level.localeCompare(b.level, 'fr');
  });
}

export function ClassesSection({ school, activeYear, classes }: Props) {
  const { refresh } = useReferentialsRefresh();
  const offeredCycles = normalizeSchoolCycles(school.offered_cycles);
  const yearCycles = activeYear
    ? normalizeSchoolCycles(activeYear.cycles ?? offeredCycles)
    : [];

  const defaultCycle = yearCycles[0] ?? 'primaire';
  const [cycle, setCycle] = useState<SchoolCycle>(defaultCycle);
  const levelsForCycle = useMemo(() => classLevelsForCycle(cycle), [cycle]);
  const [level, setLevel] = useState<string>(levelsForCycle[0] ?? '');
  const [sections, setSections] = useState<string[]>([]);
  const [customSection, setCustomSection] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const existingSectionsForLevel = useMemo(
    () =>
      new Set(
        classes.filter((c) => c.level === level).map((c) => c.name.toUpperCase()),
      ),
    [classes, level],
  );

  const groupedClasses = useMemo(() => groupClassesByLevel(classes), [classes]);

  const sectionsToCreate = sections.filter(
    (s) => !existingSectionsForLevel.has(s.toUpperCase()),
  );

  function handleCycleChange(next: SchoolCycle) {
    setCycle(next);
    const levels = classLevelsForCycle(next);
    setLevel(levels[0] ?? '');
    setSections([]);
    setCustomSection('');
    setSuccess(null);
  }

  function handleLevelChange(nextLevel: string) {
    setLevel(nextLevel);
    setSections([]);
    setCustomSection('');
    setSuccess(null);
  }

  function toggleSection(section: string) {
    setSuccess(null);
    const key = section.toUpperCase();
    setSections((prev) => {
      const has = prev.some((s) => s.toUpperCase() === key);
      return has
        ? prev.filter((s) => s.toUpperCase() !== key)
        : [...prev, section.toUpperCase()];
    });
  }

  function addCustomSection() {
    const value = customSection.trim().toUpperCase();
    if (!value) return;
    if (existingSectionsForLevel.has(value)) return;
    setSections((prev) =>
      prev.some((s) => s.toUpperCase() === value) ? prev : [...prev, value],
    );
    setCustomSection('');
    setSuccess(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (sectionsToCreate.length === 0) {
      setError('Sélectionnez au moins une section à créer.');
      return;
    }

    setPending(true);
    const result = await createClassesAction({
      level,
      sections: sectionsToCreate,
      maxCapacity: Number.parseInt(maxCapacity, 10) || 30,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSections([]);
    setCustomSection('');
    setSuccess(result.message ?? 'Classes créées.');
    refresh();
  }

  async function handleDelete(classId: string) {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await deleteClassAction(classId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes</CardTitle>
        <CardDescription>
          {activeYear
            ? `Choisissez un niveau et cochez les sections (A, B, C…) — création en une fois pour ${activeYear.name}.`
            : 'Activez une année scolaire pour créer des classes.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription className="flex items-center gap-1.5">
              <Check className="size-4 text-secondary" aria-hidden />
              {success}
            </AlertDescription>
          </Alert>
        )}

        {activeYear && yearCycles.length > 0 ? (
          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border bg-muted/20 p-4">
            {yearCycles.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {yearCycles.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={cycle === c ? 'default' : 'outline'}
                    onClick={() => handleCycleChange(c)}
                  >
                    {SCHOOL_CYCLE_LABELS[c]}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="classLevel">Niveau</Label>
                <select
                  id="classLevel"
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {levelsForCycle.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Capacité par section</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min={1}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sections à créer</Label>
              <div className="flex flex-wrap gap-2">
                {CLASS_SECTION_PRESETS.map((section) => {
                  const exists = existingSectionsForLevel.has(section);
                  const selected = sections.some(
                    (s) => s.toUpperCase() === section,
                  );
                  return (
                    <Button
                      key={section}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      disabled={exists}
                      onClick={() => toggleSection(section)}
                      className="min-w-10"
                    >
                      {section}
                      {exists ? (
                        <span className="sr-only"> (existe déjà)</span>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
              {existingSectionsForLevel.size > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Déjà créées pour {level} :{' '}
                  {[...existingSectionsForLevel].sort().join(', ')}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[8rem] flex-1 space-y-2 sm:max-w-[12rem]">
                <Label htmlFor="customSection">Autre section</Label>
                <Input
                  id="customSection"
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  placeholder="Ex. G1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSection();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={addCustomSection}
                disabled={!customSection.trim()}
              >
                <Plus className="size-4" aria-hidden />
                Ajouter
              </Button>
            </div>

            {sectionsToCreate.length > 0 ? (
              <div className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">
                  {sectionsToCreate.length} classe
                  {sectionsToCreate.length > 1 ? 's' : ''} à créer
                </p>
                <p className="mt-1 text-muted-foreground">
                  {sectionsToCreate
                    .map((s) => formatClassLabel(level, s))
                    .join(' · ')}
                </p>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={pending || sectionsToCreate.length === 0}
            >
              {pending
                ? 'Création…'
                : sectionsToCreate.length > 1
                  ? `Créer ${sectionsToCreate.length} classes`
                  : 'Créer la classe'}
            </Button>
          </form>
        ) : null}

        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune classe pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {groupedClasses.map((group) => (
              <div key={group.level} className="overflow-hidden rounded-lg border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{group.level}</span>
                    <Badge variant="outline" className="font-normal">
                      {SCHOOL_CYCLE_LABELS[group.cycle]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.items.length} section
                    {group.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="divide-y">
                  {group.items
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                    .map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-md bg-muted font-medium">
                            {c.name}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {c.current_count} / {c.max_capacity} élèves
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending || c.current_count > 0}
                          onClick={() => handleDelete(c.id)}
                          aria-label={`Supprimer ${formatClassLabel(c.level, c.name)}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
