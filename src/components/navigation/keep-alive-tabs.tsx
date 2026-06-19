'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type KeepAliveTab = {
  key: string;
  content: ReactNode;
};

type KeepAliveTabsProps = {
  activeKey: string;
  tabs: KeepAliveTab[];
  /**
   * true = tous les onglets montés dès le départ (design toujours en place,
   * switch instantané sans flash « Chargement… »).
   */
  eager?: boolean;
};

/**
 * Onglets gardés en mémoire : masqués via `hidden`, jamais démontés.
 * Le contenu (`content`) est passé une fois — pas de `render()` répété.
 */
export function KeepAliveTabs({
  activeKey,
  tabs,
  eager = true,
}: KeepAliveTabsProps) {
  const mounted = useRef<Set<string>>(
    eager ? new Set(tabs.map((t) => t.key)) : new Set(),
  );

  if (!eager && !mounted.current.has(activeKey)) {
    mounted.current.add(activeKey);
  }

  return (
    <>
      {tabs.map((tab) => {
        if (!mounted.current.has(tab.key)) return null;
        const isActive = tab.key === activeKey;
        return (
          <div
            key={tab.key}
            className={cn(isActive ? undefined : 'hidden')}
            aria-hidden={!isActive}
          >
            {tab.content}
          </div>
        );
      })}
    </>
  );
}
