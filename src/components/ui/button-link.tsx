import Link from 'next/link';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

type ButtonAnchorProps = Omit<React.ComponentProps<'a'>, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export function ButtonAnchor({
  className,
  variant,
  size,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
