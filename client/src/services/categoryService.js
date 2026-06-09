import { api } from './api.js';

export const categoryService = {
  list:   ()           => api.get('/categories'),
  create: (data)       => api.post('/categories', data),
  update: (id, data)   => api.put(`/categories/${id}`, data),
  delete: (id)         => api.delete(`/categories/${id}`),
};
