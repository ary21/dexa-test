import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, User, Phone, Briefcase, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
  });

  const { register, handleSubmit } = useForm({
    values: { name: emp?.name, position: emp?.position, phone: emp?.phone },
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/employees/${id}`, d),
    onSuccess: () => {
      toast.success('Updated successfully');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['employee', id] });
    },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/employees" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      <Card className="bg-slate-900 border-white/10">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {emp?.photoUrl ? (
                <img src={emp.photoUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center ring-2 ring-purple-500/40">
                  <User className="w-10 h-10 text-purple-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{emp?.name}</h1>
                <p className="text-slate-400">{emp?.email}</p>
              </div>
            </div>
            {!editing && (
              <Button variant="ghost" onClick={() => setEditing(true)}
                className="bg-white/10 hover:bg-white/20 text-white">
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Briefcase className="text-slate-400 w-5 h-5" />
              <div>
                <p className="text-sm text-slate-400">Position</p>
                <p className="text-white">{emp?.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-slate-400 w-5 h-5" />
              <div>
                <p className="text-sm text-slate-400">Phone</p>
                <p className="text-white">{emp?.phone || '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-300">Name</Label>
              <Input {...register('name')} className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Position</Label>
              <Input {...register('position')} className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Phone</Label>
              <Input {...register('phone')} className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}
                className="flex-1 bg-white/10 text-slate-300 hover:bg-white/20">Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
