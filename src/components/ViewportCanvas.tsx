import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, RotateCcw, Crosshair, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { BotPose, VoxelSnapshot } from '../types/minecraft';

interface ViewportCanvasProps {
  pose: BotPose | null;
  snapshot: VoxelSnapshot | null;
  onSendLook?: (yaw: number, pitch: number) => void;
  onDig?: () => void;
  onPlace?: () => void;
}

const BASE: Array<[number, number, number] | null> = [
  null,
  [150, 150, 155], // 1: Stone
  [134, 96, 67],   // 2: Dirt
  [95, 159, 53],   // 3: Grass
  [219, 207, 163], // 4: Sand
  [102, 81, 51],   // 5: Log
  [162, 130, 78],  // 6: Plank
  [58, 125, 30],   // 7: Leaves
  [50, 90, 220],   // 8: Water
  [250, 120, 20],  // 9: Lava
  [235, 245, 250], // 10: Snow/Ice
  [190, 190, 190], // 11: Other
];

const RAMP = '@#%*+=-:.';
const FACE = [0.85, 1.0, 0.7, 0.5]; // X face, Top face, Z face, Bottom face

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  pose,
  snapshot,
  onSendLook,
  onDig,
  onPlace,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [resolution, setResolution] = useState<'72x25' | '100x34' | '140x48'>('100x34');
  const [followBot, setFollowBot] = useState(true);
  const [syncLook, setSyncLook] = useState(false);
  const [fov, setFov] = useState(80);
  const [fps, setFps] = useState(0);

  // Camera angles
  const camYawRef = useRef(0);
  const camPitchRef = useRef(0);
  const lastLookTime = useRef(0);
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());

  // Quality dimensions
  const [W, H] = resolution.split('x').map(Number);

  // Depth buffer
  const depthBufferRef = useRef<Float32Array>(new Float32Array(100 * 34));

  // Color caching
  const colorCache = useRef<Record<number, string>>({});
  const getColor = (cls: number, face: number, shade: number) => {
    const key = cls * 100 + face * 10 + shade;
    let c = colorCache.current[key];
    if (!c) {
      const b = BASE[cls] || [180, 180, 180];
      const k = FACE[face] * (1 - 0.6 * shade / 7);
      c = `rgb(${Math.round(b[0] * k)},${Math.round(b[1] * k)},${Math.round(b[2] * k)})`;
      colorCache.current[key] = c;
    }
    return c;
  };

  const sendLook = useCallback(
    (yaw: number, pitch: number, force = false) => {
      if (!onSendLook) return;
      const now = Date.now();
      if (!force && now - lastLookTime.current < 80) return;
      lastLookTime.current = now;
      onSendLook(yaw, pitch);
    },
    [onSendLook]
  );

  // Pointer drag for camera look
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    let lx = 0;
    let ly = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;

      setFollowBot(false);
      camYawRef.current -= dx * 0.006;
      camPitchRef.current -= dy * 0.006;
      camPitchRef.current = Math.max(-1.45, Math.min(1.45, camPitchRef.current));

      if (syncLook) {
        sendLook(camYawRef.current, camPitchRef.current, false);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      if (syncLook) {
        sendLook(camYawRef.current, camPitchRef.current, true);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setFov((prev) => Math.max(40, Math.min(110, prev + e.deltaY * 0.05)));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [syncLook, sendLook]);

  // Sync follow bot angle
  useEffect(() => {
    if (followBot && pose) {
      camYawRef.current = pose.yaw;
      camPitchRef.current = pose.pitch;
    }
  }, [followBot, pose]);

  // Main render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth || 640;
      const targetHeight = Math.round(displayWidth * (H / W) * 1.8);

      if (canvas.width !== displayWidth * dpr || canvas.height !== targetHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = targetHeight * dpr;
      }

      const totalChars = W * H;
      if (depthBufferRef.current.length !== totalChars) {
        depthBufferRef.current = new Float32Array(totalChars);
      }
      const depth = depthBufferRef.current;

      const cw = canvas.width / W;
      const ch = canvas.height / H;

      // Dark obsidian background
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!pose || !snapshot) {
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(cw * 1.6)}px "JetBrains Mono", monospace`;
        ctx.fillText('Đang đồng bộ dữ liệu thế giới Minecraft...', canvas.width / 2, canvas.height / 2);
        animId = requestAnimationFrame(render);
        return;
      }

      const curYaw = followBot ? pose.yaw : camYawRef.current;
      const curPitch = followBot ? pose.pitch : camPitchRef.current;

      const sy_ = Math.sin(curYaw);
      const cy_ = Math.cos(curYaw);
      const sp = Math.sin(curPitch);
      const cp = Math.cos(curPitch);

      // Camera view vectors
      const bfx = -sy_ * cp;
      const bfy = sp;
      const bfz = -cy_ * cp;

      const brx = cy_;
      const brz = -sy_;

      const bux = sy_ * sp;
      const buy = cp;
      const buz = cy_ * sp;

      const tanH = Math.tan((fov * Math.PI) / 360);
      const tanV = tanH * (canvas.height / canvas.width);
      const ex = pose.x;
      const ey = pose.y + 1.62; // Eye height
      const ez = pose.z;

      const MAXD = 18;
      const grid = snapshot.data;
      const { ox, oy, oz, sx, sy, sz } = snapshot;

      ctx.font = `bold ${Math.round(cw / 0.58)}px "JetBrains Mono", "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let lastColor = '';

      // Raymarching DDA algorithm across character matrix
      for (let r = 0; r < H; r++) {
        const ny = (1 - ((r + 0.5) / H) * 2) * tanV;
        for (let c = 0; c < W; c++) {
          const nx = (((c + 0.5) / W) * 2 - 1) * tanH;
          let dx = bfx + nx * brx + ny * bux;
          let dy = bfy + ny * buy;
          let dz = bfz + nx * brz + ny * buz;
          const inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);
          dx *= inv;
          dy *= inv;
          dz *= inv;

          // DDA Traversal
          let hitCls = 0;
          let hitT = 0;
          let hitFace = 0;
          let hit = false;

          let x = Math.floor(ex);
          let y = Math.floor(ey);
          let z = Math.floor(ez);
          const stx = dx > 0 ? 1 : -1;
          const sty = dy > 0 ? 1 : -1;
          const stz = dz > 0 ? 1 : -1;

          const tdx = dx !== 0 ? Math.abs(1 / dx) : 1e30;
          const tdy = dy !== 0 ? Math.abs(1 / dy) : 1e30;
          const tdz = dz !== 0 ? Math.abs(1 / dz) : 1e30;

          let tmx = dx > 0 ? (x + 1 - ex) * tdx : (ex - x) * tdx;
          let tmy = dy > 0 ? (y + 1 - ey) * tdy : (ey - y) * tdy;
          let tmz = dz > 0 ? (z + 1 - ez) * tdz : (ez - z) * tdz;

          let t = 0;
          let face = 0;

          for (let step = 0; step < 120; step++) {
            const gx = x - ox;
            const gy = y - oy;
            const gz = z - oz;

            if (gx < 0 || gx >= sx || gy < 0 || gy >= sy || gz < 0 || gz >= sz) break;

            const v = grid[(gy * sz + gz) * sx + gx];
            if (v) {
              hitCls = v;
              hitT = t;
              hitFace = face;
              hit = true;
              break;
            }

            if (tmx < tmy && tmx < tmz) {
              x += stx;
              t = tmx;
              tmx += tdx;
              face = 0;
            } else if (tmy < tmz) {
              y += sty;
              t = tmy;
              tmy += tdy;
              face = dy > 0 ? 3 : 1;
            } else {
              z += stz;
              t = tmz;
              tmz += tdz;
              face = 2;
            }

            if (t > MAXD) break;
          }

          if (hit) {
            depth[r * W + c] = hitT;
            let glyph: string;
            if (hitCls === 8) glyph = '~'; // Water
            else if (hitCls === 9) glyph = '!'; // Lava
            else glyph = RAMP[Math.min(RAMP.length - 1, Math.floor((hitT / MAXD) * RAMP.length))];

            const col = getColor(hitCls, hitFace, Math.min(7, Math.floor((hitT / MAXD) * 8)));
            if (col !== lastColor) {
              ctx.fillStyle = col;
              lastColor = col;
            }
            ctx.fillText(glyph, (c + 0.5) * cw, (r + 0.5) * ch);
          } else {
            depth[r * W + c] = 1e9;
          }
        }
      }

      // Render nearby Entities (Players, Hostile Mobs, Animals)
      if (pose.ents && pose.ents.length > 0) {
        for (const e of pose.ents) {
          const evx = e[0] - ex;
          const evy = e[1] + 0.9 - ey;
          const evz = e[2] - ez;
          const zf = evx * bfx + evy * bfy + evz * bfz;
          if (zf < 0.4) continue;

          const xr = evx * brx + evz * brz;
          const yu = evx * bux + evy * buy + evz * buz;

          const ecol = ((xr / zf / tanH + 1) / 2) * W;
          const erow = ((1 - yu / zf / tanV) / 2) * H;
          const ci = Math.floor(ecol);
          const ri = Math.floor(erow);

          if (ci < 0 || ci >= W || ri < 0 || ri >= H) continue;

          const dist = Math.sqrt(evx * evx + evy * evy + evz * evz);
          if (dist > depth[ri * W + ci] + 0.4) continue; // Occluded by voxel terrain

          const hh = Math.max(1, Math.min(10, Math.round((1.8 / (zf * tanV)) * (H / 2))));
          const ww = Math.max(1, Math.min(6, Math.round((0.6 / (zf * tanH)) * (W / 2))));
          const r0 = Math.round(erow - hh / 2);
          const c0 = Math.round(ecol - ww / 2);

          // Type color
          const entColor = e[3] === 0 ? '#38bdf8' : e[3] === 1 ? '#ef4444' : '#fbbf24';
          const entGlyph = e[3] === 0 ? 'P' : e[3] === 1 ? 'M' : 'm';

          ctx.fillStyle = entColor;
          for (let rr = 0; rr < hh; rr++) {
            for (let cc = 0; cc < ww; cc++) {
              const R2 = r0 + rr;
              const C2 = c0 + cc;
              if (R2 < 0 || R2 >= H || C2 < 0 || C2 >= W) continue;
              ctx.fillText(entGlyph, (C2 + 0.5) * cw, (R2 + 0.5) * ch);
            }
          }

          // Nametag for players
          if (e[3] === 0 && e[4]) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(cw * 1.1)}px "JetBrains Mono", monospace`;
            ctx.fillText(e[4], ecol * cw, (r0 - 0.7) * ch);
            ctx.font = `bold ${Math.round(cw / 0.58)}px "JetBrains Mono", "Courier New", monospace`;
          }
        }
      }

      // HUD Crosshair
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('+', canvas.width / 2, canvas.height / 2);

      // HUD Telemetry
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `500 ${Math.round(cw * 1.3)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#10b981';
      ctx.fillText(
        `${followBot ? 'THEO BOT' : 'CAMERA TỰ DO'} · FOV ${Math.round(fov)}°`,
        cw * 1.5,
        ch * 0.8
      );

      // FPS calculation
      frameCount.current++;
      const now = Date.now();
      if (now - lastFpsTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsTime.current = now;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [W, H, fov, followBot, pose, snapshot]);

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3">
      {/* Viewport Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200">Góc Nhìn 3D Ký Tự</h2>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 font-mono tabular-nums">{fps} FPS</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quality select */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Độ nét:</span>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              className="bg-[#111827] border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="72x25">Thấp (72x25)</option>
              <option value="100x34">Vừa (100x34)</option>
              <option value="140x48">Nét cao (140x48)</option>
            </select>
          </div>

          {/* Sync Look Toggle */}
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncLook}
              onChange={(e) => setSyncLook(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span>Bot nhìn theo chuột</span>
          </label>

          {/* Follow Bot Button */}
          <button
            onClick={() => setFollowBot(true)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              followBot
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Theo Bot</span>
          </button>

          {/* FOV Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFov((f) => Math.max(40, f - 10))}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Phóng to (Giảm FOV)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFov((f) => Math.min(110, f + 10))}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Thu nhỏ (Tăng FOV)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Dig & Place Buttons */}
          {onDig && (
            <button
              onClick={onDig}
              className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Đào block trước mặt"
            >
              <span>⛏️ Đào</span>
            </button>
          )}

          {onPlace && (
            <button
              onClick={onPlace}
              className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Đặt block đang cầm"
            >
              <span>🧱 Đặt</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Element with Pointer Capture */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800/80 bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block select-none cursor-grab active:cursor-grabbing touch-none"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded pointer-events-none">
          <span>Kéo chuột để xoay góc nhìn · Lăn chuột để chỉnh FOV</span>
          <span className="font-mono text-emerald-400">Raymarching Voxel DDA</span>
        </div>
      </div>
    </div>
  );
};
