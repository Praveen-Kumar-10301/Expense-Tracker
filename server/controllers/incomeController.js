import Income from '../models/Income.js';

export async function getIncome(req, res) {
  const { userId } = req.user;
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month query param required (YYYY-MM)', code: 422 });
  }

  const row = await Income.findByUserAndMonth(userId, month);
  res.json({ income: { month, amount: row?.amount_paise ?? 0 } });
}

export async function setIncome(req, res) {
  const { userId } = req.user;
  const { month, amount } = req.body ?? {};

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(422).json({ error: 'month must be in YYYY-MM format', code: 422 });
  }
  const amountPaise = parseInt(amount, 10);
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    return res.status(422).json({ error: 'amount must be a non-negative integer (in paise)', code: 422 });
  }

  await Income.upsert(userId, amountPaise, month);
  res.json({ income: { month, amount: amountPaise } });
}
