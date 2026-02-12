
import React, { useState } from 'react';
import { Bill, Customer, BillStatus, Collector } from '../types';

interface BillingListProps {
  bills: Bill[];
  customers: Customer[];
  collectors: Collector[];
  onGenerate: (month: string, year: number) => void;
  onMarkPaid: (id: string, penalty?: number) => void;
  onRejectPayment: (id: string) => void;
  onMarkMultiplePaid: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onAssignCollector: (billIds: string[], collectorId: string) => void;
  isCollector?: boolean;
  collectorId?: string;
}

export const BillingList: React.FC<BillingListProps> = ({ 
  bills, 
  customers, 
  collectors,
  onGenerate, 
  onMarkPaid, 
  onRejectPayment,
  onMarkMultiplePaid, 
  onDelete,
  onDeleteMultiple,
  onAssignCollector,
  isCollector = false,
  collectorId
}) => {
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'overdue' | 'unpaid' | 'paid'>('all');
  const [filterCollector, setFilterCollector] = useState<string>('all');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [paymentModal, setPaymentModal] = useState<{ id: string, name: string, amount: number, isConfirmation?: boolean } | null>(null);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);
  const [penaltyInput, setPenaltyInput] = useState<number>(0);

  const today = new Date().toISOString().split('T')[0];

  const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
    { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  const allFilteredBills = bills.filter(b => {
    // Role Restriction: Collectors only see their assigned bills
    if (isCollector && b.collectorId !== collectorId) return false;

    // Admin Filter: Filter by selected collector
    if (!isCollector && filterCollector !== 'all') {
      if (filterCollector === 'none') {
        if (b.collectorId) return false;
      } else {
        if (b.collectorId !== filterCollector) return false;
      }
    }

    const customer = customers.find(c => c.id === b.customerId);
    const matchesPeriod = b.month === filterMonth && b.year === filterYear;
    const matchesSearch = customer?.name.toLowerCase().includes(search.toLowerCase()) || 
                         customer?.phone.includes(search) ||
                         b.id.toLowerCase().includes(search.toLowerCase());
    
    let matchesType = true;
    if (filterType === 'pending') matchesType = b.status === BillStatus.PENDING;
    if (filterType === 'overdue') matchesType = b.status === BillStatus.UNPAID && b.dueDate < today;
    if (filterType === 'unpaid') matchesType = b.status === BillStatus.UNPAID;
    if (filterType === 'paid') matchesType = b.status === BillStatus.PAID;

    return matchesPeriod && (search ? matchesSearch : true) && matchesType;
  });

  const handleBulkAssign = (collectorId: string) => {
    onAssignCollector(selectedIds, collectorId);
    setSelectedIds([]);
    setShowAssignModal(false);
    setShowBulkMenu(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === allFilteredBills.length && allFilteredBills.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredBills.map(b => b.id));
    }
  };

  const openPaymentModal = (bill: Bill, customerName: string) => {
    setPaymentModal({ id: bill.id, name: customerName, amount: bill.amount });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {isCollector ? 'Tagihan Tugas Saya' : 'Manajemen Tagihan'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isCollector ? 'Daftar penagihan yang ditugaskan kepada Anda.' : 'Kelola seluruh sirkulasi keuangan dan tagihan pelanggan.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {!isCollector && selectedIds.length > 0 && (
              <div className="relative z-20 flex gap-2">
                <button 
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-lg transition-all text-sm active:scale-95"
                >
                  Tindakan Masal ({selectedIds.length})
                  <svg className={`w-4 h-4 transition-transform ${showBulkMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {showBulkMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                    <button onClick={() => { setShowAssignModal(true); setShowBulkMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                       Tugaskan Kang Tagih
                    </button>
                    <button onClick={() => onMarkMultiplePaid(selectedIds)} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                       Bayar Lunas
                    </button>
                    <button onClick={() => { if(confirm('Hapus tagihan terpilih?')) onDeleteMultiple(selectedIds); setSelectedIds([]); setShowBulkMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       Hapus Permanen
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {isCollector && selectedIds.length > 0 && (
                <button 
                  onClick={() => { if(confirm(`Lunaskan ${selectedIds.length} tagihan?`)) onMarkMultiplePaid(selectedIds); setSelectedIds([]); }}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-lg transition-all text-sm active:scale-95 animate-in zoom-in"
                >
                  Bayar Lunas ({selectedIds.length})
                </button>
            )}

            {!isCollector && (
                <button 
                    onClick={() => onGenerate(filterMonth, filterYear)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg transition-all text-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    Terbitkan Tagihan
                </button>
            )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
         <div className="relative lg:col-span-1">
            <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
               type="text" 
               placeholder="Cari nama / invoice..." 
               className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-slate-200"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-200"
         >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
         </select>
         <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-200"
         >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
         </select>
         <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-200"
         >
            <option value="all">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="overdue">Terlambat</option>
            <option value="pending">Menunggu Konf.</option>
            <option value="paid">Lunas</option>
         </select>
         {!isCollector && (
            <select 
               value={filterCollector} 
               onChange={(e) => setFilterCollector(e.target.value)}
               className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600 dark:text-indigo-400"
            >
               <option value="all">Semua Petugas</option>
               <option value="none">Belum Ditugaskan</option>
               {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 cursor-pointer border-slate-300 dark:border-slate-700 dark:bg-slate-950" onChange={toggleSelectAll} checked={allFilteredBills.length > 0 && selectedIds.length === allFilteredBills.length} />
                </th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Pelanggan & Invoice</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Jumlah</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Petugas</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {allFilteredBills.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const collector = collectors.find(c => c.id === b.collectorId);
                const isOverdue = b.status === BillStatus.UNPAID && b.dueDate < today;
                return (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 cursor-pointer border-slate-300 dark:border-slate-700 dark:bg-slate-950" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="font-black text-slate-800 dark:text-slate-200">{customer?.name || 'N/A'}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">ID: #{b.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="font-black text-slate-800 dark:text-slate-200">{formatter.format(b.amount + (b.penaltyAmount || 0))}</p>
                       <p className={`text-[9px] font-bold uppercase ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>JT: {b.dueDate.split('-').reverse().join('/')}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {collector ? (
                          <div className="flex items-center gap-1.5">
                             <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-md flex items-center justify-center text-[9px] font-black">{collector.name.charAt(0)}</div>
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{collector.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700 italic">Belum Ditugaskan</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-110 cursor-default inline-block ${
                        b.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                        isOverdue ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isOverdue ? 'TERLAMBAT' : b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1">
                          {b.status === BillStatus.UNPAID && (
                              <button 
                                onClick={() => openPaymentModal(b, customer?.name || 'N/A')} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-90 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                              >
                                BAYAR
                              </button>
                          )}
                          <button onClick={() => setDetailBill(b)} className="text-slate-400 hover:text-indigo-600 p-2 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {allFilteredBills.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm italic">Tidak ada tagihan ditemukan untuk kriteria ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BAYAR CEPAT */}
      {paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Konfirmasi Terima Uang</h3>
                 <p className="text-slate-500 text-sm mb-6">Pelanggan: <b className="text-slate-800 dark:text-slate-200">{paymentModal.name}</b></p>
                 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl mb-8">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total Tunai</p>
                    <p className="text-2xl font-black text-indigo-600">{formatter.format(paymentModal.amount)}</p>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button onClick={() => { onMarkPaid(paymentModal.id); setPaymentModal(null); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">LUNASKAN SEKARANG</button>
                    <button onClick={() => setPaymentModal(null)} className="w-full text-slate-400 font-bold uppercase text-xs hover:text-slate-600 transition-colors">Batal</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border dark:border-slate-800 animate-in zoom-in duration-200 overflow-hidden">
              <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Pilih Petugas Penagih</h3>
                    <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                 </div>
                 <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {collectors.map(c => (
                      <button key={c.id} onClick={() => handleBulkAssign(c.id)} className="w-full p-4 rounded-2xl border dark:border-slate-800 flex items-center justify-between hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95 group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center font-black">
                              {c.name.charAt(0)}
                           </div>
                           <div className="text-left">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{c.phone}</p>
                           </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                    {collectors.length === 0 && (
                       <p className="text-center py-10 text-slate-400 text-sm italic">Belum ada petugas Kang Tagih yang terdaftar.</p>
                    )}
                 </div>
                 <button onClick={() => setShowAssignModal(false)} className="w-full mt-6 py-4 text-slate-400 font-black text-sm uppercase hover:text-slate-600 transition-colors">Batal</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
