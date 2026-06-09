import Budget from '../models/Budget.js';

function mapBudget(row, month) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    color: row.color,
    budgetAmount: row.budget_paise,
    spentAmount: row.spent_paise,
    percentUsed: row.budget_paise > 0
      ? Math.round((row.spent_paise / row.budget_paise) * 100)
      : 0,
    effectiveMonth: row.effective_month,
    month,
  };
}

export async function listBudgets(req, res) {
  const { userId } = req.user;
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month query param required (YYYY-MM)', code: 422 });
  }

  const rows = await Budget.findActiveByUserAndMonth(userId, month);
  // Drop tombstones: a 0-amount active row means the budget was removed from this month.
  const budgets = rows
    .filter((row) => row.budget_paise > 0)
    .map((row) => mapBudget(row, month));

  res.json({ budgets, month });
}

export async function upsertBudget(req, res) {
  const { userId } = req.user;
  const categoryId = parseInt(req.params.categoryId, 10);
  const { amount, month } = req.body ?? {};

  if (!amount || !month) {
    return res.status(422).json({ error: 'amount and month are required', code: 422 });
  }
  const amountPaise = parseInt(amount, 10);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return res.status(422).json({ error: 'amount must be a positive integer (in paise)', code: 422 });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month must be in YYYY-MM format', code: 422 });
  }

  // Write a budget effective from the month the user is viewing.
  await Budget.upsert(userId, categoryId, amountPaise, month);

  const rows = await Budget.findActiveByUserAndMonth(userId, month);
  const row = rows.find((r) => r.category_id === categoryId);
  if (!row) {
    return res.status(404).json({ error: 'Budget not found after upsert', code: 404 });
  }

  res.json({ budget: mapBudget(row, month) });
}

export async function deleteBudget(req, res) {
  const { userId } = req.user;
  const categoryId = parseInt(req.params.categoryId, 10);
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month query param required (YYYY-MM)', code: 422 });
  }

  // Tombstone from this month forward — earlier months keep their budget.
  await Budget.upsert(userId, categoryId, 0, month);
  res.json({ message: 'Budget removed' });
}
