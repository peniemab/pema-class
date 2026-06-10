import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-primary-dark text-primary-foreground',
  'bg-[#53bdeb] text-white',
  'bg-primary-light text-primary-dark',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

type Props = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

const SIZE_CLASS = {
  sm: 'size-10 text-sm',
  md: 'size-12 text-base',
  lg: 'size-14 text-lg',
};

export function WaAvatar({ name, size = 'md', className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        SIZE_CLASS[size],
        colorFromName(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
