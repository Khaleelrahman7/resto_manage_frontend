import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from 'lucide-react';
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

const toMonthKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const msToHhMm = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const AttendanceInfo: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Date>(() => new Date());

  const monthKey = useMemo(() => toMonthKey(monthDate), [monthDate]);

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') {
      navigate('/attendance/admin', { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    axios
      .get(`${API_URL}/attendance/me`, { params: { month: monthKey }, headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setRecords(r.data || []))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load attendance info'))
      .finally(() => setLoading(false));
  }, [token, monthKey, user?.role, navigate]);

  useEffect(() => {
    const mStart = startOfMonth(monthDate);
    if (selected.getMonth() !== mStart.getMonth() || selected.getFullYear() !== mStart.getFullYear()) {
      setSelected(new Date(mStart));
    }
  }, [monthDate]);

  const recordByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      const d = new Date(r.punch_in);
      const key = toLocalDateKey(d);
      map.set(key, r);
    }
    return map;
  }, [records]);

  const calendarCells = useMemo(() => {
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
    const startWeekday = mStart.getDay();
    const gridStart = new Date(mStart);
    gridStart.setDate(mStart.getDate() - startWeekday);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return { mStart, mEnd, cells };
  }, [monthDate]);

  const selectedKey = useMemo(() => toLocalDateKey(selected), [selected]);
  const selectedRecord = recordByDate.get(selectedKey) || null;

  const selectedWorkMs = useMemo(() => {
    if (!selectedRecord) return 0;
    const inTime = new Date(selectedRecord.punch_in).getTime();
    const outTime = selectedRecord.punch_out ? new Date(selectedRecord.punch_out).getTime() : inTime;
    return Math.max(0, outTime - inTime);
  }, [selectedRecord]);

  const getStatus = (d: Date) => {
    const key = toLocalDateKey(d);
    const r = recordByDate.get(key);
    if (r) {
      const inTime = new Date(r.punch_in).getTime();
      const outTime = r.punch_out ? new Date(r.punch_out).getTime() : inTime;
      const hours = (outTime - inTime) / 3600000;
      if (r.punch_out && hours > 0 && hours < 4) return 'half';
      return 'present';
    }
    const isCurrentMonth = d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
    if (!isCurrentMonth) return 'outside';
    const weekday = d.getDay();
    if (weekday === 0 || weekday === 6) return 'weekend';
    return 'absent';
  };

  const statusPill = (status: string) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-800';
    if (status === 'half') return 'bg-amber-100 text-amber-800';
    if (status === 'absent') return 'bg-rose-100 text-rose-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Info</h1>
          <p className="text-sm text-gray-500">Monthly calendar with day-wise punch details</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-700" />
            {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Calendar</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Half-day</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Absent</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                <div key={w} className="px-2">{w}</div>
              ))}
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading calendar...</div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.cells.map((d) => {
                  const status = getStatus(d);
                  const inMonth = d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
                  const active = sameDay(d, selected);
                  const base = 'h-20 sm:h-24 rounded-xl border transition-all text-left px-3 py-2';
                  const bg =
                    status === 'present'
                      ? 'bg-emerald-50 border-emerald-100'
                      : status === 'half'
                      ? 'bg-amber-50 border-amber-100'
                      : status === 'absent'
                      ? 'bg-rose-50 border-rose-100'
                      : 'bg-white border-gray-200';
                  const ring = active ? 'ring-2 ring-purple-500/30' : '';
                  const text = inMonth ? 'text-gray-900' : 'text-gray-400';
                  const key = toLocalDateKey(d);
                  const r = recordByDate.get(key);
                  const inTime = r ? new Date(r.punch_in).getTime() : 0;
                  const outTime = r && r.punch_out ? new Date(r.punch_out).getTime() : 0;
                  const hoursText = r && r.punch_out ? msToHhMm(outTime - inTime) : '';
                  const dot =
                    status === 'present'
                      ? 'bg-emerald-500'
                      : status === 'half'
                      ? 'bg-amber-500'
                      : status === 'absent'
                      ? 'bg-rose-500'
                      : 'bg-gray-300';
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(d)}
                      className={`${base} ${bg} ${ring} hover:shadow-sm`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-sm font-semibold ${text}`}>{d.getDate()}</span>
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                      </div>
                      <div className="mt-4">
                        {hoursText ? (
                          <div className="text-xs font-mono text-gray-700">{hoursText}</div>
                        ) : (
                          <div className="text-xs text-gray-400">{status === 'weekend' ? 'Weekend' : status === 'outside' ? '' : ''}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected Date</p>
              <p className="text-lg font-bold text-gray-900">{selected.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(getStatus(selected))}`}>
              {getStatus(selected) === 'half' ? 'Half-day' : getStatus(selected)}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Punch In</p>
              <p className="text-sm font-semibold text-gray-900">{selectedRecord ? new Date(selectedRecord.punch_in).toLocaleTimeString() : '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Punch Out</p>
              <p className="text-sm font-semibold text-gray-900">{selectedRecord && selectedRecord.punch_out ? new Date(selectedRecord.punch_out).toLocaleTimeString() : '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-700" />
                <p className="text-sm font-semibold text-gray-900">Total Working Hours</p>
              </div>
              <p className="font-mono font-bold text-gray-900">{selectedRecord && selectedRecord.punch_out ? msToHhMm(selectedWorkMs) : '-'}</p>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Absent/half-day indicators are derived from punch duration for this MVP.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceInfo;
