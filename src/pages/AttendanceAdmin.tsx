import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Download, RefreshCcw } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { API_URL } from '../config';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
}

interface AttendanceAdminRecord {
  id: string;
  employee_id: string;
  punch_in: string;
  punch_out: string | null;
  status: string;
  notes?: string | null;
  employee: Employee;
}

const msToHhMm = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const AttendanceAdmin: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [employeeId, setEmployeeId] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = useMemo(() => {
    const unique = new Set<string>();
    for (const e of employees) {
      if (e.department) unique.add(e.department);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/employees/`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(res.data || []);
    } catch (e: any) {
      setEmployees([]);
    }
  };

  const fetchRecords = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/attendance/admin`, {
        params: {
          month,
          employee_id: employeeId || undefined,
          department: department || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data || []);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load attendance');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  useEffect(() => {
    fetchRecords();
  }, [token, month, employeeId, department]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/attendance/admin/report.csv`, {
        params: {
          month,
          employee_id: employeeId || undefined,
          department: department || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const totals = useMemo(() => {
    let totalMs = 0;
    let completed = 0;
    for (const r of records) {
      const inTime = r.punch_in ? new Date(r.punch_in).getTime() : 0;
      const outTime = r.punch_out ? new Date(r.punch_out).getTime() : 0;
      if (inTime && outTime && outTime >= inTime) {
        totalMs += outTime - inTime;
        completed += 1;
      }
    }
    return { totalMs, completed };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">View all employees attendance and download reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecords}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900"
            >
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.department})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900"
            >
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Completed Records</p>
                  <p className="text-lg font-bold text-gray-900">{totals.completed}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Hours</p>
                  <p className="text-lg font-bold text-purple-700">{msToHhMm(totals.totalMs)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Attendance Records</h3>
          <span className="text-sm text-gray-500">{loading ? 'Loading...' : `${records.length} records`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Punch In</th>
                <th className="px-6 py-4">Punch Out</th>
                <th className="px-6 py-4">Work Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Loading attendance...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No attendance records found.</td>
                </tr>
              ) : (
                records.map((r) => {
                  const inTime = new Date(r.punch_in);
                  const outTime = r.punch_out ? new Date(r.punch_out) : null;
                  const ms = outTime ? Math.max(0, outTime.getTime() - inTime.getTime()) : 0;
                  const employeeName = `${r.employee.first_name} ${r.employee.last_name}`.trim();
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        <div className="flex flex-col">
                          <span>{employeeName}</span>
                          <span className="text-xs text-gray-500">{r.employee.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{r.employee.department}</td>
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

export default AttendanceAdmin;
