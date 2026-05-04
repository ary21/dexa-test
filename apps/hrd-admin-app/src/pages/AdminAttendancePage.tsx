import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AttRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export default function AdminAttendancePage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Filter state (live input)
  const [nameInput, setNameInput] = useState('');
  const [fromInput, setFromInput] = useState(today);
  const [toInput, setToInput] = useState(today);
  const [dateError, setDateError] = useState('');

  // Applied filter state (submitted)
  const [appliedName, setAppliedName] = useState('');
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo, setAppliedTo] = useState(today);

  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: AttRecord[]; total: number }>({
    queryKey: ['admin-attendance', page, appliedName, appliedFrom, appliedTo],
    queryFn: () =>
      api
        .get('/attendances', {
          params: {
            page,
            limit: 10,
            employeeName: appliedName || undefined,
            from: appliedFrom,
            to: appliedTo,
          },
        })
        .then((r) => r.data),
  });

  const handleSearch = () => {
    if (new Date(toInput) < new Date(fromInput)) {
      setDateError('End date must be after start date');
      return;
    }
    setDateError('');
    setAppliedName(nameInput);
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
    setPage(1);
  };

  const handleReset = () => {
    setNameInput('');
    setFromInput(today);
    setToInput(today);
    setDateError('');
    setAppliedName('');
    setAppliedFrom(today);
    setAppliedTo(today);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Company Attendance</h1>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Name search */}
            <div className="flex-1 min-w-48 space-y-1">
              <Label className="text-slate-400 text-xs">Employee Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search name..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500"
                />
              </div>
            </div>

            {/* From date */}
            <div className="flex-1 min-w-36 space-y-1">
              <Label className="text-slate-400 text-xs">From</Label>
              <Input
                type="date"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className="bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500"
              />
            </div>

            {/* To date */}
            <div className="flex-1 min-w-36 space-y-1">
              <Label className="text-slate-400 text-xs">To</Label>
              <Input
                type="date"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className="bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="bg-white/10 hover:bg-white/20 text-slate-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
          {dateError && <p className="text-red-400 text-sm">{dateError}</p>}
        </CardContent>
      </Card>

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
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((r, i) => (
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
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Prev
          </Button>
          <span className="text-slate-400 text-sm">Page {page} — {data?.total ?? 0} total</span>
          <Button
            variant="ghost"
            disabled={!data || data.data.length < 10}
            onClick={() => setPage((p) => p + 1)}
            className="bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
