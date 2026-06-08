'use client';

import { PlatformHeader } from '@/components/platform/platform-header';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export type PlatformUser = {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

type PlatformShellProps = {
  user: PlatformUser;
  children: React.ReactNode;
};

export function PlatformShell({ user, children }: PlatformShellProps) {
  return (
    <SidebarProvider>
      <PlatformSidebar />
      <SidebarInset>
        <PlatformHeader user={user} />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
