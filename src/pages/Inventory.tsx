import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { generateId } from '../utils/storage';
import { formatMoney } from '../utils/helpers';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { Plus, Search, Edit, Trash2, AlertTriangle, Tag, ScanLine } from 'lucide-react';
import type { Product, Category } from '../types';

type Tab = 'products' | 'categories';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const emptyProduct: Omit<Product, 'id' | 'createdAt'> = {
  name: '', barcode: '', category: '', buyPrice: 0, sellPrice: 0, avgCost: 0, stock: 0, minStock: 5, unit: 'حبة',
};

const UNIT_OPTIONS = ['حبة', 'كغ', 'لتر', 'م', 'Pack', 'Box', 'كرتون', 'كيس'];
const UNIT_LABELS_EN: Record<string, string> = {
  'حبة': 'Piece', 'كغ': 'KG', 'لتر': 'Liter', 'م': 'Meter',
  'Pack': 'Pack', 'Box': 'Box', 'كرتون': 'Carton', 'كيس': 'Bag',
};

export default function Inventory() {
  const { state, dispatch } = useApp();
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [catForm, setCatForm] = useState({ name: '', color: COLORS[0] });
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeScanned = (code: string) => {
    // search for existing product first
    const found = state.products.find(p => p.barcode === code);
    if (found) {
      openEdit(found);
    } else {
      setForm({ ...emptyProduct, barcode: code });
      setEditing(null);
      setShowModal(true);
    }
  };

  const filteredProducts = state.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchCat = !selectedCat || p.category === selectedCat;
    const matchLow = !showLowOnly || p.stock <= p.minStock;
    return matchSearch && matchCat && matchLow;
  });

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, barcode: p.barcode, category: p.category, buyPrice: p.buyPrice, sellPrice: p.sellPrice, avgCost: p.avgCost, stock: p.stock, minStock: p.minStock, unit: p.unit });
    setShowModal(true);
  };

  const saveProduct = () => {
    if (!form.name.trim()) return;
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...editing, ...form } });
    } else {
      // For new products added manually, avgCost = buyPrice initially
      const payload = { id: generateId(), createdAt: new Date().toISOString(), ...form, barcode: form.barcode || generateId() };
      if (!payload.avgCost || payload.avgCost === 0) payload.avgCost = payload.buyPrice;
      dispatch({ type: 'ADD_PRODUCT', payload });
    }
    setShowModal(false);
  };

  const deleteProduct = (id: string) => {
    if (confirm(t('deleteProductConfirm'))) dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const saveCat = () => {
    if (!catForm.name.trim()) return;
    if (editCat) dispatch({ type: 'UPDATE_CATEGORY', payload: { ...editCat, ...catForm } });
    else dispatch({ type: 'ADD_CATEGORY', payload: { id: generateId(), ...catForm } });
    setShowCatModal(false);
  };

  const lowCount = state.products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>
      {/* Tabs */}
      <div className="tabs-bar mt-3 mb-4">
        <button
          onClick={() => setTab('products')}
          className={`tab-item ${tab === 'products' ? 'active' : ''}`}
        >
          {t('productsTab')} · {state.products.length}
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`tab-item ${tab === 'categories' ? 'active' : ''}`}
        >
          {t('categoriesTab')} · {state.categories.length}
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              <input
                className="input-search"
                placeholder={t('searchProductPh')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingRight: '38px' }}
              />
            </div>
            <button onClick={openAdd} className="btn-primary px-4 py-2">
              <Plus size={16} /> {t('add')}
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-ghost px-3 py-2"
              title={t('scanBarcode')}
            >
              <ScanLine size={18} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => { setSelectedCat(''); setShowLowOnly(false); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${!selectedCat && !showLowOnly ? 'text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
              style={!selectedCat && !showLowOnly ? { background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' } : {}}
            >
              {t('all')}
            </button>
            <button
              onClick={() => { setShowLowOnly(!showLowOnly); setSelectedCat(''); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${showLowOnly ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              <AlertTriangle size={12} /> {t('lowStockFilter')} ({lowCount})
            </button>
            {state.categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(selectedCat === c.id ? '' : c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${selectedCat === c.id ? 'text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                style={selectedCat === c.id ? { backgroundColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Tag size={32} />
                <p>{t('noProducts')}</p>
              </div>
            ) : filteredProducts.map(p => {
              const cat = state.categories.find(c => c.id === p.category);
              const isLow = p.stock <= p.minStock;
              return (
                <div
                  key={p.id}
                  className="card p-3.5 flex items-center gap-3"
                  style={{ borderColor: isLow ? '#FDE68A' : undefined, background: isLow ? 'linear-gradient(135deg,#FFFBEB,#FFFFFF)' : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-sm text-slate-800">{p.name}</span>
                      {isLow && (
                        <span className="badge badge-amber">
                          <AlertTriangle size={9} /> {t('lowStockFilter')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {cat && (
                        <span className="badge text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                      <span className="badge badge-gray text-[10px]">{p.barcode}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                      <span style={{ color: 'var(--text-3)' }}>{t('buyPrice')}: <b className="text-slate-700">{formatMoney(p.buyPrice)}</b></span>
                      <span className="text-orange-500">{t('avgCostLabel')}: <b>{formatMoney(p.avgCost)}</b></span>
                      <span style={{ color: 'var(--text-3)' }}>{t('sellPrice')}: <b className="text-green-600">{formatMoney(p.sellPrice)}</b></span>
                      <span className={`font-bold ${isLow ? 'text-amber-500' : 'text-blue-600'}`}>📦 {p.stock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => openEdit(p)} className="btn-icon" style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
                      <Edit size={14} className="text-indigo-600" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setEditCat(null); setCatForm({ name: '', color: COLORS[0] }); setShowCatModal(true); }}
              className="btn-primary px-4 py-2"
            >
              <Plus size={16} /> {t('addCategory')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {state.categories.map(c => {
              const count = state.products.filter(p => p.category === c.id).length;
              return (
                <div key={c.id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${c.color}25`, border: `1.5px solid ${c.color}55` }}>
                    <Tag size={17} style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{c.name}</p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: c.color }}>{count} {t('items')}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditCat(c); setCatForm({ name: c.name, color: c.color }); setShowCatModal(true); }}
                      className="btn-icon" style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}
                    ><Edit size={13} className="text-indigo-600" /></button>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: c.id })}
                      className="btn-icon" style={{ background: '#FFF1F2', color: '#DC2626' }}
                    ><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Product Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('editProductTitle') : t('addProductTitle')}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('productName')} *</label>
            <input className="input-base" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('productName')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('barcode')}</label>
            <div className="flex gap-2">
              <input className="input-base flex-1" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder={t('barcodeOptional')} />
              <button className="btn-ghost px-3" onClick={() => setShowScanner(true)} type="button">
                <ScanLine size={17} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('category')}</label>
            <select className="input-base" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">{t('uncategorized')}</option>
              {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('buyPriceLabel')}</label>
              <input type="number" className="input-base" value={form.buyPrice || ''} onChange={e => setForm({ ...form, buyPrice: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('sellPriceLabel')}</label>
              <input type="number" className="input-base" value={form.sellPrice || ''} onChange={e => setForm({ ...form, sellPrice: +e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('currentStock')}</label>
              <input type="number" className="input-base" value={form.stock || ''} onChange={e => setForm({ ...form, stock: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('minStock')}</label>
              <input type="number" className="input-base" value={form.minStock || ''} onChange={e => setForm({ ...form, minStock: +e.target.value })} placeholder="5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('unit')}</label>
              <select className="input-base" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{lang === 'en' ? UNIT_LABELS_EN[u] : u}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveProduct} className="btn-primary w-full py-3.5 mt-1">
            {editing ? `✅ ${t('save')}` : `➕ ${t('add')}`}
          </button>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title={editCat ? t('editCategoryTitle') : t('addCategoryTitle')} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('categoryName')} *</label>
            <input className="input-base" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder={t('categoryName')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setCatForm({ ...catForm, color: c })}
                  className="w-9 h-9 rounded-xl transition"
                  style={{ backgroundColor: c, boxShadow: catForm.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none', transform: catForm.color === c ? 'scale(1.1)' : 'scale(1)' }}
                />
              ))}
            </div>
          </div>
          <button onClick={saveCat} className="btn-primary w-full py-3.5">
            {editCat ? `✅ ${t('save')}` : `➕ ${t('add')}`}
          </button>
        </div>
      </Modal>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(code) => {
          setShowScanner(false);
          handleBarcodeScanned(code);
        }}
        title={t('scanBarcode')}
      />
    </div>
  );
}
