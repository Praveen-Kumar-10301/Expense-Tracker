import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchExpenses } from '../store/expensesSlice.js';
import { fetchBudgets } from '../store/budgetsSlice.js';
import { fetchIncome } from '../store/incomeSlice.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, currentMonth, formatMonth } from '../utils/dates.js';
import { expenseService } from '../services/expenseService.js';
import CategoryPieChart from '../components/charts/CategoryPieChart.jsx';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart.jsx';

function prevMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { expenses, total, loading } = useSelector((s) => s.expenses);
  const { budgets } = useSelector((s) => s.budgets);
  const incomeByMonth = useSelector((s) => s.income.byMonth);

  const month = currentMonth();
  const income = incomeByMonth[month] ?? 0;

  const [summaryData, setSummaryData] = useState(null);
  const [trendData, setTrendData] = useState(null);

  useEffect(() => {
    const startOfMonth = `${month}-01`;
    dispatch(fetchExpenses({ startDate: startOfMonth, limit: 100 }));
    dispatch(fetchBudgets(month));
    dispatch(fetchIncome(month));
  }, [dispatch, month]);

  useEffect(() => {
    expenseService.summary(month).then((res) => setSummaryData(res.summary ?? []));
    expenseService.monthlyTotals().then((res) => setTrendData(res.totals ?? []));
  }, [month]);

  // Spend from the category summary is accurate for the whole month (the expenses
  // list above is capped at 100 rows); fall back to the list sum until it loads.
  const listTotal = expenses.reduce((sum, e) => sum + e.amount_paise, 0);
  const monthSpent = summaryData
    ? summaryData.reduce((sum, d) => sum + d.total_paise, 0)
    : listTotal;
  const saved = income - monthSpent;
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : null;
  const recentExpenses = expenses.slice(0, 5);
  const budgetedCategories = budgets.filter((b) => b.budgetAmount > 0);
  const onTrackCount = budgetedCategories.filter((b) => b.spentAmount <= b.budgetAmount).length;
  // Surface the categories with the most activity first, so the top-5 summary
  // shows where the money is actually going (not whichever rows SQL returned first).
  const topBudgets = [...budgetedCategories]
    .sort((a, b) => b.spentAmount - a.spentAmount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Income</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(income)}</p>
          {income > 0 ? (
            <p className="text-xs text-gray-400 mt-1">{formatMonth(month)}</p>
          ) : (
            <Link to="/budgets" className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block">
              Set income &rarr;
            </Link>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Spent this month</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(monthSpent)}</p>
          <p className="text-xs text-gray-400 mt-1">{total} transactions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{saved >= 0 ? 'Saved' : 'Overspent'}</p>
          <p className={`text-xl sm:text-2xl font-bold ${saved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(Math.abs(saved))}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {savingsRate === null ? 'Set income to track' : `${savingsRate}% of income`}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Budgets on track</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {onTrackCount} / {budgetedCategories.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent expenses</h2>
            <Link
              to="/expenses"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all &rarr;
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses this month.</p>
              <Link
                to="/expenses"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Add one &rarr;
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentExpenses.map((exp) => (
                <li key={exp.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: exp.category_color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {exp.category_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(exp.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                    {formatCurrency(exp.amount_paise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Budget progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Budget progress</h2>
            <Link
              to="/budgets"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage &rarr;
            </Link>
          </div>
          {budgetedCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No budgets set for {formatMonth(month)}.
              </p>
              <Link
                to="/budgets"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Set budgets &rarr;
              </Link>
            </div>
          ) : (
            <ul className="p-4 space-y-3">
              {topBudgets.map((b) => {
                const pct = Math.min((b.spentAmount / b.budgetAmount) * 100, 100);
                const isOver = b.spentAmount > b.budgetAmount;
                return (
                  <li key={b.categoryId}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{b.categoryName}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          isOver ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {formatCurrency(b.spentAmount)} / {formatCurrency(b.budgetAmount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-primary-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Spending by category — {formatMonth(month)}
          </h2>
          {summaryData === null ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : (
            <CategoryPieChart data={summaryData} />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly trend</h2>
          {trendData === null ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : (
            <MonthlyTrendChart data={trendData} />
          )}
        </div>
      </div>
    </div>
  );
}
