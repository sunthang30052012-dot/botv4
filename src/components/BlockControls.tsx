import React, { useState } from 'react';
import { Pickaxe, Box, ArrowDown, Layers, Hand, AlertCircle, RefreshCw, StopCircle } from 'lucide-react';

interface BlockControlsProps {
  onDigFront: () => void;
  onDigDown: () => void;
  onPlaceFront: () => void;
  onPillarUp: () => void;
  onStopDig: () => void;
  disabled?: boolean;
}

export const BlockControls: React.FC<BlockControlsProps> = ({
  onDigFront,
  onDigDown,
  onPlaceFront,
  onPillarUp,
  onStopDig,
  disabled,
}) => {
  const [isMining, setIsMining] = useState(false);
  const [autoMine, setAutoMine] = useState(false);

  const handleDigFront = async () => {
    setIsMining(true);
    await onDigFront();
    setTimeout(() => setIsMining(false), 800);
  };

  const handleDigDown = async () => {
    setIsMining(true);
    await onDigDown();
    setTimeout(() => setIsMining(false), 800);
  };

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Pickaxe className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Đào & Đặt Block (Mining & Building)</h2>
        </div>

        {isMining && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Đang đào block...</span>
          </div>
        )}
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Dig Front */}
        <button
          onClick={handleDigFront}
          disabled={disabled || isMining}
          className="py-2.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-xs active:scale-95"
        >
          <Pickaxe className="w-4 h-4 text-amber-400" />
          <span>⛏️ Đào Trước Mặt</span>
        </button>

        {/* Dig Down */}
        <button
          onClick={handleDigDown}
          disabled={disabled || isMining}
          className="py-2.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-xs active:scale-95"
        >
          <ArrowDown className="w-4 h-4 text-amber-400" />
          <span>⛏️ Đào Dưới Chân</span>
        </button>

        {/* Place Front */}
        <button
          onClick={onPlaceFront}
          disabled={disabled}
          className="py-2.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-xs active:scale-95"
        >
          <Box className="w-4 h-4 text-emerald-400" />
          <span>🧱 Đặt Block Trước</span>
        </button>

        {/* Pillar Up */}
        <button
          onClick={onPillarUp}
          disabled={disabled}
          className="py-2.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-xs active:scale-95"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>🪜 Xây Cột Lên Cao</span>
        </button>
      </div>

      {/* Stop Dig button */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Góc nhìn bot sẽ tự động hướng vào block để đào/đặt</span>
        <button
          onClick={onStopDig}
          disabled={disabled}
          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
        >
          <StopCircle className="w-3.5 h-3.5" />
          <span>Dừng Đào</span>
        </button>
      </div>
    </div>
  );
};
