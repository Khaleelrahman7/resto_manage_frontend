import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import Attendance from './pages/Attendance';
import AttendanceAdmin from './pages/AttendanceAdmin';
import AttendanceInfo from './pages/AttendanceInfo';
import LeaveApply from './pages/LeaveApply';
import LeaveBalance from './pages/LeaveBalance';
import LeaveHistory from './pages/LeaveHistory';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleProtectedRoute: React.FC<{ children: React.ReactElement; allowed: string[]; fallback: string }> = ({ children, allowed, fallback }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
};

const HomeRedirect: React.FC = () => {
  const { user, employeeProfile, employeeProfileLoading } = useSelector((state: RootState) => state.auth);
  if (employeeProfileLoading) return null;
  if (user?.role === 'staff' && employeeProfile) return <Navigate to="/attendance" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="dashboard"
          element={
            <RoleProtectedRoute allowed={['super_admin', 'admin', 'manager']} fallback="/attendance">
              <Dashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <RoleProtectedRoute allowed={['super_admin', 'admin', 'manager']} fallback="/attendance">
              <EmployeeList />
            </RoleProtectedRoute>
          }
        />
        <Route path="attendance" element={<Attendance />} />
        <Route
          path="attendance/admin"
          element={
            <RoleProtectedRoute allowed={['super_admin', 'admin', 'manager']} fallback="/attendance">
              <AttendanceAdmin />
            </RoleProtectedRoute>
          }
        />
        <Route path="attendance/info" element={<AttendanceInfo />} />
        <Route path="leave/apply" element={<LeaveApply />} />
        <Route path="leave/balance" element={<LeaveBalance />} />
        <Route path="leave/history" element={<LeaveHistory />} />
        {/* Placeholder for other routes */}
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
