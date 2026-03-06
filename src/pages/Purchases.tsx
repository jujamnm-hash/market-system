import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import type { PurchaseInvoice, InvoiceItem } from '../types';

export default function Purchases() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Manual item form
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualBuy, setManualBuy] = useState(0);
  const [manualSell, setManualSell] = useState(0);
  const [manualUnit, setManualUnit] = useState('حبة');

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const remaining = paymentType === 'debt' ? total - paidAmount : 0;

  const addExistingItem = (productId: string) => {
    const p = state.products.find(x => x.id === productId);
    if (!p) return;
    const existing = items.find(i => i.productId === productId);
    if (existing) setItems(items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    else setItems([...items, { productId: p.id, productName: p.name, barcode: p.barcode, qty: 1, price: p.buyPrice, total: p.buyPrice }]);
    setProductSearch(''); setShowProductList(false);
  };

  const addManualItem = () => {
    if (!manualName.trim()) return;
    const newProd: import('../types').Product = { id: generateId(), name: manualName, barcode: generateId(), category: '', buyPrice: manualBuy, sellPrice: manualSell, stock: 0, minStock: 5, unit: manualUnit, createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_PRODUCT', payload: newProd });
    setItems([...items, { productId: newProd.id, productName: manualName, barcode: newProd.barcode, qty: manualQty, price: manualBuy, total: manualBuy * manualQty }]);
    setManualName(''); setManualQty(1); setManualBuy(0); setManualSell(0);
  };

  const updateItem = (idx: number, field: 'qty' | 'price', val: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetForm = () => {
    setDate(todayISO()); setSupplierId(''); setPaymentType('cash'); setPaidAmount(0); setNotes(''); setItems([]);
  };

  const savePurchase = () => {
    if (items.length === 0) return;
    const inv: PurchaseInvoice = {
      id: generateId(),
      invoiceNo: generateInvoiceNo('P', state.purchases.length),
      date, supplierId, items,
      total, paymentType,
      subtotal: total,
      discount: 0,
      paid: paymentType === 'cash' ? total : paidAmount,
      remaining: paymentType === 'cash' ? 0 : remaining,
      notes,
    };
    dispatch({ type: 'ADD_PURCHASE', payload: inv });
    items.forEach(item => dispatch({ type: 'UPDATE_STOCK', payload: { id: item.productId, delta: item.qty } }));
    resetForm(); setShowAdd(false);
  };

  const filteredPurchases = useMemo(() => state.purchases.filter(p => {
    const supp = state.suppliers.find(s => s.id === p.supplierId);
    return p.invoiceNo.includes(search) || (supp?.name ?? '').includes(search);
  }).sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo)), [state.purchases, state.suppliers, search]);

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
            placeholder="بحث بالفاتورة أو المورد..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-purple-700 transition active:scale-95"
        >
          <Plus size={16} /> فاتورة
        </button>
      </div>

      <div className="space-y-2">
        {filteredPurchases.length === 0
          ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد فواتير مشتريات</div>
          : filteredPurchases.map(p => {
            const supp = state.suppliers.find(s => s.id === p.supplierId);
            return (
              <div key={p.id} className="bg-white rounded-2xl p-3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-800">{p.invoiceNo}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.date)} · {supp?.name ?? 'مورد عام'}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-purple-600 text-sm">{formatMoney(p.total)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${p.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.paymentType === 'cash' ? '💵 نقدي' : '📋 آجل'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{p.items.length} مادة</span>
                  {p.remaining > 0 && <span className="text-amber-600 font-semibold">متبقي: {formatMoney(p.remaining)}</span>}
                </div>
              </div>
            );
          })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="فاتورة مشتريات جديدة">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المورد</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">اختر المورد</option>
                {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">طريقة الدفع</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentType('cash')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${paymentType === 'cash' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>💵 نقدي</button>
              <button onClick={() => setPaymentType('debt')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${paymentType === 'debt' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>📋 آجل</button>
            </div>
          </div>

          {/* Search existing products */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اختر من المخزن</label>
            <div className="relative">
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ابحث عن مادة موجودة..."
                value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
              />
              {showProductList && productSearch && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addExistingItem(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-purple-50 transition text-right">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-purple-600 text-xs">{formatMoney(p.buyPrice)}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">لا توجد نتائج</p>}
                </div>
              )}
            </div>
          </div>

          {/* Manual item */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Package size={12} /> إضافة مادة جديدة</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="اسم المادة" value={manualName} onChange={e => setManualName(e.target.value)} />
              <select className="border border-slate-200 rounded-xl px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={manualUnit} onChange={e => setManualUnit(e.target.value)}>
                {['حبة', 'كغ', 'لتر', 'م', 'Pack', 'Box', 'كرتون', 'كيس'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input type="number" className="border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="الكمية" value={manualQty || ''} onChange={e => setManualQty(+e.target.value)} min={1} />
              <input type="number" className="border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="سعر شراء" value={manualBuy || ''} onChange={e => setManualBuy(+e.target.value)} />
              <input type="number" className="border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="سعر بيع" value={manualSell || ''} onChange={e => setManualSell(+e.target.value)} />
            </div>
            <button onClick={addManualItem} className="w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition">
              ➕ إضافة للفاتورة
            </button>
          </div>

          {/* Cart */}
          {items.length > 0 && (
            <div className="space-y-1.5 bg-slate-50 rounded-xl p-2">
              <p className="text-xs font-semibold text-slate-500 px-1">المواد ({items.length})</p>
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

          {paymentType === 'debt' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ المدفوع (د.ع)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={paidAmount || ''} onChange={e => setPaidAmount(+e.target.value)} placeholder="0" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات..." />
          </div>

          <div className="bg-purple-50 rounded-xl p-3">
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-700">الإجمالي:</span>
              <span className="text-purple-700">{formatMoney(total)}</span>
            </div>
            {paymentType === 'debt' && remaining > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-amber-600">المتبقي:</span>
                <span className="font-bold text-amber-600">{formatMoney(remaining)}</span>
              </div>
            )}
          </div>

          <button onClick={savePurchase} disabled={items.length === 0}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            ✅ حفظ الفاتورة
          </button>
        </div>
      </Modal>
    </div>
  );
}
