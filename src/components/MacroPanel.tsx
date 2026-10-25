import React, { useState } from 'react';
import { Zap, Clock, Box, Send, Shuffle, Sparkles, Navigation } from 'lucide-react';

interface MacroPanelProps {
  isRandomMoving: boolean;
  onOpenMenu: () => void;
  onClickKingSMP: () => void;
  onTpAccept: () => void;
  onToggleRandom: () => void;
  onSendCommand: (cmd: string) => void;
  disabled?: boolean;
}

export const MacroPanel: React.FC<MacroPanelProps> = ({
  isRandomMoving,
  onOpenMenu,
  onClickKingSMP,
  onTpAccept,
  onToggleRandom,
  onSendCommand,
  disabled,
}) => {
  const [customCmd, setCustomCmd] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    const formatted = customCmd.startsWith('/') ? customCmd : `/${customCmd}`;
    onSendCommand(formatted);
    setCustomCmd('');
  };

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Hệ Thống Vượt Ải & Macros</h2>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono">KingMC Auto-Routine</span>
      </div>

      {/* Main KingSMP Macro Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenMenu}
          disabled={disabled}
          className="py-2.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          <Clock className="w-4 h-4" />
          <span>⏰ Mở Menu Đồng Hồ</span>
        </button>

        <button
          onClick={onClickKingSMP}
          disabled={disabled}
          className="py-2.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          <Box className="w-4 h-4" />
          <span>🧱 Chọn Ô 24 KingSMP</span>
        </button>

        <button
          onClick={onTpAccept}
          disabled={disabled}
          className="py-2.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          <Navigation className="w-4 h-4" />
          <span>🛸 Đồng Ý /tpaccept</span>
        </button>

        <button
          onClick={onToggleRandom}
          disabled={disabled}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 border ${
            isRandomMoving
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>{isRandomMoving ? '🛑 Tắt Chạy Tự Động' : '🎲 Bật Chạy Tự Động'}</span>
        </button>
      </div>

      {/* Quick Server Commands */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-slate-400">Lệnh Nhanh Máy Chủ</label>
        <div className="flex flex-wrap gap-1.5">
          {['/spawn', '/hub', '/home', '/sethome', '/fix all', '/feed'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => onSendCommand(cmd)}
              disabled={disabled}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 font-mono transition-colors disabled:opacity-40"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Command Dispatch */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customCmd}
          onChange={(e) => setCustomCmd(e.target.value)}
          placeholder="Nhập lệnh bot (vd: /kit, /warp mine)..."
          disabled={disabled}
          className="flex-1 bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={disabled || !customCmd.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-sm shadow-emerald-950"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gửi</span>
        </button>
      </form>
    </div>
  );
};
