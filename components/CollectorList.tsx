
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
  // Fix: Explicitly type status to avoid 'as const' narrowing it to only 'Active'
  const [formData, setFormData] = useState<{ name: string; phone: string; status: 'Active' | 'Inactive' }>({ 
    name: '', 
    phone: '', 
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
    if (editingId) onUpdate(editingId, formData);
    else onAdd(formData);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', status: 'Active' });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tim Kang Tagih</h2>
          <p className="text-slate-500 text-sm">Petugas kolektor lapangan untuk penagihan manual.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Tambah Petugas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collectors.map(c => {
          const stats = getCollectorStats(c.id);
          const progress = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
          return (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl">
               <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-amber-200 dark:shadow-none">
                        {c.name.charAt(0)}
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 leading-none mb-1">{c.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.phone}</p>
                     </div>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => { setEditingId(c.id); setFormData({name: c.name, phone: c.phone, status: c.status}); setShowModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                     <button onClick={() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-rose-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pencapaian Koleksi</p>
                     <p className="font-black text-indigo-600 text-xs">{Math.round(progress)}%</p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                     <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                        <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Target Tagih</p>
                        <p className="font-black text-slate-700 dark:text-slate-300 text-xs">{formatter.format(stats.totalAssigned)}</p>
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                        <p className="text-[8px] text-emerald-600 font-bold uppercase mb-1">Sudah Setor</p>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 text-xs">{formatter.format(stats.totalCollected)}</p>
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
              <div className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                 <h3 className="font-black text-slate-800 dark:text-slate-100">{editingId ? 'Edit Petugas' : 'Tambah Petugas'}</h3>
                 <button onClick={closeModal} className="text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Nama Lengkap</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Nomor WhatsApp</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="08123xxx" />
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-400 font-bold uppercase">Batal</button>
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg">Simpan</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
