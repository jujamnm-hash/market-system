// ==================== PRODUCT ====================
export interface Product {
  id: string;
  name: string;
  nameKu?: string;
  barcode: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  avgCost: number;   // Weighted Average Cost — updated on every purchase
  stock: number;
  minStock: number;
  unit: string;
  createdAt: string;
}

// ==================== CATEGORY ====================
export interface Category {
  id: string;
  name: string;
  color: string;
}

// ==================== SUPPLIER ====================
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number; // ئەگەر > 0 ئیمە بدەین، < 0 ئەوان بدەن
}

// ==================== CUSTOMER ====================
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number; // ئەگەر > 0 ئەوان بدەین، < 0 ئیمە بدەین
}

// ==================== INVOICE ITEM ====================
export interface InvoiceItem {
  productId: string;
  productName: string;
  barcode: string;
  qty: number;
  price: number;
  costPrice?: number;  // avgCost at time of sale (for COGS) — optional for purchase items
  expiryDate?: string; // optional per-item expiry date set at purchase time
  total: number;
}

// ==================== SALE INVOICE ====================
export type PaymentType = 'cash' | 'debt';
export type PurchasePaymentType = 'cash' | 'debt' | 'gift';

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerId?: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  paymentType: PaymentType;
  notes?: string;
}

// ==================== PURCHASE INVOICE ====================
export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  supplierId?: string;
  supplierName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  paymentType: PurchasePaymentType;
  notes?: string;
}

// ==================== RETURN ====================
export type ReturnType = 'sale-return' | 'purchase-return';

export interface ReturnInvoice {
  id: string;
  returnNo: string;
  date: string;
  type: ReturnType;
  originalInvoiceNo?: string;
  partyName?: string;
  items: InvoiceItem[];
  total: number;
  reason?: string;
}

// ==================== EXPENSE ====================
export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

// ==================== EMPLOYEE ====================
export interface Employee {
  id: string;
  name: string;
  phone: string;
  position: string;
  salary: number;
  joinDate: string;
}

// ==================== SALARY PAYMENT ====================
export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  amount: number;
  paidAt: string;
  notes?: string;
}

// ==================== EXPIRY BATCH ====================
export interface ExpiryBatch {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  qty: number;
  purchaseDate: string;       // date purchased
  expiryDate: string;         // YYYY-MM-DD
  purchaseInvoiceId?: string;
  buyPrice: number;
}

// ==================== APP STATE ====================
export interface AppState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
  returns: ReturnInvoice[];
  expenses: Expense[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  expiryBatches: ExpiryBatch[];
}
