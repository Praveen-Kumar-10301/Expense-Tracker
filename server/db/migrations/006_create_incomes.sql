-- Per-month income. Lets users see how much of their income they spend vs. save.
CREATE TABLE IF NOT EXISTS incomes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK(amount_paise >= 0),
  month        TEXT    NOT NULL,                          -- YYYY-MM format
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_incomes_user_month ON incomes(user_id, month);
