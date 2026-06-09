import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Auth pages
const Login    = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));

// Main pages
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Expenses  = lazy(() => import('./pages/Expenses.jsx'));
const Budgets   = lazy(() => import('./pages/Budgets.jsx'));
const Settings  = lazy(() => import('./pages/Settings.jsx'));

const PageSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected layout routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets"  element={<Budgets />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
