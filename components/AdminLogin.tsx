
import React, { useState } from 'react';
import { AdminProfile } from '../types';

interface AdminLoginProps {
  adminProfile: AdminProfile;
  onLogin: () => void;
  onSwitchToPortal: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ adminProfile, onLogin, onSwitchToPortal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === adminProfile.username && password === (adminProfile.password || 'admin123')) {
      onLogin();
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl rotate-3 border-4 border-white/10">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0020 20c.307 0 .61-.023.906-.068M10 7c0 3.517 1.009 6.799 2.753 9.571m3.44-2.04l-.054-.09A10.003 10.003 0 014 20c-.307 0-.61-.023-.906-.068L10 7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{adminProfile.businessName}</h1>
          <p className="text-indigo-400 font-medium">Administrator Billing System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl text-sm font-bold text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">Admin Username</label>
              <input 
                required
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all placeholder:text-white/20"
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">Admin Password</label>
              <input 
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all placeholder:text-white/20"
                placeholder="********"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-900/40 transition-all active:scale-95">
              MASUK KE DASHBOARD
            </button>
          </form>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <button 
            onClick={onSwitchToPortal}
            className="text-indigo-300 hover:text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            &larr; Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    </div>
  );
};
