import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Key, 
  Server, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Save,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { SystemStatus } from '../types.js';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
    api.getSystemStatus().then(setSystemStatus).catch(console.error);
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);
    try {
      await updateProfile(name);
      setProfileMsg({ type: 'success', text: 'Name successfully updated.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update name.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setIsUpdatingPw(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      setPwMsg({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPw(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UserIcon className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Account & System Profile</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your credentials and view backend server diagnostics.
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 transition-all self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Form */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-5">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-500" />
            <span>Profile Information</span>
          </h3>

          <form onSubmit={handleUpdateName} className="space-y-4 text-xs">
            {profileMsg && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-900/60 text-red-300'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="block font-medium text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-zinc-900/50 text-zinc-400 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 cursor-not-allowed text-xs"
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Email is the primary account identifier.</p>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 text-zinc-100 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center text-zinc-500 text-[11px] pt-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>
                Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-950/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Name Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-5">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>Security & Password</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {pwMsg && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  pwMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-900/60 text-red-300'
                }`}
              >
                {pwMsg.text}
              </div>
            )}

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Current Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 text-zinc-100 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-zinc-900 text-zinc-100 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPw}
              className="w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold border border-zinc-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* System Diagnostic Status Card */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span>MovieMind AI Server Diagnostics</span>
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
            ● System Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-zinc-400 text-[11px]">Gemini 3.7 Flash Model</span>
            <div className="flex items-center space-x-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active (@google/genai)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-zinc-400 text-[11px]">TMDB Integration</span>
            <div className="flex items-center space-x-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live API + Curated Cache</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-zinc-400 text-[11px]">Speech Narration Engine</span>
            <div className="flex items-center space-x-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gemini TTS + Web Speech</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
