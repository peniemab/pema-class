'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
  showPrint?: boolean;
};

/** Le header shell gère titre, retour et impression. */
export function ReportPageShell({ children }: Props) {
  return <div className="mx-auto w-full max-w-5xl pb-10">{children}</div>;
}
