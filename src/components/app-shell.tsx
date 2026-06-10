import { AppSidebar } from '@/components/app-sidebar';
import { SchoolShellMain } from '@/components/school/mobile/school-shell-main';

type AppShellProps = {
  variant: 'platform' | 'school' | 'app';
  title?: string;
  children: React.ReactNode;
};

export function AppShell({ variant, title, children }: AppShellProps) {
  if (variant === 'school') {
    return <SchoolShellMain>{children}</SchoolShellMain>;
  }

  return (
    <div className="flex min-h-dvh">
      <AppSidebar variant={variant} />
      <div className="flex min-w-0 flex-1 flex-col">
        {title ? (
          <header className="border-b bg-card px-6 py-4">
            <h1 className="text-lg font-semibold">{title}</h1>
          </header>
        ) : null}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
