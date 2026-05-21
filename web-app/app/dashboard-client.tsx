'use client';

import { createClient } from '@/lib/supabase/client';

export function DashboardClient({ email }: { email: string }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Pema Class</h1>
        <button type="button" className="btn btn-ghost" onClick={signOut}>
          Déconnexion
        </button>
      </header>

      <main className="app-main">
        <div className="phase-card">
          <h2>Bienvenue</h2>
          <p>
            Connecté en tant que <strong>{email}</strong>
          </p>
          <ul className="phase-list">
            <li>Phase 0 : Next.js + auth + PWA (Serwist)</li>
            <li>Phase 1 : annuaire élèves (lecture seule)</li>
            <li>Phase 2 : IndexedDB + sync</li>
            <li>Phase 3 : caisse en ligne</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            Spécification métier : voir docs/domain-spec.md à la racine du dépôt.
          </p>
        </div>
      </main>
    </div>
  );
}
