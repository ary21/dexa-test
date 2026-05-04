import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { CalendarDays, Search, RotateCcw } from 'lucide-react';
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
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-32 space-y-1">
              <Label className="text-slate-400 text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm focus-visible:ring-purple-400" />
            </div>
            <div className="flex-1 min-w-32 space-y-1">
              <Label className="text-slate-400 text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm focus-visible:ring-purple-400" />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-500 text-white text-sm">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button variant="ghost" onClick={handleReset}
              className="bg-white/10 hover:bg-white/20 text-slate-300 text-sm">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
          {dateError && <p className="text-red-400 text-sm">{dateError}</p>}
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-16 text-slate-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No attendance records found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Check In</TableHead>
                <TableHead className="text-slate-400">Check Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.date} className="border-white/5 hover:bg-white/5 transition">
                  <TableCell className="text-slate-300">{row.date}</TableCell>
                  <TableCell className="text-white font-mono">
                    {row.checkIn ? format(new Date(row.checkIn), 'yyyy-MM-dd HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-white font-mono">
                    {row.checkOut ? format(new Date(row.checkOut), 'yyyy-MM-dd HH:mm') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
