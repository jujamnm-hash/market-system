import { useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Returns from './pages/Returns';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import { X, ShoppingCart, PackageSearch, RotateCcw, Wallet, TrendingUp, LayoutDashboard, Store } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'لوحة التحكم',
  '/inventory': 'المخزن والمنتجات',
  '/sales': 'فواتير المبيعات',
  '/purchases': 'فواتير المشتريات',
  '/returns': 'المرتجعات',
  '/finance': 'المالية والرواتب',
  '/reports': 'التقارير',
};

function AppLayout() {
  const [sideOpen, setSideOpen] = useState(false);
  const currentPath = window.location.pathname;
  const title = pageTitles[currentPath] || 'نظام السوبرماركت';

  const sideLinks = [
    { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم', color: 'text-blue-600' },
    { to: '/inventory', icon: PackageSearch, label: 'المخزن والمنتجات', color: 'text-green-600' },
    { to: '/sales', icon: ShoppingCart, label: 'فواتير المبيعات', color: 'text-blue-600' },
    { to: '/purchases', icon: Store, label: 'فواتير المشتريات', color: 'text-purple-600' },
    { to: '/returns', icon: RotateCcw, label: 'المرتجعات', color: 'text-orange-500' },
    { to: '/finance', icon: Wallet, label: 'المالية والرواتب', color: 'text-red-500' },
    { to: '/reports', icon: TrendingUp, label: 'التقارير', color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar title={title} onMenuClick={() => setSideOpen(true)} />

      {sideOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col slide-up mr-auto" style={{ maxWidth: '80vw' }}>
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">نظام السوبرماركت</h2>
                <p className="text-xs text-blue-200 mt-0.5">نظام إدارة متكامل</p>
              </div>
              <button onClick={() => setSideOpen(false)} className="p-2 rounded-xl hover:bg-blue-500 transition">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {sideLinks.map(({ to, icon: Icon, label, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setSideOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ` +
                    (isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={20} className={isActive ? 'text-blue-600' : color} strokeWidth={isActive ? 2.5 : 1.8} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
              الإصدار 1.0 · 2026
            </div>
          </div>
        </div>
      )}

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppLayout />
      </HashRouter>
    </AppProvider>
  );
}
