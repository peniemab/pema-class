import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { legalLinks } from '@/lib/brand';

export function LoginLegalFooter() {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      aria-label="Informations légales"
    >
      {legalLinks.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-2">
          {index > 0 && (
            <span className="text-muted-foreground/50" aria-hidden>
              •
            </span>
          )}
          <Link
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
          >
            {item.label}
            <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
          </Link>
        </span>
      ))}
    </nav>
  );
}
