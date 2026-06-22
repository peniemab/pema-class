'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import {
  isWorkspaceOverlayHref,
  normalizeWorkspaceHref,
} from '@/lib/navigation/workspace-overlay-routes';

export type WorkspaceOverlayScreen = {
  kind: 'route';
  href: string;
};

type WorkspaceOverlayContextValue = {
  overlay: WorkspaceOverlayScreen | null;
  openRoute: (href: string) => void;
  closeOverlay: () => void;
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
  const openRoute = useCallback(
    (href: string) => {
      const normalized = href.split('#')[0];
      setOverlay({ kind: 'route', href: normalized });
      window.history.pushState({ pema: 'overlay', href: normalized }, '');
    },
    [setOverlay],
  );

  const closeOverlay = useCallback(() => {
    const state = window.history.state as { pema?: string } | null;
    if (state?.pema === 'overlay') {
      window.history.back();
    } else {
      setOverlay(null);
    }
  }, [setOverlay]);

  const value = useMemo(
    () => ({
      overlay,
      openRoute,
      closeOverlay,
    }),
    [overlay, openRoute, closeOverlay],
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

/** true si href doit s'ouvrir en overlay depuis le workspace. */
export function shouldOpenWorkspaceOverlay(rootPath: string, href: string): boolean {
  const path = normalizeWorkspaceHref(href);
  if (path === rootPath || path === `${rootPath}/outils`) return false;
  return isWorkspaceOverlayHref(href);
}
