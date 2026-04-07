import { CONSTANTS } from './constants';

export type ItemType = 'barrier' | 'overhead' | 'train' | 'coin' | 'magnet' | 'jetpack' | 'sneakers' | 'multiplier' | 'spike_pit' | 'crumbling_platform' | 'creeper' | 'diamond_ore' | 'gold_ore' | 'moving_platform' | 'disappearing_block' | 'rolling_boulder';

export type BiomeType = 'forest' | 'desert' | 'nether' | 'snow';

export interface WorldItem {
  id: string;
  type: ItemType;
  lane: number; // -1, 0, 1
  z: number; // local z within chunk (0 to CHUNK_LENGTH)
  y?: number; // Optional height
  collected?: boolean;
  speed?: number;
}

export interface Decoration {
  id: string;
  type: 'tree' | 'rock' | 'bush' | 'wall' | 'banner';
  x: number;
  z: number;
  scale: number;
  rotation?: number;
}

export interface BlockData {
  x: number;
  y: number;
  z: number;
  type: number; // 0: grass, 1: dirt, 2: stone, 3: sand, 4: water, 5: wood, 6: leaves, 7: track, 8: sleeper, 9: ore
}

export interface Chunk {
  id: string;
  zOffset: number;
  items: WorldItem[];
  decorations: Decoration[];
  blocks: BlockData[];
  biome: BiomeType;
}

let chunkIdCounter = 0;
let itemIdCounter = 0;
let currentBiome: BiomeType = 'forest';
let biomeChunkCount = 0;

function getRandomLane() {
  return Math.floor(Math.random() * 3) - 1;
}

function getNoise(x: number, z: number) {
  return Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2 + Math.sin(x * 0.05 + z * 0.1) * 4;
}

export function generateChunk(zOffset: number, speed: number = CONSTANTS.BASE_SPEED, isSafe: boolean = false): Chunk {
  const items: WorldItem[] = [];
  const decorations: Decoration[] = [];
  const blocks: BlockData[] = [];
  
  // Biome rotation
  biomeChunkCount++;
  if (biomeChunkCount > 15) {
    const biomes: BiomeType[] = ['forest', 'desert', 'nether', 'snow'];
    currentBiome = biomes[Math.floor(Math.random() * biomes.length)];
    biomeChunkCount = 0;
  }

  const difficultyFactor = Math.min(2.5, speed / CONSTANTS.BASE_SPEED);
  const numObstacles = isSafe ? 0 : Math.floor((Math.random() * 5 + 4) * difficultyFactor);

  // Generate Voxel Terrain
  const startZ = zOffset;
  for (let z = 0; z < CONSTANTS.CHUNK_LENGTH; z += 2) {
    for (let x = -16; x <= 16; x += 2) {
      const worldZ = startZ - z;
      let height = Math.floor(getNoise(x, worldZ));
      
      // Track area is flat
      if (x >= -6 && x <= 6) {
        height = 0;
        const isTrack = x === -4 || x === 0 || x === 4;
        let blockType = 0; // Default biome surface
        if (currentBiome === 'desert') blockType = 3; // Sand
        else if (currentBiome === 'nether') blockType = 1; // Netherrack
        else if (currentBiome === 'snow') blockType = 2; // Snow
        
        blocks.push({ x, y: height, z, type: isTrack ? 7 : blockType });

        // Add banners along the track
        if (z % 20 === 0 && (x === -6 || x === 6)) {
          decorations.push({
            id: `banner_${itemIdCounter++}`,
            type: 'banner',
            x: x * 1.5, // Slightly further out
            z: z,
            scale: 1,
            rotation: x < 0 ? Math.PI / 2 : -Math.PI / 2
          });
        }
        continue;
      }

      // Base terrain
      let surfaceType = 0; // Grass
      if (currentBiome === 'desert') surfaceType = 3;
      else if (currentBiome === 'nether') surfaceType = 1;
      else if (currentBiome === 'snow') surfaceType = 2;

      if (height < -1) {
        surfaceType = 4; // Water/Lava
        height = -2;
      } else if (height < 0 && currentBiome === 'forest') {
        surfaceType = 3; // Sand
      }

      // Add surface block
      blocks.push({ x, y: height, z, type: surfaceType });

      // Add trees randomly
      if (Math.random() < 0.02 && x > -14 && x < 14) {
        const treeHeight = Math.floor(Math.random() * 2) + 3;
        for (let i = 1; i <= treeHeight; i++) {
          blocks.push({ x, y: height + i * 2, z, type: 5 }); // Wood
        }
        // Leaves
        for (let lx = -2; lx <= 2; lx += 2) {
          for (let ly = 0; ly <= 2; ly += 2) {
            for (let lz = -2; lz <= 2; lz += 2) {
              if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 2) continue;
              blocks.push({ x: x + lx, y: height + treeHeight * 2 + ly, z: z + lz, type: 6 });
            }
          }
        }
      }
    }
  }

  let lastZ = 10;
  for (let i = 0; i < numObstacles; i++) {
    const z = lastZ + Math.random() * 10 + 5;
    if (z > CONSTANTS.CHUNK_LENGTH - 5) break;
    lastZ = z;

    const lane = getRandomLane();
    const rand = Math.random();
    let type: ItemType = 'barrier';

    if (rand < 0.10) type = 'overhead';
    else if (rand < 0.20) type = 'train';
    else if (rand < 0.30) type = 'spike_pit';
    else if (rand < 0.40) type = 'crumbling_platform';
    else if (rand < 0.50) type = 'creeper';
    else if (rand < 0.55) type = 'moving_platform';
    else if (rand < 0.60) type = 'disappearing_block';
    else if (rand < 0.65) type = 'rolling_boulder';
    else if (rand < 0.70) type = 'diamond_ore';
    else if (rand < 0.75) type = 'gold_ore';

    let speedVal = 0;
    if (type === 'train' && Math.random() < 0.5) {
      speedVal = -15 - (speed - CONSTANTS.BASE_SPEED) * 0.5;
    } else if (type === 'rolling_boulder') {
      speedVal = -10 - (speed - CONSTANTS.BASE_SPEED) * 0.3;
    }

    items.push({ id: `item_${itemIdCounter++}`, type, lane, z, speed: speedVal });

    // Spawn coins
    if (Math.random() < 0.5) {
      const coinLane = getRandomLane();
      if (!(type === 'train' && coinLane === lane)) {
        for (let j = 0; j < 3; j++) {
          items.push({ id: `item_${itemIdCounter++}`, type: 'coin', lane: coinLane, z: z + j * 2, y: 2 });
        }
      }
    }
  }

  // Spawn powerups rarely
  if (Math.random() < 0.1) {
    const pRand = Math.random();
    let pType: ItemType = 'magnet';
    if (pRand < 0.25) pType = 'jetpack';
    else if (pRand < 0.5) pType = 'sneakers';
    else if (pRand < 0.75) pType = 'multiplier';

    items.push({ id: `item_${itemIdCounter++}`, type: pType, lane: getRandomLane(), z: Math.random() * CONSTANTS.CHUNK_LENGTH, y: 2 });
  }

  // Spawn sky coins for jetpack
  for (let i = 0; i < 20; i++) {
    const lane = Math.sin(i * 0.5) > 0.5 ? 1 : (Math.sin(i * 0.5) < -0.5 ? -1 : 0);
    items.push({ id: `item_${itemIdCounter++}`, type: 'coin', lane, z: i * 3 + 5, y: CONSTANTS.JETPACK_HEIGHT });
  }

  // Spawn jump coins (reachable with sneakers or well-timed jump)
  if (Math.random() < 0.3) {
    const lane = getRandomLane();
    const startZ = Math.random() * (CONSTANTS.CHUNK_LENGTH - 10);
    for (let j = 0; j < 5; j++) {
      items.push({ id: `item_${itemIdCounter++}`, type: 'coin', lane, z: startZ + j * 2, y: 4 });
    }
  }

  return {
    id: `chunk_${chunkIdCounter++}`,
    zOffset,
    items,
    decorations,
    blocks,
    biome: currentBiome
  };
}
