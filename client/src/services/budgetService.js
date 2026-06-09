import { api } from './api.js';

export const budgetService = {
  list:   (month)              => api.get(`/budgets?month=${month}`),
  upsert: (categoryId, data)   => api.put(`/budgets/${categoryId}`, data),
  delete: (categoryId, month)  => api.delete(`/budgets/${categoryId}?month=${month}`),
};
