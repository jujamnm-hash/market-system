import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { ReturnInvoice, InvoiceItem } from '../types';

export default function Returns() {
  const { state, dispatch } = useApp();
  const { t } = useLang();
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
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>
      <div className="tabs-bar mt-3 mb-3">
        <button onClick={() => setReturnType('sale-return')} className={`tab-item ${returnType === 'sale-return' ? 'active' : ''}`}>
          {t('salesReturnTab')}
        </button>
        <button onClick={() => setReturnType('purchase-return')} className={`tab-item ${returnType === 'purchase-return' ? 'active' : ''}`}>
          {t('purchaseReturnTab')}
        </button>
      </div>

      <div className={`text-xs rounded-xl px-3 py-2 mb-3 font-medium ${returnType === 'sale-return' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
        {returnType === 'sale-return' ? t('salesReturnInfo') : t('purchaseReturnInfo')}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            className="input-search"
            placeholder={t('searchReturnsPh')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '38px' }}
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className={`btn-primary px-4 py-2 ${returnType === 'purchase-return' ? '' : ''}`}
          style={returnType === 'purchase-return' ? { background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' } : { background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
        >
          <Plus size={16} /> {t('returnBtn')}
        </button>
      </div>

      <div className="space-y-2 stagger">
        {filteredReturns.filter(r => r.type === returnType).length === 0
          ? <div className="empty-state"><Trash2 size={28} /><p>{t('noReturns')}</p></div>
          : filteredReturns.filter(r => r.type === returnType).map(r => {
            const isS = r.type === 'sale-return';
            return (
              <div key={r.id} className="card p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-800">{r.returnNo}</span>
                      <span className={`badge ${isS ? 'badge-amber' : 'badge-blue'}`}>
                        {isS ? t('salesReturnTab') : t('purchaseReturnTab')}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{formatDate(r.date)} · {r.partyName || (isS ? t('generalCustomer') : t('supplier'))}</p>
                    {r.reason && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>{t('reason')}: {r.reason}</p>}
                  </div>
                  <span className={`font-bold ${isS ? 'text-orange-500' : 'text-indigo-500'}`}>{formatMoney(r.total)}</span>
                </div>
              </div>
            );
          })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={returnType === 'sale-return' ? t('newSaleReturnTitle') : t('newPurchaseReturnTitle')}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('date')}</label>
              <input type="date" className="input-base" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{returnType === 'sale-return' ? t('customer') : t('supplier')}</label>
              <select className="input-base" value={partyId} onChange={e => setPartyId(e.target.value)}>
                <option value="">{returnType === 'sale-return' ? t('generalCustomerOpt') : t('chooseSupplier')}</option>
                {(returnType === 'sale-return' ? state.customers : state.suppliers).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('reason')}</label>
            <input className="input-base" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('reasonPh')} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('items')}</label>
            <div className="relative">
              <input
                className="input-base"
                placeholder={t('searchItemPh')}
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
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">{t('noResults')}</p>}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="inset-card space-y-1.5">
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-3)' }}>{t('itemsSection')} · {items.length}</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded-xl px-2 py-2 shadow-sm">
                  <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{item.productName}</span>
                  <input type="number" className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                    value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} min={1} />
                  <input type="number" className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                    value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} />
                  <button onClick={() => removeItem(idx)} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626', width: '28px', height: '28px' }}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="inset-card">
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-700">{t('total')}:</span>
              <span className={returnType === 'sale-return' ? 'text-orange-600' : 'text-indigo-600'}>{formatMoney(total)}</span>
            </div>
          </div>

          <button onClick={saveReturn} disabled={items.length === 0}
            className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={returnType === 'purchase-return' ? {} : { background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
            {t('saveReturn')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
