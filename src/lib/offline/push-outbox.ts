import {
  getMutationServerId,
  listPendingOutbox,
  removeOutboxMutation,
  saveMutationServerId,
  updateOutboxMutation,
} from '@/lib/offline/outbox-repo';
import { saveStudentsSnapshot } from '@/lib/offline/students-repo';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { EnrollPushResult, OutboxMutation } from '@/lib/offline/outbox-types';
import { getOfflineDb } from '@/lib/offline/db';

const MAX_ATTEMPTS = 8;

async function pullSnapshot(): Promise<void> {
  const res = await fetch('/api/sync/students', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Pull HTTP ${res.status}`);
  const snapshot = (await res.json()) as StudentsSnapshot;
  await saveStudentsSnapshot(snapshot);
}

async function pushEnrollMutation(
  mutation: OutboxMutation,
): Promise<EnrollPushResult> {
  const res = await fetch('/api/sync/enroll', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mutationId: mutation.id,
      payload: mutation.payload,
    }),
  });
  const body = (await res.json()) as EnrollPushResult & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Push HTTP ${res.status}`);
  }
  return body;
}

/** Supprime les brouillons locaux (MAT-P / id mutation) après sync réussie. */
async function purgeOptimisticStudent(mutationId: string): Promise<void> {
  const db = getOfflineDb();
  await db.transaction('rw', db.students, db.studentDetails, db.contacts, async () => {
    await db.students.delete(mutationId);
    await db.studentDetails.delete(mutationId);
    const contactIds = await db.contacts
      .where('student_id')
      .equals(mutationId)
      .primaryKeys();
    await db.contacts.bulkDelete(contactIds);
  });
}

/**
 * Pousse les mutations outbox vers le cloud (retry + idempotence mapping).
 * Puis pull snapshot pour réconciliation (spec : purge MAT-P-…).
 */
export async function pushOutbox(schoolId: string): Promise<{
  pushed: number;
  failed: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { pushed: 0, failed: 0 };
  }

  const pending = await listPendingOutbox(schoolId);
  let pushed = 0;
  let failed = 0;

  for (const mutation of pending) {
    if (mutation.type !== 'register_student') continue;

    const existingServerId = await getMutationServerId(mutation.id);
    if (existingServerId) {
      await purgeOptimisticStudent(mutation.id);
      await removeOutboxMutation(mutation.id);
      pushed += 1;
      continue;
    }

    await updateOutboxMutation(mutation.id, { status: 'processing' });

    try {
      const result = await pushEnrollMutation(mutation);
      await saveMutationServerId(mutation.id, result.studentId);
      await purgeOptimisticStudent(mutation.id);
      await removeOutboxMutation(mutation.id);
      pushed += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de synchronisation';
      const attempts = mutation.attempts + 1;
      await updateOutboxMutation(mutation.id, {
        status: attempts >= MAX_ATTEMPTS ? 'error' : 'pending',
        attempts,
        last_error: message,
      });
      failed += 1;
    }
  }

  if (pushed > 0) {
    try {
      await pullSnapshot();
    } catch {
      // Le push a réussi ; le pull suivra au prochain cycle.
    }
  }

  return { pushed, failed };
}
