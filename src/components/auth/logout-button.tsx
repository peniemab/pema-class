import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  className?: string;
  label?: string;
  iconClassName?: string;
  children?: React.ReactNode;
};

/**
 * Déconnexion via POST natif (non préchargeable par Next.js).
 * `display:contents` sur le form pour ne pas casser les layouts flex/grid parents.
 */
export function LogoutButton({
  className,
  label = 'Déconnexion',
  iconClassName,
  children,
}: LogoutButtonProps) {
  return (
    <form action="/logout" method="post" className="contents">
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
