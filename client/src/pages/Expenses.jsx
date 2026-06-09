import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses, deleteExpense } from '../store/expensesSlice.js';
import { fetchCategories } from '../store/categoriesSlice.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, formatMonth } from '../utils/dates.js';
import { useToastContext } from '../context/ToastContext.js';
import Modal from '../components/ui/Modal.jsx';
import ExpenseForm from '../components/expenses/ExpenseForm.jsx';
import { expenseService } from '../services/expenseService.js';

export default function Expenses() {
  const dispatch = useDispatch();
  const toast = useToastContext();
  const { expenses, monthTotals, total, totalPages, loading } = useSelector((s) => s.expenses);
  const { categories } = useSelector((s) => s.categories);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', categoryId: '', startDate: '', endDate: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchExpenses({ ...filters, page }));
  }, [dispatch, filters, page]);

  // True per-month totals for the whole filtered set (from the API), keyed by YYYY-MM.
  const monthTotalsMap = useMemo(
    () => Object.fromEntries((monthTotals ?? []).map((m) => [m.month, m])),
    [monthTotals]
  );

  // Group the current page's expenses into contiguous month sections.
  // The list is ordered by date DESC, so each month forms a single run.
  const groups = useMemo(() => {
    const out = [];
    let current = null;
    for (const exp of expenses) {
      const month = exp.date.slice(0, 7);
      if (!current || current.month !== month) {
        current = { month, items: [] };
        out.push(current);
      }
      current.items.push(exp);
    }
    return out;
  }, [expenses]);

  function handleFilterChange(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    const result = await dispatch(deleteExpense(id));
    if (result.meta.requestStatus === 'fulfilled') {
      toast({ message: 'Expense deleted', type: 'success' });
    } else {
      toast({ message: 'Failed to delete expense', type: 'error' });
    }
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  function openAdd() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      await expenseService.downloadCsv(filters);
    } catch {
      toast({ message: 'Failed to export CSV', type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  function handleFormSuccess(action) {
    toast({ message: action === 'created' ? 'Expense added' : 'Expense updated', type: 'success' });
    setModalOpen(false);
    dispatch(fetchExpenses({ ...filters, page }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            aria-label="Export expenses as CSV"
            className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={openAdd}
            className="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add expense
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search notes…"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="flex-1 min-w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filters.categoryId}
          onChange={(e) => handleFilterChange('categoryId', e.target.value)}
          className="flex-1 sm:flex-none min-w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Start date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className="flex-1 sm:flex-none min-w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="date"
          aria-label="End date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className="flex-1 sm:flex-none min-w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Expense list, grouped by month */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No expenses found.</p>
            <button
              onClick={openAdd}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Add your first expense &rarr;
            </button>
          </div>
        ) : (
          groups.map((group) => {
            const summary = monthTotalsMap[group.month];
            return (
              <section key={group.month}>
                {/* Month heading with total */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/40 border-y border-gray-100 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {formatMonth(group.month)}
                  </h2>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(summary ? summary.total_paise : group.items.reduce((s, e) => s + e.amount_paise, 0))}
                    {summary ? (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {summary.count} {summary.count === 1 ? 'txn' : 'txns'}
                      </span>
                    ) : null}
                  </span>
                </div>

                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {group.items.map((exp) => (
                    <li
                      key={exp.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: exp.category_color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {exp.category_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {formatDate(exp.date)}
                            {exp.notes ? ` · ${exp.notes}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(exp.amount_paise)}
                        </span>
                        <button
                          onClick={() => openEdit(exp)}
                          aria-label={`Edit expense from ${exp.category_name}`}
                          className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          aria-label={`Delete expense from ${exp.category_name}`}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{total} total</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                &larr; Prev
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Edit expense' : 'Add expense'}
      >
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
