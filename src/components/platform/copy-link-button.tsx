'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CopyLinkButtonProps = {
  url: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'secondary' | 'ghost';
  className?: string;
};

export function CopyLinkButton({
  url,
  label = 'Copier le lien',
  size = 'sm',
  variant = 'outline',
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(className)}
      onClick={copy}
    >
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <Copy data-icon="inline-start" />
      )}
      {copied ? 'Copié' : label}
    </Button>
  );
}
