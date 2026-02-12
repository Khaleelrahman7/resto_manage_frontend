import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { API_URL } from '../config';

interface LeaveBalanceItem {
  leave_type: string;
  total: number;
  used: number;
  remaining: number;
}

const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const LeaveBalance: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [items, setItems] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_URL}/leaves/balance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load leave balance'))
      .finally(() => setLoading(false));
  }, [token]);

  const totalRemaining = useMemo(() => items.reduce((acc, it) => acc + (it.remaining || 0), 0), [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Balance</h1>
          <p className="text-sm text-gray-500">Your available leave across types</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Remaining: <span className="font-bold text-gray-900">{totalRemaining.toFixed(1)}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 lg:col-span-3">
            Loading leave balances...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 lg:col-span-3">
            No leave balances available.
          </div>
        ) : (
          items.map((it) => {
            const pct = it.total > 0 ? Math.min(100, Math.max(0, (it.used / it.total) * 100)) : 0;
            return (
              <div key={it.leave_type} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{titleCase(it.leave_type)}</h2>
                  <span className="text-sm text-gray-600">{it.remaining.toFixed(1)} left</span>
                </div>
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Used: {it.used.toFixed(1)}</span>
                    <span>Total: {it.total.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;
