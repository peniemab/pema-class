import Dexie, { type Table } from 'dexie';

/**
 * Base locale (IndexedDB) — cache hors ligne façon Contacts iPhone.
 * Source de vérité UI : on lit ici d'abord, la sync cloud suit.
 */

export type LocalStudent = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  gender: string | null;
  birth_date: string | null;
  status: string;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
  class_cycle: string | null;
  /** Métadonnées de sync (Phase 1 : lecture seule, toujours 'synced'). */
  sync_status: 'synced' | 'pending' | 'error';
  updated_at: string;
};

export type LocalClass = {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  level: string;
  cycle: string | null;
  max_capacity: number;
  current_count: number;
};

export type LocalMeta = {
  /** Clé composite : `${schoolId}:${scope}` (ex. `<id>:students`). */
  key: string;
  school_id: string;
  scope: string;
  value: unknown;
  updated_at: string;
};

export class PemaOfflineDB extends Dexie {
  students!: Table<LocalStudent, string>;
  classes!: Table<LocalClass, string>;
  meta!: Table<LocalMeta, string>;

  constructor() {
    super('pema-offline');
    this.version(1).stores({
      students: 'id, school_id, last_name, status, class_id, sync_status',
      classes: 'id, school_id, academic_year_id, level',
      meta: 'key, school_id, scope',
    });
  }
}

let _db: PemaOfflineDB | null = null;

/** Singleton — instancié uniquement côté navigateur. */
export function getOfflineDb(): PemaOfflineDB {
  if (typeof window === 'undefined') {
    throw new Error('La base offline est disponible uniquement côté client.');
  }
  if (!_db) {
    _db = new PemaOfflineDB();
  }
  return _db;
}

export function metaKey(schoolId: string, scope: string): string {
  return `${schoolId}:${scope}`;
}
