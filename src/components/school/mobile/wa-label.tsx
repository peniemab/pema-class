import { cn } from '@/lib/utils';

const LABEL_TONES = {
  green: 'bg-secondary/15 text-secondary',
  red: 'bg-destructive/10 text-destructive',
  amber: 'bg-amber-500/15 text-amber-800',
  blue: 'bg-blue-500/15 text-blue-700',
  gray: 'bg-wa-bg text-wa-text-secondary',
};

type Props = {
  children: React.ReactNode;
  tone?: keyof typeof LABEL_TONES;
  className?: string;
};

/** Étiquette style WhatsApp Business (labels). */
export function WaLabel({ children, tone = 'gray', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-1.5 py-0.5 text-[0.625rem] font-medium leading-none',
        LABEL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
