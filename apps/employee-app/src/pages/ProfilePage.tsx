import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Phone, Lock, User } from 'lucide-react';
import api from '../lib/api';

// ── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: string; name: string; email: string;
  position: string; phone: string | null; photoUrl: string | null;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const [editPhone, setEditPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fetch profile (US-04) ─────────────────────────────────
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/employees/me').then((r) => r.data),
  });

  // ── Update phone (US-06) ──────────────────────────────────
  const phoneMutation = useMutation({
    mutationFn: (phone: string) => api.patch('/employees/me/phone', { phone }),
    onSuccess: () => {
      toast.success('Phone number updated successfully');
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditingPhone(false);
    },
    onError: () => toast.error('Failed to update phone number'),
  });

  // ── Change password (US-07) ───────────────────────────────
  const passwordMutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) =>
      api.patch('/employees/me/password', d),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setShowPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Failed to change password');
    },
  });

  // ── Photo upload (US-05) ──────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type + size
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP images are accepted');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB');
      return;
    }

    try {
      // Step 1: Get presigned URL
      const { data } = await api.get('/employees/me/upload-url', {
        params: { filename: file.name, contentType: file.type },
      });

      // Step 2: PUT file directly to MinIO
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Confirm with backend
      await api.patch('/employees/me/photo', { photoUrl: data.fileUrl });
      toast.success('Profile photo updated');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch {
      toast.error('Photo upload failed. Please try again.');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    passwordMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>

      {/* Avatar + Photo Upload */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex items-center gap-6">
        <div className="relative">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center ring-2 ring-purple-500/40">
              <User className="w-10 h-10 text-purple-300" />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition"
            aria-label="Change profile photo"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{profile?.name}</h2>
          <p className="text-purple-300">{profile?.position}</p>
          <p className="text-slate-400 text-sm">{profile?.email}</p>
        </div>
      </div>

      {/* Phone */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <Phone className="w-5 h-5 text-purple-400" /> Phone Number
          </div>
          {!editingPhone && (
            <button onClick={() => { setEditingPhone(true); setEditPhone(profile?.phone ?? ''); }} className="text-purple-400 hover:text-purple-300 text-sm">
              Edit
            </button>
          )}
        </div>
        {editingPhone ? (
          <div className="flex gap-3">
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="08xxxxxxxxxx"
              maxLength={15}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Phone number"
            />
            <button onClick={() => phoneMutation.mutate(editPhone)} disabled={phoneMutation.isPending} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setEditingPhone(false)} className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 text-sm hover:bg-white/20">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-slate-300">{profile?.phone ?? '—'}</p>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Lock className="w-5 h-5 text-purple-400" /> Password
          </div>
          <button onClick={() => setShowPwModal(true)} className="text-purple-400 hover:text-purple-300 text-sm">
            Change
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {(['currentPassword', 'newPassword', 'confirm'] as const).map((f) => (
                <div key={f}>
                  <label className="block text-sm text-slate-300 mb-1" htmlFor={f}>
                    {f === 'currentPassword' ? 'Current Password' : f === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    id={f}
                    type="password"
                    value={pwForm[f]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [f]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={passwordMutation.isPending} className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50">
                  {passwordMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowPwModal(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
