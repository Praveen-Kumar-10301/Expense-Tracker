import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/authSlice.js';
import { useTheme } from '../../hooks/useTheme.js';

const LINKS = [
  { to: '/',         label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/budgets',  label: 'Budgets' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { isDark, toggle } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <span className="text-lg font-bold text-gray-900 dark:text-white">Expense Tracker</span>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User name */}
          <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">{user?.name}</span>

          {/* Sign out */}
          <button
            onClick={() => dispatch(logoutUser())}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-gray-200 dark:border-gray-700">
        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              pathname === to
                ? 'text-primary-600 dark:text-primary-400 border-t-2 border-primary-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
