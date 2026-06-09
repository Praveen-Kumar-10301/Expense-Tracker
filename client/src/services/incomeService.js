import { api } from './api.js';

export const incomeService = {
  get: (month)         => api.get(`/income?month=${month}`),
  set: (month, amount) => api.put('/income', { month, amount }),
};
