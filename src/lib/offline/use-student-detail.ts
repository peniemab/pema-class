'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import {
  readLocalContactsForStudent,
  readLocalStudentDetail,
} from '@/lib/offline/students-repo';
import { getOfflineDb } from '@/lib/offline/db';
import type { LocalContact, LocalStudent, LocalStudentDetail } from '@/lib/offline/db';

export type StudentDetailLocal = {
  detail: LocalStudentDetail | null | undefined;
  directory: LocalStudent | null | undefined;
  contacts: LocalContact[] | undefined;
  loading: boolean;
};

/** Lecture 100% locale d'une fiche élève (profil + scolarité + contacts). */
export function useStudentDetail(
  studentId: string | null,
): StudentDetailLocal {
  const detail = useLiveQuery(
    async (): Promise<LocalStudentDetail | null> =>
      studentId ? readLocalStudentDetail(studentId) : null,
    [studentId],
  );
  const directory = useLiveQuery(
    async (): Promise<LocalStudent | undefined> =>
      studentId ? getOfflineDb().students.get(studentId) : undefined,
    [studentId],
  );
  const contacts = useLiveQuery(
    async (): Promise<LocalContact[]> =>
      studentId ? readLocalContactsForStudent(studentId) : [],
    [studentId],
  );

  return {
    detail,
    directory,
    contacts,
    loading: studentId != null && detail === undefined,
  };
}
