
import React, { useState } from 'react';
import { AdminProfile } from '../types';

interface AdminSettingsProps {
  adminProfile: AdminProfile;
  onUpdate: (updates: AdminProfile) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ adminProfile, onUpdate }) => {
  const [formData, setFormData] = useState<AdminProfile>({ 
    ...adminProfile, 
    password: '',
    autoBillingEnabled: adminProfile.autoBillingEnabled ?? true,
    billingDay: adminProfile.billingDay ?? 1
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Konfirmasi password tidak cocok!');
        return;
      }
      finalData.password = newPassword;
    } else {
      finalData.password = adminProfile.password;
    }
    onUpdate(finalData);
    setNewPassword('');
    setConfirmPassword('');
    alert('Pengaturan berhasil diperbarui!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pengaturan Sistem</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola identitas bisnis dan keamanan akun.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              Profil Bisnis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Bisnis / RTRW Net</label>
                <input type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none transition-colors text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              Penagihan Otomatis (Auto Billing)
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700">
                 <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Aktifkan Penagihan Otomatis</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Tagihan akan otomatis dibuat saat Anda login pada tanggal yang ditentukan.</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, autoBillingEnabled: !formData.autoBillingEnabled})}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.autoBillingEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.autoBillingEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </button>
              </div>

              {formData.autoBillingEnabled && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Tanggal Tagih (1 - 28)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="28"
                    value={formData.billingDay} 
                    onChange={e => setFormData({ ...formData, billingDay: parseInt(e.target.value) || 1 })} 
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" 
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-medium italic">Sistem akan memeriksa tagihan setiap kali Anda masuk ke dashboard admin mulai tanggal ini.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Akun Administrator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Tampilan</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" /></div>
              <div><label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Username Login</label><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" /></div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-800">
                <div><label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Password Baru</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" placeholder="Biarkan kosong jika tetap" /></div>
                <div><label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Konfirmasi Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" placeholder="Ulangi password baru" /></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-end pt-2">
            <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
               SIMPAN PERUBAHAN
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 dark:bg-slate-900 dark:border dark:border-slate-800 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
             <div className="relative z-10">
                <h4 className="font-black mb-2 dark:text-slate-100 text-lg">Auto-Billing</h4>
                <p className="text-indigo-200 dark:text-slate-400 text-xs leading-relaxed font-medium">Sistem ini menggunakan "Login-Triggered Scheduling". Tagihan akan otomatis dibuat segera setelah Anda masuk ke dashboard admin mulai dari tanggal yang diatur, memastikan tagihan terbit tepat waktu setiap bulan tanpa perlu intervensi manual.</p>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};
