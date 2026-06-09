import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import ToastContainer from '../ui/ToastContainer.jsx';
import { useToast } from '../../hooks/useToast.js';
import { ToastContext } from '../../context/ToastContext.js';

export default function AppLayout() {
  const { toasts, toast } = useToast();

  return (
    <ToastContext.Provider value={toast}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </main>
        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  );
}
