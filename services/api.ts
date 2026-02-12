
import { AdminProfile, Bill, Customer, MikrotikUser, Package, PaymentAccount, Router, Status, BillStatus, PaymentGatewayConfig, Collector } from "../types";

const API_URL = 'http://localhost/wifinet-api/index.php';

const MOCK_DATA = {
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
  ] as Customer[],
  packages: [
    { id: 'PKG001', name: 'Paket Hemat', speed: '10 Mbps', price: 150000, description: 'Cocok untuk browsing dan sosial media' },
    { id: 'PKG002', name: 'Paket Gamer', speed: '30 Mbps', price: 250000, description: 'Stabil untuk gaming dan streaming HD' },
    { id: 'PKG003', name: 'Paket Sultan', speed: '100 Mbps', price: 500000, description: 'Kecepatan maksimal untuk seluruh keluarga' }
  ] as Package[],
  bills: [
    { id: 'BILL001', customerId: 'CUST001', month: '10', year: 2024, amount: 150000, status: BillStatus.PAID, dueDate: '2024-10-10' },
    { id: 'BILL002', customerId: 'CUST002', month: '10', year: 2024, amount: 250000, status: BillStatus.UNPAID, dueDate: '2024-10-10', collectorId: 'COL01' },
    { id: 'BILL003', customerId: 'CUST001', month: '11', year: 2024, amount: 150000, status: BillStatus.UNPAID, dueDate: '2024-11-10', collectorId: 'COL01' }
  ] as Bill[],
  collectors: [
    { id: 'COL01', name: 'Ahmad Collector', phone: '0811111111', password: '123', status: 'Active', joinedAt: '2024-01-01' },
    { id: 'COL02', name: 'Budi Lapangan', phone: '0822222222', password: '123', status: 'Active', joinedAt: '2024-02-01' }
  ] as Collector[],
  routers: [
    { id: 'RTR001', name: 'Mikrotik Utama', host: '192.168.1.1', port: 8728, username: 'admin', status: 'Online' }
  ] as Router[],
  mikrotikUsers: [] as MikrotikUser[],
  paymentAccounts: [
     { id: 'ACC001', type: 'BANK', providerName: 'BCA', accountNumber: '1234567890', accountHolder: 'WIFINET OFFICIAL' },
     { id: 'ACC002', type: 'E-WALLET', providerName: 'DANA', accountNumber: '081234567890', accountHolder: 'WIFINET' }
  ] as PaymentAccount[],
  gatewayConfig: {
    provider: 'MANUAL',
    isActive: false,
    merchantId: '',
    clientKey: '',
    serverKey: '',
    isSandbox: true
  } as PaymentGatewayConfig
};

export const api = {
  async fetchInitialData() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`${API_URL}?action=init`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);
      if (!res || !res.ok) return MOCK_DATA;
      return await res.json();
    } catch (error) { return MOCK_DATA; }
  },
  async insert(table: string, data: any) { console.log(`[Insert ${table}]`, data); },
  async update(table: string, id: string, data: any) { console.log(`[Update ${table}] ID:${id}`, data); },
  async delete(table: string, id: string) { console.log(`[Delete ${table}] ID:${id}`); },
  async bulkDelete(table: string, ids: string[]) { console.log(`[Bulk Delete ${table}]`, ids); },
  async updateAdmin(profile: AdminProfile) { console.log(`[Update Admin]`, profile); },
  async updateGatewayConfig(config: PaymentGatewayConfig) { console.log(`[Update Gateway]`, config); }
};
