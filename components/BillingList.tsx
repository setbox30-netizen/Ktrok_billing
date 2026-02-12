
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
  const [penaltyInput, setPenaltyInput] = useState<number>(0);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

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
    }
  };

  const handleReject = (billId: string) => {
    if (confirm('Apakah Anda yakin ingin menolak konfirmasi pembayaran ini? Status tagihan akan kembali menjadi BELUM BAYAR.')) {
      onRejectPayment(billId);
    }
  };

  const activeCount = customers.filter(c => c.status === 'Active').length;
  const currentPeriodTotalBills = bills.filter(b => b.month === filterMonth && b.year === filterYear);
  const overdueCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today).length;
  const pendingCount = currentPeriodTotalBills.filter(b => b.status === BillStatus.PENDING).length;

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

      {/* Filters: Stack on mobile, Grid on Tablet/Desktop */}
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
                  <tr key={b.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700" checked={isSelected} onChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="font-bold text-slate-800 dark:text-slate-200">{customer?.name || 'N/A'}</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">#{b.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatter.format(b.amount)}</span>
                          <span className="text-[10px] text-slate-400">{months.find(m => m.value === b.month)?.label}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                        b.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                        isOverdue ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {b.status === BillStatus.PAID ? 'Lunas' : b.status === BillStatus.PENDING ? 'Cek' : isOverdue ? 'Telat' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {isPending && customer && (
                         <div className="flex justify-end gap-1">
                            <button onClick={() => openPaymentModal(b, customer.name, true)} title="Setujui" className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-black shadow-md">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                            </button>
                            <button onClick={() => handleReject(b.id)} title="Tolak" className="bg-rose-100 text-rose-600 p-2 rounded-lg text-xs font-bold">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                         </div>
                      )}
                      {!isPending && b.status === BillStatus.UNPAID && customer && (
                        <>
                          <button onClick={() => sendReminder(b, customer)} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          </button>
                          <button onClick={() => openPaymentModal(b, customer.name)} className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold shadow-md">
                            Bayar
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewingBill(b)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-2 rounded-lg transition-colors" title="Lihat Detail">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => onDelete(b.id)} className="text-slate-300 dark:text-slate-700 hover:text-rose-600 p-2">
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

      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border dark:border-slate-800 animate-in fade-in zoom-in duration-200">
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
                       <input type="number" className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl py-2 px-4 font-black text-rose-600 outline-none" value={penaltyInput} onChange={(e) => setPenaltyInput(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                       <span className="text-sm text-slate-800 dark:text-slate-200 font-bold">TOTAL:</span>
                       <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatter.format(paymentModal.amount + penaltyInput)}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button onClick={confirmPayment} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg">
                       PROSES
                    </button>
                    <button onClick={() => setPaymentModal(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl font-bold">Batal</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {viewingBill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Detail Tagihan</h3>
                    <button onClick={() => setViewingBill(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-center mb-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
                            viewingBill.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                            viewingBill.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                            'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                        }`}>
                            {viewingBill.status}
                        </span>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatter.format(viewingBill.amount)}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Periode: {months.find(m => m.value === viewingBill.month)?.label} {viewingBill.year}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b dark:border-slate-800">
                            <span className="text-sm text-slate-500 dark:text-slate-400">ID Tagihan</span>
                            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">#{viewingBill.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b dark:border-slate-800">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Pelanggan</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-right">{customers.find(c => c.id === viewingBill.customerId)?.name || '-'}</span>
                        </div>
                        
                        {viewingBill.status === BillStatus.PAID && (
                            <>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl mt-4">
                                    <h5 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase mb-3 border-b border-emerald-200 dark:border-emerald-800 pb-2">Riwayat Pembayaran</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-emerald-600 dark:text-emerald-500">Tanggal Bayar</span>
                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{viewingBill.paidAt ? new Date(viewingBill.paidAt).toLocaleString('id-ID') : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-emerald-600 dark:text-emerald-500">Metode</span>
                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{viewingBill.paymentMethod || 'Manual'}</span>
                                        </div>
                                        {viewingBill.penaltyAmount ? (
                                             <div className="flex justify-between">
                                                <span className="text-xs text-emerald-600 dark:text-emerald-500">Denda Keterlambatan</span>
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">+{formatter.format(viewingBill.penaltyAmount)}</span>
                                            </div>
                                        ) : null}
                                        <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800 mt-2">
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Total Diterima</span>
                                            <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{formatter.format(viewingBill.amount + (viewingBill.penaltyAmount || 0))}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {(viewingBill.status === BillStatus.UNPAID || viewingBill.status === BillStatus.PENDING) && (
                            <div className="flex justify-between py-2 border-b dark:border-slate-800">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Jatuh Tempo</span>
                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{viewingBill.dueDate}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex justify-end">
                    <button onClick={() => setViewingBill(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors hover:bg-slate-300 dark:hover:bg-slate-700">Tutup</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
