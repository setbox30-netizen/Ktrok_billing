
import React from 'react';
import { Customer, Bill, Package, BillStatus, Status, View, AdminProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  customers: Customer[];
  bills: Bill[];
  packages: Package[];
  onViewChange?: (view: View) => void;
  adminProfile?: AdminProfile;
  newBillsAlert?: boolean;
  onDismissNewBillsAlert?: () => void;
  collectorId?: string; 
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  customers, 
  bills, 
  packages, 
  onViewChange, 
  adminProfile,
  newBillsAlert = false,
  onDismissNewBillsAlert,
  collectorId
}) => {
  const isCollector = !!collectorId;
  const filteredBills = isCollector ? bills.filter(b => b.collectorId === collectorId) : bills;
  
  const totalRevenue = filteredBills.filter(b => b.status === BillStatus.PAID).reduce((acc, curr) => acc + curr.amount + (curr.penaltyAmount || 0), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const overdueBills = filteredBills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today);
  
  // Stats Hari Ini (Khusus Kolektor)
  const todayCollectedCount = isCollector ? filteredBills.filter(b => b.status === BillStatus.PAID && b.paidAt?.startsWith(today)).length : 0;
  const todayCollectedAmount = isCollector ? filteredBills.filter(b => b.status === BillStatus.PAID && b.paidAt?.startsWith(today)).reduce((acc, b) => acc + b.amount, 0) : 0;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartData = months.map((m, idx) => {
    const monthIndex = (idx + 1).toString();
    const monthlyPaid = filteredBills
      .filter(b => b.month === monthIndex && b.status === BillStatus.PAID)
      .reduce((acc, b) => acc + b.amount + (b.penaltyAmount || 0), 0);
    const monthlyUnpaid = filteredBills
      .filter(b => b.month === monthIndex && b.status === BillStatus.UNPAID)
      .reduce((acc, b) => acc + b.amount, 0);
    
    return { 
      name: m, 
      Terbayar: monthlyPaid, 
      Menunggak: monthlyUnpaid,
      total: monthlyPaid + monthlyUnpaid
    };
  });

  const formatter = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
           <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
             {isCollector ? 'Capaian Hari Ini' : 'Ikhtisar Bisnis'}
           </h2>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Update: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {!isCollector && (
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border dark:border-slate-800 w-fit">
             System Status: <span className="text-emerald-500 font-black">ONLINE</span>
          </div>
        )}
      </div>

      {isCollector && (
        <div className="bg-indigo-600 dark:bg-indigo-900/40 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner">
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                 <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Berhasil Ditagih Hari Ini</p>
                 <h3 className="text-4xl font-black">{formatter.format(todayCollectedAmount)}</h3>
                 <p className="text-indigo-100/60 text-xs font-medium mt-1">Total {todayCollectedCount} pelanggan telah membayar tunai.</p>
              </div>
           </div>
           <button onClick={() => onViewChange?.('billing')} className="relative z-10 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl">LANJUT PENAGIHAN</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title={isCollector ? "Total Setoran" : "Total Pendapatan"} value={formatter.format(totalRevenue)} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="bg-emerald-500" />
        <StatCard title={isCollector ? "Jumlah Pelanggan" : "Pelanggan Aktif"} value={isCollector ? Array.from(new Set(filteredBills.map(b => b.customerId))).length.toString() : customers.filter(c => c.status === Status.ACTIVE).length.toString()} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" color="bg-blue-500" />
        <StatCard title="Menunggak" value={overdueBills.length.toString()} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-rose-500" />
        <StatCard title="Sisa Tugas" value={filteredBills.filter(b => b.status === BillStatus.UNPAID).length.toString()} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Statistik Kinerja</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-slate-400">Terbayar</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase text-slate-400">Menunggak</span></div>
              </div>
           </div>
           <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} tickFormatter={(v) => v/1000+'k'} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="Terbayar" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Menunggak" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm flex flex-col">
           <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 text-lg">List Penagihan Urgent</h3>
           <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {filteredBills.filter(b => b.status === BillStatus.UNPAID).slice(0, 10).map(b => {
                 const customer = customers.find(c => c.id === b.customerId);
                 const isLate = b.dueDate < today;
                 return (
                    <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800 hover:border-indigo-500 transition-all group">
                       <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors text-sm">{customer?.name}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isLate ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>{isLate ? 'LATE' : 'DUE'}</span>
                       </div>
                       <p className="text-[10px] text-slate-400 truncate mb-3">{customer?.address}</p>
                       <div className="flex justify-between items-center">
                          <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{formatter.format(b.amount)}</span>
                          <button onClick={() => onViewChange?.('billing')} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Detail &rarr;</button>
                       </div>
                    </div>
                 );
              })}
              {filteredBills.filter(b => b.status === BillStatus.UNPAID).length === 0 && (
                 <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    <p className="text-center text-xs font-bold italic">Selesai! Tidak ada tagihan tertunda.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-center gap-5">
      <div className={`${color} p-4 rounded-2xl text-white group-hover:scale-110 transition-transform shrink-0 shadow-lg`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">{value}</p>
      </div>
    </div>
  </div>
);
