import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../../store/authSlice.js';

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchMe());
    }
  }, [initialized, dispatch]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
