'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  saveSchoolSettings,
  type SchoolSettingsInput,
} from '@/lib/school/settings-actions';
import type { SchoolRow } from '@/lib/db/schools';

function toFormState(school: SchoolRow): SchoolSettingsInput {
  return {
    name: school.name ?? '',
    displayName: school.display_name ?? school.name ?? '',
    phone: school.phone ?? '',
    email: school.email ?? '',
    address: school.address ?? '',
    description: school.description ?? '',
    rccm: school.rccm ?? '',
    taxNumber: school.tax_number ?? '',
    nationalId: school.national_id ?? '',
  };
}

type SchoolSettingsFormProps = {
  school: SchoolRow;
};

export function SchoolSettingsForm({ school }: SchoolSettingsFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SchoolSettingsInput>(() => toFormState(school));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SchoolSettingsInput>(
    key: K,
    value: SchoolSettingsInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const result = await saveSchoolSettings(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const configured = Boolean(
    school.name && (school.phone || school.email || school.address),
  );

  return (
    <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-medium">Configuration de l’établissement</p>
          <p className="text-sm text-muted-foreground">
            Identité, coordonnées et informations légales (RDC)
          </p>
        </div>
        {!open && (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {configured ? 'Modifier' : 'Configurer'}
          </Button>
        )}
        {open && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setOpen(false);
              setForm(toFormState(school));
              setError(null);
            }}
            aria-label="Fermer"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nom officiel</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="displayName">Nom affiché</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => update('displayName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rccm">RCCM (optionnel)</Label>
              <Input
                id="rccm"
                value={form.rccm}
                onChange={(e) => update('rccm', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">N° impôt fiscal (optionnel)</Label>
              <Input
                id="taxNumber"
                value={form.taxNumber}
                onChange={(e) => update('taxNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nationalId">Identification nationale (optionnel)</Label>
              <Input
                id="nationalId"
                value={form.nationalId}
                onChange={(e) => update('nationalId', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Logo : téléversement fichier prévu prochainement (Supabase Storage).
          </p>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
