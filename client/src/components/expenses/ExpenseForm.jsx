import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { createExpense, updateExpense } from '../../store/expensesSlice.js';
import { toPaise } from '../../utils/currency.js';
import { today } from '../../utils/dates.js';

const schema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  amount: z.string().refine((v) => {
    const p = toPaise(v);
    return p !== null && p > 0;
  }, 'Enter a valid amount greater than 0'),
  date: z
    .string()
    .min(1, 'Select a date')
    .refine((v) => v <= today(), 'Date cannot be in the future'),
});

const inputClass =
  'w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition';

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msg}</p>;
}

export default function ExpenseForm({ expense, categories, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEdit = Boolean(expense);

  const [categoryId, setCategoryId] = useState(expense?.category_id?.toString() ?? '');
  const [amount, setAmount] = useState(expense ? (expense.amount_paise / 100).toFixed(2) : '');
  const [date, setDate] = useState(expense?.date ?? today());
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const parsed = schema.safeParse({ categoryId, amount, date });
    if (!parsed.success) {
      const errs = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0]] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const data = { categoryId: parseInt(categoryId, 10), amount: toPaise(amount), date, notes };

    const result = isEdit
      ? await dispatch(updateExpense({ id: expense.id, data }))
      : await dispatch(createExpense(data));

    setLoading(false);

    if (result.meta.requestStatus === 'fulfilled') {
      onSuccess(isEdit ? 'updated' : 'created');
    } else {
      setServerError(result.payload || 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div role="alert" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setFieldErrors((p) => ({ ...p, categoryId: '' })); }}
          className={`${inputClass} ${fieldErrors.categoryId ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <FieldError msg={fieldErrors.categoryId} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Amount (&#8377;)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setFieldErrors((p) => ({ ...p, amount: '' })); }}
          className={`${inputClass} ${fieldErrors.amount ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          placeholder="0.00"
        />
        <FieldError msg={fieldErrors.amount} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setFieldErrors((p) => ({ ...p, date: '' })); }}
          max={today()}
          className={`${inputClass} ${fieldErrors.date ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        <FieldError msg={fieldErrors.date} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} border-gray-300 dark:border-gray-600`}
          placeholder="What was this for?"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Saving\u2026' : (isEdit ? 'Update' : 'Add expense')}
        </button>
      </div>
    </form>
  );
}
