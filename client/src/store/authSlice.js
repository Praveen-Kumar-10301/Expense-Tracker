import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService.js';

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      return await authService.register(name, email, password);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

// Called on app boot to restore session from httpOnly cookie
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch {
      return rejectWithValue(null);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    initialized: false, // true after first fetchMe attempt completes
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Login
      .addCase(loginUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })
      // FetchMe (session restore)
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.isAuthenticated = false;
        state.initialized = true;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
