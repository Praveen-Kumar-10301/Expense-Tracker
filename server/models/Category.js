import { get, all, run, batch } from '../db/database.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food',          color: '#f97316' },
  { name: 'Transport',     color: '#3b82f6' },
  { name: 'Bills',         color: '#ef4444' },
  { name: 'Entertainment', color: '#a855f7' },
  { name: 'Healthcare',    color: '#22c55e' },
  { name: 'Shopping',      color: '#ec4899' },
  { name: 'Education',     color: '#eab308' },
  { name: 'Other',         color: '#6b7280' },
];

const Category = {
  findByUser: (userId) =>
    all('SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC', [userId]),

  findById: (id, userId) =>
    get('SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, userId]),

  create: async (userId, name, color = '#6366f1') => {
    const r = await run(
      'INSERT INTO categories (user_id, name, color, is_default) VALUES (?, ?, ?, ?)',
      [userId, name, color, 0]
    );
    return r.lastInsertRowid;
  },

  update: async (id, userId, name, color) =>
    (await run(
      'UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, color, id, userId]
    )).changes > 0,

  delete: async (id, userId) => {
    const { count } = await get('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?', [id]);
    if (count > 0) {
      throw Object.assign(new Error('Cannot delete category with existing expenses'), { status: 422 });
    }
    return (await run('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId])).changes > 0;
  },

  seedDefaults: async (userId) => {
    await batch(
      DEFAULT_CATEGORIES.map((cat) => ({
        sql: 'INSERT OR IGNORE INTO categories (user_id, name, color, is_default) VALUES (?, ?, ?, 1)',
        args: [userId, cat.name, cat.color],
      }))
    );
  },
};

export default Category;
