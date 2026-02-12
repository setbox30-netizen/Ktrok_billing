
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
    const matchesSearch = customer?.name.toLowerCase().includes(search.toLowerCase()) || false;
    
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

  const handleBulkReminder = () => {
    const unpaidSelected = filteredBills.filter(b => selectedIds.includes(b.id) && b.status === BillStatus.UNPAID);
    if (unpaidSelected.length === 0) {
      alert('Pilih setidaknya satu tagihan yang belum lunas untuk dikirimi pengingat.');
      return;
    }

    if (confirm(`Kirim pengingat WhatsApp ke ${unpaidSelected.length} pelanggan? (Tiap pengingat akan dibuka di tab baru)`)) {
      unpaidSelected.forEach(bill => {
        const customer = customers.find(c => c.id === bill.customerId);
        if (customer) {
          sendReminder(bill, customer);
        }
      });
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
      setDetailBill(null); // Close detail if it was open
    }
  };

  const handleReject = (billId: string) => {
    if (confirm('Apakah Anda yakin ingin menolak konfirmasi pembayaran ini? Status tagihan akan kembali menjadi BELUM BAYAR.')) {
      onRejectPayment(billId);
      setDetailBill(null);
    }
  };

  const activeCount = customers.filter(c => c.status === 'Active').length;
  const currentPeriodTotalBills = bills.filter(b => b.month === filterMonth && b.year === filterYear);
  const overdueCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today).length;
  const pendingCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.PENDING).length;

  const getDetailCustomer = detailBill ? customers.find(c => c.id === detailBill.customerId) : null;
  const getDetailHistory = detailBill ? bills.filter(b => b.customerId === detailBill.customerId && b.id !== detailBill.id) : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Tagihan</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
             {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 animate-pulse">
                   {pendingCount} Verifikasi
                </span>
             )}
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${overdueCount > 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'}`}>
                {overdueCount} Telat
             </span>
             <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Aktif: {activeCount} | Terbit: {currentPeriodTotalBills.length}
             </p>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <div className="relative z-20">
                <button 
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all text-sm"
                >
                  Bulk ({selectedIds.length})
                  <svg className={`w-4 h-4 transition-transform ${showBulkMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {showBulkMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                    <button onClick={handleBulkPaid} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                       Bayar Lunas
                    </button>
                    <button onClick={handleBulkReminder} className="w-full text-left px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                       Kirim Pengingat
                    </button>
                    <button onClick={handleBulkDelete} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       Hapus Tagihan
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
                onClick={() => onGenerate(filterMonth, filterYear)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg transition-all text-sm ${
                  currentPeriodTotalBills.length >= activeCount && activeCount > 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                disabled={currentPeriodTotalBills.length >= activeCount && activeCount > 0}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span className="truncate">Generate</span>
            </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto pb-0 hide-scrollbar">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pending', label: `Konfirmasi (${pendingCount})` },
          { id: 'unpaid', label: 'Belum Bayar' },
          { id: 'overdue', label: 'Telat Bayar' },
          { id: 'paid', label: 'Lunas' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${filterType === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {tab.label}
            {filterType === tab.id && <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cari</label>
          <input type="text" placeholder="Nama..." className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
          <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1 bg-indigo-50 dark:bg-indigo-950/20 p-2 rounded-xl text-center border border-indigo-100 dark:border-indigo-900">
            <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase">Total Filtered</p>
            <p className="font-black text-indigo-700 dark:text-indigo-300">{formatter.format(filteredBills.reduce((acc, b) => acc + b.amount + (b.penaltyAmount || 0), 0))}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700" onChange={toggleSelectAll} checked={filteredBills.length > 0 && selectedIds.length === filteredBills.length} />
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Pelanggan</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Tagihan</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredBills.length > 0 ? filteredBills.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const isOverdue = b.status === BillStatus.UNPAID && b.dueDate < today;
                const isPending = b.status === BillStatus.PENDING;
                const isSelected = selectedIds.includes(b.id);
                return (
                  <tr key={b.id} className={`transition-colors cursor-pointer group ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700" checked={isSelected} onChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setDetailBill(b)}>
                       <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{customer?.name || 'N/A'}</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">#{b.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setDetailBill(b)}>
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatter.format(b.amount)}</span>
                          <span className="text-[10px] text-slate-400">{months.find(m => m.value === b.month)?.label}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => setDetailBill(b)}>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                        b.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                        isOverdue ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {b.status === BillStatus.PAID ? 'Lunas' : b.status === BillStatus.PENDING ? 'Cek' : isOverdue ? 'Telat' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {isPending && customer && (
                         <div className="flex justify-end gap-1">
                            <button onClick={() => openPaymentModal(b, customer.name, true)} title="Setujui" className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-black shadow-md transition-transform active:scale-95">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                            </button>
                            <button onClick={() => handleReject(b.id)} title="Tolak" className="bg-rose-100 text-rose-600 p-2 rounded-lg text-xs font-bold transition-transform active:scale-95">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                         </div>
                      )}
                      {!isPending && b.status === BillStatus.UNPAID && customer && (
                        <>
                          <button onClick={() => sendReminder(b, customer)} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg transition-transform active:scale-95">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          </button>
                          <button onClick={() => openPaymentModal(b, customer.name)} className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95">
                            Bayar
                          </button>
                        </>
                      )}
                      <button onClick={() => onDelete(b.id)} className="text-slate-300 dark:text-slate-700 hover:text-rose-600 p-2 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center opacity-30 dark:opacity-10 text-slate-400">Tidak ada tagihan ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {detailBill && getDetailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800 animate-in zoom-in duration-300">
              <div className="px-8 py-6 bg-slate-800 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="font-black text-xl tracking-tight">Detail Tagihan</h3>
                    <p className="text-xs text-slate-400 font-mono">Invoice ID: #{detailBill.id.toUpperCase()}</p>
                 </div>
                 <button onClick={() => setDetailBill(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Info */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Informasi Pelanggan</h4>
                       <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{getDetailCustomer.name}</p>
                          <p className="text-xs text-slate-500 font-medium">Customer ID: {getDetailCustomer.id}</p>
                          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{getDetailCustomer.address}</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-bold">{getDetailCustomer.phone}</p>
                       </div>
                    </div>

                    {/* Bill Info */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Rincian Periode</h4>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500 font-bold">Bulan / Tahun</span>
                             <span className="text-xs font-black text-slate-800 dark:text-slate-200">{months.find(m => m.value === detailBill.month)?.label} {detailBill.year}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500 font-bold">Jatuh Tempo</span>
                             <span className="text-xs font-black text-rose-600">{detailBill.dueDate}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Payment Status & Details */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Status & Pembayaran</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col justify-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                          <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                             detailBill.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                             detailBill.status === BillStatus.PENDING ? 'bg-amber-100 text-amber-700' : 
                             'bg-rose-100 text-rose-700'
                          }`}>
                             {detailBill.status}
                          </span>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Metode</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{detailBill.paymentMethod || '-'}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tanggal Bayar</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{detailBill.paidAt ? detailBill.paidAt.split(' ')[0] : '-'}</p>
                       </div>
                    </div>
                 </div>

                 {/* Financial Breakdown */}
                 <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                    <div className="flex justify-between items-center text-indigo-100 text-xs font-bold uppercase tracking-widest">
                       <span>Tagihan Pokok</span>
                       <span>{formatter.format(detailBill.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-indigo-100 text-xs font-bold uppercase tracking-widest">
                       <span>Denda / Penalty</span>
                       <span>{formatter.format(detailBill.penaltyAmount || 0)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                       <span className="text-sm font-black uppercase tracking-tight">Total Akhir</span>
                       <span className="text-2xl font-black">{formatter.format(detailBill.amount + (detailBill.penaltyAmount || 0))}</span>
                    </div>
                 </div>

                 {/* Riwayat Pembayaran */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Tagihan Lainnya (Pelanggan Ini)</h4>
                    {getDetailHistory.length > 0 ? (
                       <div className="space-y-2">
                          {getDetailHistory.slice().reverse().map(hist => (
                             <div key={hist.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors">
                                <div>
                                   <p className="text-xs font-black text-slate-800 dark:text-slate-200">{months.find(m => m.value === hist.month)?.label} {hist.year}</p>
                                   <p className="text-[10px] text-slate-400 font-mono">#{hist.id.toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-black text-slate-700 dark:text-slate-300">{formatter.format(hist.amount + (hist.penaltyAmount || 0))}</p>
                                   <span className={`text-[8px] font-black uppercase ${hist.status === BillStatus.PAID ? 'text-emerald-500' : 'text-rose-500'}`}>{hist.status}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <p className="text-center text-xs text-slate-400 py-4 italic">Tidak ada tagihan lain.</p>
                    )}
                 </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
                 {detailBill.status === BillStatus.PENDING ? (
                    <>
                       <button onClick={() => openPaymentModal(detailBill, getDetailCustomer.name, true)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-transform active:scale-95">SETUJUI PEMBAYARAN</button>
                       <button onClick={() => handleReject(detailBill.id)} className="flex-1 bg-rose-100 text-rose-600 py-4 rounded-2xl font-black text-sm transition-transform active:scale-95">TOLAK / REJECT</button>
                    </>
                 ) : detailBill.status === BillStatus.UNPAID ? (
                    <>
                       <button onClick={() => openPaymentModal(detailBill, getDetailCustomer.name)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-transform active:scale-95">CATAT PEMBAYARAN</button>
                       <button onClick={() => sendReminder(detailBill, getDetailCustomer)} className="flex-1 bg-emerald-100 text-emerald-700 py-4 rounded-2xl font-black text-sm transition-transform active:scale-95 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          KIRIM WA
                       </button>
                    </>
                 ) : (
                    <button onClick={() => setDetailBill(null)} className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-black text-sm transition-transform active:scale-95">TUTUP</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border dark:border-slate-800">
              <div className="p-8 text-center">
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
                    {paymentModal.isConfirmation ? 'Konfirmasi' : 'Bayar'}
                 </h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Menerima setoran dari <b>{paymentModal.name}</b></p>
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 text-left border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-slate-500 font-bold uppercase">Pokok:</span>
                       <span className="font-bold text-slate-800 dark:text-slate-200">{formatter.format(paymentModal.amount)}</span>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs text-slate-500 font-bold uppercase">Denda:</label>
                       <input type="number" className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl py-2 px-4 font-black text-rose-600 outline-none focus:ring-2 focus:ring-indigo-500" value={penaltyInput} onChange={(e) => setPenaltyInput(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                       <span className="text-sm text-slate-800 dark:text-slate-200 font-bold">TOTAL:</span>
                       <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatter.format(paymentModal.amount + penaltyInput)}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button onClick={confirmPayment} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-transform active:scale-95">
                       PROSES
                    </button>
                    <button onClick={() => setPaymentModal(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl font-bold transition-transform active:scale-95">Batal</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
