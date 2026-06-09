-- Recurring budgets.
-- A budget row applies from its effective_month onward, until a newer row
-- (a later effective_month) for the same category overrides it. Editing a budget
-- while viewing month M writes a row effective from M, so earlier months keep
-- their original amounts.
-- amount_paise = 0 is a tombstone meaning "no budget from this month forward",
-- which is why the CHECK is relaxed from > 0 to >= 0.

CREATE TABLE budgets_new (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount_paise    INTEGER NOT NULL CHECK(amount_paise >= 0),
  effective_month TEXT    NOT NULL,                          -- YYYY-MM; applies from this month onward
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, effective_month)
);

-- Carry existing per-month budgets over as effective-month rows.
INSERT INTO budgets_new (id, user_id, category_id, amount_paise, effective_month, created_at, updated_at)
SELECT id, user_id, category_id, amount_paise, month, created_at, updated_at FROM budgets;

DROP TABLE budgets;
ALTER TABLE budgets_new RENAME TO budgets;

CREATE INDEX IF NOT EXISTS idx_budgets_user_eff ON budgets(user_id, effective_month);
