'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSearchField } from '@/components/school/students/student-search-field';

type Props = {
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

export function CaisseSearchPanel({ caisseBasePath }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <StudentSearchField
        value={search}
        onChange={setSearch}
        label="Rechercher un élève à encaisser"
        inputId="caisse-search"
        onSelectStudent={(studentId) => {
          router.push(`${caisseBasePath}/${studentId}`);
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Nom, post-nom ou matricule — cliquez sur une suggestion pour encaisser.
      </p>
    </div>
  );
}
