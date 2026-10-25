import React from 'react';
import { Compass, Server, Radio, Cpu } from 'lucide-react';
import type { BotState } from '../types/minecraft';

interface StatusHeaderProps {
  state: BotState;
  fps: number;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ state, fps }) => {
  return (
    <div className="bg-[#0f172a]/70 border border-emerald-950/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Status Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              state.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold text-slate-200">
            {state.connected ? 'HOẠT ĐỘNG' : 'CHƯA KẾT NỐI'}
          </span>
        </div>

        <span className="text-slate-600 font-mono">/</span>

        <span className="text-slate-300 font-medium">
          {state.status}
        </span>
      </div>

      {/* Telemetry and Coordinates with unboxed metadata discipline */}
      <div className="flex items-center gap-3 font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span className="tabular-nums tracking-wide">{state.currentXYZ}</span>
        </div>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <div className="flex items-center gap-1 text-slate-400">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span>{state.config.host}:{state.config.port}</span>
        </div>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <div className="flex items-center gap-1 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span className="tabular-nums">{fps} FPS</span>
        </div>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <div className="flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-emerald-500 font-medium uppercase">
            {state.mode === 'simulator' ? 'Sandbox Giả Lập' : 'Live Server'}
          </span>
        </div>
      </div>
    </div>
  );
};
