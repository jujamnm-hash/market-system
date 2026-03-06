import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import { formatMoney } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Edit, Trash2, AlertTriangle, Tag, ScanLine } from 'lucide-react';
import type { Product, Category } from '../types';

type Tab = 'products' | 'categories';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const emptyProduct: Omit<Product, 'id' | 'createdAt'> = {
  name: '', barcode: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, unit: 'حبة',
};

export default function Inventory() {
  const { state, dispatch } = useApp();
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

  const filteredProducts = state.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchCat = !selectedCat || p.category === selectedCat;
    const matchLow = !showLowOnly || p.stock <= p.minStock;
    return matchSearch && matchCat && matchLow;
  });

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, barcode: p.barcode, category: p.category, buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock, minStock: p.minStock, unit: p.unit });
    setShowModal(true);
  };

  const saveProduct = () => {
    if (!form.name.trim()) return;
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...editing, ...form } });
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: { id: generateId(), createdAt: new Date().toISOString(), ...form, barcode: form.barcode || generateId() } });
    }
    setShowModal(false);
  };

  const deleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const saveCat = () => {
    if (!catForm.name.trim()) return;
    if (editCat) dispatch({ type: 'UPDATE_CATEGORY', payload: { ...editCat, ...catForm } });
    else dispatch({ type: 'ADD_CATEGORY', payload: { id: generateId(), ...catForm } });
    setShowCatModal(false);
  };

  const lowCount = state.products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="pb-24 pt-16 px-3 fade-in">
      {/* Tabs */}
      <div className="flex gap-2 mt-3 mb-4">
        <button
          onClick={() => setTab('products')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}
        >
          📦 المنتجات ({state.products.length})
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'categories' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}
        >
          🏷️ الفئات ({state.categories.length})
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              <input
                className="w-full border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="بحث بالاسم أو الباركود..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-blue-700 transition active:scale-95"
            >
              <Plus size={16} /> إضافة
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => { setSelectedCat(''); setShowLowOnly(false); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${!selectedCat && !showLowOnly ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              الكل
            </button>
            <button
              onClick={() => { setShowLowOnly(!showLowOnly); setSelectedCat(''); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${showLowOnly ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              <AlertTriangle size={12} /> نقص مخزون ({lowCount})
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
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">لا توجد منتجات</div>
            ) : filteredProducts.map(p => {
              const cat = state.categories.find(c => c.id === p.category);
              const isLow = p.stock <= p.minStock;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-3.5 flex items-center gap-3 ${isLow ? 'border border-amber-200' : ''}`}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-800">{p.name}</span>
                      {isLow && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {cat && (
                        <span className="px-1.5 py-0.5 rounded-md text-white text-[10px]" style={{ backgroundColor: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                      <span className="text-slate-400">باركود: {p.barcode}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="text-slate-500">شراء: <b>{formatMoney(p.buyPrice)}</b></span>
                      <span className="text-slate-500">بيع: <b className="text-green-600">{formatMoney(p.sellPrice)}</b></span>
                      <span className={`font-bold ${isLow ? 'text-amber-500' : 'text-blue-600'}`}>📦 {p.stock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => openEdit(p)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition">
                      <Trash2 size={15} />
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
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-blue-700 transition active:scale-95"
            >
              <Plus size={16} /> فئة جديدة
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {state.categories.map(c => {
              const count = state.products.filter(p => p.category === c.id).length;
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: c.color + '30' }}>
                    <Tag size={18} style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{count} منتج</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditCat(c); setCatForm({ name: c.name, color: c.color }); setShowCatModal(true); }}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                    ><Edit size={13} /></button>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: c.id })}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                    ><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Product Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المنتج *</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم المنتج"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الباركود</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="باركود المنتج"
              />
              <button className="p-2.5 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition" title="مسح الباركود">
                <ScanLine size={18} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الفئة</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            >
              <option value="">اختر الفئة</option>
              {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سعر الشراء (د.ع)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.buyPrice || ''} onChange={e => setForm({ ...form, buyPrice: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سعر البيع (د.ع)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.sellPrice || ''} onChange={e => setForm({ ...form, sellPrice: +e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الكمية</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.stock || ''} onChange={e => setForm({ ...form, stock: +e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الحد الأدنى</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.minStock || ''} onChange={e => setForm({ ...form, minStock: +e.target.value })} placeholder="5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الوحدة</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
              >
                {['حبة', 'كغ', 'لتر', 'م', 'Pack', 'Box', 'كرتون', 'كيس'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveProduct} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition active:scale-95 mt-2">
            {editing ? '✅ حفظ التعديلات' : '➕ إضافة المنتج'}
          </button>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title={editCat ? 'تعديل الفئة' : 'فئة جديدة'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الفئة *</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="اسم الفئة"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">اللون</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setCatForm({ ...catForm, color: c })}
                  className={`w-8 h-8 rounded-lg transition ${catForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button onClick={saveCat} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition active:scale-95">
            {editCat ? '✅ حفظ' : '➕ إضافة'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
