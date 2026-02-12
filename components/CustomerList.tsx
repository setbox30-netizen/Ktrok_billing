
import React, { useState } from 'react';
import { Customer, Package, Status, Bill, BillStatus } from '../types';

interface CustomerListProps {
  customers: Customer[];
  packages: Package[];
  bills: Bill[];
  onAdd: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onBulkStatusUpdate: (ids: string[], status: Status) => void;
  onDelete: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ 
  customers, 
  packages, 
  bills, 
  onAdd, 
  onUpdate, 
  onBulkStatusUpdate, 
  onDelete 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    packageId: packages[0]?.id || '',
    status: Status.ACTIVE
  });

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  const filteredCustomers = customers.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone,
      address: c.address,
      packageId: c.packageId,
      status: c.status
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', packageId: packages[0]?.id || '', status: Status.ACTIVE });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleBulkStatus = (status: Status) => {
    if (selectedIds.length === 0) return;
    if (confirm(`Ubah status ${selectedIds.length} pelanggan terpilih menjadi ${status}?`)) {
      onBulkStatusUpdate(selectedIds, status);
      setSelectedIds([]);
      setShowBulkMenu(false);
    }
  };

  const toggleSingleStatus = (c: Customer) => {
    const newStatus = c.status === Status.ACTIVE ? Status.SUSPENDED : Status.ACTIVE;
    // Teks konfirmasi yang dinamis
    const actionText = newStatus === Status.ACTIVE ? 'Mengaktifkan kembali' : 'Mengisolir (Suspend)';
    
    if (confirm(`Apakah Anda yakin ingin ${actionText} layanan untuk ${c.name}?`)) {
        onUpdate(c.id, { status: newStatus });
    }
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Pelanggan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total {customers.length} pelanggan terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <div className="relative z-20">
               <button 
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all animate-in fade-in text-sm"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  Bulk ({selectedIds.length})
                  <svg className={`w-4 h-4 transition-transform ${showBulkMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
               </button>
               
               {showBulkMenu && (
                 <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-700 mb-1">Ubah Status Menjadi:</p>
                    <button onClick={() => handleBulkStatus(Status.ACTIVE)} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktifkan
                    </button>
                    <button onClick={() => handleBulkStatus(Status.SUSPENDED)} className="w-full text-left px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-amber-500"></span> Isolir
                    </button>
                    <button onClick={() => handleBulkStatus(Status.INACTIVE)} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-slate-400"></span> Non-Aktif
                    </button>
                    <div className="border-t dark:border-slate-700 mt-1">
                       <button onClick={() => setSelectedIds([])} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg> Batal
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg transition-all active:scale-95 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            <span className="md:hidden">Baru</span>
            <span className="hidden md:inline">Pelanggan Baru</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text"
              placeholder="Cari Nama, ID, atau No. HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-none bg-slate-50 dark:bg-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            />
         </div>
         <div className="w-full md:w-auto">
            <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="w-full md:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none min-w-[140px]"
            >
               <option value="All">Semua Status</option>
               <option value={Status.ACTIVE}>Aktif</option>
               <option value={Status.SUSPENDED}>Terisolir</option>
               <option value={Status.INACTIVE}>Non-Aktif</option>
            </select>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300 dark:border-slate-700 dark:bg-slate-900" 
                    onChange={toggleSelectAll}
                    checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                  />
                </th>
                <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Nama Pelanggan</th>
                <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Kontak & Alamat</th>
                <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Paket</th>
                <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredCustomers.length > 0 ? filteredCustomers.map(c => {
                const pkg = packages.find(p => p.id === c.packageId);
                const isSelected = selectedIds.includes(c.id);
                const isActive = c.status === Status.ACTIVE;
                return (
                  <tr key={c.id} className={`transition-all duration-200 ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'} ${!isActive && !isSelected ? 'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300 dark:border-slate-700 dark:bg-slate-900" 
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {c.name.charAt(0)}
                         </div>
                         <div>
                            <p className={`font-bold transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{c.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {c.id}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                         {c.phone}
                      </div>
                      <div className="flex items-start gap-1.5 mt-1">
                         <svg className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                         <p className="text-slate-400 dark:text-slate-500 italic truncate max-w-[150px] text-xs leading-tight">{c.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {pkg ? (
                        <div className="flex flex-col">
                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{pkg.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{pkg.speed} • {formatter.format(pkg.price)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleSingleStatus(c)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                        c.status === Status.ACTIVE ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' : 
                        c.status === Status.SUSPENDED ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200'
                      }`}>
                        {c.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button onClick={() => toggleSingleStatus(c)} title={isActive ? "Matikan" : "Aktifkan"} className={`${isActive ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'} p-2 rounded-lg transition-colors`}>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </button>
                      <button onClick={() => setHistoryCustomer(c)} title="Riwayat" className="text-amber-600 dark:text-amber-400 hover:text-amber-900 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      </button>
                      <button onClick={() => openEdit(c)} title="Edit" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onClick={() => onDelete(c.id)} title="Hapus" className="text-rose-600 dark:text-rose-400 hover:text-rose-900 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600">
                    <div className="flex flex-col items-center justify-center opacity-40">
                       <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                       <p className="font-bold text-lg">Tidak ada pelanggan ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-slate-800">
            <div className="px-6 py-4 bg-slate-800 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg">Riwayat: {historyCustomer.name}</h3>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900">
                     <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Terbayar</p>
                     <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                        {formatter.format(bills.filter(b => b.customerId === historyCustomer.id && b.status === BillStatus.PAID).reduce((acc, b) => acc + b.amount + (b.penaltyAmount || 0), 0))}
                     </p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900">
                     <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Total Tunggakan</p>
                     <p className="text-xl font-black text-rose-700 dark:text-rose-300">
                        {formatter.format(bills.filter(b => b.customerId === historyCustomer.id && b.status === BillStatus.UNPAID).reduce((acc, b) => acc + b.amount, 0))}
                     </p>
                  </div>
               </div>

               <div className="max-h-60 overflow-y-auto border dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0">
                        <tr>
                           <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Periode</th>
                           <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Jumlah</th>
                           <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y dark:divide-slate-800">
                        {bills.filter(b => b.customerId === historyCustomer.id).length > 0 ? (
                           bills.filter(b => b.customerId === historyCustomer.id).reverse().map(b => (
                              <tr key={b.id} className="dark:bg-slate-900">
                                 <td className="px-4 py-3 text-sm font-medium dark:text-slate-300">{months[parseInt(b.month) - 1]} {b.year}</td>
                                 <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{formatter.format(b.amount + (b.penaltyAmount || 0))}</td>
                                 <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                       b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                                    }`}>
                                       {b.status}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={3} className="px-4 py-10 text-center text-slate-400 dark:text-slate-600">Belum ada data tagihan.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex justify-end shrink-0">
               <button onClick={() => setHistoryCustomer(null)} className="px-6 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold shadow-lg transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Pelanggan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200 border dark:border-slate-800">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Pelanggan' : 'Tambah Baru'}</h3>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input required className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No. HP</label>
                  <input required className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08123xxx" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                    <option value={Status.ACTIVE}>Aktif</option>
                    <option value={Status.SUSPENDED}>Isolir</option>
                    <option value={Status.INACTIVE}>Non-Aktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Paket Berlangganan</label>
                <select className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - Rp{p.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Pemasangan</label>
                <textarea required rows={2} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jl. Merdeka No. 123..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
