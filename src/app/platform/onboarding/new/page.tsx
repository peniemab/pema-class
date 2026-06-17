import { OnboardingLinkForm } from '@/components/platform/onboarding-link-form';
import { ButtonLink } from '@/components/ui/button-link';

export default function PlatformOnboardingNewPage() {
  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-4">
        <ButtonLink variant="ghost" size="sm" className="-ml-2 w-fit" href="/platform/onboarding">
          ← Historique des liens
        </ButtonLink>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-wa-text-primary">
          Nouvel établissement
        </h1>
        <p className="text-sm text-wa-text-secondary">
          Générer un lien d&apos;onboarding pour le futur directeur.
        </p>
      </div>

      <div className="px-4 pt-5">
        <div className="max-w-xl">
          <OnboardingLinkForm />
        </div>
      </div>
    </div>
  );
}
