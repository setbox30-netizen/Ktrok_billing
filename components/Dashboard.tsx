
import React from 'react';
import { Customer, Bill, Package, BillStatus, Status, View } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  customers: Customer[];
  bills: Bill[];
  packages: Package[];
  onViewChange?: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ customers, bills, packages, onViewChange }) => {
  const activeCustomers = customers.filter(c => c.status === Status.ACTIVE).length;
  const totalRevenue = bills.filter(b => b.status === BillStatus.PAID).reduce((acc, curr) => acc + curr.amount + (curr.penaltyAmount || 0), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const overdueBills = bills.filter(b => b.status === BillStatus.UNPAID && b.dueDate < today);
  const totalOverdueAmount = overdueBills.reduce((acc, b) => acc + b.amount, 0);

  const potentialMonthly = customers
    .filter(c => c.status === Status.ACTIVE)
    .reduce((acc, c) => {
      const pkg = packages.find(p => p.id === c.packageId);
      return acc + (pkg?.price || 0);
    }, 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartData = months.map((m, idx) => {
    const monthIndex = (idx + 1).toString();
    const monthlyPaid = bills
      .filter(b => b.month === monthIndex && b.status === BillStatus.PAID)
      .reduce((acc, b) => acc + b.amount + (b.penaltyAmount || 0), 0);
    const monthlyUnpaid = bills
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ikhtisar Bisnis</h2>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border dark:border-slate-800 w-fit">
           Update: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {overdueBills.length > 0 && (
        <div className="bg-rose-600 border border-rose-700 text-white px-4 md:px-6 py-5 rounded-3xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-in slide-in-from-top duration-700 shadow-2xl shadow-rose-200 dark:shadow-rose-950/50">
          <div className="bg-white/20 p-4 rounded-2xl relative shrink-0">
            <span className="absolute inset-0 rounded-2xl bg-white/40 animate-ping"></span>
            <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black mb-1 uppercase tracking-tight">Perhatian: Tunggakan!</h3>
            <p className="text-rose-100 text-sm font-medium leading-relaxed">
              Ada <span className="font-black text-white">{overdueBills.length} tagihan</span> overdue total <span className="font-black text-white">{formatter.format(totalOverdueAmount)}</span>.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <button 
              onClick={() => onViewChange?.('billing')}
              className="w-full md:w-auto bg-white text-rose-600 px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Tagih Sekarang
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Pendapatan" value={formatter.format(totalRevenue)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-emerald-500" />
        <StatCard title="Pelanggan Aktif" value={activeCustomers.toString()} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" color="bg-blue-500" />
        <StatCard title="Tagihan Overdue" value={overdueBills.length.toString()} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-rose-500 shadow-lg shadow-rose-100 dark:shadow-none" />
        <StatCard title="Potensi Bulanan" value={formatter.format(potentialMonthly)} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Keuangan Bulanan</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5 dark:text-slate-400"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> Terbayar</div>
              <div className="flex items-center gap-1.5 dark:text-slate-400"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Menunggak</div>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const total = payload.reduce((acc, entry) => acc + (entry.value as number), 0);
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 border dark:border-slate-700 rounded-xl shadow-xl space-y-1.5 min-w-[150px]">
                          <p className="font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-1 mb-1 text-xs">{label}</p>
                          {payload.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center gap-2">
                              <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                {entry.name}:
                              </span>
                              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">{formatter.format(entry.value as number)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center gap-2 pt-1 border-t dark:border-slate-700 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total:</span>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{formatter.format(total)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Terbayar" stackId="a" fill="#4f46e5" animationDuration={1500} />
                <Bar dataKey="Menunggak" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Aktivitas Terkini</h3>
          <div className="space-y-4">
            {bills.slice(-6).reverse().map((bill, i) => {
              const customer = customers.find(c => c.id === bill.customerId);
              const isOverdue = bill.status === BillStatus.UNPAID && bill.dueDate < today;
              return (
                <div key={bill.id} className="flex items-start gap-3 text-sm pb-4 border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors cursor-default">
                   <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${bill.status === BillStatus.PAID ? 'bg-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-none' : isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{customer?.name || 'Unknown'}</p>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">#{bill.id.slice(0, 4)}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        {bill.status === BillStatus.PAID ? 'Pembayaran lunas' : isOverdue ? '⚠️ Menunggak pembayaran' : 'Invoice terbit'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{formatter.format(bill.amount + (bill.penaltyAmount || 0))}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Bln {bill.month}</p>
                      </div>
                   </div>
                </div>
              );
            })}
            {bills.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <p className="text-sm">Belum ada aktivitas.</p>
              </div>
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
