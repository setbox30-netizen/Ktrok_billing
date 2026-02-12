
import React from 'react';
import { Customer, Bill, Package, BillStatus, Status, View, AdminProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  customers: Customer[];
  bills: Bill[];
  packages: Package[];
  onViewChange?: (view: View) => void;
  adminProfile?: AdminProfile;
  newBillsAlert?: boolean;
  onDismissNewBillsAlert?: () => void;
  collectorId?: string; // Mengetahui apakah yang login adalah kolektor
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
  
  const activeCustomersCount = isCollector 
    ? Array.from(new Set(filteredBills.map(b => b.customerId))).length 
    : customers.filter(c => c.status === Status.ACTIVE).length;

  const totalRevenue = filteredBills.filter(b => b.status === BillStatus.PAID).reduce((acc, curr) => acc + curr.amount + (curr.penaltyAmount || 0), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const overdueBills = filteredBills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today);
  const totalOverdueAmount = overdueBills.reduce((acc, b) => acc + b.amount, 0);

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
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isCollector ? 'Dashboard Kolektor' : 'Ikhtisar Bisnis'}
        </h2>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border dark:border-slate-800 w-fit">
           Update: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {isCollector && overdueBills.length > 0 && (
        <div className="bg-rose-600 text-white p-6 rounded-3xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-xl">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                 <p className="font-black text-lg">Tugas Menunggak!</p>
                 <p className="text-rose-100 text-sm">Ada {overdueBills.length} pelanggan menunggak di daftar Anda. Segera lakukan penagihan.</p>
              </div>
           </div>
           <button onClick={() => onViewChange?.('billing')} className="bg-white text-rose-600 px-5 py-2 rounded-xl font-black text-sm active:scale-95 transition-all">LIHAT DAFTAR</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title={isCollector ? "Koleksi Berhasil" : "Total Pendapatan"} value={formatter.format(totalRevenue)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-emerald-500" />
        <StatCard title={isCollector ? "Target Penagihan" : "Pelanggan Aktif"} value={isCollector ? filteredBills.length.toString() : activeCustomersCount.toString()} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" color="bg-blue-500" />
        <StatCard title="Menunggak" value={overdueBills.length.toString()} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-rose-500" />
        <StatCard title="Sisa Tugas" value={filteredBills.filter(b => b.status === BillStatus.UNPAID).length.toString()} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Grafik Kinerja Penagihan</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => v/1000+'k'} />
                    <Tooltip />
                    <Bar dataKey="Terbayar" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Menunggak" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Pelanggan Harus Ditagih</h3>
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredBills.filter(b => b.status === BillStatus.UNPAID).map(b => {
                 const customer = customers.find(c => c.id === b.customerId);
                 return (
                    <div key={b.id} className="p-3 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                       <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{customer?.name}</p>
                       <p className="text-[10px] text-slate-400 truncate">{customer?.address}</p>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-indigo-600 font-black text-xs">{formatter.format(b.amount)}</span>
                          <span className="text-[10px] font-bold text-rose-500 uppercase">Jatuh Tempo: {b.dueDate.split('-').reverse().join('/')}</span>
                       </div>
                    </div>
                 );
              })}
              {filteredBills.filter(b => b.status === BillStatus.UNPAID).length === 0 && (
                 <p className="text-center py-10 text-slate-400 text-xs italic">Semua tagihan sudah tertagih! 🌟</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform shrink-0`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">{value}</p>
      </div>
    </div>
  </div>
);
