
import React, { useState, useEffect } from 'react';
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
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ 
  initialCustomer,
  customers, 
  packages, 
  bills, 
  paymentAccounts,
  gatewayConfig,
  onPaymentSuccess,
  onGatewayPaymentSuccess,
  onUpdateCustomer,
  onLogout 
}) => {
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [view, setView] = useState<PortalView>('home');
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Profile / Password state
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

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

  const handleRequestChange = (pkg: Package) => {
    const isUpgrade = pkg.price > (myPackage?.price || 0);
    const action = isUpgrade ? 'Upgrade' : 'Downgrade';
    if (confirm(`Ajukan ${action} ke paket ${pkg.name}?`)) {
      alert(`Permintaan ${action} terkirim! Admin akan menghubungi Anda.`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (customer.password && oldPasswordInput !== customer.password) {
      alert('Password lama salah!');
      return;
    }
    if (newPasswordInput.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      alert('Konfirmasi password baru tidak cocok!');
      return;
    }

    onUpdateCustomer(customer.id, { password: newPasswordInput });
    setCustomer({ ...customer, password: newPasswordInput });
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    alert('Password berhasil diperbarui!');
    setView('home');
  };

  if (!customer) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  // --- SUB COMPONENTS FOR CLEANER RENDER ---

  const Header = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between">
       <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => setView('home')} className="p-1 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
       </div>
       {!showBack && (
         <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
           {customer.name.charAt(0)}
         </div>
       )}
    </div>
  );

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
       {/* Hero Member Card */}
       <div className="relative w-full h-52 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800"></div>
          {/* Decorative Circles */}
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
             <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Member Card</p>
                  <h1 className="text-2xl font-black text-white tracking-tight">{customer.name}</h1>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20 ${customer.status === Status.ACTIVE ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                  {customer.status}
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-end gap-1">
                   <span className="text-white/60 text-xs font-medium mb-1">ID Pelanggan</span>
                   <p className="text-xl font-mono text-white tracking-wider">{customer.id}</p>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-white/30 to-transparent"></div>
                <div className="flex justify-between items-center">
                   <div>
                      <p className="text-indigo-200 text-[10px] font-bold uppercase">Paket Aktif</p>
                      <p className="text-white font-bold text-sm">{myPackage?.name || 'Loading...'}</p>
                   </div>
                   <div>
                      <p className="text-indigo-200 text-[10px] font-bold uppercase text-right">Kecepatan</p>
                      <p className="text-white font-bold text-sm text-right">{myPackage?.speed || '-'}</p>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Billing Status Widget */}
       <div className="grid grid-cols-1 gap-4">
         {unpaidBills.length > 0 ? (
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-lg shadow-rose-100/50 dark:shadow-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-bl-[3rem] -mr-4 -mt-4"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <h3 className="font-black text-rose-600 dark:text-rose-400 text-lg">Tagihan Belum Lunas</h3>
                 </div>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Anda memiliki <strong className="text-slate-800 dark:text-slate-200">{unpaidBills.length} tagihan</strong> yang belum dibayarkan.</p>
                 <button 
                   onClick={() => setView('history')}
                   className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    BAYAR SEKARANG <span className="font-mono">{formatter.format(unpaidBills.reduce((a,b) => a+b.amount, 0))}</span>
                 </button>
              </div>
           </div>
         ) : (
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                 <h3 className="font-black text-emerald-600 dark:text-emerald-400">Tagihan Lunas</h3>
                 <p className="text-slate-400 text-xs font-medium">Terima kasih telah melakukan pembayaran tepat waktu.</p>
              </div>
           </div>
         )}
       </div>

       {/* Menu Grid */}
       <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView('package')} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm hover:border-indigo-200 transition-all group text-left">
             <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
             </div>
             <p className="font-black text-slate-800 dark:text-slate-200">Paket Saya</p>
             <p className="text-[10px] text-slate-400">Upgrade & Cek Detail</p>
          </button>
          <button onClick={() => setView('profile')} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm hover:border-indigo-200 transition-all group text-left">
             <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
             </div>
             <p className="font-black text-slate-800 dark:text-slate-200">Akun</p>
             <p className="text-[10px] text-slate-400">Data Diri & Password</p>
          </button>
       </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
       <Header title="Riwayat Tagihan" showBack />
       <div className="p-4 space-y-4">
         {myBills.length > 0 ? myBills.slice().reverse().map((b, i) => (
            <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all" style={{ animationDelay: `${i * 50}ms` }}>
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                     b.status === BillStatus.PAID ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
                     b.status === BillStatus.PENDING ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                     'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                  }`}>
                     {b.month}
                  </div>
                  <div>
                     <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Bulan {b.month}/{b.year}</p>
                     <p className="text-xs text-slate-400 font-mono mt-0.5">#{b.id}</p>
                     <p className={`text-[10px] font-black uppercase mt-1 ${
                        b.status === BillStatus.PAID ? 'text-emerald-500' : 
                        b.status === BillStatus.PENDING ? 'text-amber-500' : 
                        'text-rose-500'
                     }`}>
                        {b.status === BillStatus.PAID ? 'Lunas' : b.status === BillStatus.PENDING ? 'Menunggu Konfirmasi' : 'Belum Bayar'}
                     </p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{formatter.format(b.amount + (b.penaltyAmount || 0))}</p>
                  {b.status === BillStatus.UNPAID && (
                     <button 
                        onClick={() => { setPayingBill(b); setView('payment'); }}
                        className="mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-lg shadow-slate-200 dark:shadow-none"
                     >
                        BAYAR
                     </button>
                  )}
               </div>
            </div>
         )) : (
            <div className="text-center py-20 opacity-50">
               <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
               <p className="text-slate-500 font-medium">Belum ada riwayat tagihan.</p>
            </div>
         )}
       </div>
    </div>
  );

  const renderPayment = () => {
    if (!payingBill) return null;
    
    const handleConfirmPayment = () => {
       const selectedAccount = paymentAccounts.find(a => a.id === selectedAccountId);
       if (!selectedAccount) return;
       
       alert(`Konfirmasi Pembayaran via ${selectedAccount.providerName} Berhasil Dikirim!`);
       onPaymentSuccess(payingBill.id, `${selectedAccount.type} - ${selectedAccount.providerName}`);
       setPayingBill(null);
       setSelectedAccountId(null);
       setView('history');
    };

    const getProviderTheme = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('bca')) return 'bg-blue-600';
      if (lower.includes('ovo')) return 'bg-purple-700';
      if (lower.includes('dana')) return 'bg-sky-500';
      if (lower.includes('gopay')) return 'bg-emerald-500';
      if (lower.includes('shopeepay')) return 'bg-orange-600';
      return 'bg-indigo-600';
    };

    return (
       <div className="animate-in fade-in slide-in-from-bottom-8 duration-300 pb-32">
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b dark:border-slate-800 p-4 flex items-center gap-3">
             <button onClick={() => setView('history')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
             </button>
             <h2 className="text-lg font-black">Pembayaran</h2>
          </div>

          <div className="p-4 space-y-6">
             <div className="text-center py-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total yang harus dibayar</p>
                <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{formatter.format(payingBill.amount)}</h1>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono text-slate-500">
                   ID TAGIHAN: {payingBill.id}
                </div>
             </div>

             <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 px-2">Pilih Metode Transfer</h3>
                <div className="grid grid-cols-1 gap-3">
                   {paymentAccounts.map(acc => (
                      <div 
                         key={acc.id}
                         onClick={() => setSelectedAccountId(acc.id)}
                         className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedAccountId === acc.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-none scale-[1.02]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-md ${getProviderTheme(acc.providerName)}`}>
                               {acc.providerName.substring(0,4)}
                            </div>
                            <div className="flex-1">
                               <p className="font-bold text-slate-800 dark:text-slate-200">{acc.providerName}</p>
                               <p className="text-xs text-slate-400 font-medium">{acc.type}</p>
                            </div>
                            {selectedAccountId === acc.id && (
                               <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {selectedAccountId && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Nomor Tujuan</p>
                      {copiedText && <span className="text-xs font-bold text-emerald-500 animate-pulse">Berhasil Disalin!</span>}
                   </div>
                   <div className="flex items-center gap-3">
                      <p className="text-2xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-wider truncate">
                         {paymentAccounts.find(a => a.id === selectedAccountId)?.accountNumber}
                      </p>
                      <button 
                         onClick={() => handleCopy(paymentAccounts.find(a => a.id === selectedAccountId)?.accountNumber || '')}
                         className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 text-slate-500 hover:text-indigo-600 active:scale-90 transition-transform"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                   </div>
                   <p className="text-xs text-slate-500 font-bold mt-2">A.N. {paymentAccounts.find(a => a.id === selectedAccountId)?.accountHolder}</p>
                </div>
             )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t dark:border-slate-800 max-w-xl mx-auto z-40">
             <button 
                disabled={!selectedAccountId}
                onClick={handleConfirmPayment}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all ${selectedAccountId ? 'bg-indigo-600 text-white shadow-indigo-300 dark:shadow-none active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
             >
                KONFIRMASI SUDAH TRANSFER
             </button>
          </div>
       </div>
    );
  };

  const renderPackage = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
       <Header title="Paket Internet" showBack />
       <div className="p-4 space-y-4">
          {packages.map(pkg => {
             const isCurrent = pkg.id === customer.packageId;
             return (
                <div key={pkg.id} className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${isCurrent ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'}`}>
                   {isCurrent && (
                      <div className="absolute top-0 right-0 bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl">
                         PAKET SAAT INI
                      </div>
                   )}
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h3 className={`text-lg font-black ${isCurrent ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{pkg.name}</h3>
                         <p className={`text-3xl font-black ${isCurrent ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>{pkg.speed}</p>
                      </div>
                   </div>
                   <p className={`text-xs leading-relaxed mb-6 ${isCurrent ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {pkg.description}
                   </p>
                   <div className="flex items-center justify-between">
                      <p className={`font-bold ${isCurrent ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{formatter.format(pkg.price)} <span className="text-[10px] opacity-70">/bulan</span></p>
                      {!isCurrent && (
                         <button onClick={() => handleRequestChange(pkg)} className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors">
                            PILIH
                         </button>
                      )}
                   </div>
                </div>
             );
          })}
       </div>
    </div>
  );

  const renderProfile = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
       <Header title="Profil Saya" showBack />
       <div className="p-4 space-y-6">
          <div className="text-center py-4">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-4">
                {customer.name.charAt(0)}
             </div>
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{customer.name}</h2>
             <p className="text-slate-500 dark:text-slate-400 font-medium">{customer.phone}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border dark:border-slate-800 shadow-sm">
             <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4">Alamat Pemasangan</h3>
             <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                {customer.address}
             </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border dark:border-slate-800 shadow-sm">
             <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4">Ganti Password</h3>
             <form onSubmit={handleChangePassword} className="space-y-4">
               {customer.password && (
                 <input 
                   type="password"
                   value={oldPasswordInput}
                   onChange={e => setOldPasswordInput(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold placeholder:font-normal"
                   placeholder="Password Lama"
                 />
               )}
               <input 
                 type="password"
                 value={newPasswordInput}
                 onChange={e => setNewPasswordInput(e.target.value)}
                 className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold placeholder:font-normal"
                 placeholder="Password Baru"
               />
               <input 
                 type="password"
                 value={confirmPasswordInput}
                 onChange={e => setConfirmPasswordInput(e.target.value)}
                 className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold placeholder:font-normal"
                 placeholder="Konfirmasi Password Baru"
               />
               <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                 SIMPAN PASSWORD
               </button>
             </form>
          </div>

          <button onClick={onLogout} className="w-full py-4 text-rose-500 font-black text-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-colors">
             KELUAR DARI APLIKASI
          </button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter text-slate-900 dark:text-slate-100">
       <div className="max-w-xl mx-auto min-h-screen relative bg-slate-50 dark:bg-slate-950 shadow-2xl">
          {view === 'home' && (
             <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">W</div>
                   <span className="font-black text-lg tracking-tight">WIFINET</span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800">
                   <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                      {customer.name.charAt(0)}
                   </div>
                </div>
             </div>
          )}

          <div className="p-4">
            {view === 'home' && renderHome()}
            {view === 'history' && renderHistory()}
            {view === 'payment' && renderPayment()}
            {view === 'package' && renderPackage()}
            {view === 'profile' && renderProfile()}
          </div>

          {/* Floating Dock Navigation */}
          {view !== 'payment' && (
             <div className="fixed bottom-6 left-6 right-6 max-w-[calc(36rem-3rem)] mx-auto z-40">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[2rem] shadow-2xl shadow-indigo-500/10 dark:shadow-none p-2 flex justify-between items-center">
                   {[
                      { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home' },
                      { id: 'package', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Paket' },
                      { id: 'history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Tagihan' },
                      { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Akun' },
                   ].map((item) => (
                      <button
                         key={item.id}
                         onClick={() => setView(item.id as PortalView)}
                         className={`relative flex flex-col items-center justify-center w-full h-14 rounded-2xl transition-all duration-300 ${view === item.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                         <svg className={`w-6 h-6 transition-transform duration-300 ${view === item.id ? '-translate-y-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                         </svg>
                         {view === item.id && (
                            <span className="absolute bottom-2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-in zoom-in"></span>
                         )}
                      </button>
                   ))}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};
