
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { PackageList } from './components/PackageList';
import { BillingList } from './components/BillingList';
import { CollectorList } from './components/CollectorList';
import { RouterList } from './components/RouterList';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminSettings } from './components/AdminSettings';
import { PaymentSettings } from './components/PaymentSettings';
import { LandingPage } from './components/LandingPage';
import { Customer, Package, Bill, View, Status, BillStatus, Router, MikrotikUser, AdminProfile, PaymentAccount, PaymentGatewayConfig, Collector } from './types';
import { api } from './services/api';

const ADMIN_SESSION_KEY = 'wifinet_admin_logged';
const COLLECTOR_SESSION_KEY = 'wifinet_collector_id';
const CUSTOMER_SESSION_KEY = 'wifinet_customer_id';

const INITIAL_ADMIN: AdminProfile = {
  name: 'Super Admin',
  businessName: 'WIFINET',
  username: 'admin',
  password: 'admin123',
  autoBillingEnabled: true,
  billingDay: 1
};

const INITIAL_GATEWAY: PaymentGatewayConfig = {
  provider: 'MANUAL',
  isActive: false,
  isSandbox: true
};

type AppMode = 'landing' | 'admin' | 'portal' | 'collector';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  const [view, setView] = useState<View>('dashboard');
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeCollector, setActiveCollector] = useState<Collector | null>(null);

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(INITIAL_ADMIN);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [mikrotikUsers, setMikrotikUsers] = useState<MikrotikUser[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>(INITIAL_GATEWAY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newBillsAlert, setNewBillsAlert] = useState(false);

  const syncData = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsSyncing(true);
    const data = await api.fetchInitialData();
    if (data) {
        setCustomers(data.customers || []);
        setPackages(data.packages || []);
        setBills(data.bills || []);
        setCollectors(data.collectors || []);
        setRouters(data.routers || []);
        setPaymentAccounts(data.paymentAccounts || []);
        setMikrotikUsers(data.mikrotikUsers || []);
        if (data.adminProfile) setAdminProfile(data.adminProfile);
        if (data.gatewayConfig) setGatewayConfig(data.gatewayConfig);

        const customerId = localStorage.getItem(CUSTOMER_SESSION_KEY);
        if (customerId && data.customers) {
            const found = data.customers.find((c: Customer) => c.id === customerId);
            if (found) setActiveCustomer(found);
        }

        const collectorId = localStorage.getItem(COLLECTOR_SESSION_KEY);
        if (collectorId && data.collectors) {
            const foundColl = data.collectors.find((c: Collector) => c.id === collectorId);
            if (foundColl) setActiveCollector(foundColl);
        }
    }
    if (isInitial) setIsLoading(false);
    setTimeout(() => setIsSyncing(false), 800);
  }, []);
  
  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        await syncData(true);
        
        const adminLogged = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        const collectorId = localStorage.getItem(COLLECTOR_SESSION_KEY);
        const customerId = localStorage.getItem(CUSTOMER_SESSION_KEY);

        if (adminLogged) {
            setIsAdminLoggedIn(true);
            setAppMode('admin');
        } else if (collectorId) {
            setAppMode('collector');
            setView('dashboard');
        } else if (customerId) {
            setAppMode('portal');
        }
    };
    init();
  }, [syncData]);

  const handleLogin = (u: string, p: string): boolean => {
    // 1. Admin Login Check
    if (u === adminProfile.username && p === (adminProfile.password || 'admin123')) {
        setIsAdminLoggedIn(true);
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.removeItem(COLLECTOR_SESSION_KEY);
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        setActiveCustomer(null);
        setActiveCollector(null);
        setAppMode('admin');
        return true;
    }

    // 2. Collector Login Check
    const foundCollector = collectors.find(c => {
        const isMatch = c.phone.replace(/\D/g,'') === u.replace(/\D/g,'') || c.id === u.toUpperCase();
        return isMatch && (c.password ? c.password === p : p === '123456');
    });
    if (foundCollector) {
        setActiveCollector(foundCollector);
        localStorage.setItem(COLLECTOR_SESSION_KEY, foundCollector.id);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        setAppMode('collector');
        setView('dashboard');
        return true;
    }

    // 3. Customer Login Check
    const foundCustomer = customers.find(c => {
        const isIdMatch = c.id.toUpperCase() === u.toUpperCase();
        const isPhoneMatch = c.phone.replace(/\D/g,'') === u.replace(/\D/g,'');
        if (!isIdMatch && !isPhoneMatch) return false;
        return c.password ? c.password === p : c.phone.replace(/\D/g,'') === p.replace(/\D/g,'');
    });
    if (foundCustomer) {
        setActiveCustomer(foundCustomer);
        localStorage.setItem(CUSTOMER_SESSION_KEY, foundCustomer.id);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(COLLECTOR_SESSION_KEY);
        setIsAdminLoggedIn(false);
        setAppMode('portal');
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveCustomer(null);
    setActiveCollector(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(COLLECTOR_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    setAppMode('landing');
    setView('dashboard');
  };

  const addCustomer = async (c: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = { 
        ...c, 
        id: Math.random().toString(36).substr(2, 6).toUpperCase(), 
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ') 
    };
    await api.insert('customers', newCustomer);
    await syncData();
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    await api.update('customers', id, updates);
    await syncData();
  };

  const addCollector = async (c: Omit<Collector, 'id' | 'joinedAt'>) => {
    const newColl = { 
      ...c, 
      id: 'COL' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      joinedAt: new Date().toISOString().slice(0, 10)
    };
    await api.insert('collectors', newColl);
    await syncData();
  };

  const updateCollector = async (id: string, u: Partial<Collector>) => {
    await api.update('collectors', id, u);
    await syncData();
  };

  const deleteCollector = async (id: string) => {
    await api.delete('collectors', id);
    await syncData();
  };

  const assignBillsToCollector = async (billIds: string[], collectorId: string) => {
    const promises = billIds.map(id => api.update('bills', id, { collectorId }));
    await Promise.all(promises);
    await syncData();
  };

  const generateBills = async (m: string, y: number) => {
    const active = customers.filter(c => c.status === Status.ACTIVE);
    for (const c of active) {
        if (!bills.find(b => b.customerId === c.id && b.month === m && b.year === y)) {
            const bill: Bill = {
               id: Math.random().toString(36).substr(2, 9),
               customerId: c.id, month: m, year: y, 
               amount: packages.find(p => p.id === c.packageId)?.price || 0,
               status: BillStatus.UNPAID, 
               dueDate: `${y}-${m.padStart(2, '0')}-10`
            };
            await api.insert('bills', bill);
        }
    }
    setNewBillsAlert(true);
    await syncData();
  };

  const markAsPaid = async (id: string, penaltyAmount: number = 0) => {
    const updates = { 
        status: BillStatus.PAID, 
        paidAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        penaltyAmount 
    };
    await api.update('bills', id, updates);
    await syncData();
  };

  const markMultiplePaid = async (ids: string[]) => {
      const paidAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const promises = ids.map(id => api.update('bills', id, { status: BillStatus.PAID, paidAt }));
      await Promise.all(promises);
      await syncData();
  };

  const deleteBill = async (id: string) => { await api.delete('bills', id); await syncData(); };
  const deleteMultipleBills = async (ids: string[]) => { await api.bulkDelete('bills', ids); await syncData(); };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  if (appMode === 'landing') return <LandingPage businessName={adminProfile.businessName} onLogin={handleLogin} />;

  if (appMode === 'portal') {
    return (
      <CustomerPortal 
        initialCustomer={activeCustomer} customers={customers} packages={packages}
        bills={bills} paymentAccounts={paymentAccounts} gatewayConfig={gatewayConfig}
        onPaymentSuccess={async (id, m) => { await api.update('bills', id, { status: BillStatus.PENDING, paymentMethod: m }); await syncData(); }}
        onUpdateCustomer={updateCustomer} onLogout={handleLogout} isSyncing={isSyncing} onManualSync={() => syncData()}
      />
    );
  }

  return (
    <Layout 
      currentView={view} 
      onViewChange={setView} 
      adminProfile={appMode === 'collector' && activeCollector ? { ...adminProfile, name: activeCollector.name, username: 'Petugas Kolektor' } : adminProfile} 
      onLogout={handleLogout} 
      isSyncing={isSyncing}
      role={appMode === 'collector' ? 'collector' : 'admin'}
    >
      {view === 'dashboard' && <Dashboard customers={customers} bills={bills} packages={packages} onViewChange={setView} adminProfile={adminProfile} newBillsAlert={newBillsAlert} onDismissNewBillsAlert={() => setNewBillsAlert(false)} collectorId={activeCollector?.id} />}
      {view === 'customers' && appMode === 'admin' && <CustomerList customers={customers} packages={packages} bills={bills} onAdd={addCustomer} onUpdate={updateCustomer} onBulkStatusUpdate={async (ids, s) => { await Promise.all(ids.map(id => api.update('customers', id, { status: s }))); await syncData(); }} onDelete={id => { api.delete('customers', id); syncData(); }} />}
      {view === 'packages' && appMode === 'admin' && <PackageList packages={packages} onAdd={async p => { await api.insert('packages', { ...p, id: Math.random().toString(36).substr(2, 9) }); await syncData(); }} onUpdate={async (id, u) => { await api.update('packages', id, u); await syncData(); }} onDelete={async id => { await api.delete('packages', id); await syncData(); }} />}
      {view === 'billing' && <BillingList bills={bills} customers={customers} collectors={collectors} onGenerate={generateBills} onMarkPaid={markAsPaid} onRejectPayment={async id => { await api.update('bills', id, { status: BillStatus.UNPAID, paymentMethod: '' }); await syncData(); }} onMarkMultiplePaid={markMultiplePaid} onDelete={deleteBill} onDeleteMultiple={deleteMultipleBills} onAssignCollector={assignBillsToCollector} isCollector={appMode === 'collector'} collectorId={activeCollector?.id} />}
      {view === 'collectors' && appMode === 'admin' && <CollectorList collectors={collectors} bills={bills} onAdd={addCollector} onUpdate={updateCollector} onDelete={deleteCollector} />}
      {view === 'mikrotik' && appMode === 'admin' && <RouterList routers={routers} customers={customers} mikrotikUsers={mikrotikUsers} onAdd={async r => { await api.insert('routers', { ...r, id: Math.random().toString(36).substr(2, 9), status: 'Offline' }); await syncData(); }} onUpdate={async (id, u) => { await api.update('routers', id, u); await syncData(); }} onDelete={async id => { await api.delete('routers', id); await syncData(); }} onSyncUser={async (c, r) => { await api.insert('mikrotik_users', { id: Math.random().toString(36).substr(2, 9), customerId: c, routerId: r, username: 'user', profile: 'default', enabled: true, lastSynced: new Date().toISOString() }); await syncData(); }} onRemoveUser={async id => { await api.delete('mikrotik_users', id); await syncData(); }} onTest={id => {}} />}
      {view === 'payment-settings' && appMode === 'admin' && <PaymentSettings accounts={paymentAccounts} gatewayConfig={gatewayConfig} onAdd={async a => { await api.insert('payment_accounts', { ...a, id: Math.random().toString(36).substr(2, 9) }); await syncData(); }} onUpdate={async (id, u) => { await api.update('payment_accounts', id, u); await syncData(); }} onDelete={async id => { await api.delete('payment_accounts', id); await syncData(); }} onUpdateGateway={async c => { await api.updateGatewayConfig(c); await syncData(); }} />}
      {view === 'settings' && appMode === 'admin' && <AdminSettings adminProfile={adminProfile} onUpdate={async u => { await api.updateAdmin(u); await syncData(); }} />}
    </Layout>
  );
};

export default App;
