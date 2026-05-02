import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { CalendarDays, Search, RotateCcw } from 'lucide-react';
import api from '../lib/api';

interface AttendanceRecord { date: string; checkIn: string | null; checkOut: string | null; }

export default function SummaryPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [filterFrom, setFilterFrom] = useState(defaultFrom);
  const [filterTo, setFilterTo] = useState(today);
  const [dateError, setDateError] = useState('');

  const { data, isLoading } = useQuery<{ data: AttendanceRecord[] }>({
    queryKey: ['attendance-summary', filterFrom, filterTo],
    queryFn: () => api.get('/attendances/me', { params: { from: filterFrom, to: filterTo } }).then((r) => r.data),
  });

  const handleSearch = () => {
    if (new Date(to) < new Date(from)) {
      setDateError('End date must be after start date');
      return;
    }
    setDateError('');
    setFilterFrom(from);
    setFilterTo(to);
  };

  const handleReset = () => {
    setFrom(defaultFrom); setTo(today);
    setFilterFrom(defaultFrom); setFilterTo(today);
    setDateError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Attendance Summary</h1>

      {/* Filter */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-slate-400 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <button onClick={handleSearch} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
        {dateError && <p className="text-red-400 text-sm">{dateError}</p>}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" /></div>
      ) : !data?.data?.length ? (
        <div className="text-center py-16 text-slate-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No attendance records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Check In</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.date} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-slate-300">{row.date}</td>
                  <td className="px-4 py-3 text-white font-mono">
                    {row.checkIn ? format(new Date(row.checkIn), 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3 text-white font-mono">
                    {row.checkOut ? format(new Date(row.checkOut), 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
