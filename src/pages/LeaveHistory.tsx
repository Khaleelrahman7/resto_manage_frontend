import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { API_URL } from '../config';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason: string;
  applied_at: string;
  review_notes?: string | null;
}

const badge = (status: string) => {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'rejected') return 'bg-rose-100 text-rose-800';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-700';
  return 'bg-amber-100 text-amber-800';
};

const LeaveHistory: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_URL}/leaves/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load leave history'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
        <p className="text-sm text-gray-500">All leave requests and approval status</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Requests</h2>
          <span className="text-sm text-gray-500">{loading ? 'Loading...' : `${items.length} items`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Approval Details</th>
                <th className="px-6 py-4">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading leave history...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No leave requests found.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 capitalize">{it.leave_type}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(it.start_date).toLocaleDateString()} – {new Date(it.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{Number(it.total_days).toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge(it.status)}`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {it.review_notes ? it.review_notes : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(it.applied_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
