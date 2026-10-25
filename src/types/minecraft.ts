export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version: string;
  auth: 'offline' | 'microsoft';
  loginPass?: string;
  mode: 'live' | 'simulator';
}

export interface BotPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health?: number;
  food?: number;
  foodSaturation?: number;
  xpLevel?: number;
  xpProgress?: number;
  ents: Array<[number, number, number, number, string]>; // [x, y, z, type (0: player, 1: hostile, 2: passive), name]
}

export interface VoxelSnapshot {
  ox: number;
  oy: number;
  oz: number;
  sx: number;
  sy: number;
  sz: number;
  data: number[] | Uint8Array;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  text: string;
  type: 'player' | 'system' | 'command' | 'microsoft' | 'error';
  sender?: string;
}

export interface InventoryItem {
  slot: number;
  name: string;
  count: number;
  displayName: string;
  category?: 'weapon' | 'tool' | 'armor' | 'food' | 'block' | 'misc';
  durability?: number; // 0-100 percentage
}

export interface BotState {
  status: string;
  currentXYZ: string;
  isRandomMoving: boolean;
  connected: boolean;
  mode: 'live' | 'simulator';
  config: BotConfig;
  pose: BotPose;
  inventory: InventoryItem[];
  selectedSlot: number;
}
