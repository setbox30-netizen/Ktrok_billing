
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Bill, Package, BillStatus, Status, PortalView, PaymentAccount, PaymentGatewayConfig } from '../types';

interface CustomerPortalProps {
  initialCustomer: Customer | null;
  customers: Customer[];
  packages: Package[];
  bills: Bill[];
  paymentAccounts: PaymentAccount[];
  gatewayConfig?: PaymentGatewayConfig;
  onPaymentSuccess: (billId: string, method: string) => void;
  onGatewayPaymentSuccess?: (billId: string, method: string) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onLogout: () => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
  businessName?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ 
  initialCustomer,
  customers, 
  packages, 
  bills, 
  paymentAccounts,
  gatewayConfig,
  onPaymentSuccess,
  onUpdateCustomer,
  onLogout,
  isSyncing = false,
  onManualSync,
  businessName = "WIFINET"
}) => {
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [view, setView] = useState<PortalView>('home');
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Dark Mode Logic
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });

  const myBills = bills.filter(b => b.customerId === customer?.id);
  const unpaidBills = myBills.filter(b => b.status === BillStatus.UNPAID);
  const myPackage = packages.find(p => p.id === customer?.packageId);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrint = (bill: Bill) => {
    const pkg = packages.find(p => p.id === customer?.packageId);
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Bukti Bayar - ${bill.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 58mm; 
              padding: 5mm; 
              font-size: 12px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .border-top { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 8px; }
            .status { 
                border: 2px solid #000; 
                display: inline-block; 
                padding: 2px 10px; 
                font-weight: bold; 
                margin-top: 10px;
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="center bold" style="font-size: 16px;">${businessName}</div>
          <div class="center">--------------------------------</div>
          
          <div class="mt-2">
            <div class="flex"><span>Tgl Bayar:</span> <span>${bill.paidAt ? bill.paidAt.split(' ')[0] : '-'}</span></div>
            <div class="flex"><span>No Struk:</span> <span>#${bill.id.substring(0, 8).toUpperCase()}</span></div>
            <div class="flex"><span>Nama:</span> <span class="bold">${customer?.name.substring(0, 15)}</span></div>
          </div>

          <div class="border-top mt-2">
            <div class="bold">PEMBAYARAN:</div>
            <div class="flex mt-1">
              <span>Paket ${pkg?.name || 'WiFi'}</span>
              <span>${formatter.format(bill.amount)}</span>
            </div>
            ${bill.penaltyAmount ? `
              <div class="flex">
                <span>Denda</span>
                <span>${formatter.format(bill.penaltyAmount)}</span>
              </div>
            ` : ''}
          </div>

          <div class="border-top mt-2">
            <div class="flex bold">
              <span>TOTAL BAYAR</span>
              <span>${formatter.format(bill.amount + (bill.penaltyAmount || 0))}</span>
            </div>
          </div>

          <div class="center mt-2">
            <div class="status">LUNAS / PAID</div>
          </div>

          <div class="center mt-2" style="font-size: 10px;">
            Bukti bayar elektronik sah.<br>Terima kasih.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleRequestChange = (pkg: Package) => {
    const isUpgrade = pkg.price > (myPackage?.price || 0);
    const action = isUpgrade ? 'Upgrade' : 'Downgrade';
    if (confirm(`Apakah Anda yakin ingin mengajukan ${action} ke paket ${pkg.name}? Permintaan Anda akan segera diproses oleh Admin.`)) {
      alert(`Permintaan ${action} ke ${pkg.name} telah dikirim! Tim kami akan menghubungi Anda melalui WhatsApp di nomor ${customer?.phone}.`);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (customer.password && oldPasswordInput !== customer.password) { alert('Password lama salah!'); return; }
    if (newPasswordInput.length < 6) { alert('Password baru minimal 6 karakter!'); return; }
    if (newPasswordInput !== confirmPasswordInput) { alert('Konfirmasi password baru tidak cocok!'); return; }
    onUpdateCustomer(customer.id, { password: newPasswordInput });
    setCustomer({ ...customer, password: newPasswordInput });
    setOldPasswordInput(''); setNewPasswordInput(''); setConfirmPasswordInput('');
    alert('Password berhasil diperbarui!');
    setView('home');
  };

  if (!customer) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Memuat Data Pelanggan...</p>
            </div>
        </div>
    );
  }

  const renderHome = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px]">Selamat Datang,</p>
                {isSyncing && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
             </div>
             <h2 className="text-2xl font-black mb-1 truncate pr-8">{customer.name}</h2>
             <p className="text-indigo-100 text-xs font-medium bg-white/20 inline-block px-2 py-1 rounded-lg backdrop-blur-sm">ID: {customer.id}</p>
          </div>
          <button onClick={() => setView('profile')} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors backdrop-blur-md">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
       </div>

       <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border dark:border-slate-800 shadow-sm transition-colors">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Status Akun</p>
             <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${customer.status === Status.ACTIVE ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{customer.status}</span>
             </div>
          </div>
          <button onClick={() => setView('package')} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border dark:border-slate-800 shadow-sm text-left hover:border-indigo-200 transition-all active:scale-95 group transition-colors">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Paket WiFi</p>
             <div className="flex items-center justify-between">
                <p className="font-black text-indigo-600 dark:text-indigo-400 truncate text-sm mr-2">{myPackage?.name || '...'}</p>
                <svg className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
             </div>
          </button>
       </div>

       {unpaidBills.length > 0 ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-5 rounded-[1.5rem] flex items-center justify-between animate-in zoom-in duration-300">
             <div>
                <p className="text-rose-600 dark:text-rose-400 font-black text-sm">{unpaidBills.length} Tagihan Belum Dibayar</p>
                <p className="text-rose-400 dark:text-rose-500 text-[10px] mt-0.5">Ketuk untuk melunasi</p>
             </div>
             <button onClick={() => setView('history')} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-rose-200 dark:shadow-none hover:scale-105 transition-transform active:scale-95">
                BAYAR
             </button>
          </div>
       ) : (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-[1.5rem] text-center">
             <p className="text-emerald-700 dark:text-emerald-400 font-black text-sm">Tagihan Lunas! ✨</p>
             <p className="text-emerald-500 dark:text-emerald-600 text-[10px]">Layanan berjalan normal.</p>
          </div>
       )}

       <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
               <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
               Transaksi Terakhir
            </h3>
            <button onClick={onManualSync} className={`p-1 text-slate-400 hover:text-indigo-600 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
          {myBills.length > 0 ? (
             <div className="flex items-center justify-between animate-in fade-in duration-500">
                <div>
                   <p className="font-black text-slate-800 dark:text-slate-100 text-lg">{formatter.format(myBills[myBills.length-1].amount + (myBills[myBills.length-1].penaltyAmount || 0))}</p>
                   <p className="text-slate-400 text-[10px] font-bold">Periode: {myBills[myBills.length-1].month}/{myBills[myBills.length-1].year}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    myBills[myBills.length-1].status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                    myBills[myBills.length-1].status === BillStatus.PENDING ? 'bg-amber-100 text-amber-700 animate-pulse' :
                    'bg-rose-100 text-rose-700'
                    }`}>
                    {myBills[myBills.length-1].status}
                    </span>
                    {myBills[myBills.length-1].status === BillStatus.PAID && (
                        <button onClick={() => handlePrint(myBills[myBills.length-1])} className="text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-tighter hover:underline">CETAK STRUK</button>
                    )}
                </div>
             </div>
          ) : (
             <p className="text-center text-slate-400 text-xs py-4 italic">Belum ada riwayat pembayaran.</p>
          )}
       </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
       <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Riwayat Tagihan</h3>
          {isSyncing && <span className="text-[10px] font-black text-indigo-500 animate-pulse">Syncing...</span>}
       </div>
       {myBills.length > 0 ? myBills.slice().reverse().map(b => (
          <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all active:scale-95 group transition-colors">
             <div>
                <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{formatter.format(b.amount + (b.penaltyAmount || 0))}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{months[parseInt(b.month)-1]} {b.year} <span className="text-indigo-600 mx-1">•</span> ID: #{b.id.substring(0,6).toUpperCase()}</p>
             </div>
             <div className="text-right flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                   b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                   b.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                   'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}>
                   {b.status === BillStatus.PENDING ? 'MENUNGGU' : b.status}
                </span>
                <div className="flex gap-2">
                    {b.status === BillStatus.PAID && (
                       <button onClick={(e) => { e.stopPropagation(); handlePrint(b); }} className="text-indigo-600 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 transition-all" title="Cetak Bukti">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                       </button>
                    )}
                    {b.status === BillStatus.UNPAID && (
                       <button onClick={() => { setPayingBill(b); setView('payment'); }} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md active:scale-90 transition-transform">
                          BAYAR
                       </button>
                    )}
                </div>
             </div>
          </div>
       )) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 opacity-50 transition-colors">
             <p className="font-bold text-slate-400 text-sm">Tidak ditemukan data tagihan.</p>
          </div>
       )}
    </div>
  );

  const renderPayment = () => {
    if (!payingBill) return null;
    const handleConfirmPayment = () => {
       const selectedAccount = paymentAccounts.find(a => a.id === selectedAccountId);
       if (!selectedAccount) return;
       onPaymentSuccess(payingBill.id, `${selectedAccount.type} - ${selectedAccount.providerName}`);
       setPayingBill(null); setSelectedAccountId(null); setView('history');
    };

    return (
       <div className="animate-in fade-in zoom-in duration-300 pb-20">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-xl relative transition-colors">
             <button onClick={() => setView('history')} className="absolute top-5 left-5 text-slate-400 hover:text-indigo-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
             </button>
             <div className="text-center pt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pembayaran</p>
                <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6">{formatter.format(payingBill.amount + (payingBill.penaltyAmount || 0))}</h3>
                
                <div className="space-y-4 text-left">
                   {paymentAccounts.length > 0 ? (
                       <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Metode Transfer Manual</p>
                            {paymentAccounts.map(acc => (
                                <button key={acc.id} onClick={() => setSelectedAccountId(acc.id)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-95 ${selectedAccountId === acc.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-50 dark:border-slate-800'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-[9px] text-white`}>
                                        {acc.providerName.substring(0, 3).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-800 dark:text-slate-100 text-xs">{acc.providerName}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">{acc.type}</p>
                                    </div>
                                </div>
                                {selectedAccountId === acc.id && <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white animate-in zoom-in"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>}
                                </button>
                            ))}
                       </div>
                   ) : (
                       <p className="text-center text-sm text-slate-400 py-4">Metode pembayaran manual tidak tersedia.</p>
                   )}
                </div>

                {selectedAccountId && (
                   <div className="mt-6 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 animate-in slide-in-from-top-4 text-left shadow-inner">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Rekening Tujuan</p>
                       <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-wider">
                                {paymentAccounts.find(a => a.id === selectedAccountId)?.accountNumber}
                            </p>
                            <button onClick={() => { navigator.clipboard.writeText(paymentAccounts.find(a => a.id === selectedAccountId)?.accountNumber || ''); alert('Nomor Rekening Disalin!'); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-black active:scale-90 transition-transform">SALIN</button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase italic">A.N. {paymentAccounts.find(a => a.id === selectedAccountId)?.accountHolder}</p>
                   </div>
                )}

                <div className="mt-8">
                   <button disabled={!selectedAccountId} onClick={handleConfirmPayment} className={`w-full py-4 rounded-xl font-black shadow-lg transition-all text-sm ${selectedAccountId ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}>
                      SAYA SUDAH TRANSFER
                   </button>
                </div>
             </div>
          </div>
       </div>
    );
  };

  const renderPackage = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Daftar Paket</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {packages.map(pkg => {
          const isCurrent = pkg.id === customer?.packageId;
          return (
            <div key={pkg.id} className={`p-5 rounded-[1.5rem] border-2 transition-all active:scale-[0.98] ${isCurrent ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-base">{pkg.name}</h4>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{pkg.speed}</p>
                </div>
                {isCurrent && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">SEDANG AKTIF</span>}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed">{pkg.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{formatter.format(pkg.price)}<span className="text-[10px] text-slate-400 font-bold">/bln</span></p>
                {!isCurrent && <button onClick={() => handleRequestChange(pkg)} className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-md active:scale-90 transition-transform">GANTI KE PAKET INI</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Akun & Keamanan</h3>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-colors">
        <h4 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Ubah Password Login
        </h4>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {customer.password && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">Password Lama</label>
              <input required type="password" value={oldPasswordInput} onChange={e => setOldPasswordInput(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm" placeholder="••••••••" />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">Password Baru</label>
            <input required type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm" placeholder="Minimal 6 karakter" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">Konfirmasi Password Baru</label>
            <input required type="password" value={confirmPasswordInput} onChange={e => setConfirmPasswordInput(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm" placeholder="Ulangi password baru" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 text-sm mt-2">
            SIMPAN PERUBAHAN
          </button>
        </form>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-[1.5rem] flex flex-col gap-3 transition-colors">
         <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Informasi Kontak</span>
            <span className="text-indigo-600 font-black text-[10px] uppercase">Terverifikasi</span>
         </div>
         <div className="flex justify-between">
            <span className="text-slate-400 text-xs font-bold">Nomor WhatsApp</span>
            <span className="text-slate-800 dark:text-slate-200 text-xs font-black">{customer.phone}</span>
         </div>
         <div className="flex justify-between">
            <span className="text-slate-400 text-xs font-bold">Alamat Terpasang</span>
            <span className="text-slate-800 dark:text-slate-200 text-xs font-black text-right max-w-[180px] break-words">{customer.address}</span>
         </div>
      </div>
      
      <button onClick={onLogout} className="w-full py-4 border-2 border-rose-500/30 text-rose-500 rounded-xl font-black text-sm active:bg-rose-50 transition-colors mb-20">KELUAR DARI AKUN</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter select-none transition-colors duration-300">
       <header className="bg-white dark:bg-slate-900 px-5 py-4 border-b dark:border-slate-800 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-200 dark:shadow-none">W</div>
             <span className="font-black text-slate-800 dark:text-slate-100 tracking-tighter text-sm">{businessName} Portal</span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                {isDark ? (
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>
                ) : (
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.75a8.986 8.986 0 01-8.25 8.25c-4.836 0-8.75-3.914-8.75-8.75s3.914-8.75 8.75-8.75c.42 0 .826.03 1.226.086A6.25 6.25 0 005.75 12.25c0 3.452 2.798 6.25 6.25 6.25 2.126 0 3.996-1.06 5.126-2.686a8.964 8.964 0 013.874 6.936z"/></svg>
                )}
             </button>
             {isSyncing && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>}
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-[10px]">
               {customer.name.charAt(0)}
             </div>
          </div>
       </header>

       <div className="max-w-xl mx-auto p-4 pb-28">
          {view === 'home' && renderHome()}
          {view === 'history' && renderHistory()}
          {view === 'payment' && renderPayment()}
          {view === 'package' && renderPackage()}
          {view === 'profile' && renderProfile()}
       </div>

       <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t dark:border-slate-800 px-6 py-3 flex justify-between z-40 max-w-xl mx-auto shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] pb-safe-area transition-colors">
          {[
            { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'package', label: 'Paket', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'history', label: 'Tagihan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { id: 'profile', label: 'Akun', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id as PortalView)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 ${view === item.id || (view === 'payment' && item.id === 'history') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon}/></svg>
               <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
       </nav>
    </div>
  );
};
