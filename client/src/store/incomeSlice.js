import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { incomeService } from '../services/incomeService.js';

export const fetchIncome = createAsyncThunk(
  'income/fetch',
  async (month, { rejectWithValue }) => {
    try {
      return await incomeService.get(month);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveIncome = createAsyncThunk(
  'income/save',
  async ({ month, amount }, { rejectWithValue }) => {
    try {
      return await incomeService.set(month, amount);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const incomeSlice = createSlice({
  name: 'income',
  initialState: {
    // amount in paise, keyed by "YYYY-MM"
    byMonth: {},
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncome.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncome.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.byMonth[payload.income.month] = payload.income.amount;
      })
      .addCase(fetchIncome.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(saveIncome.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveIncome.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.byMonth[payload.income.month] = payload.income.amount;
      })
      .addCase(saveIncome.rejected, (state, { payload }) => {
        state.saving = false;
        state.error = payload;
      });
  },
});

export default incomeSlice.reducer;
