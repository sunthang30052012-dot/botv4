import React from 'react';
import { Package, Shield, Sword, Wrench, Apple, Clock, Layers } from 'lucide-react';
import type { InventoryItem } from '../types/minecraft';

interface InventoryViewerProps {
  items: InventoryItem[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  weapon: <Sword className="w-3.5 h-3.5 text-rose-400" />,
  tool: <Wrench className="w-3.5 h-3.5 text-sky-400" />,
  food: <Apple className="w-3.5 h-3.5 text-amber-400" />,
  armor: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
  block: <Layers className="w-3.5 h-3.5 text-stone-400" />,
  misc: <Clock className="w-3.5 h-3.5 text-purple-400" />,
};

export const InventoryViewer: React.FC<InventoryViewerProps> = ({
  items,
  selectedSlot,
  onSelectSlot,
  disabled,
}) => {
  // Map of slot -> item
  const itemMap = new Map<number, InventoryItem>();
  for (const it of items) {
    itemMap.set(it.slot, it);
  }

  // Hotbar slots in Minecraft: 36 to 44 (indices 0 to 8)
  const hotbarSlots = Array.from({ length: 9 }, (_, i) => 36 + i);

  // Main inventory slots in Minecraft: 9 to 35
  const mainSlots = Array.from({ length: 27 }, (_, i) => 9 + i);

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Kho Đồ & Thanh Phím Tắt (Hotbar)</h2>
        </div>
        <span className="text-[11px] text-slate-400">
          Đang cầm: <span className="font-mono text-emerald-400 font-bold">Slot {selectedSlot + 1}</span>
        </span>
      </div>

      {/* Hotbar (9 Slots) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400 font-medium">Thanh Phím Nhanh (Hotbar 1-9):</span>
        <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#060a12] border border-slate-800/80 rounded-lg">
          {hotbarSlots.map((slotNum, idx) => {
            const item = itemMap.get(slotNum);
            const isSelected = selectedSlot === idx;

            return (
              <button
                key={slotNum}
                onClick={() => onSelectSlot(idx)}
                disabled={disabled}
                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-xs shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700 hover:bg-[#0f172a]'
                }`}
                title={item ? `${item.displayName} (x${item.count})` : `Slot ${idx + 1} (Trống)`}
              >
                {/* Slot index label */}
                <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-500">
                  {idx + 1}
                </span>

                {item ? (
                  <>
                    <div className="mt-1">
                      {CATEGORY_ICONS[item.category || 'misc'] || <Package className="w-3.5 h-3.5 text-slate-400" />}
                    </div>

                    {/* Count */}
                    {item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white tabular-nums">
                        {item.count}
                      </span>
                    )}

                    {/* Durability bar */}
                    {item.durability != null && (
                      <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${item.durability}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-slate-700 text-xs font-mono">·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Bag Inventory (27 Slots) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400 font-medium">Túi Đồ Chính (27 Slots):</span>
        <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#060a12] border border-slate-800/80 rounded-lg">
          {mainSlots.map((slotNum) => {
            const item = itemMap.get(slotNum);
            const isKingSMPSlot = slotNum === 24;

            return (
              <div
                key={slotNum}
                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all group ${
                  isKingSMPSlot
                    ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-[#0f172a]/40 hover:border-slate-700 hover:bg-[#0f172a]'
                }`}
                title={item ? `${item.displayName} (x${item.count})` : `Ô ${slotNum}`}
              >
                {/* KingSMP slot 24 marker */}
                {isKingSMPSlot && (
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-amber-400 font-bold">
                    24
                  </span>
                )}

                {item ? (
                  <>
                    <div>
                      {CATEGORY_ICONS[item.category || 'misc'] || <Package className="w-3.5 h-3.5 text-slate-400" />}
                    </div>

                    {item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white tabular-nums">
                        {item.count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-800 text-xs font-mono">·</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
