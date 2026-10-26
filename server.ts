import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { Vec3 } from 'vec3';
import {
  takeSnapshot,
  getPose,
  generateSimulatedSnapshot,
  getSimulatedPose,
  getSimulatedInventory,
} from './src/server/screens.ts';
import type { BotConfig } from './src/types/minecraft.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.json());

const FPS = 27;

const config: BotConfig = {
  host: 'kingmc.vn',
  port: 25565,
  username: 'ipttdup',
  version: '1.20.1',
  auth: 'offline',
  mode: 'live', // Default to REAL Minecraft server with Mineflayer
};

let loginPass = '';
let bot: any = null;
let currentMode: 'live' | 'simulator' = 'live';
let isConnected = false;
let botStatus = 'Đang kết nối tới máy chủ Minecraft thật...';
let currentXYZ = 'X: 0 | Y: 0 | Z: 0';
let isRandomMoving = false;
let lastSnap: any = null;

// Simulator state
let simPos = { x: 128.5, y: 65.0, z: 256.5 };
let simYaw = 0;
let simPitch = 0;
let simTick = 0;
let simInterval: NodeJS.Timeout | null = null;

// Mineflayer intervals
let farmInterval: NodeJS.Timeout | null = null;
let randomMoveInterval: NodeJS.Timeout | null = null;
let xyzInterval: NodeJS.Timeout | null = null;
let poseInterval: NodeJS.Timeout | null = null;
let snapInterval: NodeJS.Timeout | null = null;
const moveTimers: Record<string, NodeJS.Timeout> = {};

function clearAllIntervals() {
  if (farmInterval) clearInterval(farmInterval);
  if (randomMoveInterval) clearInterval(randomMoveInterval);
  if (xyzInterval) clearInterval(xyzInterval);
  if (poseInterval) clearInterval(poseInterval);
  if (snapInterval) clearInterval(snapInterval);
  if (simInterval) clearInterval(simInterval);
  farmInterval = null;
  randomMoveInterval = null;
  xyzInterval = null;
  poseInterval = null;
  snapInterval = null;
  simInterval = null;
}

// ------------------- SIMULATOR ENGINE -------------------
function startSimulator() {
  clearAllIntervals();
  currentMode = 'simulator';
  isConnected = true;
  botStatus = 'Đang chạy giả lập thế giới Minecraft (Sandbox)';
  currentXYZ = `X: ${Math.round(simPos.x)} | Y: ${Math.round(simPos.y)} | Z: ${Math.round(simPos.z)}`;

  // Emit initial snapshot
  lastSnap = generateSimulatedSnapshot(simPos);
  io.emit('snap', lastSnap);
  io.emit('inventoryUpdate', getSimulatedInventory());
  io.emit('minecraftChat', '§a[HỆ THỐNG] Đã khởi động máy giả lập môi trường Minecraft Sandbox!');
  io.emit('minecraftChat', '§e[SERVER] Chào mừng ' + config.username + ' gia nhập máy chủ KingMC!');
  io.emit('minecraftChat', '§b[KingSMP] Vui lòng sử dụng Đồng Hồ ở slot 4 để mở bảng chọn cụm server.');

  // High-frequency pose stream (27 FPS)
  simInterval = setInterval(() => {
    simTick++;
    if (isRandomMoving && simTick % 50 === 0) {
      simYaw += (Math.random() - 0.5) * 0.8;
      simPitch = Math.max(-1.4, Math.min(1.4, simPitch + (Math.random() - 0.5) * 0.4));
      const spd = 0.35;
      simPos.x += -Math.sin(simYaw) * spd;
      simPos.z += -Math.cos(simYaw) * spd;
    }

    const pose = getSimulatedPose(simPos, simYaw, simPitch, simTick);
    io.volatile.emit('pose', pose);

    // Refresh block snapshot every 20 ticks
    if (simTick % 20 === 0) {
      lastSnap = generateSimulatedSnapshot(simPos);
      io.emit('snap', lastSnap);
      currentXYZ = `X: ${Math.round(simPos.x)} | Y: ${Math.round(simPos.y)} | Z: ${Math.round(simPos.z)}`;
    }
  }, Math.round(1000 / FPS));
}

// ------------------- MINEFLAYER ENGINE -------------------
async function startRealBot() {
  clearAllIntervals();
  currentMode = 'live';
  botStatus = `Đang kết nối vào ${config.host}:${config.port} ...`;
  isConnected = false;

  io.emit('statusUpdate', {
    status: botStatus,
    xyz: currentXYZ,
    isRandomMoving,
    connected: false,
    mode: 'live',
  });
  io.emit('minecraftChat', `§6[KẾT NỐI] Đang bắt đầu Mineflayer kết nối ${config.host}:${config.port}...`);

  let mineflayer: any;
  try {
    const mf = await import('mineflayer');
    mineflayer = mf.default || mf;
  } catch (err: any) {
    botStatus = 'Không tải được thư viện mineflayer: ' + err.message;
    io.emit('minecraftChat', '§c[LỖI] ' + botStatus);
    return;
  }

  const opts: any = {
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth,
  };

  if (config.version) opts.version = config.version;
  if (config.auth === 'microsoft') {
    opts.profilesFolder = './auth-cache';
    opts.onMsaCode = (data: any) => {
      botStatus = 'Chờ xác thực Microsoft Code: ' + data.user_code;
      io.emit('minecraftChat', '§b[MICROSOFT] ' + data.message);
    };
  }

  let b: any;
  try {
    b = mineflayer.createBot(opts);
  } catch (e: any) {
    botStatus = 'Lỗi tạo bot: ' + e.message;
    io.emit('minecraftChat', '§c[LỖI] ' + botStatus);
    return;
  }

  bot = b;

  b.on('connect', () => {
    if (bot !== b) return;
    botStatus = `Đã thông kết nối tới ${config.host}:${config.port}. Đang thực hiện Handshake...`;
    io.emit('minecraftChat', `§a[KẾT NỐI] Đã kết nối TCP tới ${config.host}:${config.port}`);
  });

  b.on('login', () => {
    if (bot !== b) return;
    isConnected = true;
    botStatus = 'Đang ở Sảnh chờ Lobby (Hãy gõ lệnh đăng nhập)';
    io.emit('minecraftChat', '§a[BOT] Đã đăng nhập vào lobby máy chủ!');
  });

  b.on('spawn', () => {
    if (bot !== b) return;
    clearAllIntervals();
    isConnected = true;
    botStatus = 'Đã xuất hiện trong game Minecraft thật!';
    io.emit('minecraftChat', '§a[BOT] Nhân vật đã spawn trong thế giới game thật!');

    const sendRealInventory = () => {
      if (!b || !b.inventory) return;
      try {
        const items: any[] = [];
        for (const it of b.inventory.items()) {
          items.push({
            slot: it.slot,
            name: it.name,
            count: it.count,
            displayName: it.displayName || it.name,
          });
        }
        io.emit('inventoryUpdate', items);
      } catch (e) {}
    };

    sendRealInventory();
    try {
      b.inventory?.on?.('windowUpdate', sendRealInventory);
      b.on('playerCollect', sendRealInventory);
    } catch (e) {}

    // Auto /login if password provided
    if (loginPass && !b._autoLoginDone) {
      b._autoLoginDone = true;
      setTimeout(() => {
        if (bot === b) {
          b.chat('/login ' + loginPass);
          io.emit('minecraftChat', '§7[TỰ ĐỘNG] Đã gửi lệnh /login ********');
        }
      }, 2500);
    }

    xyzInterval = setInterval(() => {
      if (bot === b && b.entity && b.entity.position) {
        const pos = b.entity.position;
        currentXYZ = `X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)}`;
        if (Math.round(pos.z) > 40 || Math.round(pos.x) > 10) {
          botStatus = 'Đã vào thế giới chính cụm KingSMP thành công! 🎉';
        }
      }
    }, 1000);

    poseInterval = setInterval(() => {
      if (bot !== b || io.engine.clientsCount === 0) return;
      const pose = getPose(b);
      if (pose) io.volatile.emit('pose', pose);
    }, Math.round(1000 / FPS));

    snapInterval = setInterval(() => {
      if (!bot || io.engine.clientsCount === 0) return;
      try {
        const s = takeSnapshot(bot);
        if (!s) return;
        lastSnap = s;
        io.emit('snap', s);
      } catch (e) {
        // ignore
      }
    }, 500);

    farmInterval = setInterval(() => {
      if (bot === b && b.entity && b.nearestEntity) {
        const target = b.nearestEntity((entity: any) => entity.type === 'mob');
        if (target && b.attack) b.attack(target);
      }
    }, 1000);
  });

  b.on('message', (jsonMsg: any) => {
    io.emit('minecraftChat', jsonMsg.toString());
  });

  b.on('kicked', (reason: any) => {
    const msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
    io.emit('minecraftChat', '§c[KICK] ' + msg);
    botStatus = 'Bot bị kick khỏi server: ' + msg;
  });

  b.on('windowOpen', () => {
    if (bot === b) {
      botStatus = 'Menu Đồng hồ đã mở! Sẵn sàng click ô 24.';
      io.emit('minecraftChat', '§e[MENU] Đã phát hiện giao diện Chest Menu mở ra.');
    }
  });

  b.on('error', (err: any) => {
    if (bot === b) {
      botStatus = 'Lỗi kết nối bot: ' + err.message;
      io.emit('minecraftChat', '§c[LỖI BOT] ' + err.message);
    }
  });

  b.on('end', () => {
    if (bot !== b) return;
    bot = null;
    isConnected = false;
    isRandomMoving = false;
    clearAllIntervals();
    lastSnap = null;
    botStatus = 'Bot đã ngắt kết nối.';
    io.emit('botOff');
    io.emit('minecraftChat', '§7[BOT] Phiên kết nối bot đã kết thúc.');
  });
}

function stopBot() {
  clearAllIntervals();
  isRandomMoving = false;
  isConnected = false;

  if (bot) {
    const old = bot;
    bot = null;
    try {
      old.quit();
    } catch (e) {}
    try {
      old.end();
    } catch (e) {}
  }
  lastSnap = null;
  botStatus = 'Bot đã ngắt kết nối.';
  io.emit('botOff');
  io.emit('statusUpdate', {
    status: botStatus,
    xyz: currentXYZ,
    isRandomMoving: false,
    connected: false,
    mode: currentMode,
  });
}

// ------------------- SOCKET.IO BROADCASTS -------------------
io.on('connection', (socket) => {
  socket.emit('statusUpdate', {
    status: botStatus,
    xyz: currentXYZ,
    isRandomMoving,
    connected: isConnected,
    mode: currentMode,
    config,
  });
  if (lastSnap) socket.emit('snap', lastSnap);
  if (currentMode === 'simulator') {
    socket.emit('inventoryUpdate', getSimulatedInventory());
  }
});

setInterval(() => {
  io.emit('statusUpdate', {
    status: botStatus,
    xyz: currentXYZ,
    isRandomMoving,
    connected: isConnected,
    mode: currentMode,
    config,
  });
}, 1500);

// ------------------- REST API ENDPOINTS -------------------

app.get('/api/status', (req, res) => {
  res.json({
    status: botStatus,
    xyz: currentXYZ,
    isRandomMoving,
    connected: isConnected,
    mode: currentMode,
    config,
  });
});

app.post('/api/start', (req, res) => {
  const body = req.body || {};
  let host = String(body.host || '').trim();
  const m = host.match(/^(.+):(\d+)$/);
  let port = parseInt(body.port, 10);
  if (m) {
    host = m[1];
    port = parseInt(m[2], 10);
  }
  if (host) config.host = host;
  config.port = port > 0 && port < 65536 ? port : 25565;
  const username = String(body.username || '').trim();
  if (username) config.username = username;
  config.version = String(body.version || '').trim();
  config.auth = body.auth === 'microsoft' ? 'microsoft' : 'offline';
  loginPass = String(body.loginPass || '');
  const targetMode = body.mode === 'live' ? 'live' : 'simulator';
  config.mode = targetMode;

  if (targetMode === 'simulator') {
    if (bot) stopBot();
    startSimulator();
  } else {
    if (bot) stopBot();
    setTimeout(startRealBot, 1000);
  }

  res.json({ success: true, mode: targetMode });
});

app.post('/api/stop', (req, res) => {
  stopBot();
  res.json({ success: true });
});

app.post('/api/chat', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.sendStatus(400);

  if (currentMode === 'live' && bot) {
    bot.chat(text);
  } else {
    // Simulator echo & mock commands
    io.emit('minecraftChat', `<${config.username}> ${text}`);
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      if (cmd === '/tpaccept') {
        setTimeout(() => {
          io.emit('minecraftChat', '§a[DỊCH CHUYỂN] Đã chấp nhận yêu cầu dịch chuyển thành công!');
        }, 500);
      } else if (cmd === '/login') {
        setTimeout(() => {
          io.emit('minecraftChat', '§a[XÁC THỰC] Đăng nhập thành công! Chúc bạn chơi game vui vẻ.');
        }, 600);
      } else if (cmd === '/spawn' || cmd === '/hub') {
        setTimeout(() => {
          simPos = { x: 0.5, y: 64.0, z: 0.5 };
          io.emit('minecraftChat', '§6[WARP] Đã dịch chuyển về Spawn an toàn.');
        }, 800);
      } else {
        setTimeout(() => {
          io.emit('minecraftChat', `§7[HỆ THỐNG] Đã thực thi lệnh ${cmd}`);
        }, 400);
      }
    }
  }
  res.json({ success: true });
});

app.post('/api/tpaccept', (req, res) => {
  if (currentMode === 'live' && bot) {
    bot.chat('/tpaccept');
  } else {
    io.emit('minecraftChat', `<${config.username}> /tpaccept`);
    io.emit('minecraftChat', '§a[DỊCH CHUYỂN] Đã tự động chấp nhận yêu cầu /tpaccept!');
  }
  res.json({ success: true });
});

app.post('/api/look', (req, res) => {
  const yaw = Number(req.body?.yaw);
  const pitch = Number(req.body?.pitch);

  if (isFinite(yaw) && isFinite(pitch)) {
    if (currentMode === 'live' && bot && bot.entity) {
      bot.look(yaw, Math.max(-1.5, Math.min(1.5, pitch)), true).catch(() => {});
    } else {
      simYaw = yaw;
      simPitch = Math.max(-1.5, Math.min(1.5, pitch));
    }
  }
  res.json({ success: true });
});

app.post('/api/move', (req, res) => {
  const dir = String(req.body?.dir || '');
  if (['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint'].includes(dir)) {
    if (currentMode === 'live' && bot && bot.entity) {
      clearTimeout(moveTimers[dir]);
      bot.setControlState(dir, true);
      moveTimers[dir] = setTimeout(() => {
        if (bot) bot.setControlState(dir, false);
      }, dir === 'jump' ? 400 : 500);
    } else {
      // Simulator physics step
      const step = 0.8;
      if (dir === 'forward') {
        simPos.x += -Math.sin(simYaw) * step;
        simPos.z += -Math.cos(simYaw) * step;
      } else if (dir === 'back') {
        simPos.x += Math.sin(simYaw) * step;
        simPos.z += Math.cos(simYaw) * step;
      } else if (dir === 'left') {
        simPos.x += -Math.cos(simYaw) * step;
        simPos.z += Math.sin(simYaw) * step;
      } else if (dir === 'right') {
        simPos.x += Math.cos(simYaw) * step;
        simPos.z += -Math.sin(simYaw) * step;
      } else if (dir === 'jump') {
        simPos.y = Math.min(80, simPos.y + 1);
        setTimeout(() => {
          simPos.y = Math.max(64, simPos.y - 1);
        }, 350);
      }
    }
  }
  res.json({ success: true });
});

app.post('/api/toggle-random', (req, res) => {
  isRandomMoving = !isRandomMoving;

  if (currentMode === 'live' && bot) {
    clearInterval(randomMoveInterval!);
    if (isRandomMoving) {
      randomMoveInterval = setInterval(() => {
        if (bot && bot.entity) {
          const yaw = Math.random() * 360 * (Math.PI / 180);
          const pitch = (Math.random() * 40 - 20) * (Math.PI / 180);
          bot.look(yaw, pitch, true);
          const moves = ['forward', 'back', 'left', 'right', 'jump'];
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          bot.setControlState(randomMove, true);
          setTimeout(() => {
            if (bot) bot.setControlState(randomMove, false);
          }, 400);
        }
      }, 4000);
    }
  } else {
    io.emit(
      'minecraftChat',
      isRandomMoving
        ? '§b[ANTI-AFK] Chế độ chạy tự do ngẫu nhiên ĐÃ BẬT'
        : '§7[ANTI-AFK] Chế độ chạy tự do ngẫu nhiên ĐÃ TẮT'
    );
  }

  res.json({ success: true, isRandomMoving });
});

app.post('/api/open-menu', (req, res) => {
  if (currentMode === 'live' && bot) {
    bot.setQuickBarSlot(4);
    setTimeout(() => {
      if (bot) bot.activateItem();
    }, 1000);
  } else {
    io.emit('minecraftChat', '§e[MENU] Bot đã chọn ô slot 4 (Đồng Hồ) và kích hoạt mở Menu Máy Chủ!');
    botStatus = 'Menu Đồng hồ đã mở! Sẵn sàng click ô 24 KingSMP.';
  }
  res.json({ success: true });
});

app.post('/api/click-kingsmp', (req, res) => {
  if (currentMode === 'live' && bot) {
    bot.clickWindow(24, 0, 0).catch((e: any) => console.log(e.message));
  } else {
    io.emit('minecraftChat', '§a[VƯỢT ẢI] Bot đã nhấn vào Ô 24 (Cụm KingSMP Survival)! Đang chuyển cụm...');
    setTimeout(() => {
      botStatus = 'Đã vào thế giới chính cụm KingSMP thành công! 🎉';
      io.emit('minecraftChat', '§6[KingSMP] Chào mừng bạn đã vào cụm KingSMP Thành Công!');
    }, 1200);
  }
  res.json({ success: true });
});

app.post('/api/inventory/select', (req, res) => {
  const slot = Number(req.body?.slot);
  if (slot >= 0 && slot <= 8) {
    if (currentMode === 'live' && bot && bot.setQuickBarSlot) {
      bot.setQuickBarSlot(slot);
    }
  }
  res.json({ success: true, slot });
});

// Use / eat currently held item (food)
app.post('/api/inventory/consume', async (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      io.emit('minecraftChat', '§6[HÀNH ĐỘNG] Đang ăn/sử dụng vật phẩm trên tay...');
      await bot.consume();
      io.emit('minecraftChat', '§a[HÀNH ĐỘNG] Đã ăn xong vật phẩm!');
      res.json({ success: true });
    } catch (e: any) {
      io.emit('minecraftChat', `§c[LỖI ĂN] ${e.message}`);
      res.status(400).json({ success: false, message: e.message });
    }
  } else {
    io.emit('minecraftChat', '§a[SANDBOX] Đã ăn 1 món thức ăn (Hồi phục độ no)!');
    res.json({ success: true });
  }
});

// Activate / right-click item (e.g. clock for KingSMP menu, ender pearl, shield)
app.post('/api/inventory/activate', (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      bot.activateItem();
      io.emit('minecraftChat', '§b[HÀNH ĐỘNG] Đã kích hoạt chuột phải vật phẩm đang cầm!');
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  } else {
    io.emit('minecraftChat', '§b[SANDBOX] Đã kích hoạt vật phẩm đang cầm!');
    res.json({ success: true });
  }
});

// Drop / Toss item from slot
app.post('/api/inventory/toss', async (req, res) => {
  const slot = Number(req.body?.slot);
  const count = Number(req.body?.count) || null;

  if (currentMode === 'live' && bot && bot.inventory) {
    try {
      const item = bot.inventory.slots[slot];
      if (!item) {
        return res.status(400).json({ success: false, message: 'Ô này không có vật phẩm.' });
      }
      if (count && count < item.count) {
        await bot.toss(item.type, null, count);
      } else {
        await bot.tossStack(item);
      }
      io.emit('minecraftChat', `§7[KHO ĐỒ] Đã vứt bỏ ${item.displayName || item.name} ra ngoài.`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  } else {
    io.emit('minecraftChat', `§7[SANDBOX] Đã vứt vật phẩm tại ô ${slot}`);
    res.json({ success: true });
  }
});

// Equip item (hand, head, torso, legs, feet, off-hand)
app.post('/api/inventory/equip', async (req, res) => {
  const slot = Number(req.body?.slot);
  const destination = String(req.body?.destination || 'hand');

  if (currentMode === 'live' && bot && bot.inventory) {
    try {
      const item = bot.inventory.slots[slot];
      if (!item) {
        return res.status(400).json({ success: false, message: 'Ô này không có vật phẩm.' });
      }
      await bot.equip(item, destination as any);
      io.emit('minecraftChat', `§a[TRANG BỊ] Đã trang bị ${item.displayName || item.name} vào ${destination}!`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  } else {
    io.emit('minecraftChat', `§a[SANDBOX] Đã trang bị vật phẩm vào ${destination}`);
    res.json({ success: true });
  }
});

// Move / swap item between two slots
app.post('/api/inventory/move', async (req, res) => {
  const sourceSlot = Number(req.body?.sourceSlot);
  const destSlot = Number(req.body?.destSlot);

  if (currentMode === 'live' && bot && bot.moveSlotItem) {
    try {
      await bot.moveSlotItem(sourceSlot, destSlot);
      io.emit('minecraftChat', `§7[KHO ĐỒ] Đã chuyển vật phẩm từ ô ${sourceSlot} sang ô ${destSlot}.`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  } else {
    io.emit('minecraftChat', `§7[SANDBOX] Đã đổi chỗ ô ${sourceSlot} và ${destSlot}`);
    res.json({ success: true });
  }
});

// ------------------- BLOCK MINING & PLACING API -------------------

// Dig block in front (at cursor or in raycast view)
app.post('/api/block/dig', async (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      let targetBlock = bot.blockAtCursor ? bot.blockAtCursor(4.5) : null;

      if (!targetBlock && bot.entity) {
        const p = bot.entity.position;
        const yaw = bot.entity.yaw;
        const pitch = bot.entity.pitch;

        for (let d = 1.2; d <= 4.5; d += 0.5) {
          const tx = Math.floor(p.x - Math.sin(yaw) * Math.cos(pitch) * d);
          const ty = Math.floor(p.y + 1.62 + Math.sin(pitch) * d);
          const tz = Math.floor(p.z - Math.cos(yaw) * Math.cos(pitch) * d);
          const b = bot.blockAt(new Vec3(tx, ty, tz));
          if (b && b.name !== 'air' && b.name !== 'water' && b.name !== 'lava') {
            targetBlock = b;
            break;
          }
        }
      }

      if (!targetBlock) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy block nào trước mặt để đào.' });
      }

      if (!bot.canDigBlock(targetBlock)) {
        return res.status(400).json({ success: false, message: `Block ${targetBlock.name} không thể đào được.` });
      }

      io.emit('minecraftChat', `§e[ĐÀO BLOCK] Đang đào block ${targetBlock.displayName || targetBlock.name} tại (${targetBlock.position.x}, ${targetBlock.position.y}, ${targetBlock.position.z})...`);
      
      await bot.dig(targetBlock, true);
      io.emit('minecraftChat', `§a[ĐÀO BLOCK] Đã phá vỡ block ${targetBlock.displayName || targetBlock.name} thành công!`);
      res.json({ success: true, block: targetBlock.name });
    } catch (err: any) {
      io.emit('minecraftChat', `§c[LỖI ĐÀO] ${err.message}`);
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    // Simulator dig
    const frontX = Math.floor(simPos.x - Math.sin(simYaw) * 2);
    const frontY = Math.floor(simPos.y);
    const frontZ = Math.floor(simPos.z - Math.cos(simYaw) * 2);
    io.emit('minecraftChat', `§a[SANDBOX ĐÀO] Đã đào vỡ block trước mặt tại (${frontX}, ${frontY}, ${frontZ})!`);
    res.json({ success: true });
  }
});

// Dig block directly under feet
app.post('/api/block/dig-down', async (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      const p = bot.entity.position;
      const targetPos = new Vec3(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z));
      const targetBlock = bot.blockAt(targetPos);
      if (!targetBlock || targetBlock.name === 'air') {
        return res.status(400).json({ success: false, message: 'Dưới chân không có block cứng nào.' });
      }
      if (!bot.canDigBlock(targetBlock)) {
        return res.status(400).json({ success: false, message: `Block ${targetBlock.name} dưới chân không thể đào.` });
      }
      io.emit('minecraftChat', `§e[ĐÀO BLOCK] Đang đào block dưới chân (${targetBlock.displayName || targetBlock.name})...`);
      await bot.dig(targetBlock, true);
      io.emit('minecraftChat', '§a[ĐÀO BLOCK] Đã đào xong block dưới chân!');
      res.json({ success: true, block: targetBlock.name });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    io.emit('minecraftChat', '§a[SANDBOX ĐÀO] Đã đào 1 block dưới chân!');
    res.json({ success: true });
  }
});

// Stop digging
app.post('/api/block/stop-dig', (req, res) => {
  if (currentMode === 'live' && bot && bot.stopDigging) {
    bot.stopDigging();
  }
  res.json({ success: true });
});

// Place block in front
app.post('/api/block/place', async (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      const p = bot.entity.position;
      const yaw = bot.entity.yaw;

      const fx = Math.floor(p.x - Math.sin(yaw) * 1.5);
      const fy = Math.floor(p.y);
      const fz = Math.floor(p.z - Math.cos(yaw) * 1.5);

      let refBlock = bot.blockAt(new Vec3(fx, fy - 1, fz));
      let face = new Vec3(0, 1, 0);

      if (!refBlock || refBlock.name === 'air') {
        refBlock = bot.blockAt(new Vec3(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z)));
      }

      if (!refBlock || refBlock.name === 'air') {
        return res.status(400).json({ success: false, message: 'Không tìm thấy block điểm tựa để đặt.' });
      }

      // Check if held item is a placeable block
      let held = bot.heldItem;
      if (!held || !held.name || held.name.includes('sword') || held.name.includes('pickaxe') || held.name.includes('apple')) {
        const blockItem = bot.inventory.items().find((it: any) =>
          it.name.includes('plank') || it.name.includes('dirt') || it.name.includes('stone') ||
          it.name.includes('cobble') || it.name.includes('wood') || it.name.includes('sand')
        );
        if (blockItem) {
          await bot.equip(blockItem, 'hand');
          held = bot.heldItem;
        }
      }

      await bot.placeBlock(refBlock, face);
      io.emit('minecraftChat', `§a[ĐẶT BLOCK] Đã đặt block ${held?.displayName || held?.name || 'mới'} trước mặt!`);
      res.json({ success: true });
    } catch (err: any) {
      io.emit('minecraftChat', `§c[LỖI ĐẶT BLOCK] ${err.message}`);
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    io.emit('minecraftChat', '§a[SANDBOX ĐẶT] Đã đặt block mới thành công!');
    res.json({ success: true });
  }
});

// Pillar up (jump and place block below feet)
app.post('/api/block/pillar', async (req, res) => {
  if (currentMode === 'live' && bot) {
    if (!bot.entity) {
      return res.status(400).json({ success: false, message: 'Bot chưa vào game hoặc chưa xuất hiện.' });
    }
    try {
      const p = bot.entity.position;
      const refBlock = bot.blockAt(new Vec3(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z)));
      if (!refBlock || refBlock.name === 'air') {
        return res.status(400).json({ success: false, message: 'Không có block điểm tựa dưới chân.' });
      }

      bot.setControlState('jump', true);
      setTimeout(async () => {
        try {
          await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
          bot.setControlState('jump', false);
          io.emit('minecraftChat', '§a[XÂY CỘT] Đã nhảy lên và đặt block dưới chân thành công!');
        } catch (e: any) {
          bot.setControlState('jump', false);
        }
      }, 250);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    simPos.y += 1;
    io.emit('minecraftChat', '§a[SANDBOX XÂY CỘT] Đã nhảy lên và đặt block dưới chân!');
    res.json({ success: true });
  }
});

// Start real Minecraft bot with Mineflayer immediately on boot
startRealBot();

// ------------------- DEV MIDDLEWARE OR STATIC SERVING -------------------
async function startServer() {
  // Support both AI Studio dev environment (port 3000) and external production platforms like Render
  const isRender = !!process.env.RENDER || !!process.env.RENDER_SERVICE_ID;
  const isProd = process.env.NODE_ENV === 'production';
  const customPort = process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : null;
  const PORT = (isRender || isProd) && customPort ? customPort : 3000;

  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');

  if (isProd) {
    // If dist/index.html is missing (e.g. build step was omitted in Render build command), build it automatically!
    if (!fs.existsSync(distIndex)) {
      console.log('[AUTO-BUILD] dist/index.html not found in production. Automatically running Vite build...');
      try {
        execSync('npx vite build', { stdio: 'inherit' });
        console.log('[AUTO-BUILD] Vite build completed successfully.');
      } catch (buildErr: any) {
        console.error('[AUTO-BUILD FAILED]', buildErr?.message);
      }
    }

    if (fs.existsSync(distIndex)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(distIndex);
      });
    } else {
      // Graceful fallback to on-the-fly Vite middleware so server never crashes with ENOENT
      console.log('[FALLBACK] dist/index.html missing; falling back to dynamic Vite middleware');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Minecraft Bot Control Panel server listening on port ${PORT}`);
  });
}

startServer();
