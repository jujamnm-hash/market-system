import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { formatMoney, todayISO, sumBy } from '../utils/helpers';
import {
  ShoppingCart, Package, AlertTriangle, TrendingUp, Users, Wallet,
  ArrowUpRight, CalendarClock, ChevronLeft, BarChart2, Zap, CircleDollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const today = todayISO();

  const todaySales        = state.sales.filter(s => s.date.startsWith(today));
  const todayRevenue      = sumBy(todaySales, s => s.total);
  const todayPurchaseCost = sumBy(state.purchases.filter(p => p.date.startsWith(today)), p => p.total);
  const lowStockItems     = state.products.filter(p => p.stock <= p.minStock);
  const expiryAlerts      = state.expiryBatches.filter(b => {
    const diff = Math.floor((new Date(b.expiryDate).getTime() - new Date(today).getTime()) / 86400000);
    return diff <= 7;
  });
  const expiredCount       = state.expiryBatches.filter(b => new Date(b.expiryDate) < new Date(today)).length;
  const criticalCount      = expiryAlerts.length - expiredCount;
  const totalDebtCustomers = sumBy(state.customers, c => Math.max(0, c.debt));
  const totalDebtSuppliers = sumBy(state.suppliers, s => Math.max(0, s.debt));
  const totalRevenue       = sumBy(state.sales, s => s.total);
  const totalCOGS          = state.sales
    .flatMap(s => s.items)
    .reduce((sum, item) => sum + item.qty * (item.costPrice ?? 0), 0);
  const grossProfit = totalRevenue - totalCOGS;

  const last7: { day: string; sales: number; purchases: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    last7.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      sales:     sumBy(state.sales.filter(s     => s.date.startsWith(dateStr)), s => s.total),
      purchases: sumBy(state.purchases.filter(p => p.date.startsWith(dateStr)), p => p.total),
    });
  }

  const stats = [
    { label: t('todaySales'),     value: formatMoney(todayRevenue),      sub: `${todaySales.length} ${lang === 'ar' ? 'فاتورة' : 'invoices'}`,  icon: ShoppingCart,  cls: 'stat-blue',   iconColor: '#4F46E5', path: '/sales'     },
    { label: t('todayPurchases'), value: formatMoney(todayPurchaseCost), sub: `${state.purchases.filter(p => p.date.startsWith(today)).length} ${lang === 'ar' ? 'طلب' : 'orders'}`, icon: Package, cls: 'stat-purple', iconColor: '#7C3AED', path: '/purchases' },
    { label: t('customerDebts'),  value: formatMoney(totalDebtCustomers),sub: `${state.customers.filter(c => c.debt > 0).length} ${lang === 'ar' ? 'زبون' : 'clients'}`,   icon: Users,         cls: 'stat-red',    iconColor: '#DC2626', path: '/finance'   },
    { label: t('supplierDebts'),  value: formatMoney(totalDebtSuppliers),sub: `${state.suppliers.filter(s => s.debt > 0).length} ${lang === 'ar' ? 'مورد' : 'suppliers'}`, icon: Wallet,        cls: 'stat-orange', iconColor: '#D97706', path: '/finance'   },
    { label: t('lowStock'),       value: `${lowStockItems.length}`,      sub: t('itemsUnit'),                                                                               icon: AlertTriangle, cls: 'stat-amber',  iconColor: '#D97706', path: '/inventory' },
    { label: t('totalProducts'),  value: `${state.products.length}`,     sub: t('itemsUnit'),                                                                               icon: TrendingUp,    cls: 'stat-green',  iconColor: '#16A34A', path: '/inventory' },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '100px', paddingTop: '62px' }}>

      {/* HERO */}
      <div className="hero-gradient px-5 pt-5 pb-10">
        <p className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {new Date().toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-sm font-bold text-white/80 mb-5">{t('welcomeMsg')}</p>

        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {lang === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}
            </p>
            <h1 className="text-[32px] font-black text-white tracking-tight leading-none count-up">
              {formatMoney(totalRevenue)}
            </h1>
            {grossProfit > 0 && (
              <p className="text-[12px] mt-1.5 font-semibold" style={{ color: 'rgba(134,239,172,0.9)' }}>
                ↑ {lang === 'ar' ? 'ربح إجمالي' : 'Gross profit'}: {formatMoney(grossProfit)}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-90"
            style={{ background: 'rgba(255,255,255,0.17)', border: '1px solid rgba(255,255,255,0.22)', color: 'white' }}
          >
            <BarChart2 size={13} />
            {lang === 'ar' ? 'التقارير' : 'Reports'}
            <ChevronLeft size={12} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ height: 56, opacity: 0.65 }}>
          <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={last7} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area dataKey="sales" stroke="rgba(255,255,255,0.9)" strokeWidth={2} fill="url(#heroGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-2 mt-4">
          {[
            { label: lang === 'ar' ? '+ بيع'   : '+ Sale',      path: '/sales',     bg: 'rgba(255,255,255,0.20)' },
            { label: lang === 'ar' ? '+ شراء'  : '+ Purchase',  path: '/purchases', bg: 'rgba(255,255,255,0.13)' },
            { label: lang === 'ar' ? 'المخزن'  : 'Inventory',   path: '/inventory', bg: 'rgba(255,255,255,0.13)' },
          ].map(q => (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition active:scale-90"
              style={{ background: q.bg, border: '1px solid rgba(255,255,255,0.18)' }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-3 -mt-4">

        {/* Alerts */}
        {(lowStockItems.length > 0 || expiryAlerts.length > 0) && (
          <div className="flex gap-2 mb-4">
            {lowStockItems.length > 0 && (
              <button
                onClick={() => navigate('/inventory')}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border transition active:scale-95"
                style={{ background: '#FFFBEB', borderColor: '#FDE68A', boxShadow: '0 2px 10px rgba(217,119,6,0.12)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)' }}>
                  <AlertTriangle size={16} style={{ color: '#D97706' }} />
                </div>
                <div className="text-right">
                  <p className="font-black text-base leading-none" style={{ color: '#78350F' }}>{lowStockItems.length}</p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#92400E' }}>{t('lowStockAlert')}</p>
                </div>
              </button>
            )}
            {expiryAlerts.length > 0 && (
              <button
                onClick={() => navigate('/expiry')}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border transition active:scale-95"
                style={{ background: '#FFF1F2', borderColor: '#FECDD3', boxShadow: '0 2px 10px rgba(220,38,38,0.10)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#FFE4E6,#FECDD3)' }}>
                  <CalendarClock size={16} style={{ color: '#DC2626' }} />
                </div>
                <div className="text-right">
                  <p className="font-black text-base leading-none" style={{ color: '#7F1D1D' }}>
                    {expiredCount > 0 ? expiredCount : criticalCount}
                  </p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#991B1B' }}>{t('expiryAlertTitle')}</p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 stagger">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => navigate(s.path)}
                className={`${s.cls} card text-right p-4 transition-all active:scale-[0.97] hover:shadow-md w-full`}
              >
                <div className="flex items-start justify-between mb-3">
                  <ArrowUpRight size={13} style={{ color: s.iconColor, opacity: 0.6 }} className="flex-shrink-0 mt-0.5" />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.75)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                    <Icon size={17} style={{ color: s.iconColor }} strokeWidth={2.2} />
                  </div>
                </div>
                <p className="font-black text-[15px] text-slate-800 leading-none truncate">{s.value}</p>
                <p className="text-[10px] font-medium mt-1.5 truncate" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-[9px] mt-0.5 font-semibold" style={{ color: s.iconColor, opacity: 0.75 }}>{s.sub}</p>
              </button>
            );
          })}
        </div>

        {/* 7-Day Chart */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
                <Zap size={13} className="text-indigo-600" />
              </div>
              <h2 className="font-bold text-[13px] text-slate-700">{t('last7days')}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
                <span className="text-[10px] text-slate-400 font-medium">{t('chartSales')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#C4B5FD' }} />
                <span className="text-[10px] text-slate-400 font-medium">{t('chartPurchases')}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7} barCategoryGap="30%" margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', fontSize: 11, padding: '8px 12px' }}
                formatter={(v) => formatMoney(Number(v ?? 0))}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              />
              <Bar dataKey="sales"     name={t('chartSales')}     fill="#6366F1" radius={[5,5,0,0]} />
              <Bar dataKey="purchases" name={t('chartPurchases')} fill="#C4B5FD" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Banner */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 60%, #4F46E5 100%)',
            boxShadow: '0 8px 28px rgba(79,70,229,0.3)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            <CircleDollarSign size={22} className="text-white" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {lang === 'ar' ? 'الربح الإجمالي الكلي' : 'Total Gross Profit'}
            </p>
            <p className="text-xl font-black text-white">{formatMoney(grossProfit)}</p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
        </div>

        {/* Recent Sales */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#DBEAFE,#BFDBFE)' }}>
                <ShoppingCart size={13} className="text-blue-600" />
              </div>
              <h2 className="font-bold text-[13px] text-slate-700">{t('recentInvoices')}</h2>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 transition active:scale-90"
            >
              {lang === 'ar' ? 'الكل' : 'All'} <ChevronLeft size={12} />
            </button>
          </div>

          {state.sales.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={32} />
              <p>{t('noSalesYet')}</p>
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {[...state.sales].reverse().slice(0, 5).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl transition"
                  style={{ background: 'linear-gradient(135deg, #F8FAFF, #F0F4FF)', border: '1px solid #E8EEFF' }}
                >
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-slate-700 leading-none">{s.invoiceNo}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{s.customerName || t('generalCustomer')}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{s.date}</p>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1.5">
                    <span className={`badge ${s.paymentType === 'cash' ? 'badge-green' : 'badge-red'}`}>
                      {s.paymentType === 'cash' ? t('cash') : t('credit')}
                    </span>
                    <p className="text-[14px] font-black text-indigo-700">{formatMoney(s.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
