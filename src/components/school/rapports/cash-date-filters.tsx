'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  basePath: string;
  selectedDate: string;
};

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CashDateFilters({ basePath, selectedDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = todayIsoDate();
  const yesterday = shiftDate(today, -1);

  function pushDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (date) params.set('date', date);
    else params.delete('date');
    const q = params.toString();
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <QuickDateButton
          label="Aujourd'hui"
          active={selectedDate === today}
          onClick={() => pushDate(today)}
        />
        <QuickDateButton
          label="Hier"
          active={selectedDate === yesterday}
          onClick={() => pushDate(yesterday)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cash-report-date">Date</Label>
        <Input
          id="cash-report-date"
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => pushDate(e.target.value)}
          className="max-w-xs bg-background"
        />
      </div>
    </div>
  );
}

function QuickDateButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn('h-8 rounded-full px-3 text-xs', !active && 'bg-background')}
    >
      {label}
    </Button>
  );
}
