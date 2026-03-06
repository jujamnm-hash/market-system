// ==================== PRODUCT ====================
export interface Product {
  id: string;
  name: string;
  nameKu?: string;
  barcode: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
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
  total: number;
}

// ==================== SALE INVOICE ====================
export type PaymentType = 'cash' | 'debt';

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
  paymentType: PaymentType;
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
}
