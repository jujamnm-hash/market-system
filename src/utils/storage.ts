import type { AppState } from '../types';

const KEY = 'market_system_v1';

export const defaultState: AppState = {
  products: [
    { id: '1', name: 'سكر', barcode: '6001234567890', category: 'cat1', buyPrice: 1200, sellPrice: 1500, stock: 50, minStock: 10, unit: 'كغ', createdAt: new Date().toISOString() },
    { id: '2', name: 'أرز', barcode: '6009876543210', category: 'cat1', buyPrice: 2500, sellPrice: 3000, stock: 5, minStock: 10, unit: 'كغ', createdAt: new Date().toISOString() },
    { id: '3', name: 'زيت نباتي', barcode: '6005555555555', category: 'cat2', buyPrice: 3000, sellPrice: 3500, stock: 20, minStock: 5, unit: 'لتر', createdAt: new Date().toISOString() },
  ],
  categories: [
    { id: 'cat1', name: 'مواد غذائية', color: '#10b981' },
    { id: 'cat2', name: 'مشروبات', color: '#3b82f6' },
    { id: 'cat3', name: 'منظفات', color: '#f59e0b' },
    { id: 'cat4', name: 'أخرى', color: '#8b5cf6' },
  ],
  suppliers: [
    { id: 's1', name: 'شركة أحمد للتوريد', phone: '07701234567', address: 'أربيل', debt: 0 },
    { id: 's2', name: 'مورد الأنوار', phone: '07509876543', address: 'السليمانية', debt: 150000 },
  ],
  customers: [
    { id: 'c1', name: 'عميل عام', phone: '', address: '', debt: 0 },
    { id: 'c2', name: 'أحمد علي', phone: '07751234567', address: 'أربيل', debt: 50000 },
  ],
  sales: [],
  purchases: [],
  returns: [],
  expenses: [],
  employees: [
    { id: 'e1', name: 'محمد كريم', phone: '07701111111', position: 'موظف مبيعات', salary: 500000, joinDate: '2024-01-01' },
  ],
  salaryPayments: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function generateInvoiceNo(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
}
