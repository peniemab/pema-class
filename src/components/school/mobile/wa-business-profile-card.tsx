import Link from 'next/link';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { WaAvatar } from '@/components/school/mobile/wa-avatar';
import { formatFeeAmount } from '@/lib/school/referentials/constants';

type Props = {
  schoolName: string;
  activeYearName: string | null;
  enrolledCount: number;
  classCount: number;
  totalCollectedCdf: number;
  studentsWithDebt: number;
};

export function WaBusinessProfileCard({
  schoolName,
  activeYearName,
  enrolledCount,
  classCount,
  totalCollectedCdf,
  studentsWithDebt,
}: Props) {
  return (
    <section className="border-b border-wa-divider bg-wa-panel px-4 py-5">
      <div className="flex items-start gap-4">
        <WaAvatar name={schoolName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-lg font-semibold text-wa-text-primary">
              {schoolName}
            </h2>
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Compte établissement" />
          </div>
          <p className="mt-0.5 text-sm text-wa-text-secondary">
            Établissement scolaire
            {activeYearName ? ` · ${activeYearName}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-wa-bg px-2.5 py-1 text-wa-text-secondary">
              {enrolledCount} inscrit{enrolledCount > 1 ? 's' : ''}
            </span>
            <span className="rounded-full bg-wa-bg px-2.5 py-1 text-wa-text-secondary">
              {classCount} classe{classCount > 1 ? 's' : ''}
            </span>
            {studentsWithDebt > 0 ? (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
                {studentsWithDebt} impayé{studentsWithDebt > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {activeYearName ? (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-wa-bg px-3 py-2.5">
          <div>
            <p className="text-xs text-wa-text-secondary">Encaissé cette année</p>
            <p className="text-base font-semibold tabular-nums text-secondary">
              {formatFeeAmount(totalCollectedCdf, 'CDF')}
            </p>
          </div>
          <Link
            href="/school/parametres#etablissement"
            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary"
          >
            Profil
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
