import React, { useState } from 'react';
import {
  Package,
  Shield,
  Sword,
  Wrench,
  Apple,
  Clock,
  Layers,
  ArrowRightLeft,
  Trash2,
  Utensils,
  Sparkles,
  Hand,
  Check,
  X,
} from 'lucide-react';
import type { InventoryItem } from '../types/minecraft';

interface InventoryViewerProps {
  items: InventoryItem[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  onMoveItem: (sourceSlot: number, destSlot: number) => void;
  onTossItem: (slot: number, count?: number) => void;
  onEquipItem: (slot: number, destination: string) => void;
  onConsumeItem: () => void;
  onActivateItem: () => void;
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
  onMoveItem,
  onTossItem,
  onEquipItem,
  onConsumeItem,
  onActivateItem,
  disabled,
}) => {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [movingSlot, setMovingSlot] = useState<number | null>(null);

  // Map of slot -> item
  const itemMap = new Map<number, InventoryItem>();
  for (const it of items) {
    itemMap.set(it.slot, it);
  }

  // Hotbar slots in Minecraft: 36 to 44 (indices 0 to 8)
  const hotbarSlots = Array.from({ length: 9 }, (_, i) => 36 + i);

  // Main inventory slots in Minecraft: 9 to 35
  const mainSlots = Array.from({ length: 27 }, (_, i) => 9 + i);

  const selectedItem = activeSlot !== null ? itemMap.get(activeSlot) : null;

  const handleSlotClick = (slotNum: number, hotbarIdx?: number) => {
    if (disabled) return;

    // If we are currently moving an item, clicking the second slot executes the swap/move
    if (movingSlot !== null) {
      if (movingSlot !== slotNum) {
        onMoveItem(movingSlot, slotNum);
      }
      setMovingSlot(null);
      setActiveSlot(null);
      return;
    }

    // If it's a hotbar slot and no action menu is active, select hotbar directly
    if (hotbarIdx !== undefined && activeSlot === null) {
      onSelectSlot(hotbarIdx);
    }

    setActiveSlot(activeSlot === slotNum ? null : slotNum);
  };

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Kho Đồ & Tương Tác Vật Phẩm</h2>
        </div>

        {/* Quick Item Actions */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onConsumeItem}
            disabled={disabled}
            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
            title="Ăn/Sử dụng vật phẩm thức ăn đang cầm trên tay"
          >
            <Utensils className="w-3 h-3" />
            <span>Ăn / Dùng</span>
          </button>

          <button
            onClick={onActivateItem}
            disabled={disabled}
            className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
            title="Kích hoạt chuột phải (Đồng hồ, ngọc, khiên)"
          >
            <Sparkles className="w-3 h-3" />
            <span>Chuột Phải</span>
          </button>
        </div>
      </div>

      {/* Moving Mode Notice */}
      {movingSlot !== null && (
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 animate-pulse" />
            <span>Chọn ô đích để chuyển / đổi chỗ vật phẩm từ ô {movingSlot}...</span>
          </div>
          <button
            onClick={() => setMovingSlot(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hotbar (9 Slots) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium">Thanh Phím Nhanh (Hotbar 1-9):</span>
          <span>Đang cầm: <span className="font-mono text-emerald-400 font-bold">Slot {selectedSlot + 1}</span></span>
        </div>
        <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#060a12] border border-slate-800/80 rounded-lg">
          {hotbarSlots.map((slotNum, idx) => {
            const item = itemMap.get(slotNum);
            const isSelected = selectedSlot === idx;
            const isTargeted = activeSlot === slotNum;
            const isMovingSource = movingSlot === slotNum;

            return (
              <button
                key={slotNum}
                onClick={() => handleSlotClick(slotNum, idx)}
                disabled={disabled}
                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all ${
                  isMovingSource
                    ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400 animate-pulse'
                    : isTargeted
                    ? 'border-sky-400 bg-sky-500/20 ring-2 ring-sky-400'
                    : isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-xs shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700 hover:bg-[#0f172a]'
                }`}
                title={item ? `${item.displayName} (x${item.count})` : `Slot ${idx + 1} (Trống)`}
              >
                <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-500">
                  {idx + 1}
                </span>

                {item ? (
                  <>
                    <div className="mt-1">
                      {CATEGORY_ICONS[item.category || 'misc'] || <Package className="w-3.5 h-3.5 text-slate-400" />}
                    </div>

                    {item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white tabular-nums">
                        {item.count}
                      </span>
                    )}

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
        <span className="text-[11px] text-slate-400 font-medium">Túi Đồ Chính (27 Slots - Click để tương tác):</span>
        <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#060a12] border border-slate-800/80 rounded-lg">
          {mainSlots.map((slotNum) => {
            const item = itemMap.get(slotNum);
            const isKingSMPSlot = slotNum === 24;
            const isTargeted = activeSlot === slotNum;
            const isMovingSource = movingSlot === slotNum;

            return (
              <button
                key={slotNum}
                onClick={() => handleSlotClick(slotNum)}
                disabled={disabled}
                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all ${
                  isMovingSource
                    ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400 animate-pulse'
                    : isTargeted
                    ? 'border-sky-400 bg-sky-500/20 ring-2 ring-sky-400'
                    : isKingSMPSlot
                    ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-[#0f172a]/40 hover:border-slate-700 hover:bg-[#0f172a]'
                }`}
                title={item ? `${item.displayName} (x${item.count})` : `Ô ${slotNum} (Trống)`}
              >
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Item Action Panel */}
      {activeSlot !== null && (
        <div className="p-3 bg-[#070b14] border border-slate-800 rounded-lg flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {selectedItem ? selectedItem.displayName : `Ô ${activeSlot} (Trống)`}
              </span>
              {selectedItem && (
                <span className="text-[11px] font-mono text-emerald-400">
                  x{selectedItem.count}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveSlot(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* If it's in hotbar, button to select as held item */}
            {activeSlot >= 36 && activeSlot <= 44 && (
              <button
                onClick={() => {
                  onSelectSlot(activeSlot - 36);
                  setActiveSlot(null);
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-colors"
              >
                <Hand className="w-3 h-3" />
                <span>Cầm Slot Này</span>
              </button>
            )}

            {/* Move / Swap */}
            <button
              onClick={() => {
                setMovingSlot(activeSlot);
                setActiveSlot(null);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3 text-amber-400" />
              <span>Chuyển / Đổi Vị Trí</span>
            </button>

            {/* If item exists: Equip / Toss */}
            {selectedItem && (
              <>
                <button
                  onClick={() => {
                    onEquipItem(activeSlot, 'hand');
                    setActiveSlot(null);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-colors"
                >
                  <Hand className="w-3 h-3 text-sky-400" />
                  <span>Trang Bị Tay Cầm</span>
                </button>

                <button
                  onClick={() => {
                    onEquipItem(activeSlot, 'off-hand');
                    setActiveSlot(null);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-colors"
                >
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Tay Phụ (Khiên)</span>
                </button>

                <button
                  onClick={() => {
                    onTossItem(activeSlot, 1);
                    setActiveSlot(null);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vứt 1</span>
                </button>

                <button
                  onClick={() => {
                    onTossItem(activeSlot);
                    setActiveSlot(null);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vứt Hết</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
