import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, CheckCircle, Clock, RefreshCcw, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  punch_in: string;
  punch_out: string | null;
  status: string;
}

const msToHhMm = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [now, setNow] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const [todayRes, monthRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/me/today`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/attendance/me`, { params: { month: monthKey }, headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setTodayRecord(todayRes.data || null);
      setMonthRecords(monthRes.data || []);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') {
      navigate('/attendance/admin', { replace: true });
      return;
    }
    refresh();
    const poll = setInterval(() => {
      axios
        .get(`${API_URL}/attendance/me/today`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => setTodayRecord(r.data || null))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(poll);
  }, [token, monthKey, user?.role, navigate]);

  const handlePunchIn = async () => {
    if (!window.confirm('Confirm Punch In?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/attendance/punch-in`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to punch in');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!window.confirm('Confirm Punch Out?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/attendance/punch-out`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await refresh();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to punch out');
    } finally {
      setActionLoading(false);
    }
  };

  const workedMsToday = useMemo(() => {
    if (!todayRecord) return 0;
    const inTime = new Date(todayRecord.punch_in).getTime();
    const outTime = todayRecord.punch_out ? new Date(todayRecord.punch_out).getTime() : now.getTime();
    return Math.max(0, outTime - inTime);
  }, [todayRecord, now]);

  const monthStats = useMemo(() => {
    let totalMs = 0;
    let presentDays = 0;
    for (const r of monthRecords) {
      if (!r.punch_in) continue;
      presentDays += 1;
      const inTime = new Date(r.punch_in).getTime();
      const outTime = r.punch_out ? new Date(r.punch_out).getTime() : inTime;
      totalMs += Math.max(0, outTime - inTime);
    }
    const avg = presentDays ? totalMs / presentDays : 0;
    return { presentDays, totalMs, avgMs: avg };
  }, [monthRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">Punch in/out and track your working hours</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance/info')}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Attendance Info
          </button>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-3xl font-mono font-bold text-gray-900">{now.toLocaleTimeString()}</p>
              <p className="text-sm text-gray-500 mt-1">{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Worked Today</p>
              <p className="text-2xl font-bold text-purple-700">{msToHhMm(workedMsToday)}</p>
              <p className="text-xs text-gray-400 mt-1">{todayRecord ? (todayRecord.punch_out ? 'Completed' : 'In progress') : 'Not started'}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handlePunchIn}
              disabled={actionLoading || !!(todayRecord && !todayRecord.punch_out)}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Punch In
            </button>
            <button
              onClick={handlePunchOut}
              disabled={actionLoading || !todayRecord || !!todayRecord.punch_out}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <XCircle className="h-5 w-5" />
              Punch Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">This Month</h2>
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Avg. Work Hours</p>
                  <p className="text-xs text-gray-500">{monthKey}</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">{msToHhMm(monthStats.avgMs)}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Present Days</p>
                <p className="text-xs text-gray-500">Days with recorded punches</p>
              </div>
              <span className="text-xl font-bold text-gray-900">{monthStats.presentDays}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Total Work Hours</p>
                <p className="text-xs text-gray-500">Sum of completed records</p>
              </div>
              <span className="text-xl font-bold text-gray-900">{msToHhMm(monthStats.totalMs)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Attendance</h3>
          <span className="text-sm text-gray-500">{loading ? 'Loading...' : `${monthRecords.length} records`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Punch In</th>
                <th className="px-6 py-4">Punch Out</th>
                <th className="px-6 py-4">Work Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading attendance...</td></tr>
              ) : monthRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No attendance records found for this month.</td></tr>
              ) : (
                monthRecords.slice(0, 10).map((r) => {
                  const inTime = new Date(r.punch_in);
                  const outTime = r.punch_out ? new Date(r.punch_out) : null;
                  const ms = outTime ? (outTime.getTime() - inTime.getTime()) : 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{inTime.toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-700">{inTime.toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-gray-700">{outTime ? outTime.toLocaleTimeString() : '-'}</td>
                      <td className="px-6 py-4 font-mono text-gray-900">{outTime ? msToHhMm(ms) : '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 capitalize">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
