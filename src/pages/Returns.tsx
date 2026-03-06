import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { ReturnInvoice, InvoiceItem } from '../types';

export default function Returns() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const [returnType, setReturnType] = useState<'sale-return' | 'purchase-return'>('sale-return');
  const [date, setDate] = useState(todayISO());
  const [partyId, setPartyId] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  const addItem = (productId: string) => {
    const p = state.products.find(x => x.id === productId);
    if (!p) return;
    const existing = items.find(i => i.productId === productId);
    if (existing) setItems(items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    else setItems([...items, { productId: p.id, productName: p.name, barcode: p.barcode, qty: 1, price: returnType === 'sale-return' ? p.sellPrice : p.buyPrice, total: returnType === 'sale-return' ? p.sellPrice : p.buyPrice }]);
    setProductSearch(''); setShowProductList(false);
  };

  const updateItem = (idx: number, field: 'qty' | 'price', val: number) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetForm = () => { setDate(todayISO()); setPartyId(''); setReason(''); setItems([]); };

  const saveReturn = () => {
    if (items.length === 0) return;
    const partyName = returnType === 'sale-return'
      ? (state.customers.find(c => c.id === partyId)?.name ?? '')
      : (state.suppliers.find(s => s.id === partyId)?.name ?? '');
    const inv: ReturnInvoice = {
      id: generateId(),
      returnNo: generateInvoiceNo('R', state.returns.length),
      date, type: returnType, partyName, items, total, reason,
    };
    dispatch({ type: 'ADD_RETURN', payload: inv });
    const delta = returnType === 'sale-return' ? 1 : -1;
    items.forEach(item => dispatch({ type: 'UPDATE_STOCK', payload: { id: item.productId, delta: item.qty * delta } }));
    resetForm(); setShowAdd(false);
  };

  const filteredReturns = useMemo(() => state.returns.filter(r => {
    return r.returnNo.includes(search) || (r.partyName ?? '').includes(search);
  }).sort((a, b) => b.returnNo.localeCompare(a.returnNo)), [state.returns, search, returnType]);

  const filteredProducts = state.products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch)
  );

  return (
    <div className="pb-24 pt-16 px-3 fade-in">
      <div className="flex gap-2 mt-3 mb-4">
        <button onClick={() => setReturnType('sale-return')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${returnType === 'sale-return' ? 'bg-orange-500 text-white' : 'bg-white text-slate-500'}`}>
          📤 مرتجع مبيعات
        </button>
        <button onClick={() => setReturnType('purchase-return')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${returnType === 'purchase-return' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500'}`}>
          📥 مرتجع مشتريات
        </button>
      </div>

      <div className={`text-xs rounded-xl px-3 py-2 mb-3 ${returnType === 'sale-return' ? 'bg-orange-50 text-orange-700' : 'bg-indigo-50 text-indigo-700'}`}>
        {returnType === 'sale-return'
          ? '📦 مرتجع مبيعات: يزيد المخزون (المنتج رجع إلى المتجر)'
          : '📦 مرتجع مشتريات: ينقص المخزون (المنتج يعود إلى المورد)'}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            className="w-full border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            placeholder="بحث..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className={`px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold text-white transition active:scale-95 ${returnType === 'sale-return' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
        >
          <Plus size={16} /> مرتجع
        </button>
      </div>

      <div className="space-y-2">
        {filteredReturns.filter(r => r.type === returnType).length === 0
          ? <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد مرتجعات</div>
          : filteredReturns.filter(r => r.type === returnType).map(r => {
            return (
              <div key={r.id} className="bg-white rounded-2xl p-3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-800">{r.returnNo}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.date)} · {r.partyName || (returnType === 'sale-return' ? 'عميل عام' : 'مورد عام')}</p>
                    {r.reason && <p className="text-xs text-slate-500 mt-0.5">السبب: {r.reason}</p>}
                  </div>
                  <span className={`font-bold text-sm ${returnType === 'sale-return' ? 'text-orange-500' : 'text-indigo-500'}`}>{formatMoney(r.total)}</span>
                </div>
              </div>
            );
          })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={returnType === 'sale-return' ? 'مرتجع مبيعات جديد' : 'مرتجع مشتريات جديد'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{returnType === 'sale-return' ? 'العميل' : 'المورد'}</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={partyId} onChange={e => setPartyId(e.target.value)}>
                <option value="">{returnType === 'sale-return' ? 'عميل عام' : 'مورد عام'}</option>
                {(returnType === 'sale-return' ? state.customers : state.suppliers).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">سبب الإرجاع</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={reason} onChange={e => setReason(e.target.value)} placeholder="اختياري - سبب الإرجاع" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اختر المواد المرتجعة</label>
            <div className="relative">
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ابحث عن مادة..."
                value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
              />
              {showProductList && productSearch && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addItem(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-orange-50 transition text-right">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400">{p.stock} {p.unit}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">لا توجد نتائج</p>}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-1.5 bg-slate-50 rounded-xl p-2">
              <p className="text-xs font-semibold text-slate-500 px-1">المواد المرتجعة ({items.length})</p>
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

          <div className={`rounded-xl p-3 ${returnType === 'sale-return' ? 'bg-orange-50' : 'bg-indigo-50'}`}>
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-700">الإجمالي:</span>
              <span className={returnType === 'sale-return' ? 'text-orange-600' : 'text-indigo-600'}>{formatMoney(total)}</span>
            </div>
          </div>

          <button onClick={saveReturn} disabled={items.length === 0}
            className={`w-full text-white py-3 rounded-xl font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${returnType === 'sale-return' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
            ✅ حفظ المرتجع
          </button>
        </div>
      </Modal>
    </div>
  );
}
