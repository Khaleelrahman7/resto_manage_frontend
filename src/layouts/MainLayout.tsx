import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, fetchUser, fetchEmployeeProfile } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store/store';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  ClipboardList,
  History,
  LogOut, 
  Menu, 
  X, 
  ChefHat 
} from 'lucide-react';
import clsx from 'clsx';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, employeeProfile, employeeProfileLoading } = useSelector((state: RootState) => state.auth);
  const [openSections, setOpenSections] = useState<{ attendance: boolean; leave: boolean }>({
    attendance: true,
    leave: true,
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUser()).then(() => {
        dispatch(fetchEmployeeProfile());
      });
      return;
    }
    if (token && user?.role === 'staff' && employeeProfile === null && !employeeProfileLoading) {
      dispatch(fetchEmployeeProfile());
    }
  }, [dispatch, token, user, employeeProfile, employeeProfileLoading]);

  const isEmployeePortalUser = useMemo(() => user?.role === 'staff' && !!employeeProfile, [user?.role, employeeProfile]);
  const canManageEmployees = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager';

  const toggleSection = (key: 'attendance' | 'leave') => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="p-2 bg-purple-600 rounded-lg">
              <ChefHat className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">RestoManage</span>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {!isEmployeePortalUser && (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    location.pathname === '/dashboard'
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </button>

                {canManageEmployees && (
                  <button
                    onClick={() => navigate('/employees')}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      location.pathname === '/employees'
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Employees</span>
                  </button>
                )}

                <button
                  onClick={() => navigate('/attendance/admin')}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    location.pathname.startsWith('/attendance')
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Attendance</span>
                </button>
              </>
            )}

            {isEmployeePortalUser && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('attendance')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-purple-300" />
                      <span className="font-semibold">Attendance</span>
                    </div>
                    {openSections.attendance ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>

                  {openSections.attendance && (
                    <div className="ml-2 pl-3 border-l border-slate-800 space-y-1">
                      <button
                        onClick={() => navigate('/attendance')}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                          location.pathname === '/attendance'
                            ? "bg-purple-600/20 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span className="text-sm font-medium">Punch In / Out</span>
                      </button>
                      <button
                        onClick={() => navigate('/attendance/info')}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                          location.pathname === '/attendance/info'
                            ? "bg-purple-600/20 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-sm font-medium">Attendance Info</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('leave')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-300" />
                      <span className="font-semibold">Leave</span>
                    </div>
                    {openSections.leave ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>

                  {openSections.leave && (
                    <div className="ml-2 pl-3 border-l border-slate-800 space-y-1">
                      <button
                        onClick={() => navigate('/leave/apply')}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                          location.pathname === '/leave/apply'
                            ? "bg-blue-600/20 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Leave Apply</span>
                      </button>
                      <button
                        onClick={() => navigate('/leave/balance')}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                          location.pathname === '/leave/balance'
                            ? "bg-blue-600/20 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span className="text-sm font-medium">Leave Balance</span>
                      </button>
                      <button
                        onClick={() => navigate('/leave/history')}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                          location.pathname === '/leave/history'
                            ? "bg-blue-600/20 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <History className="h-4 w-4" />
                        <span className="text-sm font-medium">Leave History</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <span className="font-bold text-gray-800">RestoManage</span>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
