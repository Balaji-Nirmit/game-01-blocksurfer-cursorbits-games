import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { CONSTANTS } from '../utils/constants';
import { useGameStore } from '../store';
import { globalGameState } from '../utils/gameState';
import { soundManager } from '../utils/soundManager';

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const { input } = useInput();
  const status = useGameStore((state) => state.status);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  
  const [lane, setLane] = useState(0); // -1, 0, 1
  const velocityRef = useRef(0);
  const isJumpingRef = useRef(false);
  const [isRolling, setIsRolling] = useState(false);
  
  // Input handling flags to prevent continuous triggering
  const prevInput = useRef({ left: false, right: false, up: false, down: false });

  const [isDead, setIsDead] = useState(false);

  useEffect(() => {
    if (status === 'gameover') {
      setIsDead(true);
      soundManager.stopRunning();
      soundManager.stopBgMusic();
      soundManager.play('hit');
    } else if (status === 'playing') {
      setIsDead(false);
      setLane(0);
      velocityRef.current = 0;
      isJumpingRef.current = false;
      setIsRolling(false);
      if (groupRef.current) {
        groupRef.current.position.set(0, 1.5, CONSTANTS.PLAYER_Z);
        groupRef.current.rotation.set(0, 0, 0);
      }
      soundManager.startRunning();
    } else {
      setLane(0);
      velocityRef.current = 0;
      isJumpingRef.current = false;
      setIsRolling(false);
      if (groupRef.current) {
        groupRef.current.position.set(0, 1.5, CONSTANTS.PLAYER_Z);
        groupRef.current.rotation.set(0, 0, 0);
      }
      soundManager.stopRunning();
    }
  }, [status]);

  useEffect(() => {
    if (!soundEnabled) {
      soundManager.stopRunning();
      soundManager.stopBgMusic();
    } else if (status === 'playing') {
      soundManager.startRunning();
      soundManager.startBgMusic();
    }
  }, [soundEnabled, status]);

  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const characterRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || !characterRef.current) return;

    if (isDead) {
      // Death animation: fall backward
      characterRef.current.rotation.x = THREE.MathUtils.lerp(characterRef.current.rotation.x, -Math.PI / 2, delta * 5);
      characterRef.current.position.y = THREE.MathUtils.lerp(characterRef.current.position.y, 0.5, delta * 5);
      return;
    }

    if (status !== 'playing') return;

    const powerups = useGameStore.getState().powerups;
    const hasJetpack = powerups.jetpack > 0;
    const hasSneakers = powerups.sneakers > 0;

    // Animation
    const time = state.clock.getElapsedTime();
    const runSpeed = 15;
    const speed = useGameStore.getState().speed;
    const animSpeed = runSpeed * (speed / CONSTANTS.BASE_SPEED);
    
    // Update sound rate based on speed
    soundManager.updateRunningRate(speed);

    if (isJumpingRef.current || hasJetpack) {
      // Jump/Fly Pose
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI * 0.8, 10 * delta);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI * 0.1, 10 * delta);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI * 0.8, 10 * delta);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI * 0.1, 10 * delta);
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -Math.PI * 0.2, 10 * delta);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.2, 10 * delta);
      
      characterRef.current.rotation.y = THREE.MathUtils.lerp(characterRef.current.rotation.y, 0, 10 * delta);
      characterRef.current.position.y = THREE.MathUtils.lerp(characterRef.current.position.y, Math.sin(time * 5) * 0.05, 10 * delta);
      
      // Stop running sound while jumping or flying
      soundManager.stopRunning();
    } else if (isRolling) {
      // Roll/Slide Pose
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.PI * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.PI * 0.8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      characterRef.current.rotation.y = THREE.MathUtils.lerp(characterRef.current.rotation.y, 0, 15 * delta);
      
      // Stop running sound while rolling
      soundManager.stopRunning();
    } else {
      // Run Animation
      const swing = Math.sin(time * animSpeed);
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing * 0.8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.8;
      
      // Head bob and body tilt
      characterRef.current.rotation.y = swing * 0.05;
      characterRef.current.position.y = Math.abs(swing) * 0.1;
      characterRef.current.rotation.z = -swing * 0.02;

      // Start running sound if not already playing
      soundManager.startRunning();
    }

    // Handle Lane Changes
    if (input.left && !prevInput.current.left && lane > -1) {
      setLane(lane - 1);
      soundManager.play('slide');
    }
    if (input.right && !prevInput.current.right && lane < 1) {
      setLane(lane + 1);
      soundManager.play('slide');
    }

    // Handle Jump
    if (input.up && !prevInput.current.up && !isJumpingRef.current && !hasJetpack) {
      velocityRef.current = hasSneakers ? CONSTANTS.SNEAKER_JUMP_FORCE : CONSTANTS.JUMP_FORCE;
      isJumpingRef.current = true;
      setIsRolling(false);
      soundManager.play('jump');
    }

    // Handle Roll (Slide)
    if (input.down && !prevInput.current.down && !hasJetpack) {
      if (isJumpingRef.current) {
        velocityRef.current = -CONSTANTS.JUMP_FORCE; // Fast fall
      }
      setIsRolling(true);
      soundManager.play('slide');
      setTimeout(() => setIsRolling(false), 800); // Roll duration
    }

    prevInput.current = { ...input };

    // Movement Physics
    const targetX = lane * CONSTANTS.LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 15 * delta);

    if (isRolling && !isJumpingRef.current) {
       // Slide backward (lying down)
       characterRef.current.rotation.x = THREE.MathUtils.lerp(characterRef.current.rotation.x, -Math.PI / 2, 15 * delta);
       characterRef.current.position.y = THREE.MathUtils.lerp(characterRef.current.position.y, 0.5, 15 * delta);
    } else {
       characterRef.current.rotation.x = THREE.MathUtils.lerp(characterRef.current.rotation.x, 0, 15 * delta);
       characterRef.current.position.y = THREE.MathUtils.lerp(characterRef.current.position.y, 0, 15 * delta);
    }

    if (hasJetpack) {
      // Fly up to jetpack height
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, CONSTANTS.JETPACK_HEIGHT, 5 * delta);
      velocityRef.current = 0;
      isJumpingRef.current = false;
      setIsRolling(false);
    } else {
      // Apply gravity
      groupRef.current.position.y += velocityRef.current * delta;
      velocityRef.current += CONSTANTS.GRAVITY * delta;

      // Ground collision
      // Track block is at y=0, rendered at y=0.5. Top of block is 1.5.
      // Player group y is at feet. So feet should be at 1.5.
      if (groupRef.current.position.y <= 1.5) {
        groupRef.current.position.y = 1.5;
        velocityRef.current = 0;
        isJumpingRef.current = false;
      }
    }

    // Update global state for collision detection
    globalGameState.playerPosition.copy(groupRef.current.position);
    globalGameState.isRolling = isRolling;
    
    // Update bounding box
    const boxHeight = isRolling ? 0.8 : (isJumpingRef.current ? 1.2 : 1.8);
    // If rolling, box is lower. If jumping, box is also slightly smaller to be more forgiving.
    // The player's group position y is at their feet (1.5).
    const boxY = groupRef.current.position.y + boxHeight / 2;
    globalGameState.playerBox.setFromCenterAndSize(
      new THREE.Vector3(groupRef.current.position.x, boxY, groupRef.current.position.z),
      new THREE.Vector3(0.6, boxHeight, 0.6) // Slightly narrower box for better feel
    );
  });

  // Minecraft Steve-like colors
  const skinColor = '#e0b096';
  const shirtColor = '#00a8a8';
  const pantsColor = '#42428f';
  const shoesColor = '#5c5c5c';

  return (
    <group ref={groupRef} position={[0, 0, CONSTANTS.PLAYER_Z]}>
      <group ref={characterRef}>
        {/* Head */}
        <mesh position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinColor} />
          {/* Hair */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.52, 0.3, 0.52]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          <mesh position={[0, 0.2, -0.1]}>
            <boxGeometry args={[0.52, 0.2, 0.4]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[0.06, 0.08, 0.02]} />
              <meshStandardMaterial color="#42428f" />
            </mesh>
          </mesh>
          <mesh position={[0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[0.06, 0.08, 0.02]} />
              <meshStandardMaterial color="#42428f" />
            </mesh>
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.05, 0.28]}>
            <boxGeometry args={[0.1, 0.1, 0.05]} />
            <meshStandardMaterial color="#d2a086" />
          </mesh>
          {/* Mouth/Beard */}
          <mesh position={[0, -0.18, 0.26]}>
            <boxGeometry args={[0.25, 0.08, 0.02]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
        </mesh>
        
        {/* Body */}
        <mesh position={[0, 1.125, 0]} castShadow>
          <boxGeometry args={[0.5, 0.75, 0.25]} />
          <meshStandardMaterial color={shirtColor} />
          {/* Shirt Detail */}
          <mesh position={[0, 0.3, 0.13]}>
            <boxGeometry args={[0.2, 0.15, 0.02]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.375, 1.5, 0]}>
          <group position={[0, -0.375, 0]}>
            {/* Sleeve */}
            <mesh position={[0, 0.125, 0]} castShadow>
              <boxGeometry args={[0.25, 0.5, 0.25]} />
              <meshStandardMaterial color={shirtColor} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
          </group>
        </group>
        <group ref={rightArmRef} position={[0.375, 1.5, 0]}>
          <group position={[0, -0.375, 0]}>
            {/* Sleeve */}
            <mesh position={[0, 0.125, 0]} castShadow>
              <boxGeometry args={[0.25, 0.5, 0.25]} />
              <meshStandardMaterial color={shirtColor} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
          </group>
        </group>

        {/* Legs */}
        <group ref={leftLegRef} position={[-0.125, 0.75, 0]}>
          <group position={[0, -0.375, 0]}>
            {/* Pants */}
            <mesh position={[0, 0.125, 0]} castShadow>
              <boxGeometry args={[0.25, 0.5, 0.25]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            {/* Shoe */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshStandardMaterial color={shoesColor} />
            </mesh>
          </group>
        </group>
        <group ref={rightLegRef} position={[0.125, 0.75, 0]}>
          <group position={[0, -0.375, 0]}>
            {/* Pants */}
            <mesh position={[0, 0.125, 0]} castShadow>
              <boxGeometry args={[0.25, 0.5, 0.25]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            {/* Shoe */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshStandardMaterial color={shoesColor} />
            </mesh>
          </group>
        </group>
        
        {/* Powerup Visuals */}
        <PowerupVisuals />
        
      </group>
    </group>
  );
}

function JetpackThruster({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 5; i++) {
      temp.push({
        offset: new THREE.Vector3((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1),
        speed: Math.random() * 2 + 1,
        life: Math.random(),
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        p.life -= delta * 2;
        if (p.life <= 0) {
          p.life = 1;
          child.position.set(p.offset.x, p.offset.y, p.offset.z);
        }
        child.position.y -= p.speed * delta;
        child.scale.setScalar(p.life);
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = p.life;
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#00ffff" transparent emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function PowerupVisuals() {
  const jetpack = useGameStore((state) => state.powerups.jetpack);
  const sneakers = useGameStore((state) => state.powerups.sneakers);
  const magnet = useGameStore((state) => state.powerups.magnet);
  const multiplier = useGameStore((state) => state.powerups.multiplier);

  return (
    <>
      {/* Jetpack Visual */}
      {jetpack > 0 && (
        <group position={[0, 1.125, -0.2]}>
          {/* Main Tank */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.7, 0.3]} />
            <meshStandardMaterial color="#444444" metalness={1} roughness={0.2} />
          </mesh>
          {/* Side Thrusters */}
          <mesh castShadow position={[-0.3, -0.1, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          <mesh castShadow position={[0.3, -0.1, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          {/* Glowing Core */}
          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[0.2, 0.2, 0.05]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
          </mesh>
          {/* Thruster Particles */}
          <JetpackThruster position={[-0.3, -0.4, 0]} />
          <JetpackThruster position={[0.3, -0.4, 0]} />
        </group>
      )}
      
      {/* Sneakers Visual */}
      {sneakers > 0 && (
        <group>
          {/* Left Shoe Wings */}
          <group position={[-0.125, 0.1, 0]}>
            <mesh position={[-0.15, 0.1, -0.1]} rotation={[0, -0.5, 0.5]}>
              <boxGeometry args={[0.05, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
              <meshStandardMaterial color="#00ffff" transparent opacity={0.5} emissive="#00ffff" emissiveIntensity={1} />
            </mesh>
          </group>
          {/* Right Shoe Wings */}
          <group position={[0.125, 0.1, 0]}>
            <mesh position={[0.15, 0.1, -0.1]} rotation={[0, 0.5, -0.5]}>
              <boxGeometry args={[0.05, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
              <meshStandardMaterial color="#00ffff" transparent opacity={0.5} emissive="#00ffff" emissiveIntensity={1} />
            </mesh>
          </group>
        </group>
      )}

      {/* Magnet Visual */}
      {magnet > 0 && (
        <group position={[0, 2.2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.05, 16, 32]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
          </mesh>
          <pointLight color="#ff0000" intensity={2} distance={2} />
        </group>
      )}

      {/* Multiplier Visual */}
      {multiplier > 0 && (
        <group position={[0, 2.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#ff00ff" intensity={2} distance={2} />
        </group>
      )}
    </>
  );
}
