import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Paperclip, Send } from 'lucide-react';
import { API_URL } from '../config';

const LeaveApply: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, { total: number; used: number; remaining: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachmentBase64(result.split(',')[1] || result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setBalanceLoading(true);
    axios
      .get(`${API_URL}/leaves/balance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const map: Record<string, { total: number; used: number; remaining: number }> = {};
        for (const it of r.data || []) {
          map[it.leave_type] = { total: Number(it.total), used: Number(it.used), remaining: Number(it.remaining) };
        }
        setBalances(map);
      })
      .catch(() => {})
      .finally(() => setBalanceLoading(false));
  }, [token]);

  const remainingForType = useMemo(() => balances[leaveType]?.remaining, [balances, leaveType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both start date and end date');
      return;
    }
    if (startDate > endDate) {
      setError('Start date must be on or before end date');
      return;
    }
    if (!window.confirm('Submit this leave request?')) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        attachment_name: attachmentName,
        attachment_base64: attachmentBase64,
      };
      await axios.post(`${API_URL}/leaves/apply`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Leave request submitted');
      setBalances((prev) => ({ ...prev }));
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');
      setAttachmentName(null);
      setAttachmentBase64(null);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to submit leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Apply</h1>
        <p className="text-sm text-gray-500">Submit a new leave request</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">{success}</div>}

      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-gray-700">Leave Type</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
          </select>
          <div className="mt-2 text-xs text-gray-500">
            {balanceLoading ? 'Loading balance…' : remainingForType !== undefined ? `Remaining: ${remainingForType.toFixed(1)} day(s)` : 'Balance unavailable'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Attachment</label>
          <div className="mt-2 flex items-center gap-3">
            <input type="file" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {attachmentName && <span className="text-sm text-gray-600 inline-flex items-center gap-1"><Paperclip className="h-3 w-3" /> {attachmentName}</span>}
          </div>
        </div>

        <button type="submit" disabled={loading} className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="h-4 w-4" />
          Apply
        </button>
      </form>
    </div>
  );
};

export default LeaveApply;
