import React from 'react';
import { Heart, Utensils, Award } from 'lucide-react';
import type { BotPose } from '../types/minecraft';

interface VitalsBarProps {
  pose: BotPose | null;
}

export const VitalsBar: React.FC<VitalsBarProps> = ({ pose }) => {
  const health = pose?.health != null ? Math.max(0, Math.min(20, pose.health)) : 20;
  const food = pose?.food != null ? Math.max(0, Math.min(20, pose.food)) : 20;
  const xpLevel = pose?.xpLevel ?? 0;
  const xpProgress = pose?.xpProgress ?? 0;

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-3.5 flex flex-col gap-3">
      {/* Vitals row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Health */}
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-200">Máu (HP):</span>
              <span className="font-mono font-bold text-rose-400 tabular-nums">
                {Math.round(health)} / 20
              </span>
            </div>
            {/* Visual 10 heart segments */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = health >= (i + 1) * 2;
                const half = !filled && health >= i * 2 + 1;
                return (
                  <div
                    key={i}
                    className={`w-3 h-2.5 rounded-xs transition-colors ${
                      filled
                        ? 'bg-rose-500 shadow-xs shadow-rose-950'
                        : half
                        ? 'bg-rose-700'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Food */}
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-200">Độ No (Food):</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {Math.round(food)} / 20
              </span>
            </div>
            {/* Visual 10 food segments */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = food >= (i + 1) * 2;
                const half = !filled && food >= i * 2 + 1;
                return (
                  <div
                    key={i}
                    className={`w-3 h-2.5 rounded-xs transition-colors ${
                      filled
                        ? 'bg-amber-500 shadow-xs shadow-amber-950'
                        : half
                        ? 'bg-amber-700'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Level */}
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-200">Cấp Độ:</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">
              Lvl {xpLevel}
            </span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 relative">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
          style={{ width: `${Math.round(xpProgress * 100)}%` }}
        />
      </div>
    </div>
  );
};
