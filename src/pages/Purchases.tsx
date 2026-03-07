import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { Plus, Search, Trash2, Package, ScanLine, Calendar } from 'lucide-react';
import type { PurchaseInvoice, InvoiceItem, PurchasePaymentType } from '../types';

const UNIT_OPTIONS = ['حبة', 'كغ', 'لتر', 'م', 'Pack', 'Box', 'كرتون', 'كيس'];
const UNIT_LABELS_EN: Record<string, string> = {
  'حبة': 'Piece', 'كغ': 'KG', 'لتر': 'Liter', 'م': 'Meter',
  'Pack': 'Pack', 'Box': 'Box', 'كرتون': 'Carton', 'كيس': 'Bag',
};

export default function Purchases() {
  const { state, dispatch } = useApp();
  const { t, lang } = useLang();
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>('cash');
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
  const effectiveTotal = paymentType === 'gift' ? 0 : total;
  const remaining = paymentType === 'debt' ? total - paidAmount : 0;

  const addItemByBarcode = (barcode: string) => {
    const p = state.products.find(x => x.barcode === barcode);
    if (p) {
      addExistingItem(p.id);
    } else {
      setProductSearch(barcode);
      setShowProductList(true);
    }
  };

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
    const newProd: import('../types').Product = { id: generateId(), name: manualName, barcode: generateId(), category: '', buyPrice: manualBuy, sellPrice: manualSell, avgCost: manualBuy, stock: 0, minStock: 5, unit: manualUnit, createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_PRODUCT', payload: newProd });
    setItems([...items, { productId: newProd.id, productName: manualName, barcode: newProd.barcode, qty: manualQty, price: manualBuy, total: manualBuy * manualQty }]);
    setManualName(''); setManualQty(1); setManualBuy(0); setManualSell(0);
  };

  const updateItem = (idx: number, field: 'qty' | 'price', val: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };
  const updateItemExpiry = (idx: number, expiryDate: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, expiryDate: expiryDate || undefined } : item));
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
      total: effectiveTotal, paymentType,
      subtotal: effectiveTotal,
      discount: 0,
      paid: paymentType === 'gift' ? 0 : paymentType === 'cash' ? effectiveTotal : paidAmount,
      remaining: paymentType === 'debt' ? remaining : 0,
      notes,
    };
    dispatch({ type: 'ADD_PURCHASE', payload: inv });
    // Update Weighted Average Cost BEFORE adding to stock (skip for gifts — free items don't affect cost)
    if (paymentType !== 'gift') {
      items.forEach(item => {
        if (item.productId) {
          dispatch({ type: 'UPDATE_AVG_COST', payload: { id: item.productId, newQty: item.qty, newBuyPrice: item.price } });
        }
      });
    }
    items.forEach(item => dispatch({ type: 'UPDATE_STOCK', payload: { id: item.productId, delta: item.qty } }));
    // Create ExpiryBatch records for items with expiry dates
    items.forEach(item => {
      if (item.expiryDate) {
        dispatch({
          type: 'ADD_EXPIRY_BATCH',
          payload: {
            id: generateId(),
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            qty: item.qty,
            purchaseDate: date,
            expiryDate: item.expiryDate,
            purchaseInvoiceId: inv.id,
            buyPrice: item.price,
          },
        });
      }
    });
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
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>
      <div className="flex gap-2 mt-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            className="input-search"
            placeholder={t('searchPurchasesPh')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '38px' }}
          />
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary px-4 py-2">
          <Plus size={16} /> {t('purchaseInvoiceBtn')}
        </button>
      </div>

      <div className="space-y-2 stagger">
        {filteredPurchases.length === 0
            ? <div className="empty-state"><Package size={28} /><p>{t('noPurchasesInvoices')}</p></div>
          : filteredPurchases.map(p => {
            const supp = state.suppliers.find(s => s.id === p.supplierId);
            const badgeClass = p.paymentType === 'cash' ? 'badge-green' : p.paymentType === 'gift' ? 'badge-purple' : 'badge-amber';
            const label = p.paymentType === 'cash' ? t('cash') : p.paymentType === 'gift' ? t('gift') : t('credit');
            return (
              <div key={p.id} className="card p-3.5">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{p.invoiceNo}</span>
                      <span className={`badge ${badgeClass}`}>{label}</span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{formatDate(p.date)} · {supp?.name ?? t('supplier')}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-purple-600">{formatMoney(p.total)}</p>
                    <p className="text-[11px] text-right" style={{ color: 'var(--text-4)' }}>{p.items.length} {t('items')}</p>
                  </div>
                </div>
                {p.remaining > 0 && (
                  <span className="badge badge-amber">{t('remainingLabel')} {formatMoney(p.remaining)}</span>
                )}
              </div>
            );
          })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('newPurchaseTitle')}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('date')}</label>
              <input type="date" className="input-base" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('supplier')}</label>
              <select className="input-base" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">{t('chooseSupplier')}</option>
                {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('paymentMethod')}</label>
            <div className="tabs-bar">
              <button onClick={() => setPaymentType('cash')} className={`tab-item ${paymentType === 'cash' ? 'active' : ''}`}>{t('cash')}</button>
              <button onClick={() => setPaymentType('debt')} className={`tab-item ${paymentType === 'debt' ? 'active' : ''}`}>{t('credit')}</button>
              <button onClick={() => setPaymentType('gift')} className={`tab-item ${paymentType === 'gift' ? 'active' : ''}`}>{t('gift')}</button>
            </div>
            {paymentType === 'gift' && (
              <p className="text-[11px] text-rose-500 mt-1.5 bg-rose-50 rounded-xl px-3 py-1.5 border border-rose-100">{t('purchaseGiftNote')}</p>
            )}
          </div>

          {/* Search existing products */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('searchExisting')}</label>
            <div className="relative flex gap-2">
              <input
                className="input-base flex-1"
                placeholder={t('searchExistingPh')}
                value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
              />
              <button type="button" onClick={() => setShowScanner(true)} className="btn-ghost px-3" title={t('scanBarcode')}>
                <ScanLine size={18} />
              </button>
              {showProductList && productSearch && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addExistingItem(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-purple-50 transition text-right">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-purple-600 text-xs">{formatMoney(p.buyPrice)}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">{t('noResults')}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Manual item */}
          <div className="inset-card">
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}><Package size={12} /> {t('addNewItem')}</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="input-base text-xs py-2" placeholder={t('itemName')} value={manualName} onChange={e => setManualName(e.target.value)} />
              <select className="input-base text-xs py-2" value={manualUnit} onChange={e => setManualUnit(e.target.value)}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{lang === 'en' ? UNIT_LABELS_EN[u] : u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input type="number" className="input-base text-xs py-2" placeholder={t('qty')} value={manualQty || ''} onChange={e => setManualQty(+e.target.value)} min={1} />
              <input type="number" className="input-base text-xs py-2" placeholder={t('buyPrice')} value={manualBuy || ''} onChange={e => setManualBuy(+e.target.value)} />
              <input type="number" className="input-base text-xs py-2" placeholder={t('sellPrice')} value={manualSell || ''} onChange={e => setManualSell(+e.target.value)} />
            </div>
            <button onClick={addManualItem} className="btn-primary w-full py-2 text-xs" style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)' }}>
              {t('addToInvoice')}
            </button>
          </div>

          {/* Cart */}
          {items.length > 0 && (
            <div className="inset-card space-y-1.5">
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-3)' }}>{t('cartSection')} · {items.length}</p>
              {items.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl px-2 py-2 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{item.productName}</span>
                    <input type="number" className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                      value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} min={1} />
                    <input type="number" className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                      value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} />
                    <button onClick={() => removeItem(idx)} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626', width: '28px', height: '28px' }}><Trash2 size={11} /></button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] text-slate-400">{t('expiryOptional')}:</span>
                    <input
                      type="date"
                      className={`flex-1 border rounded-lg px-2 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-400 ${
                        item.expiryDate ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-slate-200 text-slate-500'
                      }`}
                      value={item.expiryDate || ''}
                      onChange={e => updateItemExpiry(idx, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {paymentType === 'debt' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('paidAmountLabel')}</label>
              <input type="number" className="input-base" value={paidAmount || ''} onChange={e => setPaidAmount(+e.target.value)} placeholder="0" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('notes')}</label>
            <textarea className="input-base resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_ph')} />
          </div>

          <div className="inset-card">
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-700">{t('total')}:</span>
              {paymentType === 'gift'
                ? <span className="text-rose-500">{t('totalFreeGift')}</span>
                : <span style={{ color: 'var(--accent)' }}>{formatMoney(total)}</span>
              }
            </div>
            {paymentType === 'debt' && remaining > 0 && (
              <div className="flex justify-between text-sm mt-1.5">
                <span className="text-amber-600">{t('remaining')}:</span>
                <span className="font-bold text-amber-600">{formatMoney(remaining)}</span>
              </div>
            )}
          </div>

          <button onClick={savePurchase} disabled={items.length === 0} className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed">
            {t('saveInvoice')}
          </button>
        </div>
      </Modal>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(code) => {
          setShowScanner(false);
          addItemByBarcode(code);
        }}
        title={t('scanBarcode')}
      />
    </div>
  );
}
