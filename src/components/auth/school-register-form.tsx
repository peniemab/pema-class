'use client';

import { useActionState, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  registerSchoolAdminAccount,
  type RegisterFormState,
} from '@/lib/register/actions';
import {
  KINSHASA_COMMUNES,
  SCHOOL_ADMIN_FUNCTION,
  SCHOOL_DISCIPLINES,
} from '@/lib/register/constants';
import { brand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

type SchoolRegisterFormProps = {
  defaultInvitationToken?: string;
  invitationReadonly?: boolean;
};

export function SchoolRegisterForm({
  defaultInvitationToken = '',
  invitationReadonly = false,
}: SchoolRegisterFormProps) {
  const [state, action, pending] = useActionState(
    registerSchoolAdminAccount,
    null as RegisterFormState | null,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required autoComplete="given-name" />
        <Field label="Nom" name="lastName" required autoComplete="family-name" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          placeholder={brand.login.emailPlaceholder}
          required
          autoComplete="email"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Numéro de téléphone</p>
          <div className="grid grid-cols-[5.75rem_1fr] gap-2">
            <label className="text-sm font-medium">
              <span className="sr-only">Indicatif pays</span>
              <select
                name="dialCode"
                required
                defaultValue="+243"
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="+243">🇨🇩 +243</option>
                <option value="+242">🇨🇬 +242</option>
                <option value="+250">🇷🇼 +250</option>
                <option value="+257">🇧🇮 +257</option>
                <option value="+256">🇺🇬 +256</option>
                <option value="+260">🇿🇲 +260</option>
                <option value="+244">🇦🇴 +244</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+1">🇺🇸 +1</option>
              </select>
            </label>
            <Input
              name="phoneNumber"
              type="tel"
              placeholder="Ex : 812 345 678"
              aria-label="Téléphone"
              className="h-10 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Adresse</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Commune
            <select
              name="commune"
              defaultValue=""
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Sélectionner une commune
              </option>
              {KINSHASA_COMMUNES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Field label="Quartier" name="quartier" placeholder="Ex : Gare" />
          <Field
            label="Avenue et numéro"
            name="avenue"
            placeholder="Ex : Av. de l'École, n°12"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Discipline / domaine
          <select
            name="discipline"
            className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Sélectionner un domaine
            </option>
            {SCHOOL_DISCIPLINES.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium">
          Fonction au sein de l&apos;établissement
          <Input
            value={SCHOOL_ADMIN_FUNCTION.label}
            readOnly
            className="h-10 bg-muted"
          />
          <input type="hidden" name="role" value={SCHOOL_ADMIN_FUNCTION.value} />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Rattachement à l&apos;établissement</p>
        <Field
          label="Lien ou code d'invitation"
          name="inviteToken"
          placeholder="Collez le lien reçu ou le code transmis par votre établissement"
          defaultValue={defaultInvitationToken}
          readOnly={invitationReadonly}
          required
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ce lien permet de vérifier que votre compte doit bien être rattaché à
          un établissement. Si vous n&apos;avez pas de lien, contactez la direction
          ou {brand.name}.
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
      <p className="-mt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
        Votre accès est nominatif et vos identifiants doivent rester
        confidentiels. Ne communiquez jamais votre mot de passe à d&apos;autres
        personnes.
      </p>

      <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
        <CheckboxLine required name="consent">
          Je déclare avoir pris connaissance et accepter les{' '}
          <Link href="/legal/cgu" className="text-primary hover:underline">
            Conditions d&apos;Utilisation des services
          </Link>{' '}
          et j&apos;autorise {brand.name} à utiliser mes données pour améliorer la
          pertinence de ses communications professionnelles.
        </CheckboxLine>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        En créant votre compte, vous acceptez de recevoir des communications de
        la part de {brand.name}. Vous pourrez gérer vos préférences à tout
        moment depuis votre espace professionnel.
      </p>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? 'Création du compte…' : 'Créer mon compte professionnel'}
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
  placeholder,
  required,
  defaultValue,
  readOnly,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
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
        placeholder={placeholder}
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
        placeholder="********"
        required
        minLength={8}
        autoComplete="new-password"
        className="h-10 bg-background pr-10"
      />
    </label>
  );
}

function CheckboxLine({
  children,
  required,
  name,
}: {
  children: React.ReactNode;
  required?: boolean;
  name?: string;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-1 size-4 rounded border-input accent-primary"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}
