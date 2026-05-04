import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Clock, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

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
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><LogIn className="w-4 h-4" />Check In</div>
            <p className="text-white font-semibold">
              {status?.checkIn ? format(new Date(status.checkIn), 'HH:mm') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><LogOut className="w-4 h-4" />Check Out</div>
            <p className="text-white font-semibold">
              {status?.checkOut ? format(new Date(status.checkOut), 'HH:mm') : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {!hasCheckedIn && (
          <Button
            onClick={() => setShowCheckInDialog(true)}
            className="w-full py-8 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            <Clock className="w-6 h-6 mr-3" /> Check In
          </Button>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <Button
            onClick={() => setShowCheckOutDialog(true)}
            className="w-full py-8 text-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
          >
            <Clock className="w-6 h-6 mr-3" /> Check Out
          </Button>
        )}

        {hasCheckedIn && hasCheckedOut && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex items-center justify-center gap-3 py-6 text-slate-400 font-medium">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Attendance complete for today
            </CardContent>
          </Card>
        )}
      </div>

      {/* Check-In Confirmation Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-white">Check In at {format(now, 'HH:mm')}?</DialogTitle>
            <DialogDescription className="text-slate-400">This action will be recorded immediately.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-center">
            <Button variant="ghost" onClick={() => setShowCheckInDialog(false)}
              className="flex-1 bg-white/10 text-slate-300 hover:bg-white/20">Cancel</Button>
            <Button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
              {checkInMutation.isPending ? 'Recording...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-Out Confirmation Dialog */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-white">Check Out at {format(now, 'HH:mm')}?</DialogTitle>
            <DialogDescription className="text-slate-400">This action will be recorded immediately.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-center">
            <Button variant="ghost" onClick={() => setShowCheckOutDialog(false)}
              className="flex-1 bg-white/10 text-slate-300 hover:bg-white/20">Cancel</Button>
            <Button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
              {checkOutMutation.isPending ? 'Recording...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
