import { get, all, run } from '../db/database.js';

const SELECT_WITH_CATEGORY =
  'SELECT e.*, c.name as category_name, c.color as category_color FROM expenses e JOIN categories c ON e.category_id = c.id';

const Expense = {
  create: async (userId, { categoryId, amountPaise, date, notes = '' }) => {
    const r = await run(
      'INSERT INTO expenses (user_id, category_id, amount_paise, date, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, categoryId, amountPaise, date, notes]
    );
    return r.lastInsertRowid;
  },

  findById: (id, userId) =>
    get(`${SELECT_WITH_CATEGORY} WHERE e.id = ? AND e.user_id = ?`, [id, userId]),

  update: async (id, userId, { categoryId, amountPaise, date, notes }) =>
    (await run(
      'UPDATE expenses SET category_id = ?, amount_paise = ?, date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [categoryId, amountPaise, date, notes, id, userId]
    )).changes > 0,

  delete: async (id, userId) =>
    (await run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId])).changes > 0,

  // Dynamic query builder for filtered list
  findByUser: async (userId, filters = {}) => {
    const { startDate, endDate, categoryId, search, minAmount, maxAmount, page = 1, limit = 20 } = filters;
    const conditions = ['e.user_id = ?'];
    const params = [userId];

    if (startDate) { conditions.push('e.date >= ?'); params.push(startDate); }
    if (endDate)   { conditions.push('e.date <= ?'); params.push(endDate); }
    if (categoryId){ conditions.push('e.category_id = ?'); params.push(categoryId); }
    if (search)    { conditions.push('e.notes LIKE ?'); params.push(`%${search}%`); }
    if (minAmount) { conditions.push('e.amount_paise >= ?'); params.push(minAmount); }
    if (maxAmount) { conditions.push('e.amount_paise <= ?'); params.push(maxAmount); }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const rows = await all(
      `${SELECT_WITH_CATEGORY}
       WHERE ${where} ORDER BY e.date DESC, e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const { total } = await get(
      `SELECT COUNT(*) as total FROM expenses e WHERE ${where}`,
      params
    );

    // Accurate per-month totals across the whole filtered set (not just this page),
    // so the Expenses list can show a true total beside each month heading.
    const monthTotals = await all(
      `SELECT strftime('%Y-%m', e.date) as month,
              SUM(e.amount_paise) as total_paise,
              COUNT(*) as count
       FROM expenses e WHERE ${where}
       GROUP BY month ORDER BY month DESC`,
      params
    );

    return { rows, total, page, limit, monthTotals };
  },

  // Monthly summary by category for charts
  summaryByCategory: (userId, month) =>
    all(
      `SELECT c.id as category_id, c.name as category_name, c.color,
              SUM(e.amount_paise) as total_paise, COUNT(*) as count
       FROM expenses e JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND strftime('%Y-%m', e.date) = ?
       GROUP BY c.id ORDER BY total_paise DESC`,
      [userId, month]
    ),

  // Monthly totals for the last N months (trend chart)
  monthlyTotals: (userId, months = 6) =>
    all(
      `SELECT strftime('%Y-%m', date) as month, SUM(amount_paise) as total_paise
       FROM expenses WHERE user_id = ?
       GROUP BY month ORDER BY month DESC LIMIT ?`,
      [userId, months]
    ),
};

export default Expense;
