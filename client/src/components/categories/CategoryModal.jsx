import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createCategory, updateCategory } from '../../store/categoriesSlice.js';
import { useToastContext } from '../../context/ToastContext.js';

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#ef4444', '#a855f7',
  '#22c55e', '#ec4899', '#eab308', '#6b7280',
  '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6',
];

export default function CategoryModal({ category, onSuccess, onClose }) {
  const dispatch = useDispatch();
  const toast = useToastContext();
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#6366f1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }

    setLoading(true);
    const result = isEdit
      ? await dispatch(updateCategory({ id: category.id, data: { name: name.trim(), color } }))
      : await dispatch(createCategory({ name: name.trim(), color }));
    setLoading(false);

    if (result.meta.requestStatus === 'fulfilled') {
      toast({ message: isEdit ? 'Category updated' : 'Category created', type: 'success' });
      onSuccess();
    } else {
      setError(result.payload || 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          placeholder="e.g. Investment"
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Color
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom color picker"
            className="h-9 w-14 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{color}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Saving\u2026' : (isEdit ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}
