
import React, { useState, useEffect } from 'react';
import { View, AdminProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onSwitchMode?: () => void;
  adminProfile: AdminProfile;
  onLogout: () => void;
  isSyncing?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  onSwitchMode, 
  adminProfile,
  onLogout,
  isSyncing = false
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    if (window.innerWidth >= 768) setSidebarOpen(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'customers' as View, label: 'Pelanggan', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'packages' as View, label: 'Paket WiFi', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'billing' as View, label: 'Tagihan', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'mikrotik' as View, label: 'Mikrotik', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
    { id: 'payment-settings' as View, label: 'Metode Bayar', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'settings' as View, label: 'Pengaturan', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  const handleNavClick = (viewId: View) => {
    onViewChange(viewId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`bg-indigo-900 text-white w-64 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="bg-white text-indigo-900 px-2 rounded-lg">{adminProfile.businessName.substring(0, 4)}</span>
                {adminProfile.businessName.substring(4)}
              </h1>
              <p className="text-indigo-300 text-[10px] mt-1 uppercase tracking-widest font-black">Management Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-indigo-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <nav className="mt-2 px-4 h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${currentView === item.id ? 'bg-indigo-700 text-white shadow-lg' : 'text-indigo-200 hover:bg-indigo-800'}`}>
              <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ))}
          <div className="my-6 border-t border-indigo-800 pt-6">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-indigo-300 hover:bg-rose-600 hover:text-white transition-all">
              <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span className="truncate">Keluar Sesi</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'} w-full`}>
        <header className="bg-white dark:bg-slate-900 dark:border-slate-800 border-b sticky top-0 z-30 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden md:block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M4 6h16M4 12h16M4 18h7" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)} className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs">
                {isDark ? <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg> : <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.75a8.986 8.986 0 01-8.25 8.25c-4.836 0-8.75-3.914-8.75-8.75s3.914-8.75 8.75-8.75c.42 0 .826.03 1.226.086A6.25 6.25 0 005.75 12.25c0 3.452 2.798 6.25 6.25 6.25 2.126 0 3.996-1.06 5.126-2.686a8.964 8.964 0 013.874 6.936z"/></svg>}
                <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>
              
              {isSyncing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 animate-in fade-in slide-in-from-left-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Syncing</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{adminProfile.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{adminProfile.username}</p>
             </div>
             <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-black border-2 border-indigo-50 dark:border-indigo-800 shadow-sm shrink-0">
               {adminProfile.name.charAt(0)}
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
