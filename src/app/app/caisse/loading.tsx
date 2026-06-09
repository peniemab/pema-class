import { Skeleton } from '@/components/ui/skeleton';

export default function AppCaisseLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-36 rounded-lg" />
    </div>
  );
}
