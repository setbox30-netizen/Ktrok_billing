
import React, { useState } from 'react';
import { Collector } from '../types';

interface CollectorProfileProps {
  collector: Collector;
  onUpdate: (id: string, updates: Partial<Collector>) => void;
}

export const CollectorProfile: React.FC<CollectorProfileProps> = ({ collector, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: collector.name,
    phone: collector.phone,
    password: collector.password || ''
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Collector> = {
      name: formData.name,
      phone: formData.phone
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Konfirmasi password tidak cocok!');
        return;
      }
      updates.password = newPassword;
    }

    onUpdate(collector.id, updates);
    setNewPassword('');
    setConfirmPassword('');
    alert('Profil berhasil diperbarui!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="bg-indigo-600 p-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/20">
             <span className="text-4xl font-black text-indigo-600">{collector.name.charAt(0)}</span>
          </div>
          <h2 className="text-white font-black text-2xl mt-4 relative z-10">{collector.name}</h2>
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-80 relative z-10">Petugas Kolektor</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Petugas</label>
              <input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Nomor WhatsApp</label>
              <input 
                required 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Keamanan Akun
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Password Baru</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Isi untuk ubah password"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Ulangi Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Pastikan sama"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            SIMPAN PERUBAHAN PROFIL
          </button>
        </form>
      </div>
    </div>
  );
};
