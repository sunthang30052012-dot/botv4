import React, { useRef, useEffect } from 'react';
import { Compass, Users, Skull, Dog } from 'lucide-react';
import type { BotPose, VoxelSnapshot } from '../types/minecraft';

interface RadarCanvasProps {
  pose: BotPose | null;
  snapshot: VoxelSnapshot | null;
  camYaw?: number;
}

const RR = 11; // 23 x 23 radar matrix
const GLY = [' ', '=', ',', '.', ':', '|', '+', '%', '~', '!', '*', '#'];
const BASE_COLORS: Record<number, string> = {
  1: '#94a3b8', // Stone
  2: '#855938', // Dirt
  3: '#5f9f35', // Grass
  4: '#dbcfa3', // Sand
  5: '#665133', // Log
  6: '#a2824e', // Plank
  7: '#3a7d1e', // Leaves
  8: '#325adc', // Water
  9: '#fa7814', // Lava
  10: '#ebf5fa', // Snow
  11: '#bebebe', // Other
};

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  pose,
  snapshot,
  camYaw = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth || 320;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayWidth * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayWidth * dpr;
      }

      const N = RR * 2 + 1;
      const cell = canvas.width / N;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!pose || !snapshot) {
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(cell * 0.9)}px "JetBrains Mono", monospace`;
        ctx.fillText('Chưa có dữ liệu radar', canvas.width / 2, canvas.height / 2);
        animId = requestAnimationFrame(render);
        return;
      }

      const cyv = Math.cos(camYaw || pose.yaw);
      const syv = Math.sin(camYaw || pose.yaw);
      const by = Math.floor(pose.y) - snapshot.oy;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(cell * 0.85)}px "JetBrains Mono", monospace`;

      // 1. Draw Terrain Grid from Voxel Snapshot
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const u = i - RR;
          const v = RR - j; // u: right, v: forward

          const wx = Math.floor(pose.x + u * cyv - v * syv) - snapshot.ox;
          const wz = Math.floor(pose.z - u * syv - v * cyv) - snapshot.oz;

          if (wx < 0 || wx >= snapshot.sx || wz < 0 || wz >= snapshot.sz) continue;

          let cls = 0;
          let dyv = 0;
          for (let gy = Math.min(snapshot.sy - 1, by + 3); gy >= Math.max(0, by - 4); gy--) {
            const q = snapshot.data[(gy * snapshot.sz + wz) * snapshot.sx + wx];
            if (q) {
              cls = q;
              dyv = gy - by;
              break;
            }
          }

          if (!cls) continue;

          const isWall = dyv >= 1 && cls !== 8;
          ctx.fillStyle = BASE_COLORS[cls] ? `${BASE_COLORS[cls]}44` : 'rgba(255,255,255,0.06)';
          ctx.fillRect(i * cell, j * cell, cell, cell);

          ctx.fillStyle = isWall ? '#ffffff' : (BASE_COLORS[cls] || '#64748b');
          ctx.fillText(isWall ? '#' : (GLY[cls] || '.'), (i + 0.5) * cell, (j + 0.5) * cell);
        }
      }

      // 2. Range Rings
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, cell * 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, cell * 9, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Draw Mobs and Players
      if (pose.ents && pose.ents.length > 0) {
        for (const e of pose.ents) {
          const ddx = e[0] - pose.x;
          const ddz = e[2] - pose.z;
          const u = ddx * cyv - ddz * syv;
          const v = -ddx * syv - ddz * cyv;
          const i = RR + Math.round(u);
          const j = RR - Math.round(v);

          if (i < 0 || i >= N || j < 0 || j >= N) continue;

          const color = e[3] === 0 ? '#38bdf8' : e[3] === 1 ? '#ef4444' : '#fbbf24';
          const symbol = e[3] === 0 ? 'P' : e[3] === 1 ? 'M' : 'm';

          ctx.fillStyle = color;
          ctx.fillRect(i * cell + 1, j * cell + 1, cell - 2, cell - 2);
          ctx.fillStyle = '#000000';
          ctx.fillText(symbol, (i + 0.5) * cell, (j + 0.5) * cell);
        }
      }

      // 4. Bot in Center
      ctx.fillStyle = '#10b981';
      ctx.fillRect(RR * cell, RR * cell, cell, cell);
      ctx.fillStyle = '#000000';
      ctx.fillText('@', (RR + 0.5) * cell, (RR + 0.5) * cell);

      // 5. Compass Directions (N, S, E, W)
      const currentAngle = camYaw || pose.yaw;
      const compassRadius = (canvas.width / 2) - 14;

      const directions = [
        { label: 'N', angle: 0, color: '#ef4444' }, // North in red
        { label: 'E', angle: Math.PI / 2, color: '#94a3b8' },
        { label: 'S', angle: Math.PI, color: '#94a3b8' },
        { label: 'W', angle: (3 * Math.PI) / 2, color: '#94a3b8' },
      ];

      for (const dir of directions) {
        const relAngle = dir.angle - currentAngle - Math.PI / 2;
        const cx = canvas.width / 2 + Math.cos(relAngle) * compassRadius;
        const cy = canvas.height / 2 + Math.sin(relAngle) * compassRadius;
        ctx.fillStyle = dir.color;
        ctx.font = `bold ${Math.round(cell * 0.9)}px "JetBrains Mono", monospace`;
        ctx.fillText(dir.label, cx, cy);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [pose, snapshot, camYaw]);

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Radar 2D Xoay 360°</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="text-emerald-400">@ Bot</span>
          <span>·</span>
          <span className="text-sky-400">P Người</span>
          <span>·</span>
          <span className="text-rose-400">M Quái</span>
          <span>·</span>
          <span className="text-amber-400">m Thú</span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-800/80 bg-black flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          className="w-full max-w-[340px] aspect-square block select-none"
        />
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-between">
        <span>Bán kính quét: 11 blocks xung quanh</span>
        <span className="font-mono text-emerald-400">N: Hướng Bắc</span>
      </div>
    </div>
  );
};
