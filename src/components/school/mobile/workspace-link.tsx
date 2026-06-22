'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, type ComponentProps, type MouseEvent } from 'react';
import { useAppTabsOptional } from '@/lib/navigation/app-tab-context';
import {
  shouldOpenWorkspaceOverlay,
  useWorkspaceOverlayOptional,
} from '@/lib/navigation/workspace-overlay-context';

type WorkspaceLinkProps = ComponentProps<typeof Link>;

/**
 * Lien workspace : bascule un onglet keep-alive ou ouvre un overlay selon la
 * cible. Depuis /school (accueil, outils, etc.), aucune navigation Next.js.
 */
export const WorkspaceLink = forwardRef<HTMLAnchorElement, WorkspaceLinkProps>(
  function WorkspaceLink({ href, onClick, ...rest }, ref) {
    const tabs = useAppTabsOptional();
    const overlay = useWorkspaceOverlayOptional();
    const pathname = usePathname();
    const inWorkspace = tabs != null && pathname === tabs.rootPath;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (!inWorkspace || !tabs) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const raw = typeof href === 'string' ? href : (href.pathname ?? '');

      if (shouldOpenWorkspaceOverlay(tabs.rootPath, raw) && overlay) {
        event.preventDefault();
        overlay.openRoute(raw);
        return;
      }

      const path = raw.split('#')[0].split('?')[0];
      const tabKey = tabs.tabForHref(path);
      if (tabKey) {
        event.preventDefault();
        tabs.selectTab(tabKey);
      }
    };

    return <Link ref={ref} href={href} onClick={handleClick} {...rest} />;
  },
);
