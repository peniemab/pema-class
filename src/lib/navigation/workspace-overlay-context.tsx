'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

export type WorkspaceOverlayScreen =
  | { kind: 'impayes' }
  | { kind: 'recouvrement'; feeId: string; search?: string; classId?: string };

type WorkspaceOverlayContextValue = {
  overlay: WorkspaceOverlayScreen | null;
  openImpayes: () => void;
  openRecouvrement: (feeId: string, filters?: { search?: string; classId?: string }) => void;
  closeOverlay: () => void;
  /** Retour interne (recouvrement → impayés). */
  backInOverlay: () => void;
};

const WorkspaceOverlayContext =
  createContext<WorkspaceOverlayContextValue | null>(null);

export function WorkspaceOverlayProvider({
  overlay,
  setOverlay,
  children,
}: {
  overlay: WorkspaceOverlayScreen | null;
  setOverlay: (next: WorkspaceOverlayScreen | null) => void;
  children: React.ReactNode;
}) {
  const openImpayes = useCallback(() => {
    setOverlay({ kind: 'impayes' });
    window.history.pushState({ pema: 'impayes' }, '');
  }, [setOverlay]);

  const openRecouvrement = useCallback(
    (feeId: string, filters?: { search?: string; classId?: string }) => {
      setOverlay({ kind: 'recouvrement', feeId, ...filters });
      window.history.pushState(
        { pema: 'recouvrement', feeId, search: filters?.search, classId: filters?.classId },
        '',
      );
    },
    [setOverlay],
  );

  const closeOverlay = useCallback(() => {
    const state = window.history.state as { pema?: string } | null;
    if (state?.pema === 'impayes' || state?.pema === 'recouvrement') {
      window.history.back();
    } else {
      setOverlay(null);
    }
  }, [setOverlay]);

  const backInOverlay = useCallback(() => {
    const state = window.history.state as { pema?: string } | null;
    if (state?.pema === 'recouvrement') {
      window.history.back();
    } else {
      closeOverlay();
    }
  }, [closeOverlay]);

  const value = useMemo(
    () => ({
      overlay,
      openImpayes,
      openRecouvrement,
      closeOverlay,
      backInOverlay,
    }),
    [overlay, openImpayes, openRecouvrement, closeOverlay, backInOverlay],
  );

  return (
    <WorkspaceOverlayContext.Provider value={value}>
      {children}
    </WorkspaceOverlayContext.Provider>
  );
}

export function useWorkspaceOverlayOptional(): WorkspaceOverlayContextValue | null {
  return useContext(WorkspaceOverlayContext);
}

/** Correspondance href → action overlay (null si navigation classique). */
export function overlayActionForHref(
  rootPath: string,
  href: string,
): WorkspaceOverlayScreen | null {
  const raw = href.split('#')[0];
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);

  if (path === `${rootPath}/impayes`) {
    return { kind: 'impayes' };
  }
  if (path === `${rootPath}/impayes/recouvrement`) {
    const feeId = params.get('frais');
    if (!feeId) return null;
    return {
      kind: 'recouvrement',
      feeId,
      search: params.get('q') ?? undefined,
      classId: params.get('classe') ?? undefined,
    };
  }
  return null;
}
