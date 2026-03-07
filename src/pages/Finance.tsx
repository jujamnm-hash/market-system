import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { generateId } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit, DollarSign, CheckCircle } from 'lucide-react';
import type { Expense, Employee, SalaryPayment } from '../types';

type Tab = 'expenses' | 'employees' | 'debts';

const EXPENSE_CATS = ['طعام وشراب', 'كهرباء', 'إيجار', 'غاز', 'نقل', 'صيانة', 'أثاث', 'أخرى'];
const EXPENSE_CATS_EN: Record<string, string> = {
  'طعام وشراب': 'Food & Drink', 'كهرباء': 'Electricity', 'إيجار': 'Rent',
  'غاز': 'Gas', 'نقل': 'Transport', 'صيانة': 'Maintenance', 'أثاث': 'Furniture', 'أخرى': 'Other',
};

export default function Finance() {
  const { state, dispatch } = useApp();
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>('expenses');

  // Expense state
  const [showExpModal, setShowExpModal] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [expForm, setExpForm] = useState({ description: '', amount: 0, category: EXPENSE_CATS[0], date: todayISO() });

  // Employee state
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ name: '', position: '', salary: 0, phone: '' });

  // Salary modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryEmp, setSalaryEmp] = useState<Employee | null>(null);
  const [salaryForm, setSalaryForm] = useState({ amount: 0, date: todayISO(), notes: '' });

  // Debt tab
  const [debtView, setDebtView] = useState<'customers' | 'suppliers'>('customers');

  // Expense handlers
  const openAddExp = () => { setEditExp(null); setExpForm({ description: '', amount: 0, category: EXPENSE_CATS[0], date: todayISO() }); setShowExpModal(true); };
  const openEditExp = (e: Expense) => { setEditExp(e); setExpForm({ description: e.description, amount: e.amount, category: e.category, date: e.date }); setShowExpModal(true); };
  const saveExp = () => {
    if (!expForm.description.trim() || expForm.amount <= 0) return;
    if (editExp) dispatch({ type: 'UPDATE_EXPENSE', payload: { ...editExp, ...expForm } });
    else dispatch({ type: 'ADD_EXPENSE', payload: { id: generateId(), ...expForm } });
    setShowExpModal(false);
  };

  // Employee handlers
  const openAddEmp = () => { setEditEmp(null); setEmpForm({ name: '', position: '', salary: 0, phone: '' }); setShowEmpModal(true); };
  const openEditEmp = (e: Employee) => { setEditEmp(e); setEmpForm({ name: e.name, position: e.position, salary: e.salary, phone: e.phone ?? '' }); setShowEmpModal(true); };
  const saveEmp = () => {
    if (!empForm.name.trim()) return;
    if (editEmp) dispatch({ type: 'UPDATE_EMPLOYEE', payload: { ...editEmp, ...empForm } });
    else dispatch({ type: 'ADD_EMPLOYEE', payload: { id: generateId(), joinDate: todayISO(), ...empForm } });
    setShowEmpModal(false);
  };

  const openSalary = (e: Employee) => { setSalaryEmp(e); setSalaryForm({ amount: e.salary, date: todayISO(), notes: '' }); setShowSalaryModal(true); };
  const saveSalary = () => {
    if (!salaryEmp || salaryForm.amount <= 0) return;
    const payment: SalaryPayment = { id: generateId(), employeeId: salaryEmp.id, employeeName: salaryEmp.name, amount: salaryForm.amount, month: salaryForm.date.slice(0, 7), paidAt: new Date().toISOString(), notes: salaryForm.notes };
    dispatch({ type: 'ADD_SALARY', payload: payment });
    setShowSalaryModal(false);
  };

  // Debt calculations
  const customerDebts = state.customers.map(c => {
    const totalSales = state.sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + s.remaining, 0);
    return { ...c, debt: totalSales };
  }).filter(c => c.debt > 0);

  const supplierDebts = state.suppliers.map(s => {
    const totalPurchases = state.purchases.filter(p => p.supplierId === s.id).reduce((sum, p) => sum + p.remaining, 0);
    return { ...s, debt: totalPurchases };
  }).filter(s => s.debt > 0);

  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>
      {/* Tabs */}
      <div className="tabs-bar mt-3 mb-4">
        {([['expenses', t('expensesTab')], ['employees', t('employeesTab')], ['debts', t('debtsTab')]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as Tab)} className={`tab-item ${tab === key ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <>
          <div className="card p-3.5 flex items-center justify-between mb-4" style={{ background: 'linear-gradient(135deg,#FFF1F2,#FFF7ED)', borderColor: '#FED7AA' }}>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>{t('totalExpenses')}</p>
              <p className="text-xl font-bold text-red-600 mt-0.5">{formatMoney(totalExpenses)}</p>
            </div>
            <button onClick={openAddExp} className="btn-primary px-4 py-2" style={{ background: 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
              <Plus size={16} /> {t('add')}
            </button>
          </div>
          <div className="space-y-2 stagger">
            {state.expenses.length === 0
              ? <div className="empty-state"><DollarSign size={28} /><p>{t('noExpenses')}</p></div>
              : [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <div key={e.id} className="card p-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800">{e.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-red text-[10px]">{e.category}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>{formatDate(e.date)}</span>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-red-600">{formatMoney(e.amount)}</p>
                    <div className="flex gap-1 mt-1.5 justify-end">
                      <button onClick={() => openEditExp(e)} className="btn-icon" style={{ background: '#EEF2FF', width: '28px', height: '28px' }}><Edit size={12} className="text-indigo-600" /></button>
                      <button onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: e.id })} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626', width: '28px', height: '28px' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* EMPLOYEES TAB */}
      {tab === 'employees' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={openAddEmp} className="btn-primary px-4 py-2">
              <Plus size={16} /> {t('add')}
            </button>
          </div>
          <div className="space-y-2 stagger">
            {state.employees.length === 0
              ? <div className="empty-state"><CheckCircle size={28} /><p>{t('noEmployees')}</p></div>
              : state.employees.map(emp => {
                const totalPaid = state.salaryPayments.filter(p => p.employeeId === emp.id).reduce((s, p) => s + p.amount, 0);
                return (
                  <div key={emp.id} className="card p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-indigo-600" style={{ background: '#EEF2FF' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.position}</p>
                        {emp.phone && <p className="text-xs text-slate-400">{emp.phone}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs">{t('salary')}: <b className="text-indigo-600">{formatMoney(emp.salary)}</b></span>
                          <span className="text-xs">{t('paid')}: <b className="text-green-600">{formatMoney(totalPaid)}</b></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openSalary(emp)} className="btn-icon" style={{ background: '#ECFDF5', color: '#059669' }} title={t('payBtn')}>
                        <DollarSign size={14} />
                      </button>
                      <button onClick={() => openEditEmp(emp)} className="btn-icon" style={{ background: '#EEF2FF' }}>
                        <Edit size={14} className="text-indigo-600" />
                      </button>
                      <button onClick={() => dispatch({ type: 'DELETE_EMPLOYEE', payload: emp.id })} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626' }}>
                        <Trash2 size={14} />
                      </button>
                      </div>
                    </div>
                    {/* Recent payments */}
                    {state.salaryPayments.filter(p => p.employeeId === emp.id).slice(-2).map(sp => (
                      <div key={sp.id} className="mt-2 flex items-center justify-between bg-green-50 rounded-xl px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-green-600" />
                          <span className="text-xs text-slate-600">{sp.month}</span>
                        </div>
                        <span className="text-xs font-bold text-green-700">{formatMoney(sp.amount)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* DEBTS TAB */}
      {tab === 'debts' && (
        <>
          <div className="tabs-bar mb-4">
            <button onClick={() => setDebtView('customers')} className={`tab-item ${debtView === 'customers' ? 'active' : ''}`}>
              👥 {t('customersDebts')} · {customerDebts.length}
            </button>
            <button onClick={() => setDebtView('suppliers')} className={`tab-item ${debtView === 'suppliers' ? 'active' : ''}`}>
              🏭 {t('suppliersDebts')} · {supplierDebts.length}
            </button>
          </div>

          {debtView === 'customers' && (
            <div className="space-y-2">
              {customerDebts.length === 0
                ? <div className="card p-8 text-center text-slate-400 text-sm">{t('noDebts')}</div>
                : customerDebts.map(c => <DebtCard key={c.id} name={c.name} debt={c.debt} color="amber" />)}
            </div>
          )}

          {debtView === 'suppliers' && (
            <div className="space-y-2">
              {supplierDebts.length === 0
                ? <div className="card p-8 text-center text-slate-400 text-sm">{t('noDebts')}</div>
                : supplierDebts.map(s => <DebtCard key={s.id} name={s.name} debt={s.debt} color="red" />)}
            </div>
          )}
        </>
      )}

      {/* Expense Modal */}
      <Modal isOpen={showExpModal} onClose={() => setShowExpModal(false)} title={editExp ? t('editExpenseTitle') : t('addExpenseTitle')}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('description')} *</label>
            <input className="input-base" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder={t('descriptionPh')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('amount')} *</label>
              <input type="number" className="input-base" value={expForm.amount || ''} onChange={e => setExpForm({ ...expForm, amount: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('date')}</label>
              <input type="date" className="input-base" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">{t('expenseCategory')}</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATS.map(c => (
                <button key={c} onClick={() => setExpForm({ ...expForm, category: c })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${expForm.category === c ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  style={expForm.category !== c ? { background: 'var(--surface-2)' } : {}}>
                  {lang === 'en' ? EXPENSE_CATS_EN[c] : c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveExp} className="btn-primary w-full py-3.5" style={{ background: 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
            {editExp ? `✅ ${t('save')}` : `➕ ${t('add')}`}
          </button>
        </div>
      </Modal>

      {/* Employee Modal */}
      <Modal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} title={editEmp ? t('editEmployeeTitle') : t('addEmployeeTitle')} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('nameLabel')} *</label>
            <input className="input-base" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} placeholder={t('nameLabel')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('position')}</label>
            <input className="input-base" value={empForm.position} onChange={e => setEmpForm({ ...empForm, position: e.target.value })} placeholder={t('position')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('salary')}</label>
            <input type="number" className="input-base" value={empForm.salary || ''} onChange={e => setEmpForm({ ...empForm, salary: +e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('phone')}</label>
            <input className="input-base" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} placeholder="07XX XXX XXXX" />
          </div>
          <button onClick={saveEmp} className="btn-primary w-full py-3.5">
            {editEmp ? `✅ ${t('save')}` : `➕ ${t('add')}`}
          </button>
        </div>
      </Modal>

      {/* Salary Modal */}
      <Modal isOpen={showSalaryModal} onClose={() => setShowSalaryModal(false)} title={`${t('paySalaryTitle')}: ${salaryEmp?.name ?? ''}`} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('amount')} *</label>
            <input type="number" className="input-base" value={salaryForm.amount || ''} onChange={e => setSalaryForm({ ...salaryForm, amount: +e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('date')}</label>
            <input type="date" className="input-base" value={salaryForm.date} onChange={e => setSalaryForm({ ...salaryForm, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('notes')}</label>
            <input className="input-base" value={salaryForm.notes} onChange={e => setSalaryForm({ ...salaryForm, notes: e.target.value })} placeholder={t('notes_ph')} />
          </div>
          <button onClick={saveSalary} className="btn-primary w-full py-3.5" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            {t('payBtn')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DebtCard({ name, debt, color }: { name: string; debt: number; color: 'amber' | 'red' }) {
  const isAmber = color === 'amber';
  return (
    <div className="card p-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: isAmber ? '#FEF3C7' : '#FFF1F2', color: isAmber ? '#D97706' : '#DC2626' }}
        >
          {name.charAt(0)}
        </div>
        <span className="font-bold text-sm text-slate-800">{name}</span>
      </div>
      <span className={`badge ${isAmber ? 'badge-amber' : 'badge-red'} text-sm font-bold px-3 py-1.5`}>
        {formatMoney(debt)}
      </span>
    </div>
  );
}
