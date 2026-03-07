import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxW = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in"
      style={{ background: 'rgba(5,8,22,0.68)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative bg-white w-full ${maxW} rounded-t-[28px] sm:rounded-2xl max-h-[94vh] flex flex-col slide-up`}
        style={{
          boxShadow: '0 -4px 0 rgba(99,102,241,0.10), 0 -20px 60px rgba(79,70,229,0.18), 0 0 0 1px rgba(226,232,240,0.45)',
        }}
      >
        {/* Handle bar – mobile only */}
        <div
          className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
          style={{ background: 'rgba(148,163,184,0.4)' }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 rounded-t-[28px] sm:rounded-t-2xl"
          style={{
            background: 'linear-gradient(to bottom, #FFFFFF 85%, rgba(255,255,255,0))',
            borderBottom: '1px solid rgba(226,232,240,0.6)',
          }}
        >
          <h2 className="font-bold text-[15px] text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', border: '1px solid #C7D2FE' }}
          >
            <X size={15} className="text-indigo-600" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}


