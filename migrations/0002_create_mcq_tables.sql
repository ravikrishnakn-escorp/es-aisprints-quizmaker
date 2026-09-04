-- Migration number: 0002    2026-09-04T00:00:00.000Z

CREATE TABLE mcq (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mcq_id) REFERENCES mcq (id) ON DELETE CASCADE
);

CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mcq_id) REFERENCES mcq (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices (id) ON DELETE RESTRICT
);

CREATE INDEX idx_mcq_created_by_user_id ON mcq (created_by_user_id);
CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices (mcq_id);
CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts (mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts (user_id);
