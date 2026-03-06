import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit, DollarSign, CheckCircle } from 'lucide-react';
import type { Expense, Employee, SalaryPayment } from '../types';

type Tab = 'expenses' | 'employees' | 'debts';

const EXPENSE_CATS = ['طعام وشراب', 'كهرباء', 'إيجار', 'غاز', 'نقل', 'صيانة', 'أثاث', 'أخرى'];

export default function Finance() {
  const { state, dispatch } = useApp();
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
    <div className="pb-24 pt-16 px-3 fade-in">
      {/* Tabs */}
      <div className="flex gap-1.5 mt-3 mb-4 overflow-x-auto">
        {([['expenses', '💸 المصروفات'], ['employees', '👷 الموظفين'], ['debts', '📋 الديون']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* EXPENSES TAB */}
      {tab === 'expenses' && (
        <>
          <div className="bg-red-50 rounded-2xl p-3 flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-red-600">{formatMoney(totalExpenses)}</p>
            </div>
            <button onClick={openAddExp} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-red-700 transition active:scale-95">
              <Plus size={16} /> إضافة
            </button>
          </div>
          <div className="space-y-2">
            {state.expenses.length === 0
              ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد مصروفات</div>
              : [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <div key={e.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">{e.category}</span>
                      <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                    </div>

                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-red-600 text-sm">{formatMoney(e.amount)}</p>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => openEditExp(e)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit size={12} /></button>
                      <button onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: e.id })} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"><Trash2 size={12} /></button>
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
            <button onClick={openAddEmp} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-blue-700 transition active:scale-95">
              <Plus size={16} /> موظف جديد
            </button>
          </div>
          <div className="space-y-2">
            {state.employees.length === 0
              ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا يوجد موظفون</div>
              : state.employees.map(emp => {
                const totalPaid = state.salaryPayments.filter(p => p.employeeId === emp.id).reduce((s, p) => s + p.amount, 0);
                return (
                  <div key={emp.id} className="bg-white rounded-2xl p-3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.position}</p>
                        {emp.phone && <p className="text-xs text-slate-400">{emp.phone}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs">راتب: <b className="text-blue-600">{formatMoney(emp.salary)}</b></span>
                          <span className="text-xs">مدفوع: <b className="text-green-600">{formatMoney(totalPaid)}</b></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openSalary(emp)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition" title="دفع راتب">
                          <DollarSign size={14} />
                        </button>
                        <button onClick={() => openEditEmp(emp)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => dispatch({ type: 'DELETE_EMPLOYEE', payload: emp.id })} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition">
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
          <div className="flex gap-2 mb-4">
            <button onClick={() => setDebtView('customers')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${debtView === 'customers' ? 'bg-amber-500 text-white' : 'bg-white text-slate-500'}`}>
              👥 ديون العملاء ({customerDebts.length})
            </button>
            <button onClick={() => setDebtView('suppliers')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${debtView === 'suppliers' ? 'bg-red-500 text-white' : 'bg-white text-slate-500'}`}>
              🏭 ديون الموردين ({supplierDebts.length})
            </button>
          </div>

          {debtView === 'customers' && (
            <div className="space-y-2">
              {customerDebts.length === 0
                ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد ديون عملاء</div>
                : customerDebts.map(c => <DebtCard key={c.id} name={c.name} debt={c.debt} color="amber" />)}
            </div>
          )}

          {debtView === 'suppliers' && (
            <div className="space-y-2">
              {supplierDebts.length === 0
                ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد ديون موردين</div>
                : supplierDebts.map(s => <DebtCard key={s.id} name={s.name} debt={s.debt} color="red" />)}
            </div>
          )}
        </>
      )}

      {/* Expense Modal */}
      <Modal isOpen={showExpModal} onClose={() => setShowExpModal(false)} title={editExp ? 'تعديل المصروف' : 'إضافة مصروف'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الوصف *</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="وصف المصروف" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ (د.ع) *</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={expForm.amount || ''} onChange={e => setExpForm({ ...expForm, amount: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الفئة</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATS.map(c => (
                <button key={c} onClick={() => setExpForm({ ...expForm, category: c })}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition ${expForm.category === c ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveExp} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition active:scale-95">
            {editExp ? '✅ حفظ التعديلات' : '➕ إضافة'}
          </button>
        </div>
      </Modal>

      {/* Employee Modal */}
      <Modal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} title={editEmp ? 'تعديل موظف' : 'إضافة موظف'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم *</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} placeholder="اسم الموظف" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">المنصب</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={empForm.position} onChange={e => setEmpForm({ ...empForm, position: e.target.value })} placeholder="المنصب الوظيفي" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الراتب الأساسي (د.ع)</label>
            <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={empForm.salary || ''} onChange={e => setEmpForm({ ...empForm, salary: +e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} placeholder="07XX XXX XXXX" />
          </div>
          <button onClick={saveEmp} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition active:scale-95">
            {editEmp ? '✅ حفظ' : '➕ إضافة'}
          </button>
        </div>
      </Modal>

      {/* Salary Modal */}
      <Modal isOpen={showSalaryModal} onClose={() => setShowSalaryModal(false)} title={`دفع راتب: ${salaryEmp?.name ?? ''}`} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ (د.ع) *</label>
            <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={salaryForm.amount || ''} onChange={e => setSalaryForm({ ...salaryForm, amount: +e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={salaryForm.date} onChange={e => setSalaryForm({ ...salaryForm, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={salaryForm.notes} onChange={e => setSalaryForm({ ...salaryForm, notes: e.target.value })} placeholder="اختياري" />
          </div>
          <button onClick={saveSalary} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition active:scale-95">
            ✅ تأكيد الدفع
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DebtCard({ name, debt, color }: { name: string; debt: number; color: 'amber' | 'red' }) {
  const bg = color === 'amber' ? 'bg-amber-50' : 'bg-red-50';
  const textColor = color === 'amber' ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="bg-white rounded-2xl p-3.5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center font-bold text-sm ${textColor}`}>
          {name.charAt(0)}
        </div>
        <span className="font-semibold text-sm text-slate-800">{name}</span>
      </div>
      <div className="text-left">
        <p className={`font-bold text-sm ${textColor}`}>{formatMoney(debt)}</p>
        <p className="text-[10px] text-slate-400">مستحق</p>
      </div>
    </div>
  );
}
