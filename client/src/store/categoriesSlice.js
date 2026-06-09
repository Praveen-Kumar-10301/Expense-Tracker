import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoryService } from '../services/categoryService.js';

export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.list();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data, { rejectWithValue }) => {
    try {
      return await categoryService.create(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await categoryService.update(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await categoryService.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.categories = payload.categories;
      })
      .addCase(fetchCategories.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(createCategory.fulfilled, (state, { payload }) => {
        state.categories.push(payload.category);
      })
      .addCase(updateCategory.fulfilled, (state, { payload }) => {
        const idx = state.categories.findIndex((c) => c.id === payload.category.id);
        if (idx !== -1) state.categories[idx] = payload.category;
      })
      .addCase(deleteCategory.fulfilled, (state, { payload: id }) => {
        state.categories = state.categories.filter((c) => c.id !== id);
      });
  },
});

export default categoriesSlice.reducer;
