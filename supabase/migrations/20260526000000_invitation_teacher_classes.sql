-- Classes pré-assignées lors d'une invitation enseignant (appliquées à l'inscription).

CREATE TABLE IF NOT EXISTS invitation_teacher_classes (
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_invitation_teacher_classes_invitation
  ON invitation_teacher_classes (invitation_id);
