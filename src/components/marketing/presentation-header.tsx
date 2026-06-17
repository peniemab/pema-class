import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { ButtonLink } from '@/components/ui/button-link';
import { presentationNav } from '@/lib/marketing/presentation-content';

export function PresentationHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/presentation" className="shrink-0">
          <BrandMark size="sm" showSubtitle />
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
          aria-label="Navigation principale"
        >
          {presentationNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href="/" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Connexion
          </ButtonLink>
          <ButtonLink href="/" size="sm">
            Se connecter
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
