import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

