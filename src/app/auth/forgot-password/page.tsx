import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Entrez votre e-mail. Nous vous enverrons un lien pour définir un nouveau mot de passe.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}

