
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { PackageList } from './components/PackageList';
import { BillingList } from './components/BillingList';
import { RouterList } from './components/RouterList';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminSettings } from './components/AdminSettings';
import { PaymentSettings } from './components/PaymentSettings';
import { LandingPage } from './components/LandingPage';
import { Customer, Package, Bill, View, Status, BillStatus, Router, MikrotikUser, AdminProfile, PaymentAccount, PaymentGatewayConfig } from './types';
import { api } from './services/api';

const ADMIN_SESSION_KEY = 'wifinet_admin_logged';
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

type AppMode = 'landing' | 'admin' | 'portal';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  const [view, setView] = useState<View>('dashboard');
  
  // Auth States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(INITIAL_ADMIN);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [mikrotikUsers, setMikrotikUsers] = useState<MikrotikUser[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>(INITIAL_GATEWAY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Notification state for new bills
  const [newBillsAlert, setNewBillsAlert] = useState(false);

  // Load and Sync Data Function
  const syncData = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsSyncing(true);
    const data = await api.fetchInitialData();
    if (data) {
        setCustomers(data.customers || []);
        setPackages(data.packages || []);
        setBills(data.bills || []);
        setRouters(data.routers || []);
        setPaymentAccounts(data.paymentAccounts || []);
        setMikrotikUsers(data.mikrotikUsers || []);
        if (data.adminProfile) setAdminProfile(data.adminProfile);
        if (data.gatewayConfig) setGatewayConfig(data.gatewayConfig);

        // Update active customer reference if in portal mode
        const customerId = localStorage.getItem(CUSTOMER_SESSION_KEY);
        if (customerId && data.customers) {
            const found = data.customers.find((c: Customer) => c.id === customerId);
            if (found) setActiveCustomer(found);
        }
    }
    if (isInitial) setIsLoading(false);
    setTimeout(() => setIsSyncing(false), 800);
  }, []);
  
  // Initial Load
  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        await syncData(true);
        
        const adminLogged = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        const customerId = localStorage.getItem(CUSTOMER_SESSION_KEY);

        if (adminLogged) {
            setIsAdminLoggedIn(true);
            setAppMode('admin');
        } else if (customerId) {
            setAppMode('portal');
        }
    };
    init();
  }, [syncData]);

  // Background Sync (Every 30 seconds)
  useEffect(() => {
    if (appMode === 'landing') return;
    
    const interval = setInterval(() => {
        syncData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [appMode, syncData]);

  // AUTO BILLING CHECK
  useEffect(() => {
    if (isAdminLoggedIn && adminProfile.autoBillingEnabled && customers.length > 0) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = (today.getMonth() + 1).toString();
      const currentYear = today.getFullYear();

      if (currentDay >= (adminProfile.billingDay || 1)) {
        const activeCustomers = customers.filter(c => c.status === Status.ACTIVE);
        const alreadyBilledIds = new Set(
          bills
            .filter(b => b.month === currentMonth && b.year === currentYear)
            .map(b => b.customerId)
        );

        const needsBilling = activeCustomers.filter(c => !alreadyBilledIds.has(c.id));

        if (needsBilling.length > 0) {
          generateBills(currentMonth, currentYear);
        }
      }
    }
  }, [isAdminLoggedIn, customers, bills, adminProfile.autoBillingEnabled, adminProfile.billingDay]);

  // Universal Login Handler
  const handleLogin = (u: string, p: string): boolean => {
    if (u === adminProfile.username && p === (adminProfile.password || 'admin123')) {
        setIsAdminLoggedIn(true);
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        setActiveCustomer(null);
        setAppMode('admin');
        return true;
    }

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
        setIsAdminLoggedIn(false);
        setAppMode('portal');
        return true;
    }

    return false;
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveCustomer(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    setAppMode('landing');
    setView('dashboard');
  };

  // --- ACTIONS ---
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
  
  const bulkUpdateCustomerStatus = async (ids: string[], status: Status) => {
      const promises = ids.map(id => api.update('customers', id, { status }));
      await Promise.all(promises);
      await syncData();
  };

  const deleteCustomer = async (id: string) => {
      await api.delete('customers', id);
      await syncData();
  };

  const addPackage = async (p: Omit<Package, 'id'>) => {
      const newPkg = { ...p, id: Math.random().toString(36).substr(2, 9) };
      await api.insert('packages', newPkg);
      await syncData();
  };
  
  const updatePackage = async (id: string, u: Partial<Package>) => {
      await api.update('packages', id, u);
      await syncData();
  };

  const deletePackage = async (id: string) => {
      await api.delete('packages', id);
      await syncData();
  };

  const generateBills = async (m: string, y: number) => {
    const active = customers.filter(c => c.status === Status.ACTIVE);
    const newBills: Bill[] = [];
    for (const c of active) {
        if (!bills.find(b => b.customerId === c.id && b.month === m && b.year === y)) {
            const bill: Bill = {
               id: Math.random().toString(36).substr(2, 9),
               customerId: c.id, month: m, year: y, 
               amount: packages.find(p => p.id === c.packageId)?.price || 0,
               status: BillStatus.UNPAID, 
               dueDate: `${y}-${m.padStart(2, '0')}-10`
            };
            newBills.push(bill);
            await api.insert('bills', bill);
        }
    }
    if (newBills.length > 0) {
      setNewBillsAlert(true);
    }
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

  const submitPaymentConfirmation = async (billId: string, method: string) => {
    const updates = { status: BillStatus.PENDING, paymentMethod: method };
    await api.update('bills', billId, updates);
    await syncData();
  };

  const rejectPayment = async (billId: string) => {
    await api.update('bills', billId, { status: BillStatus.UNPAID, paymentMethod: '' });
    await syncData();
  };
  
  const deleteBill = async (id: string) => {
      await api.delete('bills', id);
      await syncData();
  };
  
  const deleteMultipleBills = async (ids: string[]) => {
      await api.bulkDelete('bills', ids);
      await syncData();
  };
  
  const markMultiplePaid = async (ids: string[]) => {
      const paidAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const promises = ids.map(id => api.update('bills', id, { status: BillStatus.PAID, paidAt }));
      await Promise.all(promises);
      await syncData();
  };

  const addRouter = async (r: Omit<Router, 'id' | 'status'>) => {
      await api.insert('routers', { ...r, id: Math.random().toString(36).substr(2, 9), status: 'Offline' });
      await syncData();
  };
  
  const updateRouter = async (id: string, u: Partial<Router>) => {
      await api.update('routers', id, u);
      await syncData();
  };

  const deleteRouter = async (id: string) => {
      await api.delete('routers', id);
      await syncData();
  };

  const syncMikrotikUser = async (customerId: string, routerId: string) => {
    const existing = mikrotikUsers.find(u => u.customerId === customerId);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (existing) {
        await api.update('mikrotik_users', existing.id, { lastSynced: now, routerId, enabled: true });
    } else {
        const customer = customers.find(c => c.id === customerId);
        await api.insert('mikrotik_users', {
            id: Math.random().toString(36).substr(2, 9),
            customerId, routerId, username: customer?.phone || 'user',
            profile: 'default', enabled: true, lastSynced: now
        });
    }
    await syncData();
  };

  const removeMikrotikUser = async (uid: string) => {
      await api.delete('mikrotik_users', uid);
      await syncData();
  };

  const addPaymentAccount = async (acc: Omit<PaymentAccount, 'id'>) => {
      await api.insert('payment_accounts', { ...acc, id: Math.random().toString(36).substr(2, 9) });
      await syncData();
  };

  const updatePaymentAccount = async (id: string, u: Partial<PaymentAccount>) => {
      await api.update('payment_accounts', id, u);
      await syncData();
  };

  const deletePaymentAccount = async (id: string) => {
      await api.delete('payment_accounts', id);
      await syncData();
  };

  const updateGatewayConfig = async (config: PaymentGatewayConfig) => {
      await api.updateGatewayConfig(config);
      await syncData();
  };
  
  const updateAdminProfile = async (updates: AdminProfile) => {
      await api.updateAdmin(updates);
      await syncData();
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  if (appMode === 'landing') {
      return <LandingPage businessName={adminProfile.businessName} onLogin={handleLogin} />;
  }

  if (appMode === 'portal') {
    return (
      <CustomerPortal 
        initialCustomer={activeCustomer}
        customers={customers}
        packages={packages}
        bills={bills}
        paymentAccounts={paymentAccounts}
        gatewayConfig={gatewayConfig}
        onPaymentSuccess={submitPaymentConfirmation}
        onUpdateCustomer={updateCustomer}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onManualSync={() => syncData()}
      />
    );
  }

  return (
    <Layout 
      currentView={view} 
      onViewChange={setView} 
      adminProfile={adminProfile}
      onLogout={handleLogout}
      isSyncing={isSyncing}
    >
      {view === 'dashboard' && (
        <Dashboard 
          customers={customers} 
          bills={bills} 
          packages={packages} 
          onViewChange={setView} 
          adminProfile={adminProfile}
          newBillsAlert={newBillsAlert}
          onDismissNewBillsAlert={() => setNewBillsAlert(false)}
        />
      )}
      {view === 'customers' && (
        <CustomerList 
          customers={customers} packages={packages} bills={bills}
          onAdd={addCustomer} onUpdate={updateCustomer} 
          onBulkStatusUpdate={bulkUpdateCustomerStatus}
          onDelete={deleteCustomer} 
        />
      )}
      {view === 'packages' && (
        <PackageList 
          packages={packages} onAdd={addPackage} onUpdate={updatePackage} onDelete={deletePackage}
        />
      )}
      {view === 'billing' && (
        <BillingList 
          bills={bills} customers={customers} onGenerate={generateBills} onMarkPaid={markAsPaid}
          onRejectPayment={rejectPayment} onMarkMultiplePaid={markMultiplePaid}
          onDelete={deleteBill} onDeleteMultiple={deleteMultipleBills}
        />
      )}
      {view === 'mikrotik' && (
        <RouterList 
          routers={routers} customers={customers} mikrotikUsers={mikrotikUsers}
          onAdd={addRouter} onUpdate={updateRouter} onDelete={deleteRouter}
          onSyncUser={syncMikrotikUser} onRemoveUser={removeMikrotikUser}
          onTest={id => {}}
        />
      )}
      {view === 'payment-settings' && (
        <PaymentSettings 
          accounts={paymentAccounts} gatewayConfig={gatewayConfig}
          onAdd={addPaymentAccount} onUpdate={updatePaymentAccount} onDelete={deletePaymentAccount}
          onUpdateGateway={updateGatewayConfig}
        />
      )}
      {view === 'settings' && <AdminSettings adminProfile={adminProfile} onUpdate={updateAdminProfile} />}
    </Layout>
  );
};

export default App;
