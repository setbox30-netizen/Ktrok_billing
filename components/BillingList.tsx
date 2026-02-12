
import React, { useState } from 'react';
import { Bill, Customer, BillStatus } from '../types';

interface BillingListProps {
  bills: Bill[];
  customers: Customer[];
  onGenerate: (month: string, year: number) => void;
  onMarkPaid: (id: string, penalty?: number) => void;
  onRejectPayment: (id: string) => void;
  onMarkMultiplePaid: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

export const BillingList: React.FC<BillingListProps> = ({ 
  bills, 
  customers, 
  onGenerate, 
  onMarkPaid, 
  onRejectPayment,
  onMarkMultiplePaid, 
  onDelete,
  onDeleteMultiple
}) => {
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'overdue' | 'unpaid' | 'paid'>('all');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  
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

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  const filteredBills = bills.filter(b => {
    const customer = customers.find(c => c.id === b.customerId);
    const matchesPeriod = b.month === filterMonth && b.year === filterYear;
    const matchesSearch = customer?.name.toLowerCase().includes(search.toLowerCase()) || 
                         b.id.toLowerCase().includes(search.toLowerCase()) || false;
    
    let matchesType = true;
    if (filterType === 'pending') matchesType = b.status === BillStatus.PENDING;
    if (filterType === 'overdue') matchesType = b.status === BillStatus.UNPAID && b.dueDate < today;
    if (filterType === 'unpaid') matchesType = b.status === BillStatus.UNPAID;
    if (filterType === 'paid') matchesType = b.status === BillStatus.PAID;

    return matchesPeriod && (search ? matchesSearch : true) && matchesType;
  });

  const sendReminder = (bill: Bill, customer: Customer) => {
    const isLate = bill.status === BillStatus.UNPAID && bill.dueDate < today;
    const greeting = isLate ? `*PERINGATAN JATUH TEMPO*` : `*TAGIHAN WIFI*`;
    const message = `${greeting}\n\nHalo Bapak/Ibu ${customer.name},\nKami informasikan tagihan WiFi periode ${months.find(m => m.value === bill.month)?.label} ${bill.year} sebesar *${formatter.format(bill.amount)}*.\n\n${isLate ? 'Tagihan Anda saat ini sudah melewati batas jatuh tempo ('+bill.dueDate+'). Mohon segera lakukan pembayaran untuk menghindari pemutusan layanan.' : 'Jatuh tempo pembayaran: ' + bill.dueDate + '.'}\n\nTerima kasih atas kerjasamanya.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBills.length && filteredBills.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBills.map(b => b.id));
    }
  };

  const handleBulkPaid = () => {
    const unpaidOnly = selectedIds.filter(id => {
       const b = bills.find(item => item.id === id);
       return b?.status === BillStatus.UNPAID || b?.status === BillStatus.PENDING;
    });
    if (unpaidOnly.length === 0) {
      alert('Semua tagihan terpilih sudah berstatus lunas.');
      return;
    }
    if (confirm(`Tandai ${unpaidOnly.length} tagihan sebagai LUNAS?`)) {
      onMarkMultiplePaid(unpaidOnly);
      setSelectedIds([]);
      setShowBulkMenu(false);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data tagihan terpilih? Tindakan ini tidak dapat dibatalkan.`)) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
      setShowBulkMenu(false);
    }
  };

  const openPaymentModal = (bill: Bill, customerName: string, isConfirmation: boolean = false) => {
    const isLate = bill.status === BillStatus.UNPAID && bill.dueDate < today;
    setPenaltyInput(isLate ? 10000 : (bill.penaltyAmount || 0));
    setPaymentModal({ id: bill.id, name: customerName, amount: bill.amount, isConfirmation });
  };

  const confirmPayment = () => {
    if (paymentModal) {
      onMarkPaid(paymentModal.id, penaltyInput);
      setPaymentModal(null);
      setPenaltyInput(0);
      setDetailBill(null); 
    }
  };

  const handleReject = (billId: string) => {
    if (confirm('Apakah Anda yakin ingin menolak konfirmasi pembayaran ini? Status tagihan akan kembali menjadi BELUM BAYAR.')) {
      onRejectPayment(billId);
      setDetailBill(null);
    }
  };

  const handlePrint = (bill: Bill) => {
    alert(`Mencetak Invoice #${bill.id.toUpperCase()}...\n(Fitur ini akan membuka jendela cetak PDF pada versi produksi)`);
  };

  const activeCount = customers.filter(c => c.status === 'Active').length;
  const currentPeriodTotalBills = bills.filter(b => b.month === filterMonth && b.year === filterYear);
  const overdueCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today).length;
  const pendingCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.PENDING).length;

  const getDetailCustomer = detailBill ? customers.find(c => c.id === detailBill.customerId) : null;
  const getDetailHistory = detailBill ? bills.filter(b => b.customerId === detailBill.customerId).sort((a,b) => b.year - a.year || parseInt(b.month) - parseInt(a.month)) : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Manajemen Tagihan</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
             {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-200 dark:shadow-none">
                   {pendingCount} Verifikasi Masuk
                </span>
             )}
             <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${overdueCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                {overdueCount} Overdue
             </span>
             <p className="text-slate-500 dark:text-slate-400 text-xs font-medium ml-1">
                Aktif: {activeCount} | Terbit: {currentPeriodTotalBills.length}
             </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <div className="relative z-20">
                <button 
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-amber-100 dark:shadow-none transition-all text-sm active:scale-95"
                >
                  Tindakan Masal ({selectedIds.length})
                  <svg className={`w-4 h-4 transition-transform ${showBulkMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {showBulkMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                    <button onClick={handleBulkPaid} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                       Bayar Lunas
                    </button>
                    <button onClick={handleBulkDelete} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       Hapus Permanen
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
                onClick={() => onGenerate(filterMonth, filterYear)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg transition-all text-sm active:scale-95 ${
                  currentPeriodTotalBills.length >= activeCount && activeCount > 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                }`}
                disabled={currentPeriodTotalBills.length >= activeCount && activeCount > 0}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Terbitkan Tagihan
            </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto pb-0 hide-scrollbar">
        {[
          { id: 'all', label: 'Semua Data' },
          { id: 'pending', label: `Verifikasi (${pendingCount})` },
          { id: 'unpaid', label: 'Belum Bayar' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'paid', label: 'Lunas' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${filterType === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {tab.label}
            {filterType === tab.id && <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full animate-in fade-in duration-300"></span>}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Pencarian Cepat</label>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Nama / Invoice..." className="w-full pl-9 pr-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Bulan</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Tahun</label>
          <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1 bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center">
            <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Total Terfilter</p>
            <p className="font-black text-indigo-700 dark:text-indigo-300 text-lg leading-tight">
                {formatter.format(filteredBills.reduce((acc, b) => acc + b.amount + (b.penaltyAmount || 0), 0))}
            </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer" onChange={toggleSelectAll} checked={filteredBills.length > 0 && selectedIds.length === filteredBills.length} />
                </th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Pelanggan & Invoice</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Jumlah Tagihan</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right whitespace-nowrap">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredBills.length > 0 ? filteredBills.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const isOverdue = b.status === BillStatus.UNPAID && b.dueDate < today;
                const isPending = b.status === BillStatus.PENDING;
                const isSelected = selectedIds.includes(b.id);
                return (
                  <tr 
                    key={b.id} 
                    onClick={() => setDetailBill(b)}
                    className={`transition-all duration-200 cursor-pointer group ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/20' : isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer" checked={isSelected} onChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{customer?.name || 'N/A'}</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">ID: #{b.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="font-black text-slate-800 dark:text-slate-200">{formatter.format(b.amount + (b.penaltyAmount || 0))}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Jatuh Tempo: {b.dueDate}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform duration-200 hover:scale-105 cursor-default ${
                        b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                        b.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                        isOverdue ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {b.status === BillStatus.PAID ? 'Lunas' : b.status === BillStatus.PENDING ? 'Menunggu' : isOverdue ? 'Overdue' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDetailBill(b)} className="text-slate-400 hover:text-indigo-600 p-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button onClick={() => onDelete(b.id)} className="text-slate-300 dark:text-slate-700 hover:text-rose-600 p-2 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20 grayscale">
                       <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                       <p className="font-black uppercase tracking-widest text-sm">Tidak ada tagihan ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL TAGIHAN (LENGKAP) */}
      {detailBill && getDetailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-lg p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 animate-in zoom-in duration-300">
              {/* Header Modal */}
              <div className="px-8 py-6 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center shrink-0 border-b border-white/10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg">
                       {getDetailCustomer.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-black text-xl tracking-tight leading-none mb-1">Detail Tagihan</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">INV #{detailBill.id.toUpperCase()}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handlePrint(detailBill)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title="Print Invoice">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    </button>
                    <button onClick={() => setDetailBill(null)} className="p-2.5 hover:bg-rose-600 rounded-xl transition-all text-slate-400 hover:text-white">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bagian Informasi Pelanggan */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 mb-2">
                          <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Pelanggan</h4>
                       </div>
                       <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border dark:border-slate-700">
                          <p className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">{getDetailCustomer.name}</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-3">{getDetailCustomer.phone}</p>
                          <div className="pt-3 border-t dark:border-slate-700">
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Alamat Pemasangan</p>
                             <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{getDetailCustomer.address}</p>
                          </div>
                       </div>
                    </div>

                    {/* Bagian Rincian Invoice */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 mb-2">
                          <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Periode</h4>
                       </div>
                       <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border dark:border-slate-700 space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] text-slate-400 font-black uppercase">Bulan Tagihan</span>
                             <span className="text-xs font-black text-slate-800 dark:text-slate-200">{months.find(m => m.value === detailBill.month)?.label} {detailBill.year}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] text-slate-400 font-black uppercase">Jatuh Tempo</span>
                             <span className={`text-xs font-black px-2 py-1 rounded-lg ${detailBill.status === BillStatus.UNPAID && detailBill.dueDate < today ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                                {detailBill.dueDate}
                             </span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] text-slate-400 font-black uppercase">Metode Bayar</span>
                             <span className="text-xs font-black text-indigo-600">{detailBill.paymentMethod || 'Belum Ditentukan'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Financial Breakdown (Highlight) */}
                 <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100 dark:shadow-none space-y-5 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 space-y-3">
                       <div className="flex justify-between items-center text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em]">
                          <span>Nilai Paket Pokok</span>
                          <span>{formatter.format(detailBill.amount)}</span>
                       </div>
                       <div className="flex justify-between items-center text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em]">
                          <span>Denda Keterlambatan</span>
                          <span className={detailBill.penaltyAmount ? 'text-amber-300' : ''}>+ {formatter.format(detailBill.penaltyAmount || 0)}</span>
                       </div>
                       <div className="pt-5 border-t border-white/20 flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-indigo-200 uppercase mb-1">Total Pembayaran</p>
                             <h4 className="text-3xl font-black tracking-tighter">{formatter.format(detailBill.amount + (detailBill.penaltyAmount || 0))}</h4>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner transition-transform duration-200 hover:scale-110 cursor-default ${
                             detailBill.status === BillStatus.PAID ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/20 text-white'
                          }`}>
                             {detailBill.status === BillStatus.PAID ? 'Lunas' : detailBill.status === BillStatus.PENDING ? 'Menunggu' : detailBill.status}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Riwayat Pembayaran Pelanggan Terkait */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Riwayat Transaksi Pelanggan</h4>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{getDetailHistory.length} Transaksi Tercatat</span>
                    </div>
                    {getDetailHistory.length > 0 ? (
                       <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {getDetailHistory.map(hist => (
                             <div key={hist.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                                hist.id === detailBill.id 
                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800 ring-2 ring-indigo-500/20' 
                                : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50'
                             }`}>
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${
                                      hist.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                   }`}>
                                      {hist.month}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{months.find(m => m.value === hist.month)?.label} {hist.year}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase">ID: {hist.id.substring(0,6)}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-black text-slate-800 dark:text-slate-200">{formatter.format(hist.amount + (hist.penaltyAmount || 0))}</p>
                                   <p className={`text-[8px] font-black uppercase tracking-widest ${hist.status === BillStatus.PAID ? 'text-emerald-500' : 'text-rose-400'}`}>
                                      {hist.status === BillStatus.PAID ? `Lunas • ${hist.paidAt?.split(' ')[0]}` : hist.status === BillStatus.PENDING ? 'Menunggu' : hist.status}
                                   </p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="text-center py-10 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 italic">Belum ada riwayat transaksi sebelumnya.</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Footer Aksi Modal */}
              <div className="px-8 py-6 bg-white dark:bg-slate-950 border-t dark:border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
                 {detailBill.status === BillStatus.PENDING ? (
                    <>
                       <button onClick={() => openPaymentModal(detailBill, getDetailCustomer.name, true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                          KONFIRMASI LUNAS
                       </button>
                       <button onClick={() => handleReject(detailBill.id)} className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-sm hover:bg-rose-100 transition-all active:scale-95">TOLAK BUKTI</button>
                    </>
                 ) : detailBill.status === BillStatus.UNPAID ? (
                    <>
                       <button onClick={() => openPaymentModal(detailBill, getDetailCustomer.name)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          CATAT PEMBAYARAN
                       </button>
                       <button onClick={() => sendReminder(detailBill, getDetailCustomer)} className="flex-1 bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black text-sm hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          KIRIM PENGINGAT
                       </button>
                    </>
                 ) : (
                    <button onClick={() => setDetailBill(null)} className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-black text-sm transition-all active:scale-95">TUTUP DETAIL</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL PROSES PEMBAYARAN */}
      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-200">
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-none">
                    {paymentModal.isConfirmation ? 'Validasi Pembayaran' : 'Proses Bayar'}
                 </h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Pelanggan: <b className="text-slate-800 dark:text-slate-200 font-black">{paymentModal.name}</b></p>
                 
                 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl mb-8 text-left border dark:border-slate-700 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tagihan Pokok</span>
                       <span className="font-bold text-slate-800 dark:text-slate-200">{formatter.format(paymentModal.amount)}</span>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Input Denda (Opsional)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-3 text-xs font-black text-slate-400">Rp</span>
                          <input 
                            type="number" 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 font-black text-rose-600 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" 
                            value={penaltyInput} 
                            onChange={(e) => setPenaltyInput(parseInt(e.target.value) || 0)} 
                          />
                       </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">Total Akhir</span>
                       <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{formatter.format(paymentModal.amount + penaltyInput)}</span>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                    <button onClick={confirmPayment} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                       SIMPAN PEMBAYARAN
                    </button>
                    <button onClick={() => setPaymentModal(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95">Batalkan</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
