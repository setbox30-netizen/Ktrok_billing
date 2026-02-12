
import React, { useState } from 'react';
import { Collector, Bill, BillStatus } from '../types';

interface CollectorListProps {
  collectors: Collector[];
  bills: Bill[];
  onAdd: (c: Omit<Collector, 'id' | 'joinedAt'>) => void;
  onUpdate: (id: string, updates: Partial<Collector>) => void;
  onDelete: (id: string) => void;
}

export const CollectorList: React.FC<CollectorListProps> = ({ collectors, bills, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{ 
    name: string; 
    phone: string; 
    password: string; 
    status: 'Active' | 'Inactive' 
  }>({ 
    name: '', 
    phone: '', 
    password: '',
    status: 'Active' 
  });

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
  });

  const getCollectorStats = (id: string) => {
    const collectorBills = bills.filter(b => b.collectorId === id);
    const totalAssigned = collectorBills.reduce((acc, b) => acc + b.amount, 0);
    const totalCollected = collectorBills
      .filter(b => b.status === BillStatus.PAID)
      .reduce((acc, b) => acc + b.amount, 0);
    const count = collectorBills.length;
    const paidCount = collectorBills.filter(b => b.status === BillStatus.PAID).length;
    
    return { totalAssigned, totalCollected, count, paidCount };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      password: formData.password || '123456' // Default password if empty
    };
    
    if (editingId) onUpdate(editingId, dataToSave);
    else onAdd(dataToSave);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', password: '', status: 'Active' });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tim Kang Tagih</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola akun login dan pantau kinerja petugas lapangan.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          Tambah Petugas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collectors.map(c => {
          const stats = getCollectorStats(c.id);
          const progress = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
          return (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
               <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-amber-200 dark:shadow-none">
                        {c.name.charAt(0)}
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 leading-none mb-1">{c.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.phone}</p>
                     </div>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => { setEditingId(c.id); setFormData({name: c.name, phone: c.phone, password: c.password || '', status: c.status}); setShowModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                     <button onClick={() => { if(confirm('Hapus petugas ini?')) onDelete(c.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pencapaian Koleksi</p>
                     <p className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{Math.round(progress)}%</p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                     <div className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border dark:border-slate-800">
                        <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Target Tagih</p>
                        <p className="font-black text-slate-700 dark:text-slate-300 text-xs">{formatter.format(stats.totalAssigned)}</p>
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                        <p className="text-[8px] text-emerald-600 font-bold uppercase mb-1">Sudah Setor</p>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 text-xs">{formatter.format(stats.totalCollected)}</p>
                     </div>
                  </div>
                  <div className="pt-2 border-t dark:border-slate-800 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Login: {c.phone}</p>
                  </div>
               </div>
            </div>
          );
        })}
        {collectors.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed dark:border-slate-800 opacity-50">
             <p className="text-slate-400 font-bold italic">Belum ada petugas Kang Tagih.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
              <div className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                 <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100">{editingId ? 'Edit Akun Petugas' : 'Tambah Petugas Baru'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Kredensial Login Lapangan</p>
                 </div>
                 <button onClick={closeModal} className="text-slate-400 hover:text-rose-600 transition-colors p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Lengkap</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Cth: Ahmad Fauzi" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nomor WhatsApp (Username)</label>
                    <div className="relative">
                       <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="08123xxx" />
                       <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Password Login</label>
                    <div className="relative">
                       <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Kosongkan untuk default 123456" />
                       <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                    <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95">SIMPAN AKUN</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
