import { Skeleton } from '@/components/ui/skeleton';

export default function AppCaisseStudentLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
