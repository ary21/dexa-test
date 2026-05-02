import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, UserPlus, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '../lib/api';

interface Employee { id: string; name: string; email: string; position: string; }

export default function EmployeeListPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery<{ data: Employee[]; total: number }>({
    queryKey: ['employees', search],
    queryFn: () => api.get('/employees', { params: { search, limit: 100 } }).then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (d: any) => api.post('/employees', d),
    onSuccess: () => {
      toast.success('Employee created');
      setShowAdd(false);
      reset();
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error creating employee'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-500">
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500" />
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Position</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : data?.data?.map((emp) => (
              <tr key={emp.id} className="hover:bg-white/5">
                <td className="px-6 py-4 text-white">{emp.name}</td>
                <td className="px-6 py-4 text-slate-400">{emp.email}</td>
                <td className="px-6 py-4 text-slate-400">{emp.position}</td>
                <td className="px-6 py-4">
                  <Link to={`/employees/${emp.id}`} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg inline-flex">
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5"/> Add Employee</h2>
            <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
              <div><label className="text-sm text-slate-300">Name</label><input {...register('name')} required className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
              <div><label className="text-sm text-slate-300">Email</label><input type="email" {...register('email')} required className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
              <div><label className="text-sm text-slate-300">Position</label><input {...register('position')} required className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
              <div><label className="text-sm text-slate-300">Initial Password</label><input type="password" {...register('password')} required minLength={8} className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded text-white" /></div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded">Save</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-white/10 text-white py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
