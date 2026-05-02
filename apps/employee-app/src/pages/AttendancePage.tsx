import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Clock, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import api from '../lib/api';

interface TodayStatus {
  checkIn: string | null;
  checkOut: string | null;
}

export default function AttendancePage() {
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);

  const { data: status, refetch } = useQuery<TodayStatus>({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await api.get('/attendances/me', { params: { from: today, to: today } });
      const record = res.data.data?.[0];
      return { checkIn: record?.checkIn ?? null, checkOut: record?.checkOut ?? null };
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => api.post('/attendances/check-in'),
    onSuccess: () => { toast.success('Check-in recorded!'); refetch(); setShowCheckInDialog(false); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Check-in failed');
      setShowCheckInDialog(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => api.post('/attendances/check-out'),
    onSuccess: () => { toast.success('Check-out recorded!'); refetch(); setShowCheckOutDialog(false); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Check-out failed');
      setShowCheckOutDialog(false);
    },
  });

  const now = new Date();
  const hasCheckedIn = !!status?.checkIn;
  const hasCheckedOut = !!status?.checkOut;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center py-8">
        <p className="text-slate-400 text-sm mb-1">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-4xl font-bold text-white">{format(now, 'HH:mm')}</h1>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><LogIn className="w-4 h-4" />Check In</div>
          <p className="text-white font-semibold">
            {status?.checkIn ? format(new Date(status.checkIn), 'HH:mm') : '—'}
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><LogOut className="w-4 h-4" />Check Out</div>
          <p className="text-white font-semibold">
            {status?.checkOut ? format(new Date(status.checkOut), 'HH:mm') : '—'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Check In — visible if not yet checked in */}
        {!hasCheckedIn && (
          <button
            onClick={() => setShowCheckInDialog(true)}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition-all flex items-center justify-center gap-3"
          >
            <Clock className="w-6 h-6" /> Check In
          </button>
        )}

        {/* Check Out — visible only after check-in, if not yet checked out */}
        {hasCheckedIn && !hasCheckedOut && (
          <button
            onClick={() => setShowCheckOutDialog(true)}
            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-lg transition-all flex items-center justify-center gap-3"
          >
            <Clock className="w-6 h-6" /> Check Out
          </button>
        )}

        {/* All done */}
        {hasCheckedIn && hasCheckedOut && (
          <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-medium text-center flex items-center justify-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Attendance complete for today
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {[
        { show: showCheckInDialog, label: 'Check In', time: format(now, 'HH:mm'), onConfirm: () => checkInMutation.mutate(), onCancel: () => setShowCheckInDialog(false), pending: checkInMutation.isPending },
        { show: showCheckOutDialog, label: 'Check Out', time: format(now, 'HH:mm'), onConfirm: () => checkOutMutation.mutate(), onCancel: () => setShowCheckOutDialog(false), pending: checkOutMutation.isPending },
      ].map(({ show, label, time, onConfirm, onCancel, pending }) =>
        show ? (
          <div key={label} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 text-center space-y-4">
              <h3 className="text-white font-semibold text-lg">{label} at {time}?</h3>
              <p className="text-slate-400 text-sm">This action will be recorded immediately.</p>
              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20">Cancel</button>
                <button onClick={onConfirm} disabled={pending} className="flex-1 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50">
                  {pending ? 'Recording...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
