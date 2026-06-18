import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { OutboxMutation } from '@/lib/offline/outbox-types';

const MAPPING_SCOPE = 'mutation-mapping';

export async function addOutboxMutation(
  mutation: OutboxMutation,
): Promise<void> {
  await getOfflineDb().outbox.put(mutation);
}

export async function listPendingOutbox(
  schoolId: string,
): Promise<OutboxMutation[]> {
  return getOfflineDb()
    .outbox.where('school_id')
    .equals(schoolId)
    .filter((m) => m.status === 'pending' || m.status === 'error')
    .sortBy('created_at');
}

export async function countPendingOutbox(schoolId: string): Promise<number> {
  return getOfflineDb()
    .outbox.where('school_id')
    .equals(schoolId)
    .filter((m) => m.status === 'pending' || m.status === 'error')
    .count();
}

export async function updateOutboxMutation(
  id: string,
  patch: Partial<Pick<OutboxMutation, 'status' | 'attempts' | 'last_error'>>,
): Promise<void> {
  await getOfflineDb().outbox.update(id, patch);
}

export async function removeOutboxMutation(id: string): Promise<void> {
  await getOfflineDb().outbox.delete(id);
}

/** Mapping mutationId → studentId serveur (évite double push après succès). */
export async function getMutationServerId(
  mutationId: string,
): Promise<string | null> {
  const row = await getOfflineDb().meta.get(
    metaKey('global', `${MAPPING_SCOPE}:${mutationId}`),
  );
  return (row?.value as string | undefined) ?? null;
}

export async function saveMutationServerId(
  mutationId: string,
  serverStudentId: string,
): Promise<void> {
  await getOfflineDb().meta.put({
    key: metaKey('global', `${MAPPING_SCOPE}:${mutationId}`),
    school_id: 'global',
    scope: `${MAPPING_SCOPE}:${mutationId}`,
    value: serverStudentId,
    updated_at: new Date().toISOString(),
  });
}
