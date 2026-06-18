import { LogOut } from 'lucide-react';
import { brand } from '@/lib/brand';
import { buttonVariants } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

type LogoutIconButtonProps = {
  className?: string;
};

export function LogoutIconButton({ className }: LogoutIconButtonProps) {
  return (
    <LogoutButton
      label={brand.texts.logoutButton}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
        'shrink-0 text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
    </LogoutButton>
  );
}
