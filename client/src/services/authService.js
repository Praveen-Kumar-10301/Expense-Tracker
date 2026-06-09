import { api } from './api.js';

export const authService = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  updateName: (name) =>
    api.put('/auth/name', { name }),

  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/password', { currentPassword, newPassword }),

  deleteAccount: () =>
    api.delete('/auth/account', { confirmation: 'DELETE' }),
};
