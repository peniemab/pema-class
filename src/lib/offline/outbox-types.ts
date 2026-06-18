/** Mutation outbox — file d'attente de sync cloud (spec domain-spec). */

export type RegisterStudentContact = {
  full_name: string;
  relationship: string;
  phone: string;
  note: string | null;
};

export type RegisterStudentPayload = {
  academicYearId: string;
  classId: string;
  className: string;
  classLevel: string;
  classCycle: string | null;
  level: string;
  student: {
    first_name: string;
    last_name: string;
    matricule: string | null;
    autoMatricule: boolean;
    birth_date: string | null;
    lieu_naissance: string | null;
    ecole_provenance: string | null;
    gender: string | null;
    address: string | null;
  };
  contacts: RegisterStudentContact[];
};

export type UpdateStudentPayload = {
  studentId: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  birth_date: string | null;
  lieu_naissance: string | null;
  ecole_provenance: string | null;
  gender: string | null;
  address: string | null;
  status: 'active' | 'inactive';
};

export type UpdateContactsPayload = {
  studentId: string;
  contacts: RegisterStudentContact[];
};

export type TransferClassPayload = {
  studentId: string;
  academicYearId: string;
  classId: string;
  className: string;
  classLevel: string;
  classCycle: string | null;
  previousClassId: string | null;
};

export type OutboxStatus = 'pending' | 'processing' | 'done' | 'error';

export type OutboxMutationBase = {
  id: string;
  school_id: string;
  /** Élève concerné (coalescence des mises à jour). */
  entity_id: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
  status: OutboxStatus;
};

export type RegisterStudentMutation = OutboxMutationBase & {
  type: 'register_student';
  payload: RegisterStudentPayload;
};

export type UpdateStudentMutation = OutboxMutationBase & {
  type: 'update_student';
  payload: UpdateStudentPayload;
};

export type UpdateContactsMutation = OutboxMutationBase & {
  type: 'update_student_contacts';
  payload: UpdateContactsPayload;
};

export type TransferClassMutation = OutboxMutationBase & {
  type: 'transfer_student_class';
  payload: TransferClassPayload;
};

export type OutboxMutation =
  | RegisterStudentMutation
  | UpdateStudentMutation
  | UpdateContactsMutation
  | TransferClassMutation;

export type EnrollPushResult = {
  studentId: string;
  matricule: string;
  className: string;
  classLevel: string;
};

export type MutationPushResult = {
  ok: true;
  studentId?: string;
};
