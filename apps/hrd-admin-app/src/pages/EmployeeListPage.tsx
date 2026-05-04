import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, UserPlus, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
        <Button onClick={() => setShowAdd(true)} className="bg-purple-600 hover:bg-purple-500 text-white">
          <Plus className="w-5 h-5 mr-2" /> Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Position</TableHead>
              <TableHead className="text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">Loading...</TableCell>
              </TableRow>
            ) : data?.data?.map((emp) => (
              <TableRow key={emp.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white font-medium">{emp.name}</TableCell>
                <TableCell className="text-slate-400">{emp.email}</TableCell>
                <TableCell className="text-slate-400">{emp.position}</TableCell>
                <TableCell>
                  <Link to={`/employees/${emp.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5" /> Add Employee
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-300">Name</Label>
              <Input {...register('name')} required className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Email</Label>
              <Input type="email" {...register('email')} required className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Position</Label>
              <Input {...register('position')} required className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Initial Password</Label>
              <Input type="password" {...register('password')} required minLength={8} className="bg-white/5 border-white/10 text-white focus-visible:ring-purple-500" />
            </div>
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}
                className="flex-1 bg-white/10 text-slate-300 hover:bg-white/20">Cancel</Button>
              <Button type="submit" disabled={addMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
                {addMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
