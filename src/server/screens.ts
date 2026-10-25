/**
 * screens.ts - Minecraft block chunk snapshots + entity tracking & simulator
 */

export const R = 16;     // horizontal radius
export const DOWN = 8;   // blocks below feet
export const UP = 8;     // blocks above feet
export const SX = R * 2 + 1; // 33
export const SZ = R * 2 + 1; // 33
export const SY = DOWN + UP + 1; // 17

// Block classes:
// 0: air, 1: stone/deepslate/ore, 2: dirt/path, 3: grass_block, 4: sand,
// 5: log/wood, 6: plank, 7: leaves, 8: water, 9: lava, 10: snow/ice, 11: other
export function classify(block: any): number {
  if (!block) return 0;
  const n = block.name || '';
  if (n === 'air' || n === 'cave_air' || n === 'void_air') return 0;
  if (n === 'water') return 8;
  if (n === 'lava') return 9;
  if (block.boundingBox !== 'block') return 0; // tall grass, flower, torch treated as air
  if (n.includes('leaves')) return 7;
  if (n === 'grass_block') return 3;
  if (n.includes('plank')) return 6;
  if (n.includes('log') || n.includes('wood')) return 5;
  if (n.includes('sand')) return 4;
  if (n.includes('snow') || n.includes('ice')) return 10;
  if (
    n.includes('dirt') ||
    n.includes('path') ||
    n.includes('mud') ||
    n.includes('farmland') ||
    n.includes('podzol') ||
    n.includes('mycelium') ||
    n.includes('clay')
  ) {
    return 2;
  }
  if (
    n.includes('stone') ||
    n.includes('deepslate') ||
    n.includes('andesite') ||
    n.includes('granite') ||
    n.includes('diorite') ||
    n.includes('bedrock') ||
    n.includes('_ore') ||
    n.includes('tuff') ||
    n.includes('basalt')
  ) {
    return 1;
  }
  return 11;
}

export function takeSnapshot(bot: any) {
  if (!bot || !bot.entity) return null;
  const p = bot.entity.position;
  const ox = Math.floor(p.x) - R;
  const oy = Math.floor(p.y) - DOWN;
  const oz = Math.floor(p.z) - R;
  const data = Buffer.alloc(SX * SY * SZ);
  const pt = p.clone ? p.clone() : { ...p };

  for (let y = 0; y < SY; y++) {
    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        pt.x = ox + x;
        pt.y = oy + y;
        pt.z = oz + z;
        const b = bot.blockAt ? bot.blockAt(pt, false) : null;
        data[(y * SZ + z) * SX + x] = classify(b);
      }
    }
  }
  return { ox, oy, oz, sx: SX, sy: SY, sz: SZ, data };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function getPose(bot: any) {
  if (!bot || !bot.entity) return null;
  const p = bot.entity.position;
  const ents: Array<[number, number, number, number, string]> = [];

  if (bot.entities) {
    for (const id in bot.entities) {
      const e = bot.entities[id];
      if (!e || e === bot.entity || !e.position) continue;
      const dx = e.position.x - p.x;
      const dz = e.position.z - p.z;
      if (dx * dx + dz * dz > 400 || Math.abs(e.position.y - p.y) > 16) continue;
      let t = -1;
      if (e.type === 'player') t = 0;
      else if (e.type === 'hostile') t = 1;
      else if (e.type === 'mob' || e.type === 'animal' || e.type === 'passive' || e.type === 'living') t = 2;
      if (t < 0) continue;
      ents.push([r2(e.position.x), r2(e.position.y), r2(e.position.z), t, e.username || e.displayName || '']);
      if (ents.length >= 40) break;
    }
  }

  return {
    x: r2(p.x),
    y: r2(p.y),
    z: r2(p.z),
    yaw: r2(bot.entity.yaw || 0),
    pitch: r2(bot.entity.pitch || 0),
    health: bot.health != null ? bot.health : 20,
    food: bot.food != null ? bot.food : 20,
    foodSaturation: bot.foodSaturation != null ? bot.foodSaturation : 5,
    xpLevel: bot.experience?.level ?? 12,
    xpProgress: bot.experience?.progress ?? 0.65,
    ents,
  };
}

/**
 * Procedural Minecraft voxel terrain simulator for instant interactive sandbox testing
 */
export function generateSimulatedSnapshot(pos: { x: number; y: number; z: number }) {
  const ox = Math.floor(pos.x) - R;
  const oy = Math.floor(pos.y) - DOWN;
  const oz = Math.floor(pos.z) - R;
  const data = Buffer.alloc(SX * SY * SZ);

  for (let y = 0; y < SY; y++) {
    const worldY = oy + y;
    for (let z = 0; z < SZ; z++) {
      const worldZ = oz + z;
      for (let x = 0; x < SX; x++) {
        const worldX = ox + x;

        // Ground elevation contour
        const groundHeight = 64 + Math.round(
          Math.sin(worldX * 0.15) * 2.2 +
          Math.cos(worldZ * 0.15) * 2.2 +
          Math.sin((worldX + worldZ) * 0.08) * 1.5
        );

        let blockType = 0; // Air

        // Small water pond in distance
        const distFromPond = Math.hypot(worldX - (Math.floor(pos.x) + 7), worldZ - (Math.floor(pos.z) - 6));
        const isWaterPond = distFromPond < 4;

        if (worldY < groundHeight - 3) {
          blockType = 1; // Stone/deepslate
        } else if (worldY < groundHeight) {
          blockType = 2; // Dirt
        } else if (worldY === groundHeight) {
          if (isWaterPond && worldY <= 64) {
            blockType = 8; // Water
          } else {
            blockType = 3; // Grass
          }
        }

        // Tree generation
        const treeX = Math.floor(pos.x) - 5;
        const treeZ = Math.floor(pos.z) + 6;
        const treeGround = 64 + Math.round(
          Math.sin(treeX * 0.15) * 2.2 +
          Math.cos(treeZ * 0.15) * 2.2 +
          Math.sin((treeX + treeZ) * 0.08) * 1.5
        );

        if (worldX === treeX && worldZ === treeZ && worldY > treeGround && worldY <= treeGround + 4) {
          blockType = 5; // Wood log
        }
        if (
          Math.abs(worldX - treeX) <= 2 &&
          Math.abs(worldZ - treeZ) <= 2 &&
          worldY >= treeGround + 3 &&
          worldY <= treeGround + 5
        ) {
          if (blockType === 0) blockType = 7; // Leaves
        }

        // Wooden obstacle fence / KingSMP structure
        const kingX = Math.floor(pos.x) + 4;
        const kingZ = Math.floor(pos.z) + 4;
        if (worldX >= kingX && worldX <= kingX + 2 && worldZ >= kingZ && worldZ <= kingZ + 2) {
          if (worldY === groundHeight + 1) blockType = 6; // Planks
        }

        data[(y * SZ + z) * SX + x] = blockType;
      }
    }
  }

  return { ox, oy, oz, sx: SX, sy: SY, sz: SZ, data };
}

/**
 * Returns dynamic animated entities for the simulator
 */
export function getSimulatedPose(pos: { x: number; y: number; z: number }, yaw: number, pitch: number, tick: number) {
  const t = tick * 0.05;

  // Animated wandering entities
  const ents: Array<[number, number, number, number, string]> = [
    // 0: Player
    [
      r2(pos.x + 4 + Math.sin(t * 0.6) * 2.5),
      r2(pos.y),
      r2(pos.z + 5 + Math.cos(t * 0.6) * 2.5),
      0,
      'King_Slayer',
    ],
    // 1: Hostile Mob (Zombie)
    [
      r2(pos.x - 7 + Math.sin(t * 0.4) * 3),
      r2(pos.y),
      r2(pos.z + 8 + Math.cos(t * 0.4) * 2),
      1,
      'Zombie',
    ],
    // 2: Passive Animal (Sheep)
    [
      r2(pos.x + 6 + Math.sin(t * 0.3) * 1.5),
      r2(pos.y),
      r2(pos.z - 5 + Math.cos(t * 0.3) * 1.5),
      2,
      'Sheep',
    ],
    // 2: Passive Animal (Cow)
    [
      r2(pos.x - 4 + Math.cos(t * 0.5) * 2),
      r2(pos.y),
      r2(pos.z - 6 + Math.sin(t * 0.5) * 2),
      2,
      'Cow',
    ],
  ];

  return {
    x: r2(pos.x),
    y: r2(pos.y),
    z: r2(pos.z),
    yaw: r2(yaw),
    pitch: r2(pitch),
    health: 20,
    food: 19,
    foodSaturation: 8.5,
    xpLevel: 32,
    xpProgress: 0.78,
    ents,
  };
}

export function getSimulatedInventory() {
  return [
    { slot: 36, name: 'diamond_sword', count: 1, displayName: 'Thanh Kiếm Kim Cương Sắc Bén V', category: 'weapon', durability: 94 },
    { slot: 37, name: 'diamond_pickaxe', count: 1, displayName: 'Cúp Kim Cương Hiệu Suất IV', category: 'tool', durability: 88 },
    { slot: 38, name: 'golden_apple', count: 16, displayName: 'Táo Vàng Phù Phép', category: 'food' },
    { slot: 39, name: 'cooked_beef', count: 64, displayName: 'Bò Bít Tết Nướng', category: 'food' },
    { slot: 40, name: 'clock', count: 1, displayName: 'Đồng Hồ Menu KingSMP [Slot 4]', category: 'misc' },
    { slot: 41, name: 'shield', count: 1, displayName: 'Khiên Chiến Binh', category: 'armor', durability: 100 },
    { slot: 42, name: 'totem_of_undying', count: 2, displayName: 'Bùa Hồi Sinh', category: 'misc' },
    { slot: 43, name: 'oak_planks', count: 64, displayName: 'Ván Gỗ Sồi', category: 'block' },
    { slot: 44, name: 'ender_pearl', count: 16, displayName: 'Ngọc Ender', category: 'misc' },
    // Bag inventory
    { slot: 9, name: 'arrow', count: 64, displayName: 'Mũi Tên', category: 'weapon' },
    { slot: 10, name: 'bow', count: 1, displayName: 'Cung Vô Hạn', category: 'weapon', durability: 76 },
    { slot: 11, name: 'iron_ingot', count: 48, displayName: 'Thỏi Sắt', category: 'misc' },
    { slot: 12, name: 'diamond', count: 32, displayName: 'Kim Cương', category: 'misc' },
    { slot: 13, name: 'emerald', count: 18, displayName: 'Ngọc Lục Bảo KingMC', category: 'misc' },
    { slot: 14, name: 'torch', count: 64, displayName: 'Đuốc Sáng', category: 'block' },
    { slot: 24, name: 'netherite_scrap', count: 1, displayName: 'Ô 24: KingSMP Server Gateway', category: 'misc' },
  ];
}
