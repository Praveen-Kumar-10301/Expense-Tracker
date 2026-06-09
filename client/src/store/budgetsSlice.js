import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { budgetService } from '../services/budgetService.js';

export const fetchBudgets = createAsyncThunk(
  'budgets/fetch',
  async (month, { rejectWithValue }) => {
    try {
      return await budgetService.list(month);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const upsertBudget = createAsyncThunk(
  'budgets/upsert',
  async ({ categoryId, amount, month }, { rejectWithValue }) => {
    try {
      return await budgetService.upsert(categoryId, { amount, month });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'budgets/delete',
  async ({ categoryId, month }, { rejectWithValue }) => {
    try {
      await budgetService.delete(categoryId, month);
      return categoryId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState: {
    budgets: [],
    month: '',
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.budgets = payload.budgets;
        state.month = payload.month;
      })
      .addCase(fetchBudgets.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(upsertBudget.fulfilled, (state, { payload }) => {
        const idx = state.budgets.findIndex((b) => b.categoryId === payload.budget.categoryId);
        if (idx !== -1) {
          state.budgets[idx] = payload.budget;
        } else {
          state.budgets.push(payload.budget);
        }
      })
      .addCase(deleteBudget.fulfilled, (state, { payload: categoryId }) => {
        state.budgets = state.budgets.filter((b) => b.categoryId !== categoryId);
      });
  },
});

export default budgetsSlice.reducer;
