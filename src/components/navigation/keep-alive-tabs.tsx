'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type KeepAliveTab = {
  key: string;
  render: () => ReactNode;
};

type KeepAliveTabsProps = {
  activeKey: string;
  tabs: KeepAliveTab[];
};

/**
 * Onglets « gardés en mémoire » façon WhatsApp Business :
 * un onglet est monté à sa PREMIÈRE activation, puis conservé dans le DOM.
 * Les onglets inactifs sont masqués via `hidden` (display:none) — leur état
 * React, leur scroll et leurs hooks de synchro restent vivants. Le switch
 * d'onglet est donc instantané (0 ms, aucun rechargement).
 */
export function KeepAliveTabs({ activeKey, tabs }: KeepAliveTabsProps) {
  const mounted = useRef<Set<string>>(new Set());

  return (
    <>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        if (isActive) mounted.current.add(tab.key);
        // Jamais visité → pas encore monté (démarrage léger sur mobile).
        if (!mounted.current.has(tab.key)) return null;

        return (
          <div
            key={tab.key}
            className={cn(isActive ? undefined : 'hidden')}
            aria-hidden={!isActive}
          >
            {tab.render()}
          </div>
        );
      })}
    </>
  );
}
