'use client';

import type { PlatformUser } from '@/components/platform/platform-shell';
import { LogoutIconButton } from '@/components/logout-icon-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

type PlatformHeaderProps = {
  user: PlatformUser;
};

function getInitials(user: PlatformUser) {
  const fromName = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((p) => p!.charAt(0))
    .join('');
  if (fromName.length >= 1) {
    return fromName.slice(0, 2).toUpperCase();
  }
  const source = user.email ?? '?';
  return source
    .split(/[@.]/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PlatformHeader({ user }: PlatformHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          Pema Class Platform
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Administration SaaS
        </p>
      </div>
      <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
        Superadmin
      </span>
      <Avatar className="size-8" title={user.email}>
        <AvatarFallback>{getInitials(user)}</AvatarFallback>
      </Avatar>
      <LogoutIconButton />
    </header>
  );
}
