import Dexie, { type Table } from 'dexie';
import type { OutboxMutation } from '@/lib/offline/outbox-types';

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

/** Fiche complète (profil détaillé) pour la lecture hors ligne. */
export type LocalStudentDetail = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  birth_date: string | null;
  lieu_naissance: string | null;
  ecole_provenance: string | null;
  gender: string | null;
  photo_url: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'error';
};

export type LocalContact = {
  id: string;
  student_id: string;
  school_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  note: string | null;
  created_at: string;
  sync_status: 'synced' | 'pending' | 'error';
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
  studentDetails!: Table<LocalStudentDetail, string>;
  contacts!: Table<LocalContact, string>;
  outbox!: Table<OutboxMutation, string>;

  constructor() {
    super('pema-offline');
    this.version(1).stores({
      students: 'id, school_id, last_name, status, class_id, sync_status',
      classes: 'id, school_id, academic_year_id, level',
      meta: 'key, school_id, scope',
    });
    this.version(2).stores({
      students: 'id, school_id, last_name, status, class_id, sync_status',
      classes: 'id, school_id, academic_year_id, level',
      meta: 'key, school_id, scope',
      studentDetails: 'id, school_id, sync_status',
      contacts: 'id, student_id, school_id, sync_status',
    });
    this.version(3).stores({
      students: 'id, school_id, last_name, status, class_id, sync_status',
      classes: 'id, school_id, academic_year_id, level',
      meta: 'key, school_id, scope',
      studentDetails: 'id, school_id, sync_status',
      contacts: 'id, student_id, school_id, sync_status',
      outbox: 'id, school_id, type, status, created_at',
    });
    this.version(4)
      .stores({
        students: 'id, school_id, last_name, status, class_id, sync_status',
        classes: 'id, school_id, academic_year_id, level',
        meta: 'key, school_id, scope',
        studentDetails: 'id, school_id, sync_status',
        contacts: 'id, student_id, school_id, sync_status',
        outbox: 'id, school_id, entity_id, type, status, created_at',
      })
      .upgrade((tx) =>
        tx
          .table('outbox')
          .toCollection()
          .modify((m: OutboxMutation & { entity_id?: string }) => {
            if (!m.entity_id) {
              if (m.type === 'register_student') {
                m.entity_id = m.id;
              } else if (
                m.type === 'update_student' ||
                m.type === 'update_student_contacts' ||
                m.type === 'transfer_student_class'
              ) {
                m.entity_id = m.payload.studentId;
              }
            }
          }),
      );
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
