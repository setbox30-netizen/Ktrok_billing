
export enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended'
}

export enum BillStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PENDING = 'Pending'
}

export interface Package {
  id: string;
  name: string;
  speed: string;
  price: number;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  packageId: string;
  status: Status;
  createdAt: string;
  password?: string;
}

export interface Bill {
  id: string;
  customerId: string;
  month: string;
  year: number;
  amount: number;
  penaltyAmount?: number;
  status: BillStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
}

export interface Router {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  status: 'Online' | 'Offline' | 'Testing';
}

export interface MikrotikUser {
  id: string;
  customerId: string;
  routerId: string;
  username: string;
  profile: string; 
  enabled: boolean;
  lastSynced: string;
}

export interface AdminProfile {
  name: string;
  businessName: string;
  username: string;
  password?: string;
  autoBillingEnabled?: boolean;
  billingDay?: number;
}

export type PaymentType = 'BANK' | 'E-WALLET' | 'QRIS';

export interface PaymentAccount {
  id: string;
  type: PaymentType;
  providerName: string; // BCA, OVO, DANA, ShopeePay, QRIS
  accountNumber: string;
  accountHolder: string;
}

export type PaymentGatewayProvider = 'MANUAL' | 'MIDTRANS' | 'XENDIT';

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider;
  isActive: boolean;
  merchantId?: string;
  clientKey?: string;
  serverKey?: string;
  isSandbox: boolean;
}

export type View = 'dashboard' | 'customers' | 'packages' | 'billing' | 'mikrotik' | 'settings' | 'payment-settings';
export type PortalView = 'home' | 'history' | 'payment' | 'package' | 'profile';
export type AppMode = 'admin' | 'portal';
