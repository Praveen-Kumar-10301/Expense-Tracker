import { get, run } from '../db/database.js';

const Income = {
  findByUserAndMonth: (userId, month) =>
    get('SELECT amount_paise, month FROM incomes WHERE user_id = ? AND month = ?', [userId, month]),

  upsert: (userId, amountPaise, month) =>
    run(
      `INSERT INTO incomes (user_id, amount_paise, month)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, month)
       DO UPDATE SET amount_paise = excluded.amount_paise, updated_at = CURRENT_TIMESTAMP`,
      [userId, amountPaise, month]
    ),
};

export default Income;
