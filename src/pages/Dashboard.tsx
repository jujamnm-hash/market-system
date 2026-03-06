import { useApp } from '../context/AppContext';
import { formatMoney, todayISO, sumBy } from '../utils/helpers';
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Users, Wallet, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const today = todayISO();

  const todaySales = state.sales.filter(s => s.date.startsWith(today));
  const todayRevenue = sumBy(todaySales, s => s.total);
  const todayPurchaseCost = sumBy(state.purchases.filter(p => p.date.startsWith(today)), p => p.total);
  const lowStockItems = state.products.filter(p => p.stock <= p.minStock);
  const totalDebtCustomers = sumBy(state.customers, c => Math.max(0, c.debt));
  const totalDebtSuppliers = sumBy(state.suppliers, s => Math.max(0, s.debt));

  const last7: { day: string; المبيعات: number; المشتريات: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const shortDay = `${d.getDate()}/${d.getMonth() + 1}`;
    last7.push({
      day: shortDay,
      المبيعات: sumBy(state.sales.filter(s => s.date.startsWith(dateStr)), s => s.total),
      المشتريات: sumBy(state.purchases.filter(p => p.date.startsWith(dateStr)), p => p.total),
    });
  }

  const stats = [
    { label: 'مبيعات اليوم', value: formatMoney(todayRevenue), icon: ShoppingCart, color: 'bg-blue-500', bg: 'bg-blue-50', path: '/sales' },
    { label: 'مشتريات اليوم', value: formatMoney(todayPurchaseCost), icon: Package, color: 'bg-purple-500', bg: 'bg-purple-50', path: '/purchases' },
    { label: 'نقص المخزون', value: `${lowStockItems.length} صنف`, icon: AlertTriangle, color: 'bg-amber-500', bg: 'bg-amber-50', path: '/inventory' },
    { label: 'ديون العملاء', value: formatMoney(totalDebtCustomers), icon: Users, color: 'bg-red-500', bg: 'bg-red-50', path: '/finance' },
    { label: 'ديون الموردين', value: formatMoney(totalDebtSuppliers), icon: Wallet, color: 'bg-orange-500', bg: 'bg-orange-50', path: '/finance' },
    { label: 'إجمالي المنتجات', value: `${state.products.length} صنف`, icon: TrendingUp, color: 'bg-green-500', bg: 'bg-green-50', path: '/inventory' },
  ];

  return (
    <div className="pb-24 pt-16 px-3 fade-in">
      <div className="mt-3 mb-4">
        <h1 className="text-xl font-bold text-slate-800">أهلاً بك 👋</h1>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="bg-white rounded-2xl p-3.5 text-right flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-95 w-full"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            >
              <div className={`${s.bg} p-2.5 rounded-xl flex-shrink-0`}>
                <Icon size={20} className={s.color.replace('bg-', 'text-')} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{s.label}</p>
                <p className="font-bold text-sm text-slate-800 truncate">{s.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-slate-700">آخر 7 أيام</h2>
          <ArrowUpRight size={16} className="text-slate-400" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last7} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
            <Bar dataKey="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="المشتريات" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <h2 className="font-bold text-sm text-amber-600 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> تنبيه نقص المخزون
          </h2>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                <span className="text-xs text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  {p.stock} {p.unit} متبقي
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <h2 className="font-bold text-sm text-slate-700 mb-3">آخر الفواتير</h2>
        {state.sales.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">لا توجد فواتير مبيعات بعد</p>
        ) : (
          <div className="space-y-2">
            {state.sales.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.invoiceNo}</p>
                  <p className="text-xs text-slate-400">{s.customerName || 'عميل عام'} · {s.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatMoney(s.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.paymentType === 'cash' ? 'نقدي' : 'آجل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
