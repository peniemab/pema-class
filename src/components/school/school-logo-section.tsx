'use client';

import { useRef, useState } from 'react';
import { useReferentialsRefresh } from '@/hooks/use-referentials-refresh';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { uploadSchoolLogoAction } from '@/lib/school/referentials-actions';
import type { SchoolRow } from '@/lib/db/schools';
import {
  ALLOWED_SCHOOL_LOGO_ACCEPT,
  formatLogoMaxSize,
  validateSchoolLogoFile,
} from '@/lib/school/referentials/logo';
import { Button } from '@/components/ui/button';
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
};

export function SchoolLogoSection({ school }: Props) {
  const { refresh } = useReferentialsRefresh();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange() {
    setFileError(null);
    setError(null);
    const file = inputRef.current?.files?.[0] ?? null;
    setSelectedFile(file);
    if (!file) return;
    const validation = validateSchoolLogoFile(file);
    if (validation) {
      setFileError(validation);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Choisissez une image.');
      return;
    }
    const validation = validateSchoolLogoFile(file);
    if (validation) {
      setFileError(validation);
      return;
    }
    const formData = new FormData();
    formData.set('logo', file);
    setPending(true);
    const result = await uploadSchoolLogoAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
    refresh();
  }

  const canSubmit = Boolean(selectedFile) && !fileError && !pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo de l&apos;établissement</CardTitle>
        <CardDescription>
          JPEG, PNG, WebP ou SVG — max. {formatLogoMaxSize()}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || fileError) && (
          <Alert variant="destructive">
            <AlertDescription>{fileError ?? error}</AlertDescription>
          </Alert>
        )}

        {school.logo_url ? (
          <div className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-lg border bg-muted">
              <Image
                src={school.logo_url}
                alt={`Logo ${school.name}`}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <p className="text-sm text-muted-foreground">Logo actuel</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun logo téléversé.</p>
        )}

        <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="logoFile">Fichier</Label>
            <input
              ref={inputRef}
              id="logoFile"
              name="logo"
              type="file"
              accept={ALLOWED_SCHOOL_LOGO_ACCEPT}
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>
          <Button type="submit" disabled={!canSubmit} className="gap-2">
            <Upload className="size-4" aria-hidden />
            {pending ? 'Envoi…' : 'Téléverser'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
