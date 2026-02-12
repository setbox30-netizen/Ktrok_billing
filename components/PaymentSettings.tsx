
import React, { useState } from 'react';
import { PaymentAccount, PaymentType, PaymentGatewayConfig, PaymentGatewayProvider } from '../types';

interface PaymentSettingsProps {
  accounts: PaymentAccount[];
  gatewayConfig?: PaymentGatewayConfig;
  onAdd: (acc: Omit<PaymentAccount, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<PaymentAccount>) => void;
  onDelete: (id: string) => void;
  onUpdateGateway?: (config: PaymentGatewayConfig) => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ 
  accounts, 
  gatewayConfig = { provider: 'MANUAL', isActive: false, isSandbox: true }, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onUpdateGateway 
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'gateway'>('manual');
  
  // Manual Account States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<PaymentAccount, 'id'>>({
    type: 'BANK',
    providerName: '',
    accountNumber: '',
    accountHolder: ''
  });

  // Gateway Config State
  const [gwConfig, setGwConfig] = useState<PaymentGatewayConfig>(gatewayConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const handleGatewaySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateGateway) {
      onUpdateGateway(gwConfig);
      alert('Konfirmasi Gateway Berhasil Disimpan!');
    }
  };

  const openEdit = (acc: PaymentAccount) => {
    setEditingId(acc.id);
    setFormData({
      type: acc.type,
      providerName: acc.providerName,
      accountNumber: acc.accountNumber,
      accountHolder: acc.accountHolder
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ type: 'BANK', providerName: '', accountNumber: '', accountHolder: '' });
  };

  const getProviderTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('bca')) return 'bg-blue-600';
    if (lower.includes('mandiri')) return 'bg-yellow-500';
    if (lower.includes('bri')) return 'bg-blue-800';
    if (lower.includes('ovo')) return 'bg-purple-700';
    if (lower.includes('dana')) return 'bg-sky-500';
    if (lower.includes('gopay')) return 'bg-emerald-500';
    if (lower.includes('shopeepay')) return 'bg-orange-600';
    if (lower.includes('qris')) return 'bg-slate-800';
    return 'bg-indigo-600';
  };

  const getProviderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('qris')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m-3.322-.678l.707.707M5.422 6.422l.707.707M4 12h1m-.678 3.322l.707-.707M6.422 18.578l.707-.707M12 20v-1m3.322.678l-.707-.707M18.578 17.578l-.707-.707M20 12h-1m.678-3.322l-.707.707M18.578 5.422l-.707.707M12 12v0" />
          <rect width="4" height="4" x="7" y="7" rx="1" strokeWidth="2"/>
          <rect width="4" height="4" x="13" y="13" rx="1" strokeWidth="2"/>
        </svg>
      );
    }
    if (lower.includes('ovo') || lower.includes('dana') || lower.includes('gopay') || lower.includes('shopeepay') || lower.includes('linkaja')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Metode Pembayaran</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola rekening manual dan integrasi payment gateway.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border dark:border-slate-800 shadow-sm w-full md:w-auto">
          <button onClick={() => setActiveTab('manual')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Manual Transfer</button>
          <button onClick={() => setActiveTab('gateway')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gateway' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Payment Gateway</button>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <>
            <div className="flex justify-end">
                <button 
                onClick={() => setShowModal(true)}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg transition-all active:scale-95"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Tambah Metode Manual
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                <div key={acc.id} className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-all group relative">
                    <div className={`h-2 ${getProviderTheme(acc.providerName)}`}></div>
                    <div className="p-6">
                    <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(acc)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button onClick={() => onDelete(acc.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-5">
                        <div className={`w-12 h-12 ${getProviderTheme(acc.providerName)} rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-inner uppercase`}>
                        {getProviderIcon(acc.providerName)}
                        </div>
                        <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100 leading-none">{acc.providerName}</h4>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{acc.type}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Channel Aktif</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {acc.type === 'QRIS' ? 'Konten / Identifier' : 'Nomor Rekening / HP'}
                        </p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-wider truncate">
                            {acc.accountNumber}
                        </p>
                        </div>
                        <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pemilik</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{acc.accountHolder}</p>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
                {accounts.length === 0 && (
                <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center opacity-40">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    <p className="font-bold text-lg text-slate-600 dark:text-slate-400">Belum ada metode bayar terdaftar</p>
                </div>
                )}
            </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Konfigurasi Gateway</h3>
                        <p className="text-slate-500 text-sm">Integrasi Midtrans atau Xendit untuk pembayaran otomatis.</p>
                    </div>
                </div>

                <form onSubmit={handleGatewaySave} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Pilih Provider</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['MANUAL', 'MIDTRANS', 'XENDIT'] as PaymentGatewayProvider[]).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setGwConfig({...gwConfig, provider: p})}
                                    className={`py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${gwConfig.provider === p ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                                >
                                    <span className="font-black text-sm">{p}</span>
                                    {p !== 'MANUAL' && <span className="text-[9px] uppercase tracking-wide opacity-70">Automated</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {gwConfig.provider !== 'MANUAL' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 fade-in">
                            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    id="isSandbox"
                                    checked={gwConfig.isSandbox}
                                    onChange={(e) => setGwConfig({...gwConfig, isSandbox: e.target.checked})}
                                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                                />
                                <label htmlFor="isSandbox" className="text-sm font-bold text-amber-800 dark:text-amber-400 cursor-pointer">
                                    Mode Sandbox / Testing
                                    <span className="block text-[10px] font-normal opacity-80">Gunakan API Key Sandbox dari dashboard provider.</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Merchant ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none font-mono text-sm"
                                        value={gwConfig.merchantId || ''}
                                        onChange={e => setGwConfig({...gwConfig, merchantId: e.target.value})}
                                        placeholder="cth: G-12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Client Key</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none font-mono text-sm"
                                        value={gwConfig.clientKey || ''}
                                        onChange={e => setGwConfig({...gwConfig, clientKey: e.target.value})}
                                        placeholder="cth: SB-Mid-client-..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Server Key</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none font-mono text-sm"
                                        value={gwConfig.serverKey || ''}
                                        onChange={e => setGwConfig({...gwConfig, serverKey: e.target.value})}
                                        placeholder="cth: SB-Mid-server-..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${gwConfig.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={() => setGwConfig({...gwConfig, isActive: !gwConfig.isActive})}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${gwConfig.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Aktifkan Pembayaran Otomatis</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                            SIMPAN KONFIGURASI
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200 border dark:border-slate-800">
            <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg">{editingId ? 'Edit Metode' : 'Tambah Metode'}</h3>
                <p className="text-xs text-indigo-200">Konfigurasi channel pembayaran manual</p>
              </div>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform bg-white/20 p-2 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Tipe Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BANK', 'E-WALLET', 'QRIS'] as PaymentType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      className={`py-2 rounded-xl text-[10px] font-black border transition-all ${formData.type === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Provider</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none" 
                    value={formData.providerName} 
                    onChange={e => setFormData({...formData, providerName: e.target.value})} 
                    placeholder="BCA / DANA" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Atas Nama</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none" 
                    value={formData.accountHolder} 
                    onChange={e => setFormData({...formData, accountHolder: e.target.value})} 
                    placeholder="Pemilik" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  {formData.type === 'QRIS' ? 'Data Konten QRIS' : 'Nomor Rekening / HP'}
                </label>
                <input 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none" 
                  value={formData.accountNumber} 
                  onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
                  placeholder={formData.type === 'QRIS' ? 'ID Merchant / Content' : 'Contoh: 123456789'} 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-2xl font-bold transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                  {editingId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
