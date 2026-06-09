import { all, run } from '../db/database.js';

const Budget = {
  // Upsert a budget effective from `effectiveMonth`. Pass amountPaise = 0 to
  // tombstone (stop budgeting this category from that month forward).
  upsert: (userId, categoryId, amountPaise, effectiveMonth) =>
    run(
      `INSERT INTO budgets (user_id, category_id, amount_paise, effective_month)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, category_id, effective_month)
       DO UPDATE SET amount_paise = excluded.amount_paise, updated_at = CURRENT_TIMESTAMP`,
      [userId, categoryId, amountPaise, effectiveMonth]
    ),

  // Active budget per category for `month`: the row with the greatest
  // effective_month <= month, with that month's spend joined in. Tombstone rows
  // (amount_paise = 0) are returned too — the caller decides whether to show them.
  findActiveByUserAndMonth: (userId, month) =>
    all(
      `SELECT b.id, b.category_id, b.amount_paise AS budget_paise, b.effective_month,
              c.name AS category_name, c.color,
              COALESCE((
                SELECT SUM(e.amount_paise) FROM expenses e
                WHERE e.user_id = b.user_id AND e.category_id = b.category_id
                  AND strftime('%Y-%m', e.date) = ?
              ), 0) AS spent_paise
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ?
         AND b.effective_month <= ?
         AND b.effective_month = (
           SELECT MAX(b2.effective_month) FROM budgets b2
           WHERE b2.user_id = b.user_id AND b2.category_id = b.category_id
             AND b2.effective_month <= ?
         )
       ORDER BY c.name COLLATE NOCASE`,
      [month, userId, month, month]
    ),
};

export default Budget;
