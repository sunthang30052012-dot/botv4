import React from 'react';
import { Terminal, Shield, Sparkles, Activity } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  mode: 'live' | 'simulator';
  onQuickToggle: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  mode,
  onQuickToggle,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0b0f19] border-b border-emerald-950/40 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5 whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span>MINECRAFT BOT COCKPIT</span>
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-1 ${
            activeSection === 'dashboard'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : ''
          }`}
        >
          Trang Điều Khiển
        </button>
        <button
          onClick={() => onNavigate('viewport')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-1 ${
            activeSection === 'viewport'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : ''
          }`}
        >
          Góc Nhìn 3D & Radar
        </button>
        <button
          onClick={() => onNavigate('blocks')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-1 ${
            activeSection === 'blocks'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : ''
          }`}
        >
          Đào & Đặt Block
        </button>
        <button
          onClick={() => onNavigate('inventory')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-1 ${
            activeSection === 'inventory'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : ''
          }`}
        >
          Kho Đồ & Vật Phẩm
        </button>
        <button
          onClick={() => onNavigate('chat')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 pb-1 ${
            activeSection === 'chat'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : ''
          }`}
        >
          Khung Chat Game
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickToggle}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            connected
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-950'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{connected ? 'Ngắt Kết Nối' : 'Kết Nối Máy Chủ'}</span>
        </button>
      </div>
    </header>
  );
};
