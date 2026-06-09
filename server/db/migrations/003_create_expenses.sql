CREATE TABLE IF NOT EXISTS expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  amount_paise  INTEGER NOT NULL CHECK(amount_paise > 0),  -- stored in paise (1 INR = 100 paise)
  date          TEXT    NOT NULL,                          -- ISO 8601: YYYY-MM-DD
  notes         TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date       ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date  ON expenses(user_id, date);
