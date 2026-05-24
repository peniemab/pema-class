import { OnboardingLinkForm } from '@/components/platform/onboarding-link-form';
import { ButtonLink } from '@/components/ui/button-link';

export default function PlatformOnboardingNewPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <ButtonLink
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 w-fit"
          href="/platform/onboarding"
        >
          ← Historique des liens
        </ButtonLink>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouvel établissement
        </h1>
        <p className="text-muted-foreground">
          Générer un lien d&apos;onboarding pour le futur directeur.
        </p>
      </div>
      <div className="max-w-xl">
        <OnboardingLinkForm />
      </div>
    </main>
  );
}
