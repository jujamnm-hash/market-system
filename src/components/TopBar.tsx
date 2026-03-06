import { Menu, Bell, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  title: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, onMenuClick }: Props) {
  const { state } = useApp();
  const lowStock = state.products.filter((p) => p.stock <= p.minStock);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-blue-600 text-white px-4 h-14 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-blue-500 transition">
          <Menu size={22} />
        </button>
        <Store size={20} className="text-blue-200" />
        <span className="font-bold text-base">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {lowStock.length > 0 && (
          <div className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {lowStock.length}
            </span>
          </div>
        )}
        <span className="text-xs text-blue-200 hidden sm:block">نظام السوبرماركت</span>
      </div>
    </header>
  );
}
