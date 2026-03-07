import { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LangProvider, useLang } from './context/LangContext';
import type { TranslationKey } from './i18n';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Returns from './pages/Returns';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Expiry from './pages/Expiry';
import { X, ShoppingCart, PackageSearch, RotateCcw, Wallet, TrendingUp, LayoutDashboard, Store, CalendarClock } from 'lucide-react';

const pageTitleKeys: Record<string, TranslationKey> = {
  '/': 'dashboardTitle',
  '/inventory': 'inventoryTitle',
  '/sales': 'salesTitle',
  '/purchases': 'purchasesTitle',
  '/returns': 'returnsTitle',
  '/finance': 'financeTitle',
  '/reports': 'reportsTitle',
  '/expiry': 'expiryTitle',
};

const sideLinks: { to: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; labelKey: TranslationKey; gradient: string; iconColor: string }[] = [
  { to: '/',          icon: LayoutDashboard, labelKey: 'dashboardTitle', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)', iconColor: '#818CF8' },
  { to: '/inventory', icon: PackageSearch,   labelKey: 'inventoryTitle', gradient: 'linear-gradient(135deg,#16A34A,#22C55E)', iconColor: '#4ADE80' },
  { to: '/sales',     icon: ShoppingCart,    labelKey: 'salesTitle',     gradient: 'linear-gradient(135deg,#2563EB,#3B82F6)', iconColor: '#60A5FA' },
  { to: '/purchases', icon: Store,           labelKey: 'purchasesTitle', gradient: 'linear-gradient(135deg,#7C3AED,#A78BFA)', iconColor: '#C4B5FD' },
  { to: '/returns',   icon: RotateCcw,       labelKey: 'returnsTitle',   gradient: 'linear-gradient(135deg,#D97706,#F59E0B)', iconColor: '#FCD34D' },
  { to: '/finance',   icon: Wallet,          labelKey: 'financeTitle',   gradient: 'linear-gradient(135deg,#DC2626,#EF4444)', iconColor: '#FCA5A5' },
  { to: '/reports',   icon: TrendingUp,      labelKey: 'reportsTitle',   gradient: 'linear-gradient(135deg,#0D9488,#14B8A6)', iconColor: '#5EEAD4' },
  { to: '/expiry',    icon: CalendarClock,   labelKey: 'expiryTitle',    gradient: 'linear-gradient(135deg,#DB2777,#EC4899)', iconColor: '#F9A8D4' },
];

function AppLayout() {
  const [sideOpen, setSideOpen] = useState(false);
  const { t } = useLang();
  const location = useLocation();
  const title = t(pageTitleKeys[location.pathname] ?? 'dashboardTitle');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar title={title} onMenuClick={() => setSideOpen(true)} />

      {sideOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 fade-in"
            style={{ background: 'rgba(5,8,22,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSideOpen(false)}
          />

          {/* Drawer */}
          <div
            className="relative h-full shadow-2xl slide-in flex flex-col mr-auto"
            style={{
              width: '288px',
              maxWidth: '84vw',
              background: 'linear-gradient(180deg, #0F0D2A 0%, #0D1225 100%)',
              borderLeft: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* Sidebar Header */}
            <div
              className="hero-gradient p-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}
                >
                  🏪
                </div>
                <div>
                  <h2 className="font-black text-[15px] text-white leading-tight">{t('systemName')}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('systemSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setSideOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {sideLinks.map(({ to, icon: Icon, labelKey, gradient, iconColor }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setSideOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ` +
                    (isActive ? '' : 'hover:bg-white/5')
                  }
                  style={({ isActive }) => isActive
                    ? {
                        background: 'rgba(99,102,241,0.18)',
                        border: '1px solid rgba(99,102,241,0.28)',
                        boxShadow: '0 2px 12px rgba(79,70,229,0.2)',
                      }
                    : { border: '1px solid transparent' }}
                >
                  {({ isActive }) => (
                    <>
                      {/* icon box */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={isActive
                          ? { background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }
                          : { background: 'rgba(255,255,255,0.07)' }
                        }
                      >
                        <span style={{ color: isActive ? 'white' : iconColor, display: 'flex' }}>
                          <Icon size={16} strokeWidth={2.2} />
                        </span>
                      </div>

                      <span style={{ color: isActive ? 'white' : 'rgba(148,163,184,0.9)' }}>
                        {t(labelKey)}
                      </span>

                      {isActive && (
                        <div className="mr-auto flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('version')}</p>
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
          <Route path="/expiry" element={<Expiry />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AppProvider>
    </LangProvider>
  );
}
