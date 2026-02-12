
import { AdminProfile, Bill, Customer, MikrotikUser, Package, PaymentAccount, Router, Status, BillStatus, PaymentGatewayConfig } from "../types";

const STORAGE_KEY = 'wifinet_db_v1';

// Data bawaan awal (akan digunakan jika LocalStorage kosong)
const DEFAULT_DATA = {
  adminProfile: {
    name: 'Super Admin',
    businessName: 'WIFINET',
    username: 'admin',
    password: 'admin123'
  },
  customers: [
    { id: 'CUST001', name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Mawar No. 10', packageId: 'PKG001', status: Status.ACTIVE, createdAt: '2024-01-01 10:00:00', password: '123' },
    { id: 'CUST002', name: 'Siti Aminah', phone: '089876543210', address: 'Jl. Melati No. 5', packageId: 'PKG002', status: Status.SUSPENDED, createdAt: '2024-01-05 14:30:00' },
    { id: 'CUST003', name: 'Rudi Hartono', phone: '085678901234', address: 'Jl. Kamboja No. 3', packageId: 'PKG001', status: Status.INACTIVE, createdAt: '2024-02-10 09:15:00' }
  ],
  packages: [
    { id: 'PKG001', name: 'Paket Hemat', speed: '10 Mbps', price: 150000, description: 'Cocok untuk browsing dan sosial media' },
    { id: 'PKG002', name: 'Paket Gamer', speed: '30 Mbps', price: 250000, description: 'Stabil untuk gaming dan streaming HD' },
    { id: 'PKG003', name: 'Paket Sultan', speed: '100 Mbps', price: 500000, description: 'Kecepatan maksimal untuk seluruh keluarga' }
  ],
  bills: [
    { id: 'BILL001', customerId: 'CUST001', month: '10', year: 2024, amount: 150000, status: BillStatus.PAID, dueDate: '2024-10-10' },
    { id: 'BILL002', customerId: 'CUST002', month: '10', year: 2024, amount: 250000, status: BillStatus.UNPAID, dueDate: '2024-10-10' },
    { id: 'BILL003', customerId: 'CUST001', month: '11', year: 2024, amount: 150000, status: BillStatus.UNPAID, dueDate: '2024-11-10' }
  ],
  routers: [
    { id: 'RTR001', name: 'Mikrotik Utama', host: '192.168.1.1', port: 8728, username: 'admin', status: 'Online' }
  ],
  mikrotikUsers: [],
  paymentAccounts: [
     { id: 'ACC001', type: 'BANK', providerName: 'BCA', accountNumber: '1234567890', accountHolder: 'WIFINET OFFICIAL' },
     { id: 'ACC002', type: 'E-WALLET', providerName: 'DANA', accountNumber: '081234567890', accountHolder: 'WIFINET' }
  ],
  gatewayConfig: {
    provider: 'MANUAL',
    isActive: false,
    merchantId: '',
    clientKey: '',
    serverKey: '',
    isSandbox: true
  }
};

// Helper: Ambil data dari Local Storage
const getDB = (): any => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Gagal memuat data:", e);
    }
    // Jika kosong, kembalikan default
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
};

// Helper: Simpan data ke Local Storage
const saveDB = (data: any) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Gagal menyimpan data:", e);
    }
};

export const api = {
  // Load Initial Data
  async fetchInitialData() {
    // Simulasi delay jaringan agar terasa seperti aplikasi nyata
    await new Promise(resolve => setTimeout(resolve, 300));

    // Cek apakah ada data tersimpan
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    } else {
        // Jika pertama kali buka, simpan data default
        saveDB(DEFAULT_DATA);
        return DEFAULT_DATA;
    }
  },

  async insert(table: string, newItem: any) {
    const db = getDB();
    if (!db[table]) db[table] = [];
    
    // Tambahkan item baru
    db[table].push(newItem);
    
    saveDB(db);
    return newItem;
  },

  async update(table: string, id: string, updates: any) {
    const db = getDB();
    if (db[table]) {
        db[table] = db[table].map((item: any) => 
            item.id === id ? { ...item, ...updates } : item
        );
        saveDB(db);
    }
  },

  async delete(table: string, id: string) {
    const db = getDB();
    if (db[table]) {
        db[table] = db[table].filter((item: any) => item.id !== id);
        saveDB(db);
    }
  },

  async bulkDelete(table: string, ids: string[]) {
    const db = getDB();
    if (db[table]) {
        db[table] = db[table].filter((item: any) => !ids.includes(item.id));
        saveDB(db);
    }
  },
  
  async updateAdmin(profile: AdminProfile) {
    const db = getDB();
    db.adminProfile = profile;
    saveDB(db);
  },

  async updateGatewayConfig(config: PaymentGatewayConfig) {
    const db = getDB();
    db.gatewayConfig = config;
    saveDB(db);
  }
};
