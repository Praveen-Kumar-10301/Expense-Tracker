import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMe, logoutUser } from '../store/authSlice.js';
import { fetchCategories, deleteCategory } from '../store/categoriesSlice.js';
import { authService } from '../services/authService.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToastContext } from '../context/ToastContext.js';
import Modal from '../components/ui/Modal.jsx';
import CategoryModal from '../components/categories/CategoryModal.jsx';

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToastContext();
  const { user } = useSelector((s) => s.auth);
  const { categories } = useSelector((s) => s.categories);
  const { isDark, toggle } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // null = closed, { mode: 'add' } or { mode: 'edit', category }
  const [catModal, setCatModal] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  async function handleNameSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      await authService.updateName(name.trim());
      await dispatch(fetchMe());
      toast({ message: 'Name updated', type: 'success' });
    } catch (err) {
      toast({ message: err.message || 'Failed to update name', type: 'error' });
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(currentPw, newPw);
      toast({ message: 'Password changed. Please log in again.', type: 'success' });
      await dispatch(logoutUser());
      navigate('/login', { replace: true });
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      toast({ message: 'Account deleted', type: 'info' });
      navigate('/register', { replace: true });
    } catch (err) {
      toast({ message: err.message || 'Failed to delete account', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteCategory(id, name) {
    if (!window.confirm(`Delete "${name}"? This will fail if expenses use this category.`)) return;
    const result = await dispatch(deleteCategory(id));
    if (result.meta.requestStatus === 'fulfilled') {
      toast({ message: 'Category deleted', type: 'success' });
    } else {
      toast({ message: result.payload || 'Cannot delete: expenses reference this category', type: 'error' });
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Display name */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Display name</h2>
        <form onSubmit={handleNameSave} className="space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={nameLoading || !name.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
          >
            {nameLoading ? 'Saving\u2026' : 'Save name'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Currently {isDark ? 'on' : 'off'}</p>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isDark ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
          <button
            onClick={() => setCatModal({ mode: 'add' })}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                {cat.is_default ? <span className="text-xs text-gray-400 flex-shrink-0">(default)</span> : null}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setCatModal({ mode: 'edit', category: cat })}
                  aria-label={`Edit ${cat.name}`}
                  className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                >
                  Edit
                </button>
                {!cat.is_default && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    aria-label={`Delete ${cat.name}`}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwError && (
            <div role="alert" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {pwError}
            </div>
          )}
          <div>
            <label className={labelClass}>Current password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>New password <span className="text-gray-400 font-normal">(min. 8 chars)</span></label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
          >
            {pwLoading ? 'Changing\u2026' : 'Change password'}
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Delete account</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will permanently delete your account, all expenses, categories, and budgets. This cannot be undone.
        </p>
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div>
            <label className={labelClass}>Type <strong>DELETE</strong> to confirm</label>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" required className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={deleteLoading || deleteConfirm !== 'DELETE'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {deleteLoading ? 'Deleting\u2026' : 'Delete my account'}
          </button>
        </form>
      </div>

      {/* Category modal */}
      {catModal && (
        <Modal
          isOpen
          onClose={() => setCatModal(null)}
          title={catModal.mode === 'add' ? 'Add category' : 'Edit category'}
        >
          <CategoryModal
            category={catModal.category}
            onSuccess={() => setCatModal(null)}
            onClose={() => setCatModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
