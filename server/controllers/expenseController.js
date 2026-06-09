import Expense from '../models/Expense.js';

export async function listExpenses(req, res) {
  const { userId } = req.user;
  const { startDate, endDate, categoryId, search, page = 1, limit = 20 } = req.query;
  // minAmount and maxAmount from query are strings — convert to int if present
  const minAmount = req.query.minAmount ? parseInt(req.query.minAmount, 10) : undefined;
  const maxAmount = req.query.maxAmount ? parseInt(req.query.maxAmount, 10) : undefined;

  const result = await Expense.findByUser(userId, {
    startDate, endDate,
    categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    search, minAmount, maxAmount,
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 100),
  });

  res.json({
    expenses: result.rows,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit),
    monthTotals: result.monthTotals,
  });
}

export async function createExpense(req, res) {
  const { userId } = req.user;
  const { categoryId, amount, date, notes } = req.body ?? {};

  if (!categoryId || !amount || !date) {
    return res.status(422).json({ error: 'categoryId, amount, and date are required', code: 422 });
  }
  const amountPaise = parseInt(amount, 10);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return res.status(422).json({ error: 'amount must be a positive integer (in paise)', code: 422 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(422).json({ error: 'date must be in YYYY-MM-DD format', code: 422 });
  }

  const id = await Expense.create(userId, { categoryId: parseInt(categoryId, 10), amountPaise, date, notes: notes || '' });
  const expense = await Expense.findById(id, userId);
  res.status(201).json({ expense });
}

export async function updateExpense(req, res) {
  const { userId } = req.user;
  const id = parseInt(req.params.id, 10);
  const { categoryId, amount, date, notes } = req.body ?? {};

  if (!categoryId || !amount || !date) {
    return res.status(422).json({ error: 'categoryId, amount, and date are required', code: 422 });
  }
  const amountPaise = parseInt(amount, 10);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return res.status(422).json({ error: 'amount must be a positive integer (in paise)', code: 422 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(422).json({ error: 'date must be in YYYY-MM-DD format', code: 422 });
  }

  const existing = await Expense.findById(id, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found', code: 404 });
  }

  await Expense.update(id, userId, { categoryId: parseInt(categoryId, 10), amountPaise, date, notes: notes ?? existing.notes });
  const expense = await Expense.findById(id, userId);
  res.json({ expense });
}

export async function deleteExpense(req, res) {
  const { userId } = req.user;
  const id = parseInt(req.params.id, 10);

  const existing = await Expense.findById(id, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found', code: 404 });
  }

  await Expense.delete(id, userId);
  res.json({ message: 'Expense deleted' });
}

export async function getExpenseSummary(req, res) {
  const { userId } = req.user;
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month query param required (YYYY-MM)', code: 422 });
  }

  const summary = await Expense.summaryByCategory(userId, month);
  res.json({ summary, month });
}

export async function getMonthlyTotals(req, res) {
  const { userId } = req.user;
  const totals = await Expense.monthlyTotals(userId, 6);
  res.json({ totals });
}

export async function exportExpenses(req, res) {
  const { userId } = req.user;
  const { startDate, endDate, categoryId, search } = req.query;
  const minAmount = req.query.minAmount ? parseInt(req.query.minAmount, 10) : undefined;
  const maxAmount = req.query.maxAmount ? parseInt(req.query.maxAmount, 10) : undefined;

  const result = await Expense.findByUser(userId, {
    startDate, endDate,
    categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
    search, minAmount, maxAmount,
    page: 1,
    limit: 10000,
  });

  function csvField(value) {
    if (value == null || value === '') return '';
    const s = String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="expenses-${dateStr}.csv"`);

  const lines = ['Date,Category,Amount (\u20b9),Notes'];
  for (const exp of result.rows) {
    const amount = (exp.amount_paise / 100).toFixed(2);
    lines.push([csvField(exp.date), csvField(exp.category_name), amount, csvField(exp.notes)].join(','));
  }
  // UTF-8 BOM so Excel opens the file with correct encoding
  res.send('\uFEFF' + lines.join('\r\n'));
}
