import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

function buildPageUrl(
  page: number,
  searchParams: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/school/eleves?${qs}` : '/school/eleves';
}

export function StudentsPagination({
  page,
  pageSize,
  total,
  searchParams,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} sur {total} élève{total > 1 ? 's' : ''}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink variant="outline" size="sm" href={buildPageUrl(page - 1, searchParams)}>
            <ChevronLeft className="size-4" aria-hidden />
            Précédent
          </ButtonLink>
        ) : null}
        {page < totalPages ? (
          <ButtonLink variant="outline" size="sm" href={buildPageUrl(page + 1, searchParams)}>
            Suivant
            <ChevronRight className="size-4" aria-hidden />
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
