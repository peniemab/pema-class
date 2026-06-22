'use client';

import { LogOut } from 'lucide-react';
import { clearLocalSession } from '@/lib/offline/local-session';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  className?: string;
  label?: string;
  iconClassName?: string;
  children?: React.ReactNode;
};

/**
 * Déconnexion via POST natif (non préchargeable par Next.js).
 * Efface aussi la session locale (style WhatsApp).
 */
export function LogoutButton({
  className,
  label = 'Déconnexion',
  iconClassName,
  children,
}: LogoutButtonProps) {
  return (
    <form
      action="/logout"
      method="post"
      className="contents"
      onSubmit={() => clearLocalSession()}
    >
      <button type="submit" className={className} aria-label={label} title={label}>
        {children ?? (
          <>
            <LogOut className={cn('size-5', iconClassName)} aria-hidden />
            <span>{label}</span>
          </>
        )}
      </button>
    </form>
  );
}
