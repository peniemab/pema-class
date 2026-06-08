import { InviteStaffForm } from '@/components/school/invite-staff-form';

export default function SchoolTeamPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Équipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invitez enseignants, secrétariat et comptabilité. Chaque lien fixe le
          rôle et expire après 7 jours.
        </p>
      </div>
      <InviteStaffForm />
    </div>
  );
}
