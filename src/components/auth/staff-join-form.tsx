'use client';

import { useActionState, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  registerStaffFromInvitation,
  type StaffJoinFormState,
} from '@/lib/register/staff-actions';
import { brand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

type StaffJoinFormProps = {
  defaultInviteToken?: string;
  inviteReadonly?: boolean;
  defaultEmail?: string;
  emailReadonly?: boolean;
  roleLabel: string;
  schoolName?: string | null;
};

export function StaffJoinForm({
  defaultInviteToken = '',
  inviteReadonly = false,
  defaultEmail = '',
  emailReadonly = false,
  roleLabel,
  schoolName,
}: StaffJoinFormProps) {
  const [state, action, pending] = useActionState(
    registerStaffFromInvitation,
    null as StaffJoinFormState | null,
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      event.preventDefault();
      setClientError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setClientError(null);
  }

  return (
    <form action={action} onSubmit={submit} className="space-y-5">
      {schoolName ? (
        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-sm">
          <p className="font-medium text-foreground">{schoolName}</p>
          <p className="text-muted-foreground">
            Vous rejoignez cet établissement en tant que{' '}
            <span className="font-medium text-foreground">{roleLabel}</span>.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required autoComplete="given-name" />
        <Field label="Nom" name="lastName" required autoComplete="family-name" />
      </div>

      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        required
        defaultValue={defaultEmail}
        readOnly={emailReadonly}
        autoComplete="email"
      />

      <label className="space-y-2 text-sm font-medium">
        Fonction au sein de l&apos;établissement
        <Input value={roleLabel} readOnly className="h-10 bg-muted" />
      </label>

      <div className="space-y-2">
        <Field
          label="Lien ou code d'invitation"
          name="inviteToken"
          required
          defaultValue={defaultInviteToken}
          readOnly={inviteReadonly}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ce lien définit votre rôle dans l&apos;établissement. Contactez la
          direction si le lien ne fonctionne plus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="Mot de passe"
          name="password"
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          name="confirmPassword"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
      </div>

      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 size-4 rounded border-input accent-primary"
        />
        <span>
          J&apos;accepte les{' '}
          <Link href="/legal/cgu" className="text-primary hover:underline">
            conditions générales
          </Link>{' '}
          de {brand.name}.
        </span>
      </label>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? 'Création du compte…' : 'Rejoindre l\'établissement'}
        <ArrowRight className="size-4" aria-hidden />
      </Button>

      {clientError || state?.ok === false ? (
        <p className="text-center text-sm font-medium text-destructive" role="alert">
          {clientError ?? state?.error}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  readOnly,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  readOnly?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      {label}
      <Input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        autoComplete={autoComplete}
        className="h-10 bg-background"
      />
    </label>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      {label}
      <PasswordInput
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        className="h-10 bg-background pr-10"
      />
    </label>
  );
}
