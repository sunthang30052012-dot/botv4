import React, { useState } from 'react';
import { Server, User, Key, Globe, Shield, Play, Square, Sparkles } from 'lucide-react';
import type { BotConfig } from '../types/minecraft';

interface ConnectionPanelProps {
  config: BotConfig;
  connected: boolean;
  onConnect: (newConfig: BotConfig, loginPass?: string) => void;
  onDisconnect: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  config,
  connected,
  onConnect,
  onDisconnect,
}) => {
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(config.port);
  const [username, setUsername] = useState(config.username);
  const [version, setVersion] = useState(config.version || '');
  const [auth, setAuth] = useState<'offline' | 'microsoft'>(config.auth);
  const [loginPass, setLoginPass] = useState('');
  const [mode, setMode] = useState<'live' | 'simulator'>(config.mode || 'live');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(
      {
        host,
        port: Number(port) || 25565,
        username,
        version,
        auth,
        mode,
      },
      loginPass
    );
  };

  const applyPreset = (presetHost: string, presetPort: number, defaultMode: 'live' | 'simulator') => {
    setHost(presetHost);
    setPort(presetPort);
    setMode(defaultMode);
  };

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Kết Nối Minecraft Thật (Mineflayer)</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('live')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              mode === 'live'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Server Thật
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={() => setMode('simulator')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              mode === 'simulator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sandbox Thử Nghiệm
          </button>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
        <span className="text-slate-500">Mẫu sẵn:</span>
        <button
          type="button"
          onClick={() => applyPreset('kingmc.vn', 25565, 'live')}
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
        >
          KingMC (kingmc.vn)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('127.0.0.1', 25565, 'simulator')}
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
        >
          Sandbox Mặc Định
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleStart} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">IP / Tên miền máy chủ</label>
            <div className="relative">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="kingmc.vn"
                className="w-full bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Cổng (Port)</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              placeholder="25565"
              className="w-full bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Tên tài khoản bot</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ipttdup"
                className="w-full bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Phiên bản (trống = tự dò)</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.20.1"
              className="w-full bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Kiểu đăng nhập</label>
            <select
              value={auth}
              onChange={(e) => setAuth(e.target.value as any)}
              className="w-full bg-[#111827] border border-slate-700/80 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="offline">Offline (server crack / không bản quyền)</option>
              <option value="microsoft">Microsoft (tài khoản bản quyền chính thức)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Mật khẩu tự /login (tùy chọn)</label>
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Tự động gõ /login"
              autoComplete="off"
              className="w-full bg-[#111827] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="submit"
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-emerald-950"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{connected ? 'Khởi Động Lại / Đổi Server' : 'Kết Nối Bot Ngay'}</span>
          </button>

          <button
            type="button"
            onClick={onDisconnect}
            disabled={!connected}
            className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Ngắt Kết Nối</span>
          </button>
        </div>
      </form>
    </div>
  );
};
