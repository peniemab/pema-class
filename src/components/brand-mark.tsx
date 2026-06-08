import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';

export type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'center';
  tone?: 'default' | 'inverse';
  showSubtitle?: boolean;
};

const sizeMap = {
  sm: { box: 'size-9 text-lg', title: 'text-xl' },
  md: { box: 'size-11 text-xl', title: 'text-2xl' },
  lg: { box: 'size-14 text-2xl', title: 'text-3xl' },
};

export function BrandMark({
  className,
  size = 'md',
  orientation = 'horizontal',
  tone = 'default',
  showSubtitle = false,
}: BrandMarkProps) {
  const s = sizeMap[size];
  const inverse = tone === 'inverse';

  return (
    <div
      className={cn(
        'flex gap-3',
        orientation === 'center' ? 'flex-col items-center text-center' : 'items-center',
        className,
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl font-bold shadow-sm',
          s.box,
          inverse
            ? 'bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground',
        )}
        aria-hidden
      >
        {brand.initial}
      </div>
      <div className={cn(orientation === 'center' && 'flex flex-col items-center')}>
        <span
          className={cn(
            'font-pema-signature leading-tight tracking-tight',
            s.title,
            inverse ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          {brand.name}
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'mt-0.5 text-xs',
              inverse ? 'text-primary-foreground/75' : 'text-muted-foreground',
            )}
          >
            Gestion scolaire
          </span>
        )}
      </div>
    </div>
  );
}
