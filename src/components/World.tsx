import { useRef, useState, useEffect, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { CONSTANTS } from '../utils/constants';
import { generateChunk, Chunk, WorldItem } from '../utils/chunkGenerator';
import { globalGameState } from '../utils/gameState';
import { soundManager } from '../utils/soundManager';

const INITIAL_CHUNKS = 4;

function Coin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 3;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 6 + position[2]) * 0.1;
    }
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[0.4, 0.2, 0.6]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
    </mesh>
  );
}

function Powerup({ position, type }: { position: [number, number, number], type: string }) {
  const ref = useRef<THREE.Group>(null);
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    }
    if (crystalRef.current) {
      crystalRef.current.rotation.x += delta * 0.5;
      crystalRef.current.rotation.z += delta * 0.3;
    }
  });

  const getCrystalColor = () => {
    switch (type) {
      case 'magnet': return '#ff3333';
      case 'sneakers': return '#33ffff';
      case 'multiplier': return '#ff33ff';
      case 'jetpack': return '#ffff33';
      default: return '#ffffff';
    }
  };

  return (
    <group position={position}>
      {/* Outer Crystal Frame */}
      <mesh ref={crystalRef}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color={getCrystalColor()} 
          transparent 
          opacity={0.2} 
          wireframe 
          emissive={getCrystalColor()}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <group ref={ref}>
        {type === 'magnet' && (
          <group>
            {/* Horseshoe Magnet */}
            <mesh position={[-0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
            <mesh position={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#0000ff" />
            </mesh>
            <mesh position={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.6, 0.2, 0.2]} />
              <meshStandardMaterial color="#cccccc" />
            </mesh>
            {/* Glowing Tips */}
            <mesh position={[-0.2, 0.3, 0]}>
              <boxGeometry args={[0.25, 0.1, 0.25]} />
              <meshStandardMaterial color="#ffaaaa" emissive="#ff0000" emissiveIntensity={2} />
            </mesh>
            <mesh position={[0.2, 0.3, 0]}>
              <boxGeometry args={[0.25, 0.1, 0.25]} />
              <meshStandardMaterial color="#aaaaff" emissive="#0000ff" emissiveIntensity={2} />
            </mesh>
            <pointLight intensity={5} distance={3} color="#ff0000" />
          </group>
        )}

        {type === 'sneakers' && (
          <group>
            {/* Winged Sneakers */}
            <group position={[-0.2, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.2, 0.5]} />
                <meshStandardMaterial color="#00ffff" />
              </mesh>
              {/* Wing */}
              <mesh position={[-0.2, 0.1, -0.1]} rotation={[0, -0.5, 0.5]}>
                <boxGeometry args={[0.1, 0.3, 0.4]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
              </mesh>
            </group>
            <group position={[0.2, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.2, 0.5]} />
                <meshStandardMaterial color="#00ffff" />
              </mesh>
              {/* Wing */}
              <mesh position={[0.2, 0.1, -0.1]} rotation={[0, 0.5, -0.5]}>
                <boxGeometry args={[0.1, 0.3, 0.4]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
              </mesh>
            </group>
            <pointLight intensity={5} distance={3} color="#00ffff" />
          </group>
        )}

        {type === 'multiplier' && (
          <group>
            {/* 2X Symbol */}
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.6, 0.2]} />
              <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
            </mesh>
            {/* "2" shape */}
            <group position={[-0.1, 0, 0.11]}>
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.25, 0.08, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0.1, 0.1, 0]}>
                <boxGeometry args={[0.08, 0.2, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.25, 0.08, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-0.1, -0.1, 0]}>
                <boxGeometry args={[0.08, 0.2, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[0.25, 0.08, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
            {/* "X" shape */}
            <group position={[0.18, 0, 0.11]} rotation={[0, 0, Math.PI / 4]}>
              <mesh>
                <boxGeometry args={[0.08, 0.4, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.08, 0.4, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
            <pointLight intensity={5} distance={3} color="#ff00ff" />
          </group>
        )}

        {type === 'jetpack' && (
          <group>
            {/* High-Tech Jetpack */}
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.7, 0.3]} />
              <meshStandardMaterial color="#444444" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[-0.3, -0.1, 0]} castShadow>
              <boxGeometry args={[0.2, 0.5, 0.2]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[0.3, -0.1, 0]} castShadow>
              <boxGeometry args={[0.2, 0.5, 0.2]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            {/* Glowing Core */}
            <mesh position={[0, 0, 0.16]}>
              <boxGeometry args={[0.3, 0.3, 0.05]} />
              <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
            </mesh>
            <pointLight intensity={5} distance={3} color="#ffff00" />
          </group>
        )}
      </group>
    </group>
  );
}

function Clouds() {
  const clouds = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 20; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 100,
        y: 20 + Math.random() * 10,
        z: (Math.random() - 0.5) * 100 - 50,
        scale: 2 + Math.random() * 3,
      });
    }
    return temp;
  }, []);

  return (
    <group>
      {clouds.map((cloud, i) => (
        <mesh key={i} position={[cloud.x, cloud.y, cloud.z]} scale={[cloud.scale * 2, cloud.scale * 0.5, cloud.scale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

const CreeperInstance = forwardRef(({ x, itemY, item }: { x: number, itemY: number, item: WorldItem }, ref: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.z = -item.z;
      
      const playerPos = globalGameState.playerPosition;
      const dist = Math.sqrt((x - playerPos.x)**2 + (-item.z - playerPos.z)**2);
      
      // Flash when close
      if (dist < 8) {
        setIsFlashing(Math.sin(state.clock.elapsedTime * 20) > 0);
      } else {
        setIsFlashing(false);
      }
    }
  });

  return (
    <group ref={meshRef} position={[x, itemY - 0.5, -item.z]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
      {/* Face (Eyes) */}
      <mesh position={[-0.2, 1.2, 0.41]}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 1.2, 0.41]}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 0.9, 0.41]}>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-0.2, -0.1, 0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
      <mesh castShadow position={[0.2, -0.1, 0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
      <mesh castShadow position={[-0.2, -0.1, -0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
      <mesh castShadow position={[0.2, -0.1, -0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={isFlashing ? "#ffffff" : "#2ecc71"} />
      </mesh>
    </group>
  );
});

function Explosion({ position }: { position: THREE.Vector3 }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 20; i++) {
      temp.push({
        velocity: new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15),
        position: new THREE.Vector3(0, 0, 0),
        scale: 0.2 + Math.random() * 0.5,
      });
    }
    return temp;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        if (!p) return;
        child.position.addScaledVector(p.velocity, delta);
        p.velocity.multiplyScalar(0.95); // Friction
        child.scale.multiplyScalar(0.98); // Shrink
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} scale={[p.scale, p.scale, p.scale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ff4500" : "#ffd700"} emissive={i % 2 === 0 ? "#ff4500" : "#ffd700"} emissiveIntensity={2} />
        </mesh>
      ))}
      <pointLight intensity={5} distance={10} color="#ff4500" />
    </group>
  );
}

function JetpackThruster({ position }: { position: [number, number, number] }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 5; i++) {
      temp.push({
        offset: new THREE.Vector3((Math.random() - 0.5) * 0.2, -0.5, (Math.random() - 0.5) * 0.2),
        scale: 0.1 + Math.random() * 0.2,
        speed: 2 + Math.random() * 3,
      });
    }
    return temp;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.y -= p.speed * delta;
        if (child.position.y < -1.5) {
          child.position.y = -0.5;
        }
        child.scale.setScalar(p.scale * (1 + child.position.y / 1.5));
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.offset.x, p.offset.y, p.offset.z]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Warden() {
  const ref = useRef<THREE.Group>(null);
  const [isAngry, setIsAngry] = useState(false);
  const status = useGameStore((state) => state.status);
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  useEffect(() => {
    if (status === 'playing' && soundEnabled) {
      soundManager.play('warden');
    } else {
      soundManager.stopWarden();
    }
  }, [status, soundEnabled]);

  useFrame((state) => {
    if (ref.current) {
      const playerPos = globalGameState.playerPosition;
      // Follow player at a distance
      const targetZ = playerPos.z + 12;
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, 0.1);
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, playerPos.x, 0.05);
      ref.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      setIsAngry(Math.sin(state.clock.elapsedTime * 10) > 0);
      
      // Update warden sound volume based on distance
      const dist = Math.abs(ref.current.position.z - playerPos.z);
      // If distance is 12, volume should be low. If distance is 0 (hit), volume should be high.
      const volume = Math.max(0, 1 - dist / 15) * 0.5;
      soundManager.updateWardenVolume(volume);
    }
  });

  return (
    <group ref={ref} position={[0, 1.5, 12]}>
      {/* Warden Body (Large and imposing) */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 2, 0.8]} />
        <meshStandardMaterial color="#0a1a1a" emissive={isAngry ? "#00ffff" : "#003333"} emissiveIntensity={1} />
      </mesh>
      {/* Glowing Ribs */}
      <mesh position={[0, 0, 0.41]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color="#0a1a1a" />
      </mesh>
      {/* Ears/Antennae */}
      <mesh position={[-0.6, 1.8, 0]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#00ffff" />
      </mesh>
      <mesh position={[0.6, 1.8, 0]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#00ffff" />
      </mesh>
    </group>
  );
}

function MovingPlatformInstance() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime * 2) * CONSTANTS.LANE_WIDTH;
    }
  });
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.4, 2]} />
        <meshStandardMaterial color="#3498db" />
      </mesh>
      {/* Mechanical bits */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
}

function DisappearingBlockInstance() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const isVisible = Math.floor(state.clock.elapsedTime * 2) % 2 === 0;
      ref.current.visible = isVisible;
    }
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
      <meshStandardMaterial color="#9b59b6" transparent opacity={0.8} />
    </mesh>
  );
}

function RollingBoulderInstance() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 10;
    }
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[0.75, 16, 16]} />
      <meshStandardMaterial color="#7f8c8d" />
    </mesh>
  );
}

function Banner({ position, rotation }: { position: [number, number, number], rotation: number }) {
  const boardRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (boardRef.current) {
      // Make the board face the camera on the Y axis
      const cameraPosition = state.camera.position;
      const boardWorldPosition = new THREE.Vector3();
      boardRef.current.getWorldPosition(boardWorldPosition);
      
      // Calculate angle to camera
      const dx = cameraPosition.x - boardWorldPosition.x;
      const dz = cameraPosition.z - boardWorldPosition.z;
      const angle = Math.atan2(dx, dz);
      
      // Smoothly rotate towards camera or just snap for billboard effect
      boardRef.current.rotation.y = angle;
    }
  });

  return (
    <group position={position}>
      {/* Post - remains static */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Rotating Banner Board and Content */}
      <group ref={boardRef} position={[0, 3, 0]}>
        {/* Banner Board */}
        <mesh castShadow>
          <boxGeometry args={[4, 2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Ad Background */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[3.8, 1.8, 0.01]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        {/* Ad Content */}
        <Text
          position={[0, 0.2, 0.07]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          gorogoro.games
        </Text>
        <Text
          position={[0, -0.2, 0.07]}
          fontSize={0.2}
          color="#f1c40f"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          PLAY NOW
        </Text>
      </group>
    </group>
  );
}

export function World() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [explosionPos, setExplosionPos] = useState<THREE.Vector3 | null>(null);
  const status = useGameStore((state) => state.status);
  const endGame = useGameStore((state) => state.endGame);
  const addCoin = useGameStore((state) => state.addCoin);
  const activatePowerup = useGameStore((state) => state.activatePowerup);
  
  const chunksRef = useRef<Chunk[]>([]);
  const meshRefs = useRef<THREE.InstancedMesh[]>([]);
  const chunkGroupsRef = useRef<{ [key: string]: THREE.Group | null }>({});

  const colors = [
    '#5e9d34', // 0: Grass
    '#79553a', // 1: Dirt / Netherrack
    '#7d7d7d', // 2: Stone / Snow
    '#dbd3a0', // 3: Sand
    '#2b5ddb', // 4: Water / Lava
    '#675132', // 5: Wood
    '#3a5e2b', // 6: Leaves
    '#555555', // 7: Track (Base)
    '#5d4037', // 8: Track (Sleepers)
    '#3498db', // 9: Diamond Ore
    '#f1c40f', // 10: Gold Ore
  ];

  const [timeOfDay, setTimeOfDay] = useState(0); // 0 to 1
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (status === 'playing') {
      const initial = [];
      const currentSpeed = useGameStore.getState().speed;
      for (let i = 0; i < INITIAL_CHUNKS; i++) {
        // First two chunks are safe (no obstacles)
        const isSafe = i < 2;
        initial.push(generateChunk(-i * CONSTANTS.CHUNK_LENGTH, currentSpeed, isSafe));
      }
      setChunks(initial);
      chunksRef.current = initial;
      setExplosionPos(null);
    } else if (status === 'menu') {
      setChunks([]);
      chunksRef.current = [];
      chunkGroupsRef.current = {};
    }
  }, [status]);

  useFrame((state, delta) => {
    if (status !== 'playing') return;

    // Day/Night Cycle
    const cycleSpeed = 0.05;
    const newTime = (state.clock.elapsedTime * cycleSpeed) % 1;
    setTimeOfDay(newTime);

    // Camera Shake
    if (shake > 0) {
      state.camera.position.x += (Math.random() - 0.5) * shake;
      state.camera.position.y += (Math.random() - 0.5) * shake;
      setShake(Math.max(0, shake - delta * 5));
    }

    const currentSpeed = useGameStore.getState().speed;
    const increaseSpeed = useGameStore.getState().increaseSpeed;
    
    // Increase speed over time
    increaseSpeed(delta * 0.2); // Faster acceleration

    let newChunks = [...chunksRef.current];
    let chunksChanged = false;

    // Move chunks and items
    for (let i = 0; i < newChunks.length; i++) {
      newChunks[i].zOffset += currentSpeed * delta;
      
      // Update the group position directly via ref for performance
      const group = chunkGroupsRef.current[newChunks[i].id];
      if (group) {
        group.position.z = newChunks[i].zOffset;
      }

      for (const item of newChunks[i].items) {
        if (item.speed) {
          item.z += item.speed * delta;
        }
      }
    }

    // Remove old chunks and add new ones
    if (newChunks[0] && newChunks[0].zOffset > CONSTANTS.CHUNK_LENGTH) {
      const removed = newChunks.shift();
      if (removed) delete chunkGroupsRef.current[removed.id];
      
      const lastZ = newChunks[newChunks.length - 1].zOffset;
      newChunks.push(generateChunk(lastZ - CONSTANTS.CHUNK_LENGTH, currentSpeed));
      chunksChanged = true;
    }

    // Collision Detection
    const playerPos = globalGameState.playerPosition;
    const isRolling = globalGameState.isRolling;
    const powerups = useGameStore.getState().powerups;
    const hasMagnet = powerups.magnet > 0;
    const hasJetpack = powerups.jetpack > 0;
    const isJumping = !hasJetpack && playerPos.y > 1.6; // Simple jump check
    
    const playerBoxHeight = isRolling ? 0.8 : (isJumping ? 1.2 : 1.8);
    const playerBoxY = playerPos.y + playerBoxHeight / 2;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(playerPos.x, playerBoxY, playerPos.z),
      new THREE.Vector3(0.6, playerBoxHeight, 0.6)
    );

    const itemBox = new THREE.Box3();
    const itemSize = new THREE.Vector3();
    const itemCenter = new THREE.Vector3();

    for (const chunk of newChunks) {
      for (const item of chunk.items) {
        if (item.collected) continue;

        const itemZ = chunk.zOffset - item.z;
        const itemX = item.lane * CONSTANTS.LANE_WIDTH;
        
        // Skip items that are far away
        if (itemZ > 5 || itemZ < -40) continue;

        // Magnet effect
        if (hasMagnet && item.type === 'coin') {
          const dist = Math.sqrt((itemX - playerPos.x)**2 + (itemZ - playerPos.z)**2);
          if (dist < CONSTANTS.MAGNET_RADIUS) {
            item.collected = true;
            addCoin();
            chunksChanged = true;
            continue;
          }
        }

        // Jetpack sky coins logic
        const itemY = item.y ?? (
          item.type === 'overhead' || item.type === 'crumbling_platform' ? 3.5 : 
          item.type === 'disappearing_block' ? 2.4 :
          item.type === 'rolling_boulder' ? 2.2 :
          2
        );

        // Set item box
        if (item.type === 'barrier') itemSize.set(1.8, 1, 0.5);
        else if (item.type === 'overhead') itemSize.set(2, 1, 0.5);
        else if (item.type === 'train') itemSize.set(1.8, 1.5, 3.8);
        else if (item.type === 'spike_pit') itemSize.set(1.8, 0.5, 1.8);
        else if (item.type === 'crumbling_platform') itemSize.set(2, 0.8, 2);
        else if (item.type === 'creeper') itemSize.set(0.8, 1.8, 0.8);
        else if (item.type === 'moving_platform') {
          itemSize.set(2, 0.4, 2);
          const laneOffset = Math.sin(state.clock.elapsedTime * 2) * CONSTANTS.LANE_WIDTH;
          itemCenter.x += laneOffset;
        }
        else if (item.type === 'disappearing_block') {
          const isVisible = Math.floor(state.clock.elapsedTime * 2) % 2 === 0;
          if (!isVisible) continue; // Skip collision if invisible
          itemSize.set(1.8, 1.8, 1.8);
        }
        else if (item.type === 'rolling_boulder') itemSize.set(1.5, 1.5, 1.5);
        else if (item.type === 'coin') itemSize.set(1.2, 1.2, 1.2);
        else itemSize.set(0.8, 0.8, 0.8); // powerups

        itemCenter.set(itemX, itemY, itemZ);
        itemBox.setFromCenterAndSize(itemCenter, itemSize);

        if (playerBox.intersectsBox(itemBox)) {
          if (item.type === 'coin') {
            item.collected = true;
            addCoin();
            soundManager.play('coin');
            chunksChanged = true;
          } else if (item.type === 'magnet' || item.type === 'jetpack' || item.type === 'sneakers' || item.type === 'multiplier') {
            item.collected = true;
            activatePowerup(item.type, 10); // 10 seconds duration
            soundManager.play('powerup');
            chunksChanged = true;
          } else if (item.type === 'diamond_ore') {
            item.collected = true;
            useGameStore.getState().addScore(500);
            soundManager.play('powerup');
            chunksChanged = true;
          } else if (item.type === 'gold_ore') {
            item.collected = true;
            useGameStore.getState().addScore(100);
            useGameStore.getState().increaseSpeed(2);
            soundManager.play('powerup');
            chunksChanged = true;
          } else {
            // Hit obstacle
            if (item.type === 'creeper') {
              setExplosionPos(new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z));
              setShake(1.5);
            }
            endGame();
          }
        }
      }
    }

    // Update InstancedMesh
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const currentIndices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    for (const chunk of newChunks) {
      const biome = (chunk as any).biome || 'forest';
      if (chunk.blocks) {
        for (const block of chunk.blocks) {
          const type = block.type;
          const mesh = meshRefs.current[type];
          if (mesh) {
            dummy.position.set(block.x, block.y + 0.5, chunk.zOffset - block.z);
            dummy.updateMatrix();
            mesh.setMatrixAt(currentIndices[type], dummy.matrix);
            
            // Set Biome Color
            let baseColor = colors[type];
            if (type === 0) { // Surface
              if (biome === 'desert') baseColor = colors[3]; // Sand
              else if (biome === 'nether') baseColor = '#7d2e2e'; // Netherrack
              else if (biome === 'snow') baseColor = '#ffffff'; // Snow
            } else if (type === 1) { // Dirt
              if (biome === 'nether') baseColor = '#4a2e2e'; // Soul Sand
            } else if (type === 4) { // Liquid
              if (biome === 'nether') baseColor = '#ff4500'; // Lava
            }
            
            color.set(baseColor);
            mesh.setColorAt(currentIndices[type], color);
            currentIndices[type]++;
            
            // Add sleepers for tracks
            if (type === 7 && block.z % 4 === 0) {
              const sleeperMesh = meshRefs.current[8];
              if (sleeperMesh) {
                dummy.position.set(block.x, block.y + 0.55, chunk.zOffset - block.z);
                dummy.updateMatrix();
                sleeperMesh.setMatrixAt(currentIndices[8], dummy.matrix);
                sleeperMesh.setColorAt(currentIndices[8], color.set(colors[8]));
                currentIndices[8]++;
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < 11; i++) {
      if (meshRefs.current[i]) {
        meshRefs.current[i].instanceMatrix.needsUpdate = true;
        if (meshRefs.current[i].instanceColor) meshRefs.current[i].instanceColor.needsUpdate = true;
        meshRefs.current[i].count = currentIndices[i];
      }
    }

    if (chunksChanged) {
      chunksRef.current = newChunks;
      setChunks([...newChunks]);
    }
  });

  const skyColor = new THREE.Color().lerpColors(
    new THREE.Color('#78A7FF'), // Day
    new THREE.Color('#0A0A2A'), // Night
    Math.sin(timeOfDay * Math.PI)
  );

  const sunIntensity = Math.max(0.2, 1 - Math.sin(timeOfDay * Math.PI));

  return (
    <group>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 30, 80]} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={sunIntensity * 1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={sunIntensity * 0.5} />
      <Clouds />
      
      {/* Instanced Terrain */}
      {colors.map((color, i) => (
        <instancedMesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el as THREE.InstancedMesh)}
          args={[undefined, undefined, 10000]} // Max 10k blocks per type
          receiveShadow
          castShadow
        >
          <boxGeometry args={i === 7 ? [1.8, 0.1, 2] : (i === 8 ? [2.2, 0.1, 0.4] : [2, 2, 2])} />
          <meshStandardMaterial 
            color={color} 
            emissive={i === 4 ? "#ff4500" : "#000000"} 
            emissiveIntensity={i === 4 ? 0.5 : 0} 
          />
        </instancedMesh>
      ))}

      {/* Render Items */}
      {chunks.map((chunk) => (
        <group 
          key={chunk.id} 
          ref={(el) => (chunkGroupsRef.current[chunk.id] = el)}
          position={[0, 0, chunk.zOffset]}
        >
          <ItemsRenderer chunk={chunk} />
          {/* Render Decorations */}
          {chunk.decorations && chunk.decorations.map((dec) => {
            if (dec.type === 'banner') {
              return (
                <Banner 
                  key={dec.id} 
                  position={[dec.x, 0, -dec.z]} 
                  rotation={dec.rotation || 0} 
                />
              );
            }
            return null;
          })}
        </group>
      ))}

      {explosionPos && <Explosion position={explosionPos} />}
      <Warden />
    </group>
  );
}

function ItemsRenderer({ chunk }: { chunk: Chunk }) {
  return (
    <>
      {chunk.items.map((item) => {
        if (item.collected) return null;
        return <ItemInstance key={item.id} item={item} />;
      })}
    </>
  );
}

function ItemInstance({ item }: { item: WorldItem }) {
  const ref = useRef<THREE.Group>(null);
  const x = item.lane * CONSTANTS.LANE_WIDTH;
  const itemY = item.y ?? (
    item.type === 'overhead' || item.type === 'crumbling_platform' ? 3.5 : 
    item.type === 'disappearing_block' ? 2.4 :
    item.type === 'rolling_boulder' ? 2.2 :
    2
  );

  useFrame(() => {
    if (ref.current) {
      // item.z is updated in the main World useFrame loop
      ref.current.position.z = -item.z;
    }
  });

  if (item.type === 'barrier') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        {/* Oak Fence */}
        <mesh position={[-0.8, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0.8, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.2, 0.1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.2, 0.1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      </group>
    );
  }

  if (item.type === 'overhead') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        {/* Stone Bricks */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 1, 1]} />
          <meshStandardMaterial color="#7f8c8d" />
        </mesh>
        {/* Pillars */}
        <mesh position={[-0.8, -1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 2, 0.4]} />
          <meshStandardMaterial color="#7f8c8d" />
        </mesh>
        <mesh position={[0.8, -1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 2, 0.4]} />
          <meshStandardMaterial color="#7f8c8d" />
        </mesh>
      </group>
    );
  }

  if (item.type === 'train') {
    const isMoving = (item.speed || 0) !== 0;
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        {/* Locomotive Body */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 1.6, 4]} />
          <meshStandardMaterial color={isMoving ? "#c0392b" : "#2c3e50"} />
        </mesh>
        
        {/* Front Grill/Buffer */}
        <mesh position={[0, -0.4, 2.1]} castShadow>
          <boxGeometry args={[1.6, 0.6, 0.2]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Cab (Top part) */}
        <mesh position={[0, 0.8, -1]} castShadow>
          <boxGeometry args={[1.6, 1, 1.5]} />
          <meshStandardMaterial color={isMoving ? "#e74c3c" : "#34495e"} />
        </mesh>

        {/* Windows */}
        <mesh position={[0, 0.8, -0.24]} castShadow>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
        </mesh>

        {/* Headlight */}
        <mesh position={[0, 0.2, 2.01]}>
          <boxGeometry args={[0.6, 0.4, 0.05]} />
          <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={isMoving ? 2 : 0.5} />
        </mesh>

        {/* Wheels */}
        {[-1.5, 0, 1.5].map((zPos, i) => (
          <group key={i} position={[0, -0.8, zPos]}>
            <mesh position={[-0.9, 0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.6, 0.6]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
            <mesh position={[0.9, 0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.6, 0.6]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (item.type === 'spike_pit') {
    return (
      <group ref={ref} position={[x, itemY - 0.4, -item.z]}>
        {/* Pit Base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.2, 1.8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        {/* Spikes */}
        {[-0.6, 0, 0.6].map((sx) => (
          [-0.6, 0, 0.6].map((sz) => (
            <mesh key={`${sx}-${sz}`} position={[sx, 0.3, sz]} castShadow>
              <coneGeometry args={[0.1, 0.6, 4]} />
              <meshStandardMaterial color="#95a5a6" />
            </mesh>
          ))
        ))}
      </group>
    );
  }

  if (item.type === 'crumbling_platform') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        {/* Main Platform */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 0.4, 2]} />
          <meshStandardMaterial color="#79553a" />
        </mesh>
        {/* Cracks and bits */}
        <mesh position={[0.5, -0.3, 0.5]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        <mesh position={[-0.6, -0.2, -0.4]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
      </group>
    );
  }

  if (item.type === 'moving_platform') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <MovingPlatformInstance />
      </group>
    );
  }

  if (item.type === 'disappearing_block') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <DisappearingBlockInstance />
      </group>
    );
  }

  if (item.type === 'rolling_boulder') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <RollingBoulderInstance />
      </group>
    );
  }

  if (item.type === 'diamond_ore' || item.type === 'gold_ore') {
    const isDiamond = item.type === 'diamond_ore';
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial 
            color={isDiamond ? "#3498db" : "#f1c40f"} 
            emissive={isDiamond ? "#3498db" : "#f1c40f"} 
            emissiveIntensity={1} 
          />
        </mesh>
      </group>
    );
  }

  if (item.type === 'creeper') {
    return <CreeperInstance x={x} itemY={itemY} item={item} />;
  }

  if (item.type === 'coin') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <Coin position={[0, 0, 0]} />
      </group>
    );
  }

  if (item.type === 'magnet' || item.type === 'jetpack' || item.type === 'sneakers' || item.type === 'multiplier') {
    return (
      <group ref={ref} position={[x, itemY, -item.z]}>
        <Powerup position={[0, 0, 0]} type={item.type} />
      </group>
    );
  }

  return null;
}
