import { SchoolShellMain } from '@/components/school/mobile/school-shell-main';
import { PlatformShellMain } from '@/components/platform/mobile/platform-shell-main';

type AppShellProps = {
  variant: 'platform' | 'school';
  children: React.ReactNode;
};

export function AppShell({ variant, children }: AppShellProps) {
  if (variant === 'school') {
    return <SchoolShellMain>{children}</SchoolShellMain>;
  }
  if (variant === 'platform') {
    return <PlatformShellMain>{children}</PlatformShellMain>;
  }

  return <>{children}</>;
}
