'use client';

import { LogOut } from 'lucide-react';
import { brand } from '@/lib/brand';
import { ButtonAnchor } from '@/components/ui/button-link';
import { cn } from '@/lib/utils';

type LogoutIconButtonProps = {
  className?: string;
};

export function LogoutIconButton({ className }: LogoutIconButtonProps) {
  return (
    <ButtonAnchor
      variant="ghost"
      size="icon-sm"
      href="/logout"
      aria-label={brand.texts.logoutButton}
      title={brand.texts.logoutButton}
      className={cn(
        'shrink-0 text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
    </ButtonAnchor>
  );
}
