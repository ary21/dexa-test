import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, User, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

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
      <Link to="/employees" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {emp?.photoUrl ? (
              <img src={emp.photoUrl} alt="Avatar" className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                <User className="w-10 h-10 text-purple-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{emp?.name}</h1>
              <p className="text-slate-400">{emp?.email}</p>
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <div><label className="text-slate-400 text-sm">Name</label><input {...register('name')} className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
            <div><label className="text-slate-400 text-sm">Position</label><input {...register('position')} className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
            <div><label className="text-slate-400 text-sm">Phone</label><input {...register('phone')} className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-white/10 text-white rounded">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Briefcase className="text-slate-400" />
              <div><p className="text-sm text-slate-400">Position</p><p className="text-white">{emp?.position}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-slate-400" />
              <div><p className="text-sm text-slate-400">Phone</p><p className="text-white">{emp?.phone || '—'}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
