import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Product, Category, Supplier, Customer, SaleInvoice, PurchaseInvoice, ReturnInvoice, Expense, Employee, SalaryPayment } from '../types';
import { loadState, saveState } from '../utils/storage';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  // Products
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'UPDATE_STOCK'; payload: { id: string; delta: number } }
  // Categories
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  // Suppliers
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  // Customers
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  // Sales
  | { type: 'ADD_SALE'; payload: SaleInvoice }
  | { type: 'DELETE_SALE'; payload: string }
  // Purchases
  | { type: 'ADD_PURCHASE'; payload: PurchaseInvoice }
  | { type: 'DELETE_PURCHASE'; payload: string }
  // Returns
  | { type: 'ADD_RETURN'; payload: ReturnInvoice }
  // Expenses
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  // Employees
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  // Salary
  | { type: 'ADD_SALARY'; payload: SalaryPayment }
  | { type: 'DELETE_SALARY'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE': return action.payload;
    case 'ADD_PRODUCT': return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'UPDATE_STOCK': return {
      ...state,
      products: state.products.map(p => p.id === action.payload.id ? { ...p, stock: Math.max(0, p.stock + action.payload.delta) } : p)
    };
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'ADD_SUPPLIER': return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    case 'ADD_CUSTOMER': return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
    case 'ADD_SALE': return { ...state, sales: [action.payload, ...state.sales] };
    case 'DELETE_SALE': return { ...state, sales: state.sales.filter(s => s.id !== action.payload) };
    case 'ADD_PURCHASE': return { ...state, purchases: [action.payload, ...state.purchases] };
    case 'DELETE_PURCHASE': return { ...state, purchases: state.purchases.filter(p => p.id !== action.payload) };
    case 'ADD_RETURN': return { ...state, returns: [action.payload, ...state.returns] };
    case 'ADD_EXPENSE': return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE': return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EXPENSE': return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
    case 'ADD_EMPLOYEE': return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE': return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EMPLOYEE': return { ...state, employees: state.employees.filter(e => e.id !== action.payload) };
    case 'ADD_SALARY': return { ...state, salaryPayments: [action.payload, ...state.salaryPayments] };
    case 'DELETE_SALARY': return { ...state, salaryPayments: state.salaryPayments.filter(s => s.id !== action.payload) };
    default: return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
