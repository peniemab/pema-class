/** Phase visible dans l’UI (auto-sync en arrière-plan ne passe jamais en `syncing`). */
export type SyncPhase = 'idle' | 'syncing' | 'error';

export type RefreshOptions = {
  /** true = l’utilisateur a demandé (badge) → spinner autorisé. */
  visible?: boolean;
};

/** Planifie un travail réseau sans bloquer le rendu (idle ou micro-délai). */
export function scheduleBackgroundWork(work: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const ric = (
    window as typeof window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    }
  ).requestIdleCallback;

  if (ric) {
    const id = ric(work, { timeout: 2500 });
    return () => {
      window.cancelIdleCallback?.(id);
    };
  }

  const timer = window.setTimeout(work, 80);
  return () => window.clearTimeout(timer);
}
