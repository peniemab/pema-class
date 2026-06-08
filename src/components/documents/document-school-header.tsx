import Image from 'next/image';
import type { SchoolDocumentInfo } from '@/lib/documents/types';

type Props = {
  school: SchoolDocumentInfo;
  subtitle?: string;
};

export function DocumentSchoolHeader({ school, subtitle }: Props) {
  return (
    <header className="document-header border-b border-black/20 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {school.logoUrl ? (
            <Image
              src={school.logoUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 rounded object-contain"
              unoptimized
            />
          ) : null}
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide">
              {school.displayName}
            </h1>
            {school.address ? (
              <p className="mt-0.5 text-xs text-black/70">{school.address}</p>
            ) : null}
            <p className="mt-0.5 text-xs text-black/70">
              {[school.phone, school.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {subtitle ? (
          <p className="text-right text-xs font-medium uppercase tracking-wider text-black/60">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}
