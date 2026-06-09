import { get, run, batch } from '../db/database.js';

const User = {
  findByEmail: (email) => get('SELECT * FROM users WHERE email = ?', [email]),

  findById: (id) => get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id]),

  create: async (email, passwordHash, name) => {
    const r = await run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name]
    );
    return r.lastInsertRowid;
  },

  updateName: async (id, name) =>
    (await run('UPDATE users SET name = ? WHERE id = ?', [name, id])).changes > 0,

  updatePassword: async (id, passwordHash) =>
    (await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id])).changes > 0,

  delete: async (id) => {
    // Remove child rows explicitly and atomically — FK cascade isn't guaranteed
    // on libSQL/Turso the way it is for a local SQLite file.
    await batch([
      { sql: 'DELETE FROM expenses WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM budgets WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM incomes WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM categories WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM users WHERE id = ?', args: [id] },
    ]);
    return true;
  },
};

export default User;
