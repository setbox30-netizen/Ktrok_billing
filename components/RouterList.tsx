
import React, { useState } from 'react';
import { Router, Customer, MikrotikUser, Status } from '../types';

interface RouterListProps {
  routers: Router[];
  customers: Customer[];
  mikrotikUsers: MikrotikUser[];
  onAdd: (r: Omit<Router, 'id' | 'status'>) => void;
  onUpdate: (id: string, updates: Partial<Router>) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSyncUser: (customerId: string, routerId: string) => void;
  onRemoveUser: (userId: string) => void;
}

export const RouterList: React.FC<RouterListProps> = ({ 
  routers, 
  customers, 
  mikrotikUsers, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onTest,
  onSyncUser,
  onRemoveUser
}) => {
  const [activeTab, setActiveTab] = useState<'routers' | 'users'>('routers');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRouterId, setSelectedRouterId] = useState<string>(routers[0]?.id || '');
  
  // Refined sync status state
  const [syncStatus, setSyncStatus] = useState<Record<string, { type: 'loading' | 'success' | 'error', message?: string }>>({});

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: ''
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

  const openEdit = (r: Router) => {
    setEditingId(r.id);
    setFormData({
      name: r.name,
      host: r.host,
      port: r.port,
      username: r.username,
      password: r.password || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', host: '', port: 8728, username: '', password: '' });
  };

  const handleSync = async (customerId: string) => {
    if (!selectedRouterId) {
      alert('Pilih router terlebih dahulu!');
      return;
    }
    
    // Set loading state
    setSyncStatus(prev => ({ ...prev, [customerId]: { type: 'loading' } }));

    // Simulate API process
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Random success/failure simulation for demo purposes
        // In production this would be the result of onSyncUser promise
        const isSuccess = Math.random() > 0.3;
        
        if (isSuccess) {
            onSyncUser(customerId, selectedRouterId);
            setSyncStatus(prev => ({ ...prev, [customerId]: { type: 'success', message: 'Synced' } }));
        } else {
            throw new Error('Connection Timeout');
        }
    } catch (err) {
        setSyncStatus(prev => ({ ...prev, [customerId]: { type: 'error', message: 'Failed' } }));
    }

    // Clear status after 3 seconds
    setTimeout(() => {
        setSyncStatus(prev => {
            const next = { ...prev };
            delete next[customerId];
            return next;
        });
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mikrotik Integration</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola RouterOS dan sinkronisasi User Manager pelanggan.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border dark:border-slate-800 shadow-sm w-full md:w-auto">
          <button onClick={() => setActiveTab('routers')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'routers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Router List</button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>User Manager</button>
        </div>
      </div>

      {activeTab === 'routers' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg transition-all active:scale-95 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              Tambah Router
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routers.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                   <button onClick={() => openEdit(r)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                   <button onClick={() => onDelete(r.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${r.status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{r.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${r.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{r.status}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Host IP</span>
                      <span className="font-mono font-bold dark:text-slate-300">{r.host}:{r.port}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">User</span>
                      <span className="font-mono font-bold dark:text-slate-300">{r.username}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Daftar Pengguna PPPoE / Hotspot</h3>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Target Router:</span>
                <select 
                   value={selectedRouterId}
                   onChange={(e) => setSelectedRouterId(e.target.value)}
                   className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                >
                   <option value="" disabled>Pilih Router</option>
                   {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pelanggan</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Sync</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mikrotik User</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {customers.filter(c => c.status === Status.ACTIVE).map(c => {
                  const mUser = mikrotikUsers.find(u => u.customerId === c.id);
                  const isSyncing = syncStatus[c.id]?.type === 'loading';
                  const syncResult = syncStatus[c.id];

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {c.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        {mUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Unsynced
                          </span>
                        )}
                        {syncResult?.type === 'success' && <span className="text-[10px] text-emerald-500 font-bold ml-2 animate-pulse">✓ Done</span>}
                        {syncResult?.type === 'error' && <span className="text-[10px] text-rose-500 font-bold ml-2 animate-pulse">✗ Failed</span>}
                      </td>
                      <td className="px-6 py-4">
                        {mUser ? (
                           <div>
                              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{mUser.username}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">Last: {mUser.lastSynced.split(' ')[0]}</p>
                           </div>
                        ) : (
                           <span className="text-xs text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleSync(c.id)} 
                           disabled={isSyncing}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 ml-auto ${
                             isSyncing 
                             ? 'bg-slate-100 text-slate-400 cursor-wait' 
                             : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                           }`}
                         >
                            {isSyncing ? (
                               <>
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Syncing...
                               </>
                            ) : (
                               <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                {mUser ? 'Resync' : 'Sync'}
                               </>
                            )}
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{editingId ? 'Edit Router' : 'Tambah Router'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Router</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Mikrotik Utama" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Host / IP</label>
                  <input required value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="192.168.88.1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">API Port</label>
                  <input required type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-400">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
