import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, PackageSearch, TrendingUp, Wallet } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/inventory', icon: PackageSearch, label: 'المخزن' },
  { to: '/sales', icon: ShoppingCart, label: 'المبيعات' },
  { to: '/finance', icon: Wallet, label: 'المالية' },
  { to: '/reports', icon: TrendingUp, label: 'التقارير' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 flex items-stretch"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors duration-150 ` +
            (isActive ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600')
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
