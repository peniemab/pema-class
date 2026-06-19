'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * État d'onglet local (`currentTab`) synchronisé avec l'URL via `?tab=`.
 *
 * - `selectTab` met à jour l'état ET l'URL avec `history.replaceState` :
 *   pas de rechargement Next.js, pas d'aller-retour serveur (0 ms).
 * - Le bouton « retour » système (popstate) est respecté.
 * - Le deep-link (`/app?tab=caisse`) ouvre directement le bon onglet.
 */
export function useTabRouter<T extends string>(
  defaultKey: T,
  validKeys: readonly T[],
) {
  const [currentTab, setTab] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultKey;
    const fromUrl = new URLSearchParams(window.location.search).get('tab') as T | null;
    return fromUrl && validKeys.includes(fromUrl) ? fromUrl : defaultKey;
  });

  const selectTab = useCallback(
    (key: T) => {
      if (!validKeys.includes(key)) return;
      setTab(key);
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', key);
      window.history.replaceState(window.history.state, '', url);
    },
    [validKeys],
  );

  useEffect(() => {
    const onPop = () => {
      const fromUrl = new URLSearchParams(window.location.search).get('tab') as
        | T
        | null;
      setTab(fromUrl && validKeys.includes(fromUrl) ? fromUrl : defaultKey);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [defaultKey, validKeys]);

  return { currentTab, selectTab };
}
