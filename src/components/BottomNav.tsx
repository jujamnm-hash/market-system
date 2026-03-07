import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, PackageSearch, TrendingUp, Wallet } from 'lucide-react';
import { useLang } from '../context/LangContext';
import type { TranslationKey } from '../i18n';

const navItems: {
  to: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  labelKey: TranslationKey;
  color: string;
  activeColor: string;
  activeBg: string;
}[] = [
  { to: '/',          icon: LayoutDashboard, labelKey: 'dashboard',    color: '#64748B', activeColor: '#4F46E5', activeBg: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' },
  { to: '/inventory', icon: PackageSearch,   labelKey: 'inventoryNav', color: '#64748B', activeColor: '#16A34A', activeBg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' },
  { to: '/sales',     icon: ShoppingCart,    labelKey: 'salesNav',     color: '#64748B', activeColor: '#2563EB', activeBg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' },
  { to: '/finance',   icon: Wallet,          labelKey: 'financeNav',   color: '#64748B', activeColor: '#DC2626', activeBg: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)' },
  { to: '/reports',   icon: TrendingUp,      labelKey: 'reportsNav',   color: '#64748B', activeColor: '#7C3AED', activeBg: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)' },
];

export default function BottomNav() {
  const { t } = useLang();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      style={{ padding: '0 10px max(10px, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="w-full max-w-lg flex items-center rounded-[22px] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow: '0 -1px 0 rgba(226,232,240,0.8), 0 12px 40px rgba(79,70,229,0.14), 0 4px 12px rgba(0,0,0,0.07)',
          border: '1px solid rgba(226,232,240,0.75)',
        }}
      >
        {navItems.map(({ to, icon: Icon, labelKey, color, activeColor, activeBg }) => (
          <NavLink key={to} to={to} end={to === '/'} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200">
                {/* icon pill */}
                <div
                  className="flex items-center justify-center rounded-[13px] transition-all duration-250"
                  style={{
                    width: isActive ? 48 : 36,
                    height: 28,
                    background: isActive ? activeBg : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? activeColor : color, transition: 'color 0.2s' }}
                  />
                </div>
                <span
                  className="font-semibold leading-none transition-all duration-200"
                  style={{
                    fontSize: '10px',
                    color: isActive ? activeColor : color,
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {t(labelKey)}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


