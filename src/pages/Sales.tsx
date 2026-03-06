import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Trash2, ShoppingCart, User } from 'lucide-react';
import type { SaleInvoice, InvoiceItem } from '../types';

export default function Sales() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = subtotal - discount;
  const remaining = paymentType === 'debt' ? total - paidAmount : 0;

  const addItem = (productId: string) => {
    const p = state.products.find(x => x.id === productId);
    if (!p) return;
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      setItems(items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { productId: p.id, productName: p.name, barcode: p.barcode, qty: 1, price: p.sellPrice, total: p.sellPrice }]);
    }
    setProductSearch('');
    setShowProductList(false);
  };

  const updateItem = (idx: number, field: 'qty' | 'price', val: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val, total: (field === 'qty' ? val : item.qty) * (field === 'price' ? val : item.price) } : item));
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetForm = () => {
    setDate(todayISO()); setCustomerId(''); setPaymentType('cash'); setPaidAmount(0);
    setDiscount(0); setNotes(''); setItems([]);
  };

  const saveSale = () => {
    if (items.length === 0) return;
    const inv: SaleInvoice = {
      id: generateId(),
      invoiceNo: generateInvoiceNo('S', state.sales.length),
      date, customerId, items,
      subtotal, discount, total,
      paymentType,
      paid: paymentType === 'cash' ? total : paidAmount,
      remaining: paymentType === 'cash' ? 0 : remaining,
      notes,
    };
    dispatch({ type: 'ADD_SALE', payload: inv });
    items.forEach(item => dispatch({ type: 'UPDATE_STOCK', payload: { id: item.productId, delta: -item.qty } }));
    resetForm();
    setShowAdd(false);
  };

  const filteredSales = useMemo(() => state.sales.filter(s => {
    const cust = state.customers.find(c => c.id === s.customerId);
    return s.invoiceNo.includes(search) || (cust?.name ?? '').includes(search);
  }).sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo)), [state.sales, state.customers, search]);

  const filteredProducts = state.products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch)
  );

  return (
    <div className="pb-24 pt-16 px-3 fade-in">
      <div className="flex gap-2 mt-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            className="w-full border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            placeholder="بحث بالفاتورة أو العميل..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-blue-700 transition active:scale-95"
        >
          <Plus size={16} /> فاتورة
        </button>
      </div>

      <div className="space-y-2">
        {filteredSales.length === 0
          ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد فواتير مبيعات</div>
          : filteredSales.map(s => {
            const cust = state.customers.find(c => c.id === s.customerId);
            return (
              <div key={s.id} className="bg-white rounded-2xl p-3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-800">{s.invoiceNo}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.date)} · {cust?.name ?? 'عميل عام'}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600 text-sm">{formatMoney(s.total)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${s.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.paymentType === 'cash' ? '💵 نقدي' : '📋 آجل'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{s.items.length} مادة</span>
                  {s.discount > 0 && <span className="text-red-500">خصم: {formatMoney(s.discount)}</span>}
                  {s.remaining > 0 && <span className="text-amber-600 font-semibold">متبقي: {formatMoney(s.remaining)}</span>}
                </div>
              </div>
            );
          })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="فاتورة مبيعات جديدة">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">العميل</label>
              <div className="relative">
                <User size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                <select
                  className="w-full border border-slate-200 rounded-xl pr-8 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
                  value={customerId} onChange={e => setCustomerId(e.target.value)}
                >
                  <option value="">عميل عام</option>
                  {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">طريقة الدفع</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentType('cash')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${paymentType === 'cash' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >💵 نقدي</button>
              <button
                onClick={() => setPaymentType('debt')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${paymentType === 'debt' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >📋 آجل</button>
            </div>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">إضافة مادة</label>
            <div className="relative">
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ابحث عن المادة..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
              />
              {showProductList && productSearch && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 transition text-right"
                    >
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-green-600 text-xs">{formatMoney(p.sellPrice)}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">لا توجد نتائج</p>}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="space-y-1.5 bg-slate-50 rounded-xl p-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-1">
                <ShoppingCart size={13} />
                <span>السلة ({items.length} مادة)</span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded-xl px-2 py-2">
                  <span className="flex-1 text-xs font-medium text-slate-700 truncate">{item.productName}</span>
                  <input type="number" className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                    value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} min={1} />
                  <input type="number" className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                    value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} />
                  <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الخصم (د.ع)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={discount || ''} onChange={e => setDiscount(+e.target.value)} placeholder="0" />
            </div>
            {paymentType === 'debt' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ المدفوع (د.ع)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={paidAmount || ''} onChange={e => setPaidAmount(+e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
          </div>

          {/* Totals */}
          <div className="bg-blue-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">المجموع:</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">الخصم:</span>
                <span className="font-semibold text-red-500">- {formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-1 mt-1">
              <span className="text-slate-700">الإجمالي:</span>
              <span className="text-blue-700">{formatMoney(total)}</span>
            </div>
            {paymentType === 'debt' && remaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">المتبقي:</span>
                <span className="font-bold text-amber-600">{formatMoney(remaining)}</span>
              </div>
            )}
          </div>

          <button
            onClick={saveSale}
            disabled={items.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✅ حفظ الفاتورة
          </button>
        </div>
      </Modal>
    </div>
  );
}
