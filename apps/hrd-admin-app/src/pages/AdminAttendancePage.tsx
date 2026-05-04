import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search employee name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-slate-400">Employee</TableHead>
              <TableHead className="text-slate-400">Date</TableHead>
              <TableHead className="text-slate-400">Check In</TableHead>
              <TableHead className="text-slate-400">Check Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">Loading...</TableCell>
              </TableRow>
            ) : data?.data?.map((r, i) => (
              <TableRow key={`${r.employeeId}-${i}`} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white font-medium">{r.employeeName}</TableCell>
                <TableCell className="text-slate-300">{r.date}</TableCell>
                <TableCell className="text-emerald-400 font-mono">
                  {r.checkIn ? format(new Date(r.checkIn), 'HH:mm') : '—'}
                </TableCell>
                <TableCell className="text-orange-400 font-mono">
                  {r.checkOut ? format(new Date(r.checkOut), 'HH:mm') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="bg-white/5 text-white hover:bg-white/10 disabled:opacity-50">Prev</Button>
          <span className="text-slate-400 text-sm">Page {page}</span>
          <Button variant="ghost" disabled={!data || data.data.length < 10} onClick={() => setPage(p => p + 1)}
            className="bg-white/5 text-white hover:bg-white/10 disabled:opacity-50">Next</Button>
        </div>
      </div>
    </div>
  );
}
