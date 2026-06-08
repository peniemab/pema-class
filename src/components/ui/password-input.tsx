'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type'
> & {
  wrapperClassName?: string;
};

export function PasswordInput({
  className,
  wrapperClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', wrapperClassName)}>
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={
          visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
        }
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
