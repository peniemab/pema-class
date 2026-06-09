'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReferentialsRefresh } from '@/hooks/use-referentials-refresh';
import { Check, Pencil, Trash2 } from 'lucide-react';
import {
  createFeeAction,
  createFeesAction,
  deleteFeeAction,
  updateFeeAction,
} from '@/lib/school/referentials-actions';
import type { FeeRow } from '@/lib/db/fees';
import type { AcademicYearRow } from '@/lib/db/academic-years';
import {
  FEE_ANNUAL_LUMP_LABEL,
  FEE_FIXED_PRESETS,
  formatFeeAmount,
  groupFeesForDisplay,
  installmentLabels,
  INSTALLMENT_MODE_LABELS,
  MONTHLY_INSTALLMENT_OPTIONS,
  SEMESTER_INSTALLMENT_OPTIONS,
  normalizeFeeCurrency,
  type FeeCurrency,
  type InstallmentMode,
} from '@/lib/school/referentials/constants';
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
  activeYear: AcademicYearRow | null;
  fees: FeeRow[];
};

type AddTab = 'tranches' | 'fixed';

function parseAmount(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function CurrencyToggle({
  value,
  onChange,
}: {
  value: FeeCurrency;
  onChange: (c: FeeCurrency) => void;
}) {
  return (
    <div className="flex gap-2">
      {(['CDF', 'USD'] as const).map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={value === code ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => onChange(code)}
        >
          {code}
        </Button>
      ))}
    </div>
  );
}

function groupTotalByCurrency(items: FeeRow[]): Partial<Record<FeeCurrency, number>> {
  const totals: Partial<Record<FeeCurrency, number>> = {};
  for (const fee of items) {
    const code = normalizeFeeCurrency(fee.currency);
    totals[code] = (totals[code] ?? 0) + fee.amount;
  }
  return totals;
}

export function FeesSection({ activeYear, fees }: Props) {
  const { refresh } = useReferentialsRefresh();
  const [tab, setTab] = useState<AddTab>('tranches');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // --- Scolarité par tranches ---
  const [installmentMode, setInstallmentMode] =
    useState<InstallmentMode>('trimester');
  const [monthCount, setMonthCount] = useState<number>(10);
  const [semesterCount, setSemesterCount] = useState<number>(2);
  const [trancheCurrency, setTrancheCurrency] = useState<FeeCurrency>('CDF');
  const [sameAmountEnabled, setSameAmountEnabled] = useState(false);
  const [sameAmount, setSameAmount] = useState('');
  const [trancheAmounts, setTrancheAmounts] = useState<Record<string, string>>(
    {},
  );

  // --- Frais fixes ---
  const [fixedName, setFixedName] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedCurrency, setFixedCurrency] = useState<FeeCurrency>('CDF');

  // --- Édition ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<FeeCurrency>('CDF');

  const existingNames = useMemo(
    () => new Set(fees.map((f) => f.name.trim().toLowerCase())),
    [fees],
  );

  const currentLabels = useMemo(() => {
    if (installmentMode === 'monthly') {
      return installmentLabels('monthly', monthCount);
    }
    if (installmentMode === 'semester') {
      return installmentLabels('semester', semesterCount);
    }
    return installmentLabels('trimester');
  }, [installmentMode, monthCount, semesterCount]);

  useEffect(() => {
    setTrancheAmounts((prev) => {
      const next: Record<string, string> = {};
      for (const label of currentLabels) {
        next[label] = prev[label] ?? '';
      }
      return next;
    });
  }, [currentLabels]);

  const displayGroups = useMemo(() => groupFeesForDisplay(fees), [fees]);

  const tranchePreview = useMemo(() => {
    const items: { label: string; amount: number }[] = [];
    for (const label of currentLabels) {
      if (existingNames.has(label.toLowerCase())) continue;
      const raw = sameAmountEnabled ? sameAmount : trancheAmounts[label] ?? '';
      const amount = parseAmount(raw);
      if (amount !== null) items.push({ label, amount });
    }
    return items;
  }, [
    currentLabels,
    existingNames,
    sameAmountEnabled,
    sameAmount,
    trancheAmounts,
  ]);

  const tranchePreviewTotal = tranchePreview.reduce((s, i) => s + i.amount, 0);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  function selectFixedPreset(preset: string) {
    setFixedName(preset);
    clearFeedback();
  }

  async function handleCreateTranches() {
    clearFeedback();
    if (tranchePreview.length === 0) {
      setError('Renseignez au moins une tranche avec un montant valide.');
      return;
    }

    setPending(true);
    const items = tranchePreview.map((item) => ({
      name: item.label,
      amount: String(item.amount),
      currency: trancheCurrency,
    }));
    const annualKey = FEE_ANNUAL_LUMP_LABEL.toLowerCase();
    if (
      tranchePreviewTotal > 0 &&
      !existingNames.has(annualKey) &&
      !items.some((i) => i.name.toLowerCase() === annualKey)
    ) {
      items.push({
        name: FEE_ANNUAL_LUMP_LABEL,
        amount: String(tranchePreviewTotal),
        currency: trancheCurrency,
      });
    }

    const result = await createFeesAction({ items });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSameAmount('');
    setTrancheAmounts({});
    setSuccess(result.message ?? 'Tranches créées.');
    refresh();
  }

  async function handleCreateFixed(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();

    const amount = parseAmount(fixedAmount);
    if (!fixedName.trim()) {
      setError('Indiquez un libellé ou choisissez un modèle.');
      return;
    }
    if (amount === null) {
      setError('Montant invalide.');
      return;
    }
    if (existingNames.has(fixedName.trim().toLowerCase())) {
      setError(`« ${fixedName.trim()} » existe déjà.`);
      return;
    }

    setPending(true);
    const result = await createFeeAction({
      name: fixedName.trim(),
      amount: String(amount),
      currency: fixedCurrency,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setFixedName('');
    setFixedAmount('');
    setSuccess(result.message ?? 'Frais ajouté.');
    refresh();
  }

  function startEdit(fee: FeeRow) {
    setEditingId(fee.id);
    setEditName(fee.name);
    setEditAmount(String(fee.amount));
    setEditCurrency(normalizeFeeCurrency(fee.currency));
    clearFeedback();
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(feeId: string) {
    clearFeedback();
    const amount = parseAmount(editAmount);
    if (!editName.trim()) {
      setError('Le libellé est obligatoire.');
      return;
    }
    if (amount === null) {
      setError('Montant invalide.');
      return;
    }

    setPending(true);
    const result = await updateFeeAction({
      feeId,
      name: editName.trim(),
      amount: String(amount),
      currency: editCurrency,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    setSuccess(result.message ?? 'Frais modifié.');
    refresh();
  }

  async function handleDelete(feeId: string) {
    clearFeedback();
    setPending(true);
    const result = await deleteFeeAction(feeId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frais scolaires</CardTitle>
        <CardDescription>
          {activeYear
            ? `Tarifs pour ${activeYear.name}.`
            : 'Activez une année scolaire pour définir des frais.'}
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

        {activeYear ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={tab === 'tranches' ? 'default' : 'outline'}
                onClick={() => setTab('tranches')}
              >
                Scolarité par tranches
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tab === 'fixed' ? 'default' : 'outline'}
                onClick={() => setTab('fixed')}
              >
                Frais fixes
              </Button>
            </div>

            {tab === 'tranches' ? (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Mode de paiement</p>

                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(INSTALLMENT_MODE_LABELS) as InstallmentMode[]
                  ).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      size="sm"
                      variant={installmentMode === mode ? 'default' : 'outline'}
                      onClick={() => {
                        setInstallmentMode(mode);
                        clearFeedback();
                      }}
                    >
                      {INSTALLMENT_MODE_LABELS[mode]}
                    </Button>
                  ))}
                </div>

                {installmentMode === 'monthly' ? (
                  <div className="space-y-2">
                    <Label htmlFor="monthCount">Nombre de mois</Label>
                    <select
                      id="monthCount"
                      value={monthCount}
                      onChange={(e) =>
                        setMonthCount(Number.parseInt(e.target.value, 10))
                      }
                      className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {MONTHLY_INSTALLMENT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} mois
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {installmentMode === 'semester' ? (
                  <div className="space-y-2">
                    <Label htmlFor="semesterCount">Nombre de tranches</Label>
                    <select
                      id="semesterCount"
                      value={semesterCount}
                      onChange={(e) =>
                        setSemesterCount(Number.parseInt(e.target.value, 10))
                      }
                      className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {SEMESTER_INSTALLMENT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} tranches
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <CurrencyToggle
                      value={trancheCurrency}
                      onChange={setTrancheCurrency}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sameAmountEnabled}
                        onChange={(e) => setSameAmountEnabled(e.target.checked)}
                        className="size-4 accent-primary"
                      />
                      Même montant pour toutes les tranches
                    </Label>
                    {sameAmountEnabled ? (
                      <Input
                        type="number"
                        min={trancheCurrency === 'USD' ? 0.01 : 1}
                        step={trancheCurrency === 'USD' ? '0.01' : '1'}
                        value={sameAmount}
                        onChange={(e) => setSameAmount(e.target.value)}
                        placeholder={
                          trancheCurrency === 'USD' ? '100' : '50000'
                        }
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Décochez pour saisir un montant par tranche ci-dessous.
                      </p>
                    )}
                  </div>
                </div>

                {!sameAmountEnabled ? (
                  <div className="space-y-2">
                    <Label>Montant par tranche</Label>
                    <div className="divide-y rounded-lg border bg-background">
                      {currentLabels.map((label) => {
                        const exists = existingNames.has(label.toLowerCase());
                        return (
                          <div
                            key={label}
                            className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                          >
                            <span className="min-w-[8rem] text-sm font-medium">
                              {label}
                            </span>
                            {exists ? (
                              <Badge variant="outline" className="font-normal">
                                Déjà créée
                              </Badge>
                            ) : (
                              <Input
                                type="number"
                                min={trancheCurrency === 'USD' ? 0.01 : 1}
                                step={trancheCurrency === 'USD' ? '0.01' : '1'}
                                value={trancheAmounts[label] ?? ''}
                                onChange={(e) =>
                                  setTrancheAmounts((prev) => ({
                                    ...prev,
                                    [label]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  trancheCurrency === 'USD' ? '100' : '50000'
                                }
                                className="max-w-[10rem]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {currentLabels.map((label) => (
                      <li key={label}>
                        {label}
                        {existingNames.has(label.toLowerCase())
                          ? ' — déjà créée'
                          : null}
                      </li>
                    ))}
                  </ul>
                )}

                {tranchePreview.length > 0 ? (
                  <div className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">
                    <p className="font-medium">
                      {tranchePreview.length} tranche
                      {tranchePreview.length > 1 ? 's' : ''} à créer
                      {tranchePreviewTotal > 0
                        ? ` — total ${formatFeeAmount(tranchePreviewTotal, trancheCurrency)}`
                        : null}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {tranchePreview
                        .map(
                          (item) =>
                            `${item.label} : ${formatFeeAmount(item.amount, trancheCurrency)}`,
                        )
                        .join(' · ')}
                      {!existingNames.has(FEE_ANNUAL_LUMP_LABEL.toLowerCase()) ? (
                        <>
                          {' · '}
                          {FEE_ANNUAL_LUMP_LABEL} :{' '}
                          {formatFeeAmount(tranchePreviewTotal, trancheCurrency)} (lié)
                        </>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                <Button
                  type="button"
                  disabled={pending || tranchePreview.length === 0}
                  onClick={handleCreateTranches}
                >
                  {pending
                    ? 'Création…'
                    : tranchePreview.length > 1
                      ? `Créer ${tranchePreview.length} tranches`
                      : 'Créer la tranche'}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleCreateFixed}
                className="space-y-4 rounded-lg border bg-muted/20 p-4"
              >
                <div>
                  <p className="text-sm font-medium">Frais fixes</p>
                  <p className="text-xs text-muted-foreground">
                    Montants connus et payés une fois (inscription, uniforme…).
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FEE_FIXED_PRESETS.map((preset) => {
                    const exists = existingNames.has(preset.toLowerCase());
                    const selected =
                      fixedName.trim().toLowerCase() === preset.toLowerCase();
                    return (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        disabled={exists}
                        onClick={() => selectFixedPreset(preset)}
                      >
                        {preset}
                      </Button>
                    );
                  })}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fixedName">Libellé</Label>
                    <Input
                      id="fixedName"
                      value={fixedName}
                      onChange={(e) => setFixedName(e.target.value)}
                      placeholder="Ex. Frais d'inscription"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixedAmount">Montant</Label>
                    <Input
                      id="fixedAmount"
                      type="number"
                      min={fixedCurrency === 'USD' ? 0.01 : 1}
                      step={fixedCurrency === 'USD' ? '0.01' : '1'}
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      placeholder={fixedCurrency === 'USD' ? '20' : '50000'}
                    />
                  </div>
                </div>

                <div className="max-w-xs space-y-2">
                  <Label>Devise</Label>
                  <CurrencyToggle
                    value={fixedCurrency}
                    onChange={setFixedCurrency}
                  />
                </div>

                {parseAmount(fixedAmount) !== null && fixedName.trim() ? (
                  <p className="text-sm text-muted-foreground">
                    Aperçu :{' '}
                    <span className="font-medium text-foreground">
                      {formatFeeAmount(
                        parseAmount(fixedAmount)!,
                        fixedCurrency,
                      )}
                    </span>{' '}
                    — {fixedName.trim()}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={
                    pending ||
                    !fixedName.trim() ||
                    parseAmount(fixedAmount) === null
                  }
                >
                  {pending ? 'Ajout…' : 'Ajouter le frais fixe'}
                </Button>
              </form>
            )}
          </>
        ) : null}

        {fees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Commencez par définir la{' '}
            <span className="font-medium text-foreground">
              scolarité par tranches
            </span>{' '}
            (T1, T2, T3 ou mensualités), puis les frais fixes.
          </p>
        ) : (
          <div className="space-y-4">
            {displayGroups.map((group) => {
              const totals = groupTotalByCurrency(group.fees as FeeRow[]);
              return (
                <div key={group.id} className="overflow-hidden rounded-lg border">
                  <div className="border-b bg-muted/40 px-3 py-2">
                    <p className="text-sm font-medium">{group.label}</p>
                    <p className="text-xs text-muted-foreground">{group.hint}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {(['CDF', 'USD'] as const).map((code) =>
                        totals[code] !== undefined ? (
                          <span key={code}>
                            Total {code} :{' '}
                            {formatFeeAmount(totals[code]!, code)}
                          </span>
                        ) : null,
                      )}
                    </div>
                  </div>
                  <ul className="divide-y">
                    {group.fees.map((fee) =>
                      editingId === fee.id ? (
                        <li
                          key={fee.id}
                          className="space-y-3 bg-muted/20 px-3 py-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Libellé</Label>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Montant</Label>
                              <Input
                                type="number"
                                min={editCurrency === 'USD' ? 0.01 : 1}
                                step={editCurrency === 'USD' ? '0.01' : '1'}
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Devise</Label>
                              <CurrencyToggle
                                value={editCurrency}
                                onChange={setEditCurrency}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={pending}
                              onClick={() => handleSaveEdit(fee.id)}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={cancelEdit}
                            >
                              Annuler
                            </Button>
                          </div>
                        </li>
                      ) : (
                        <li
                          key={fee.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                        >
                          <div>
                            <p className="font-medium">{fee.name}</p>
                            <p className="tabular-nums text-muted-foreground">
                              {formatFeeAmount(
                                fee.amount,
                                normalizeFeeCurrency(fee.currency),
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={pending}
                              onClick={() => startEdit(fee as FeeRow)}
                              aria-label={`Modifier ${fee.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={pending}
                              onClick={() => handleDelete(fee.id)}
                              aria-label={`Supprimer ${fee.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
