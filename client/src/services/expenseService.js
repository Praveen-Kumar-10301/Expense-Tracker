import { api } from './api.js';

export const expenseService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return api.get(`/expenses${qs ? `?${qs}` : ''}`);
  },

  create: (data) => api.post('/expenses', data),

  update: (id, data) => api.put(`/expenses/${id}`, data),

  delete: (id) => api.delete(`/expenses/${id}`),

  summary: (month) => api.get(`/expenses/summary?month=${month}`),

  monthlyTotals: () => api.get('/expenses/monthly-totals'),

  downloadCsv: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    const res = await fetch(`/api/v1/expenses/export${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
