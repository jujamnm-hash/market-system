import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { generateId, generateInvoiceNo } from '../utils/storage';
import { formatMoney, formatDate, todayISO } from '../utils/helpers';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { Plus, Search, Trash2, ShoppingCart, ScanLine } from 'lucide-react';
import type { SaleInvoice, InvoiceItem } from '../types';

export default function Sales() {
  const { state, dispatch } = useApp();
  const { t } = useLang();
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
  const [showScanner, setShowScanner] = useState(false);

  const addItemByBarcode = (barcode: string) => {
    const p = state.products.find(x => x.barcode === barcode);
    if (p) { addItem(p.id); setProductSearch(p.name); }
    else { setProductSearch(barcode); setShowProductList(true); }
  };
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
      setItems([...items, { productId: p.id, productName: p.name, barcode: p.barcode, qty: 1, price: p.sellPrice, costPrice: p.avgCost > 0 ? p.avgCost : p.buyPrice, total: p.sellPrice }]);
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
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>
      <div className="flex gap-2 mt-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            className="input-search"
            placeholder={t('searchSalesPh')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '38px' }}
          />
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary px-4 py-2">
          <Plus size={16} /> {t('invoiceBtn')}
        </button>
      </div>

      <div className="space-y-2 stagger">
        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={32} />
            <p>{t('noSalesInvoices')}</p>
          </div>
        ) : filteredSales.map(s => {
          const cust = state.customers.find(c => c.id === s.customerId);
          return (
            <div key={s.id} className="card p-3.5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{s.invoiceNo}</span>
                    <span className={`badge ${s.paymentType === 'cash' ? 'badge-green' : 'badge-amber'}`}>
                      {s.paymentType === 'cash' ? t('cash') : t('credit')}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{formatDate(s.date)} · {cust?.name ?? t('generalCustomer')}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-600">{formatMoney(s.total)}</p>
                  <p className="text-[11px] text-right" style={{ color: 'var(--text-4)' }}>{s.items.length} {t('items')}</p>
                </div>
              </div>
              {(s.discount > 0 || s.remaining > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {s.discount > 0 && <span className="badge badge-red">{t('discountLabel')} {formatMoney(s.discount)}</span>}
                  {s.remaining > 0 && <span className="badge badge-amber">{t('remainingLabel')} {formatMoney(s.remaining)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('newSaleTitle')}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('date')}</label>
              <input type="date" className="input-base" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('customer')}</label>
              <select className="input-base" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">{t('generalCustomerOpt')}</option>
                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('paymentMethod')}</label>
            <div className="tabs-bar">
              <button onClick={() => setPaymentType('cash')} className={`tab-item ${paymentType === 'cash' ? 'active' : ''}`}>
                ✅ {t('cash')}
              </button>
              <button onClick={() => setPaymentType('debt')} className={`tab-item ${paymentType === 'debt' ? 'active' : ''}`}>
                ⏳ {t('credit')}
              </button>
            </div>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('add')} {t('items')}</label>
            <div className="relative">
              <input
                className="input-base"
                placeholder={t('addItemPh')}
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="btn-icon absolute top-1/2 -translate-y-1/2 left-2"
              >
                <ScanLine size={15} />
              </button>
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
                  {filteredProducts.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">{t('noResults')}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="inset-card space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: 'var(--text-3)' }}>
                <ShoppingCart size={13} />
                <span>{t('itemsSection')} · {items.length} {t('items')}</span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded-xl px-2 py-2 shadow-sm">
                  <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{item.productName}</span>
                  <input type="number" className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center bg-white"
                    value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} min={1} />
                  <input type="number" className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center bg-white"
                    value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} />
                  <button onClick={() => removeItem(idx)} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626', width: '28px', height: '28px' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('discountInput')}</label>
              <input type="number" className="input-base" value={discount || ''} onChange={e => setDiscount(+e.target.value)} placeholder="0" />
            </div>
            {paymentType === 'debt' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('paidAmountLabel')}</label>
                <input type="number" className="input-base" value={paidAmount || ''} onChange={e => setPaidAmount(+e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('notes')}</label>
            <textarea className="input-base resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_ph')} />
          </div>

          {/* Totals */}
          <div className="inset-card space-y-1.5">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-3)' }}>{t('subtotal')}:</span>
              <span className="font-semibold text-slate-700">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">{t('discount')}:</span>
                <span className="font-semibold text-red-500">- {formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t pt-2 mt-1" style={{ borderColor: 'var(--border)' }}>
              <span className="text-slate-700">{t('total')}:</span>
              <span style={{ color: 'var(--accent)' }}>{formatMoney(total)}</span>
            </div>
            {paymentType === 'debt' && remaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">{t('remaining')}:</span>
                <span className="font-bold text-amber-600">{formatMoney(remaining)}</span>
              </div>
            )}
          </div>

          <button onClick={saveSale} disabled={items.length === 0} className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed">
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
