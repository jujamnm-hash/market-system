import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Period = 'day' | 'month' | 'year';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Reports() {
  const { state } = useApp();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const periodLabel = useMemo(() => {
    if (period === 'day') return now.toISOString().slice(0, 10);
    if (period === 'month') return now.toISOString().slice(0, 7);
    return String(now.getFullYear());
  }, [period]);

  const filterByPeriod = (date: string) => date.startsWith(periodLabel);

  const filteredSales = state.sales.filter(s => filterByPeriod(s.date));
  const filteredPurchases = state.purchases.filter(p => filterByPeriod(p.date));
  const filteredExpenses = state.expenses.filter(e => filterByPeriod(e.date));
  const filteredSalaries = state.salaryPayments.filter(s => filterByPeriod(s.paidAt));

  const totalSales = filteredSales.reduce((s, i) => s + i.total, 0);
  const totalPurchasesAmt = filteredPurchases.reduce((s, i) => s + i.total, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSalaries = filteredSalaries.reduce((s, p) => s + p.amount, 0);
  const grossProfit = totalSales - totalPurchasesAmt;
  const netProfit = grossProfit - totalExpenses - totalSalaries;

  // Chart data - last 7 days or months
  const chartData = useMemo(() => {
    const days = period === 'day' ? 1 : period === 'month' ? 30 : 12;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      let label = '';
      let key = '';
      if (period === 'year') {
        d.setMonth(now.getMonth() - i);
        key = d.toISOString().slice(0, 7);
        label = d.toLocaleString('ar', { month: 'short' });
      } else {
        d.setDate(now.getDate() - i);
        key = d.toISOString().slice(0, 10);
        label = `${d.getDate()}/${d.getMonth() + 1}`;
      }
      const sales = state.sales.filter(s => s.date.startsWith(key)).reduce((s, x) => s + x.total, 0);
      const purchases = state.purchases.filter(p => p.date.startsWith(key)).reduce((s, x) => s + x.total, 0);
      result.push({ name: label, المبيعات: sales, المشتريات: purchases });
    }
    return result;
  }, [state.sales, state.purchases, period]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.productId]) map[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        map[item.productId].qty += item.qty;
        map[item.productId].revenue += item.qty * item.price;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales]);

  // Expense pie
  const expensePie = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // Inventory value
  const inventoryValue = state.products.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const inventorySellValue = state.products.reduce((s, p) => s + p.stock * p.sellPrice, 0);
  const customerDebtTotal = state.sales.reduce((s, i) => s + i.remaining, 0);
  const supplierDebtTotal = state.purchases.reduce((s, i) => s + i.remaining, 0);

  return (
    <div className="pb-24 pt-16 px-3 fade-in">
      {/* Period Toggle */}
      <div className="flex gap-2 mt-3 mb-4">
        {(['day', 'month', 'year'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>
            {p === 'day' ? 'يوم' : p === 'month' ? 'شهر' : 'سنة'}
          </button>
        ))}
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold text-slate-800 mb-3 text-sm">📊 ملخص الأرباح والخسائر</h3>
        <div className="space-y-2 text-sm">
          <Row label="إجمالي المبيعات" value={formatMoney(totalSales)} color="text-green-600" />
          <Row label="إجمالي المشتريات" value={`- ${formatMoney(totalPurchasesAmt)}`} color="text-red-500" />
          <div className="border-t border-slate-100 pt-2">
            <Row label="مجمل الربح" value={formatMoney(grossProfit)} color={grossProfit >= 0 ? 'text-blue-600' : 'text-red-500'} bold />
          </div>
          <Row label="المصروفات" value={`- ${formatMoney(totalExpenses)}`} color="text-red-500" />
          <Row label="الرواتب" value={`- ${formatMoney(totalSalaries)}`} color="text-red-500" />
          <div className="border-t border-slate-200 pt-2">
            <Row label="صافي الربح" value={formatMoney(netProfit)} color={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} bold />
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.some(d => d.المبيعات > 0 || d.المشتريات > 0) && (
        <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold text-slate-800 mb-3 text-sm">📈 مبيعات ومشتريات</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
              <Bar dataKey="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="المشتريات" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 bg-blue-500 rounded-sm" />مبيعات</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 bg-purple-500 rounded-sm" />مشتريات</div>
          </div>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold text-slate-800 mb-3 text-sm">🏆 أكثر المنتجات مبيعاً</h3>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                    <span className="text-xs text-green-600 font-semibold flex-shrink-0 mr-2">{formatMoney(p.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (p.revenue / topProducts[0].revenue) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{p.qty} قطعة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Pie */}
      {expensePie.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold text-slate-800 mb-3 text-sm">💸 توزيع المصروفات</h3>
          <div className="flex items-center gap-4">
            <PieChart width={140} height={140}>
              <Pie data={expensePie} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {expensePie.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {expensePie.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-xs text-slate-600 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-slate-700">{formatMoney(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold text-slate-800 mb-3 text-sm">⚖️ الميزانية العمومية</h3>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">الأصول</p>
          <Row label="قيمة المخزون (شراء)" value={formatMoney(inventoryValue)} color="text-blue-600" />
          <Row label="قيمة المخزون (بيع)" value={formatMoney(inventorySellValue)} color="text-blue-700" />
          <Row label="ديون العملاء" value={formatMoney(customerDebtTotal)} color="text-amber-600" />
          <div className="border-t border-slate-100 pt-2">
            <Row label="إجمالي الأصول" value={formatMoney(inventoryValue + customerDebtTotal)} color="text-emerald-700" bold />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase mt-2">الالتزامات</p>
          <Row label="ديون الموردين" value={formatMoney(supplierDebtTotal)} color="text-red-500" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-bold' : ''}`}>
      <span className="text-slate-600">{label}</span>
      <span className={color ?? 'text-slate-800'}>{value}</span>
    </div>
  );
}
