import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';

interface AttRecord { employeeId: string; employeeName: string; date: string; checkIn: string | null; checkOut: string | null; }

export default function AdminAttendancePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: AttRecord[]; total: number }>({
    queryKey: ['admin-attendance', page, search],
    queryFn: () => api.get('/attendances', { params: { page, limit: 10, employeeName: search } }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Company Attendance</h1>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text" placeholder="Search employee name..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Check In</th>
              <th className="px-6 py-4">Check Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? <tr><td colSpan={4} className="text-center py-8 text-slate-400">Loading...</td></tr> :
              data?.data?.map((r, i) => (
                <tr key={`${r.employeeId}-${i}`} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-white font-medium">{r.employeeName}</td>
                  <td className="px-6 py-4 text-slate-300">{r.date}</td>
                  <td className="px-6 py-4 text-emerald-400 font-mono">{r.checkIn ? format(new Date(r.checkIn), 'HH:mm') : '—'}</td>
                  <td className="px-6 py-4 text-orange-400 font-mono">{r.checkOut ? format(new Date(r.checkOut), 'HH:mm') : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
           <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50">Prev</button>
           <span className="text-slate-400 text-sm">Page {page}</span>
           <button disabled={!data || data.data.length < 10} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
