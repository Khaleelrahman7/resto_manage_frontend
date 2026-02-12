import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
  email: string;
  role: string;
  is_active: boolean;
}

interface EmployeeProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  employeeProfile: EmployeeProfile | null;
  employeeProfileLoading: boolean;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  employeeProfile: null,
  employeeProfileLoading: false,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.detail || 'Login failed');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as any).auth.token;
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.detail);
    }
  }
);

export const fetchEmployeeProfile = createAsyncThunk(
  'auth/fetchEmployeeProfile',
  async (_, { getState }) => {
    const token = (getState() as any).auth.token;
    try {
      const response = await axios.get(`${API_URL}/employees/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.user = null;
      state.employeeProfile = null;
      state.employeeProfileLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.employeeProfile = null;
        state.employeeProfileLoading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.employeeProfileLoading = true;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action: PayloadAction<EmployeeProfile | null>) => {
        state.employeeProfileLoading = false;
        state.employeeProfile = action.payload;
      })
      .addCase(fetchEmployeeProfile.rejected, (state) => {
        state.employeeProfileLoading = false;
        state.employeeProfile = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
