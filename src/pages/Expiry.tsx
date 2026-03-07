import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LangContext';
import { formatMoney, formatDate } from '../utils/helpers';
import { AlertTriangle, Calendar, Trash2, Search, ShieldAlert, ShieldCheck, TrendingDown, Clock } from 'lucide-react';
import type { ExpiryBatch } from '../types';

type FilterStatus = 'all' | 'expired' | 'critical' | 'warning' | 'safe';

interface BatchWithDays extends ExpiryBatch {
  days: number;
  status: 'expired' | 'critical' | 'warning' | 'safe';
}

const STATUS_CONFIG = {
  expired: {
    bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600 text-white',
    daysColor: 'text-red-600', icon: '🔴', headerBg: 'bg-red-600',
  },
  critical: {
    bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white',
    daysColor: 'text-orange-600', icon: '🟠', headerBg: 'bg-orange-500',
  },
  warning: {
    bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500 text-white',
    daysColor: 'text-yellow-600', icon: '🟡', headerBg: 'bg-yellow-500',
  },
  safe: {
    bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-600 text-white',
    daysColor: 'text-green-600', icon: '🟢', headerBg: 'bg-green-600',
  },
};

export default function Expiry() {
  const { state, dispatch } = useApp();
  const { t } = useLang();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  // Calculate days for each batch
  const batchesWithDays: BatchWithDays[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return state.expiryBatches.map(b => {
      const exp = new Date(b.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const status: BatchWithDays['status'] =
        days < 0 ? 'expired' : days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'safe';
      return { ...b, days, status };
    }).sort((a, b) => a.days - b.days); // soonest first
  }, [state.expiryBatches]);

  // Summary stats
  const expired    = batchesWithDays.filter(b => b.status === 'expired');
  const critical   = batchesWithDays.filter(b => b.status === 'critical');
  const warning    = batchesWithDays.filter(b => b.status === 'warning');
  const safe       = batchesWithDays.filter(b => b.status === 'safe');
  const atRiskItems = [...expired, ...critical];
  const atRiskValue = atRiskItems.reduce((s, b) => s + b.qty * b.buyPrice, 0);
  const warningValue = warning.reduce((s, b) => s + b.qty * b.buyPrice, 0);

  // Filtered list
  const filtered = batchesWithDays.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = b.productName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filterTabs: { key: FilterStatus; labelKey: string; count: number; color: string; active: string }[] = [
    { key: 'all',      labelKey: 'expiryFilterAll',    count: batchesWithDays.length, color: 'text-slate-600',  active: 'bg-slate-700 text-white' },
    { key: 'expired',  labelKey: 'expired',             count: expired.length,         color: 'text-red-600',    active: 'bg-red-600 text-white' },
    { key: 'critical', labelKey: 'expiringCritical',    count: critical.length,        color: 'text-orange-600', active: 'bg-orange-500 text-white' },
    { key: 'warning',  labelKey: 'expiringWarning',     count: warning.length,         color: 'text-yellow-600', active: 'bg-yellow-500 text-white' },
    { key: 'safe',     labelKey: 'expirySafe',           count: safe.length,            color: 'text-green-600',  active: 'bg-green-600 text-white' },
  ];

  const handleDelete = (id: string) => {
    if (confirm(t('deleteBatch') + '?')) {
      dispatch({ type: 'DELETE_EXPIRY_BATCH', payload: id });
    }
  };

  return (
    <div className="px-3 fade-in" style={{ paddingTop: '72px', paddingBottom: '100px' }}>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mt-3 mb-4">
        {/* Expired */}
        <div className="bg-red-600 rounded-2xl p-3.5 text-white" style={{ boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-red-100">{t('expired')}</span>
            <ShieldAlert size={18} className="text-red-200" />
          </div>
          <p className="text-2xl font-black">{expired.length}</p>
          <p className="text-xs text-red-200 mt-0.5">{formatMoney(expired.reduce((s,b)=>s+b.qty*b.buyPrice,0))}</p>
        </div>

        {/* Critical ≤7 days */}
        <div className="bg-orange-500 rounded-2xl p-3.5 text-white" style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-orange-100">{t('expiringCritical')}</span>
            <AlertTriangle size={18} className="text-orange-200" />
          </div>
          <p className="text-2xl font-black">{critical.length}</p>
          <p className="text-xs text-orange-200 mt-0.5">{formatMoney(critical.reduce((s,b)=>s+b.qty*b.buyPrice,0))}</p>
        </div>

        {/* Warning ≤30 days */}
        <div className="bg-yellow-500 rounded-2xl p-3.5 text-white" style={{ boxShadow: '0 4px 14px rgba(234,179,8,0.35)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-yellow-100">{t('expiringWarning')}</span>
            <Clock size={18} className="text-yellow-200" />
          </div>
          <p className="text-2xl font-black">{warning.length}</p>
          <p className="text-xs text-yellow-200 mt-0.5">{formatMoney(warningValue)}</p>
        </div>

        {/* Safe */}
        <div className="bg-green-600 rounded-2xl p-3.5 text-white" style={{ boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-green-100">{t('expirySafe')}</span>
            <ShieldCheck size={18} className="text-green-200" />
          </div>
          <p className="text-2xl font-black">{safe.length}</p>
          <p className="text-xs text-green-200 mt-0.5">{formatMoney(safe.reduce((s,b)=>s+b.qty*b.buyPrice,0))}</p>
        </div>
      </div>

      {/* At-Risk Value Banner — only if there are risks */}
      {atRiskItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingDown size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-800">{t('totalAtRisk')}</p>
            <p className="text-xl font-black text-red-600">{formatMoney(atRiskValue)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-red-400">{expired.length + critical.length} {t('items')}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
        <input
          className="input-search"
          placeholder={t('search') + '...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: '38px' }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === tab.key ? tab.active : `bg-white ${tab.color} border border-slate-200`
            }`}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
            {tab.count > 0 && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                filter === tab.key ? 'bg-white/30' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Batches List */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm font-medium">{t('noExpiryBatches')}</p>
          <p className="text-slate-300 text-xs mt-1">{t('expiryOptional')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(b => {
            const cfg = STATUS_CONFIG[b.status];
            return (
              <div
                key={b.id}
                className={`rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {/* Colored top bar */}
                <div className={`${cfg.headerBg} h-1`} />

                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    {/* Days remaining — big number */}
                    <div className="flex-shrink-0 text-center min-w-[52px]">
                      <p className={`text-2xl font-black leading-none ${cfg.daysColor}`}>
                        {b.days < 0 ? Math.abs(b.days) : b.days === 0 ? '!' : b.days}
                      </p>
                      <p className={`text-[9px] font-semibold mt-0.5 ${cfg.daysColor}`}>
                        {b.days < 0 ? t('daysExpiredLabel') : b.days === 0 ? t('expiryToday') : t('daysLeftLabel')}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-slate-200 self-stretch" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 truncate">{b.productName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                          {cfg.icon} {t(b.status === 'expired' ? 'expired' : b.status === 'critical' ? 'expiringCritical' : b.status === 'warning' ? 'expiringWarning' : 'expirySafe')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span>📅 {t('expiryDate')}: <b className={cfg.daysColor}>{b.expiryDate}</b></span>
                        <span>📦 {t('batchQty')}: <b className="text-slate-700">{b.qty}</b></span>
                        <span>🛒 {t('purchaseDateLabel')}: {formatDate(b.purchaseDate)}</span>
                        <span>💰 {formatMoney(b.qty * b.buyPrice)}</span>
                      </div>

                      {b.barcode && (
                        <p className="text-[10px] text-slate-400 mt-1">#{b.barcode}</p>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 bg-white rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
