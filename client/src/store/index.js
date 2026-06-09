import { configureStore } from '@reduxjs/toolkit';
import authReducer       from './authSlice.js';
import expensesReducer   from './expensesSlice.js';
import categoriesReducer from './categoriesSlice.js';
import budgetsReducer    from './budgetsSlice.js';
import incomeReducer     from './incomeSlice.js';

export const store = configureStore({
  reducer: {
    auth:       authReducer,
    expenses:   expensesReducer,
    categories: categoriesReducer,
    budgets:    budgetsReducer,
    income:     incomeReducer,
  },
});
