import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBudgets, upsertBudget, deleteBudget } from '../store/budgetsSlice.js';
import { fetchCategories } from '../store/categoriesSlice.js';
import { fetchIncome, saveIncome } from '../store/incomeSlice.js';
import { formatCurrency, toPaise } from '../utils/currency.js';
import { currentMonth, formatMonth } from '../utils/dates.js';
import { useToastContext } from '../context/ToastContext.js';
import BudgetBarChart from '../components/charts/BudgetBarChart.jsx';

export default function Budgets() {
  const dispatch = useDispatch();
  const toast = useToastContext();
  const { budgets, loading } = useSelector((s) => s.budgets);
  const { categories } = useSelector((s) => s.categories);
  const incomeByMonth = useSelector((s) => s.income.byMonth);
  const incomeSaving = useSelector((s) => s.income.saving);

  const [month, setMonth] = useState(currentMonth());
  // Local state: categoryId (number) → INR amount string
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);
  // Income (INR string) for the selected month
  const [incomeInput, setIncomeInput] = useState('');

  const incomePaise = incomeByMonth[month] ?? 0;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBudgets(month));
    dispatch(fetchIncome(month));
  }, [dispatch, month]);

  // Sync the income input whenever the stored value for this month changes.
  useEffect(() => {
    setIncomeInput(incomePaise > 0 ? (incomePaise / 100).toFixed(2) : '');
  }, [incomePaise, month]);

  async function handleSaveIncome() {
    const trimmed = incomeInput.trim();
    const amountPaise = trimmed === '' ? 0 : Math.round(parseFloat(trimmed) * 100);
    if (Number.isNaN(amountPaise) || amountPaise < 0) {
      toast({ message: 'Enter a valid income amount', type: 'error' });
      return;
    }
    const result = await dispatch(saveIncome({ month, amount: amountPaise }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast({ message: 'Income saved', type: 'success' });
    } else {
      toast({ message: 'Failed to save income', type: 'error' });
    }
  }

  // Pre-fill inputs from fetched budgets
  useEffect(() => {
    const vals = {};
    budgets.forEach((b) => {
      vals[b.categoryId] = (b.budgetAmount / 100).toFixed(2);
    });
    setInputs(vals);
  }, [budgets]);

  async function saveBudget(categoryId) {
    const inrStr = inputs[categoryId];
    const amountPaise = toPaise(inrStr || '0');
    if (!amountPaise || amountPaise <= 0) {
      toast({ message: 'Enter a valid budget amount', type: 'error' });
      return;
    }
    setSaving(true);
    const result = await dispatch(upsertBudget({ categoryId, amount: amountPaise, month }));
    setSaving(false);
    if (result.meta.requestStatus === 'fulfilled') {
      toast({ message: 'Budget saved', type: 'success' });
    } else {
      toast({ message: 'Failed to save budget', type: 'error' });
    }
  }

  async function removeBudget(categoryId) {
    if (!window.confirm('Remove this budget?')) return;
    const result = await dispatch(deleteBudget({ categoryId, month }));
    if (result.meta.requestStatus === 'fulfilled') {
      setInputs((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
      toast({ message: 'Budget removed', type: 'success' });
    } else {
      toast({ message: 'Failed to remove budget', type: 'error' });
    }
  }

  const budgetMap = Object.fromEntries(budgets.map((b) => [b.categoryId, b]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Budgets for{' '}
        <strong className="text-gray-700 dark:text-gray-300">{formatMonth(month)}</strong>
      </p>

      {/* Monthly income */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">Monthly income</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Income for {formatMonth(month)}
            </p>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-44">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8377;</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Set income…"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleSaveIncome}
              disabled={incomeSaving}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((cat) => {
            const budget = budgetMap[cat.id];
            const spent = budget?.spentAmount ?? 0;
            const budgetAmt = budget?.budgetAmount ?? 0;
            const percent = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;
            const isOver = Boolean(budget && spent > budgetAmt);

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white truncate">{cat.name}</span>
                    {budget && budget.effectiveMonth && budget.effectiveMonth !== month && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        · since {formatMonth(budget.effectiveMonth)}
                      </span>
                    )}
                  </div>
                  {isOver && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                      Over by {formatCurrency(spent - budgetAmt)}
                    </span>
                  )}
                </div>

                {/* Progress bar — only shown when a budget is set */}
                {budget && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Spent: {formatCurrency(spent)}</span>
                      <span>Budget: {formatCurrency(budgetAmt)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-primary-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Budget input + actions */}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      &#8377;
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Set budget\u2026"
                      value={inputs[cat.id] ?? ''}
                      onChange={(e) =>
                        setInputs((p) => ({ ...p, [cat.id]: e.target.value }))
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => saveBudget(cat.id)}
                    disabled={saving}
                    aria-label={`Save budget for ${cat.name}`}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  {budget && (
                    <button
                      onClick={() => removeBudget(cat.id)}
                      aria-label={`Remove budget for ${cat.name}`}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">No categories found.</p>
            </div>
          )}
        </div>
      )}

      {/* Budget vs Actual chart */}
      {!loading && budgets.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Budget vs Actual — {formatMonth(month)}
          </h2>
          <BudgetBarChart budgets={budgets} />
        </div>
      )}
    </div>
  );
}
