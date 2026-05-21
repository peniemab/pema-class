import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Pema Class</h1>
        <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
          Déconnexion
        </button>
      </header>

      <main className="app-main">
        <div className="phase-card">
          <h2>Bienvenue</h2>
          <p>
            Connecté en tant que <strong>{user?.email ?? '—'}</strong>
          </p>
          <ul className="phase-list">
            <li>Phase 0 : auth + PWA installable — fait</li>
            <li>Phase 1 : annuaire élèves (lecture seule)</li>
            <li>Phase 2 : cache IndexedDB + sync</li>
            <li>Phase 3 : caisse en ligne</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            L’application Flutter reste disponible en parallèle jusqu’à la phase 3.
          </p>
        </div>
      </main>
    </div>
  );
}
