/**
 * Minecraft Bot Ultimate Control Panel (Mineflayer Bot-v3)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { StatusHeader } from './components/StatusHeader';
import { ViewportCanvas } from './components/ViewportCanvas';
import { RadarCanvas } from './components/RadarCanvas';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ControlPad } from './components/ControlPad';
import { MacroPanel } from './components/MacroPanel';
import { VitalsBar } from './components/VitalsBar';
import { InventoryViewer } from './components/InventoryViewer';
import { BlockControls } from './components/BlockControls';
import { ChatConsole } from './components/ChatConsole';
import type { BotState, BotPose, VoxelSnapshot, InventoryItem, BotConfig } from './types/minecraft';

const DEFAULT_CONFIG: BotConfig = {
  host: 'kingmc.vn',
  port: 25565,
  username: 'ipttdup',
  version: '1.20.1',
  auth: 'offline',
  mode: 'live',
};

export default function App() {
  const [state, setState] = useState<BotState>({
    status: 'Đang kết nối tới máy chủ Minecraft thật...',
    currentXYZ: 'X: 0 | Y: 0 | Z: 0',
    isRandomMoving: false,
    connected: false,
    mode: 'live',
    config: DEFAULT_CONFIG,
    pose: {
      x: 128.5,
      y: 65.0,
      z: 256.5,
      yaw: 0,
      pitch: 0,
      health: 20,
      food: 19,
      foodSaturation: 8.5,
      xpLevel: 32,
      xpProgress: 0.78,
      ents: [],
    },
    inventory: [],
    selectedSlot: 0,
  });

  const [snapshot, setSnapshot] = useState<VoxelSnapshot | null>(null);
  const [pose, setPose] = useState<BotPose | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [toast, setToast] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(27);

  const socketRef = useRef<Socket | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // ------------------- SOCKET.IO SETUP -------------------
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to backend WebSocket gateway');
    });

    socket.on('statusUpdate', (data: any) => {
      setState((prev) => ({
        ...prev,
        status: data.status || prev.status,
        currentXYZ: data.xyz || prev.currentXYZ,
        isRandomMoving: !!data.isRandomMoving,
        connected: data.connected !== undefined ? data.connected : prev.connected,
        mode: data.mode || prev.mode,
        config: data.config ? { ...prev.config, ...data.config } : prev.config,
      }));
    });

    socket.on('snap', (snapData: any) => {
      if (!snapData) {
        setSnapshot(null);
        return;
      }
      setSnapshot({
        ox: snapData.ox,
        oy: snapData.oy,
        oz: snapData.oz,
        sx: snapData.sx,
        sy: snapData.sy,
        sz: snapData.sz,
        data: new Uint8Array(snapData.data),
      });
    });

    socket.on('pose', (poseData: BotPose) => {
      setPose(poseData);
      setState((prev) => ({
        ...prev,
        pose: poseData,
      }));
    });

    socket.on('inventoryUpdate', (inv: InventoryItem[]) => {
      setState((prev) => ({ ...prev, inventory: inv }));
    });

    socket.on('minecraftChat', (msg: string) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > 500 ? next.slice(-400) : next;
      });
    });

    socket.on('botOff', () => {
      setSnapshot(null);
      setPose(null);
      setState((prev) => ({
        ...prev,
        connected: false,
        status: 'Bot đã ngắt kết nối.',
        isRandomMoving: false,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ------------------- ACTION HANDLERS -------------------
  const handleConnect = async (newConfig: BotConfig, loginPass?: string) => {
    try {
      showToast(`Đang kết nối vào ${newConfig.host}:${newConfig.port}...`);
      await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          loginPass,
        }),
      });
      setState((prev) => ({
        ...prev,
        config: newConfig,
        mode: newConfig.mode,
        status: `Đang kết nối vào ${newConfig.host}:${newConfig.port} ...`,
      }));
    } catch (e: any) {
      showToast('Lỗi khi gửi lệnh kết nối: ' + e.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/stop', { method: 'POST' });
      showToast('Đã gửi tín hiệu ngắt kết nối bot');
    } catch (e: any) {
      showToast('Lỗi khi ngắt kết nối: ' + e.message);
    }
  };

  const handleMove = async (dir: 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint' | 'sneak') => {
    try {
      await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir }),
      });
    } catch (e) {
      // ignore
    }
  };

  const handleSendLook = useCallback(async (yaw: number, pitch: number) => {
    try {
      await fetch('/api/look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaw, pitch }),
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (e: any) {
      showToast('Lỗi gửi chat: ' + e.message);
    }
  };

  const handleOpenMenu = async () => {
    try {
      await fetch('/api/open-menu', { method: 'POST' });
      showToast('⏰ Đã kích hoạt macro: Mở Menu Đồng Hồ [Slot 4]');
    } catch (e: any) {
      showToast('Lỗi macro: ' + e.message);
    }
  };

  const handleClickKingSMP = async () => {
    try {
      await fetch('/api/click-kingsmp', { method: 'POST' });
      showToast('🧱 Đã gửi lệnh click ô 24 cụm KingSMP!');
    } catch (e: any) {
      showToast('Lỗi macro: ' + e.message);
    }
  };

  const handleTpAccept = async () => {
    try {
      await fetch('/api/tpaccept', { method: 'POST' });
      showToast('🛸 Đã tự động gửi /tpaccept!');
    } catch (e: any) {
      showToast('Lỗi lệnh /tpaccept: ' + e.message);
    }
  };

  const handleToggleRandom = async () => {
    try {
      const res = await fetch('/api/toggle-random', { method: 'POST' });
      const data = await res.json();
      setState((prev) => ({ ...prev, isRandomMoving: !!data.isRandomMoving }));
      showToast(
        data.isRandomMoving
          ? '🎲 Bật chạy tự động ngẫu nhiên (Anti-AFK)'
          : '🛑 Tắt chạy tự động ngẫu nhiên'
      );
    } catch (e: any) {
      showToast('Lỗi toggle: ' + e.message);
    }
  };

  const handleSelectSlot = async (slot: number) => {
    setState((prev) => ({ ...prev, selectedSlot: slot }));
    try {
      await fetch('/api/inventory/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      });
      showToast(`Đã chuyển tay cầm sang Slot ${slot + 1}`);
    } catch (e) {
      // ignore
    }
  };

  const handleDigFront = async () => {
    try {
      showToast('⛏️ Đang đào block trước mặt...');
      const res = await fetch('/api/block/dig', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Không thể đào block');
      } else {
        showToast('⛏️ Đã đào xong block!');
      }
    } catch (e: any) {
      showToast('Lỗi đào block: ' + e.message);
    }
  };

  const handleDigDown = async () => {
    try {
      showToast('⛏️ Đang đào block dưới chân...');
      const res = await fetch('/api/block/dig-down', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Không thể đào block');
      } else {
        showToast('⛏️ Đã đào xong block dưới chân!');
      }
    } catch (e: any) {
      showToast('Lỗi đào block: ' + e.message);
    }
  };

  const handlePlaceFront = async () => {
    try {
      showToast('🧱 Đang đặt block phía trước...');
      const res = await fetch('/api/block/place', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Không thể đặt block');
      } else {
        showToast('🧱 Đã đặt block thành công!');
      }
    } catch (e: any) {
      showToast('Lỗi đặt block: ' + e.message);
    }
  };

  const handlePillarUp = async () => {
    try {
      showToast('🪜 Đang nhảy lên đặt block dưới chân...');
      const res = await fetch('/api/block/pillar', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Không thể đặt block dưới chân');
      } else {
        showToast('🪜 Đã xây cột lên 1 block!');
      }
    } catch (e: any) {
      showToast('Lỗi xây cột: ' + e.message);
    }
  };

  const handleStopDig = async () => {
    try {
      await fetch('/api/block/stop-dig', { method: 'POST' });
      showToast('🛑 Đã dừng đào');
    } catch (e) {}
  };

  const handleMoveItem = async (sourceSlot: number, destSlot: number) => {
    try {
      await fetch('/api/inventory/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceSlot, destSlot }),
      });
      showToast(`Đã chuyển đổi ô ${sourceSlot} và ${destSlot}`);
    } catch (e: any) {
      showToast('Lỗi chuyển đồ: ' + e.message);
    }
  };

  const handleTossItem = async (slot: number, count?: number) => {
    try {
      await fetch('/api/inventory/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, count }),
      });
      showToast(`Đã vứt vật phẩm từ ô ${slot}`);
    } catch (e: any) {
      showToast('Lỗi vứt đồ: ' + e.message);
    }
  };

  const handleEquipItem = async (slot: number, destination: string) => {
    try {
      await fetch('/api/inventory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, destination }),
      });
      showToast(`Đã trang bị vật phẩm vào ${destination}`);
    } catch (e: any) {
      showToast('Lỗi trang bị: ' + e.message);
    }
  };

  const handleConsumeItem = async () => {
    try {
      await fetch('/api/inventory/consume', { method: 'POST' });
      showToast('Đang ăn/dùng vật phẩm trên tay...');
    } catch (e: any) {
      showToast('Lỗi dùng đồ: ' + e.message);
    }
  };

  const handleActivateItem = async () => {
    try {
      await fetch('/api/inventory/activate', { method: 'POST' });
      showToast('Đã kích hoạt chuột phải vật phẩm đang cầm!');
    } catch (e: any) {
      showToast('Lỗi kích hoạt: ' + e.message);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    showToast('Đã xóa toàn bộ nhật ký chat');
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        connected={state.connected}
        mode={state.mode}
        onQuickToggle={() => (state.connected ? handleDisconnect() : handleConnect(state.config))}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Real-time Status Ribbon */}
        <StatusHeader state={state} fps={fps} />

        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-16 right-6 z-50 bg-emerald-500 text-black font-semibold text-xs py-2 px-4 rounded-lg shadow-lg shadow-emerald-950/80 animate-fade-in flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}

        {/* Dashboard 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Config, Vitals, Movement, Blocks, Macros, Inventory (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Server Connection Form */}
            <div id="dashboard">
              <ConnectionPanel
                config={state.config}
                connected={state.connected}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            {/* Vitals: HP Hearts & Hunger */}
            <VitalsBar pose={pose} />

            {/* Movement Controls (WASD) */}
            <ControlPad onMove={handleMove} disabled={!state.connected} />

            {/* Block Mining & Placing Controls */}
            <div id="blocks">
              <BlockControls
                onDigFront={handleDigFront}
                onDigDown={handleDigDown}
                onPlaceFront={handlePlaceFront}
                onPillarUp={handlePillarUp}
                onStopDig={handleStopDig}
                disabled={!state.connected}
              />
            </div>

            {/* Macros & KingSMP Actions */}
            <div id="macros">
              <MacroPanel
                isRandomMoving={state.isRandomMoving}
                onOpenMenu={handleOpenMenu}
                onClickKingSMP={handleClickKingSMP}
                onTpAccept={handleTpAccept}
                onToggleRandom={handleToggleRandom}
                onSendCommand={handleSendMessage}
                disabled={!state.connected}
              />
            </div>

            {/* Inventory Viewer */}
            <div id="inventory">
              <InventoryViewer
                items={state.inventory}
                selectedSlot={state.selectedSlot}
                onSelectSlot={handleSelectSlot}
                onMoveItem={handleMoveItem}
                onTossItem={handleTossItem}
                onEquipItem={handleEquipItem}
                onConsumeItem={handleConsumeItem}
                onActivateItem={handleActivateItem}
                disabled={!state.connected}
              />
            </div>
          </div>

          {/* Right Column: 3D ASCII Viewport, Radar, Chat Log (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* 3D ASCII Viewport */}
            <div id="viewport">
              <ViewportCanvas
                pose={pose}
                snapshot={snapshot}
                onSendLook={handleSendLook}
                onDig={handleDigFront}
                onPlace={handlePlaceFront}
              />
            </div>

            {/* 2-Column Split: Radar + Quick Chat Console */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5">
                <RadarCanvas
                  pose={pose}
                  snapshot={snapshot}
                  camYaw={pose?.yaw}
                />
              </div>

              <div id="chat" className="md:col-span-7">
                <ChatConsole
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onClear={handleClearChat}
                  disabled={!state.connected}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-[#060911] px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Minecraft Bot Ultimate Control Console</span>
          <span aria-hidden="true">·</span>
          <span>Mineflayer Engine v4.20 & Simulator</span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          KingMC / KingSMP Protocol Compatible
        </div>
      </footer>
    </div>
  );
}
