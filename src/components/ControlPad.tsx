import React, { useEffect, useState, useCallback } from 'react';
import { Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronsUp, Flame, ShieldAlert } from 'lucide-react';

interface ControlPadProps {
  onMove: (dir: 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint' | 'sneak') => void;
  disabled?: boolean;
}

export const ControlPad: React.FC<ControlPadProps> = ({ onMove, disabled }) => {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const [sprint, setSprint] = useState(false);
  const [sneak, setSneak] = useState(false);

  const triggerMove = useCallback(
    (dir: 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint' | 'sneak') => {
      if (disabled) return;
      onMove(dir);
    },
    [disabled, onMove]
  );

  useEffect(() => {
    const keyMap: Record<string, 'forward' | 'back' | 'left' | 'right' | 'jump'> = {
      w: 'forward',
      arrowup: 'forward',
      s: 'back',
      arrowdown: 'back',
      a: 'left',
      arrowleft: 'left',
      d: 'right',
      arrowright: 'right',
      ' ': 'jump',
    };

    let lastTime = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const k = e.key.toLowerCase();
      const dir = keyMap[k];
      if (!dir) return;

      e.preventDefault();
      setActiveKeys((prev) => ({ ...prev, [dir]: true }));

      const now = Date.now();
      if (now - lastTime < 100) return;
      lastTime = now;
      triggerMove(dir);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dir = keyMap[k];
      if (!dir) return;
      setActiveKeys((prev) => ({ ...prev, [dir]: false }));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerMove]);

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Di Chuyển WASD & Nhảy</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSprint(!sprint);
              triggerMove('sprint');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              sprint
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Chạy Nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSneak(!sneak);
              triggerMove('sneak');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              sneak
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Ngồi Xổm</span>
          </button>
        </div>
      </div>

      {/* WASD Grid */}
      <div className="flex flex-col items-center gap-2 py-1">
        {/* Forward W */}
        <button
          onClick={() => triggerMove('forward')}
          disabled={disabled}
          className={`w-12 h-12 rounded-lg font-mono font-bold text-sm flex flex-col items-center justify-center border transition-all ${
            activeKeys['forward']
              ? 'bg-emerald-500 text-black border-emerald-400 scale-95'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40'
          }`}
          title="Tiến lên (W)"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="text-[10px]">W</span>
        </button>

        {/* Left A, Back S, Right D */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerMove('left')}
            disabled={disabled}
            className={`w-12 h-12 rounded-lg font-mono font-bold text-sm flex flex-col items-center justify-center border transition-all ${
              activeKeys['left']
                ? 'bg-emerald-500 text-black border-emerald-400 scale-95'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40'
            }`}
            title="Sang trái (A)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px]">A</span>
          </button>

          <button
            onClick={() => triggerMove('back')}
            disabled={disabled}
            className={`w-12 h-12 rounded-lg font-mono font-bold text-sm flex flex-col items-center justify-center border transition-all ${
              activeKeys['back']
                ? 'bg-emerald-500 text-black border-emerald-400 scale-95'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40'
            }`}
            title="Lùi lại (S)"
          >
            <ArrowDown className="w-4 h-4" />
            <span className="text-[10px]">S</span>
          </button>

          <button
            onClick={() => triggerMove('right')}
            disabled={disabled}
            className={`w-12 h-12 rounded-lg font-mono font-bold text-sm flex flex-col items-center justify-center border transition-all ${
              activeKeys['right']
                ? 'bg-emerald-500 text-black border-emerald-400 scale-95'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40'
            }`}
            title="Sang phải (D)"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-[10px]">D</span>
          </button>
        </div>

        {/* Space Jump */}
        <button
          onClick={() => triggerMove('jump')}
          disabled={disabled}
          className={`w-40 py-2 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all ${
            activeKeys['jump']
              ? 'bg-emerald-500 text-black border-emerald-400 scale-95'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <ChevronsUp className="w-4 h-4" />
          <span>Nhảy (Space)</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 text-center font-mono">
        Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">W</kbd>{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">A</kbd>{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">S</kbd>{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">D</kbd>{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">Space</kbd> trên bàn phím.
      </div>
    </div>
  );
};
