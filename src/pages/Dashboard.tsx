import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Users, Clock, ClipboardList, CalendarDays } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

interface DashboardEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  department?: string | null;
}

interface DashboardActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  employee?: DashboardEmployee | null;
}

interface DashboardSummary {
  total_employees: number;
  active_employees: number;
  present_today: number;
  attendance_rate_today: number;
  pending_leave_requests: number;
  on_leave_today: number;
  recent_activity: DashboardActivity[];
}

const initials = (employee?: DashboardEmployee | null) => {
  if (!employee) return 'NA';
  const a = (employee.first_name || '').trim().slice(0, 1).toUpperCase();
  const b = (employee.last_name || '').trim().slice(0, 1).toUpperCase();
  return `${a || 'N'}${b || 'A'}`;
};

const timeAgo = (iso: string) => {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  const stats = useMemo(() => {
    const s = summary;
    const total = s?.total_employees ?? 0;
    const present = s?.present_today ?? 0;
    const pendingLeaves = s?.pending_leave_requests ?? 0;
    const onLeave = s?.on_leave_today ?? 0;
    const rate = s?.attendance_rate_today ?? 0;
    const active = s?.active_employees ?? 0;

    return [
      { label: 'Total Employees', value: String(total), icon: Users, color: 'bg-blue-500', trend: `${active} active` },
      { label: 'Present Today', value: String(present), icon: Clock, color: 'bg-green-500', trend: `${rate.toFixed(0)}% attendance` },
      { label: 'Pending Leaves', value: String(pendingLeaves), icon: ClipboardList, color: 'bg-purple-500', trend: `${onLeave} on leave today` },
      { label: 'Attendance Rate', value: `${rate.toFixed(1)}%`, icon: CalendarDays, color: 'bg-orange-500', trend: 'Today' },
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading activity...</div>
            ) : !summary || summary.recent_activity.length === 0 ? (
              <div className="text-sm text-gray-500">No recent activity yet.</div>
            ) : (
              summary.recent_activity.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                    {initials(a.employee)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.message}</p>
                    <p className="text-xs text-gray-400">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/employees')} className="p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group">
              <Users className="h-6 w-6 text-gray-400 group-hover:text-purple-600 mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-purple-700">Add Employee</p>
            </button>
            <button onClick={() => navigate('/attendance/admin')} className="p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Clock className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-blue-700">View Attendance</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
