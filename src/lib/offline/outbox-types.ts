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
    /** MAT-P-… en local si auto ; matricule saisi sinon. */
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

export type OutboxMutation = {
  /** UUID — sert aussi d'id optimiste de l'élève en local. */
  id: string;
  school_id: string;
  type: 'register_student';
  payload: RegisterStudentPayload;
  created_at: string;
  attempts: number;
  last_error: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
};

export type EnrollPushResult = {
  studentId: string;
  matricule: string;
  className: string;
  classLevel: string;
};
