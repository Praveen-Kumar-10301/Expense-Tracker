import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseService } from '../services/expenseService.js';

export const fetchExpenses = createAsyncThunk(
  'expenses/fetch',
  async (params, { rejectWithValue }) => {
    try {
      return await expenseService.list(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (data, { rejectWithValue }) => {
    try {
      return await expenseService.create(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await expenseService.update(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async (id, { rejectWithValue }) => {
    try {
      await expenseService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    monthTotals: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.expenses = payload.expenses;
        state.monthTotals = payload.monthTotals ?? [];
        state.total = payload.total;
        state.page = payload.page;
        state.totalPages = payload.totalPages;
      })
      .addCase(fetchExpenses.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(createExpense.fulfilled, (state, { payload }) => {
        state.expenses.unshift(payload.expense);
        state.total += 1;
      })
      .addCase(updateExpense.fulfilled, (state, { payload }) => {
        const idx = state.expenses.findIndex((e) => e.id === payload.expense.id);
        if (idx !== -1) state.expenses[idx] = payload.expense;
      })
      .addCase(deleteExpense.fulfilled, (state, { payload: id }) => {
        state.expenses = state.expenses.filter((e) => e.id !== id);
        state.total -= 1;
      });
  },
});

export default expensesSlice.reducer;
