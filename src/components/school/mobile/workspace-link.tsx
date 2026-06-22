'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, type ComponentProps, type MouseEvent } from 'react';
import { useAppTabsOptional } from '@/lib/navigation/app-tab-context';

type WorkspaceLinkProps = ComponentProps<typeof Link>;

/**
 * Lien qui se comporte comme la bottombar : si l'on est sur la racine du
 * workspace (`/app` ou `/school`) et que la cible correspond à un onglet
 * gardé en mémoire, on bascule l'onglet (0 ms, keep-alive) au lieu de
 * naviguer. Sinon, navigation Next classique.
 */
export const WorkspaceLink = forwardRef<HTMLAnchorElement, WorkspaceLinkProps>(
  function WorkspaceLink({ href, onClick, ...rest }, ref) {
    const tabs = useAppTabsOptional();
    const pathname = usePathname();
    const inWorkspace = tabs != null && pathname === tabs.rootPath;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (!inWorkspace || !tabs) return;
      // Laisser le comportement natif pour ouvrir dans un nouvel onglet.
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
