import { Menu, Bell, Globe, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';

interface Props {
  title: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, onMenuClick }: Props) {
  const { state } = useApp();
  const { lang, setLang, t } = useLang();
  const lowStock = state.products.filter((p) => p.stock <= p.minStock);
  const expiryAlerts = state.expiryBatches?.filter(b => {
    const diff = Math.floor((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
    return diff <= 7;
  }) ?? [];
  const totalAlerts = lowStock.length + expiryAlerts.length;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 hero-gradient"
      style={{ height: '62px', boxShadow: '0 4px 28px rgba(30,27,75,0.45)' }}
    >
      {/* subtle grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        pointerEvents: 'none',
      }} />

      {/* bottom glow line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 30%, rgba(165,145,250,0.45) 60%, transparent 100%)',
      }} />

      <div className="relative h-full flex items-center justify-between px-4 gap-3">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
            aria-label="menu"
          >
            <Menu size={19} strokeWidth={2.2} className="text-white" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
              <Store size={15} strokeWidth={2} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[15px] text-white leading-none truncate tracking-tight">{title}</h1>
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('systemName')}</p>
            </div>
          </div>
        </div>

        {/* Right: alerts + language  */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90"
            style={{
              background: totalAlerts > 0
                ? 'rgba(239,68,68,0.22)'
                : 'rgba(255,255,255,0.13)',
              border: totalAlerts > 0
                ? '1px solid rgba(239,68,68,0.35)'
                : '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="notifications"
          >
            <Bell size={17} strokeWidth={2} className="text-white" />
            {totalAlerts > 0 && (
              <span className="nav-badge animate-pulse2">{totalAlerts > 9 ? '9+' : totalAlerts}</span>
            )}
          </button>

          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 h-9 rounded-xl text-[11px] font-black transition-all active:scale-90 text-white"
            style={{
              background: 'rgba(255,255,255,0.13)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Globe size={12} strokeWidth={2.5} />
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>
        </div>
      </div>
    </header>
  );
}


