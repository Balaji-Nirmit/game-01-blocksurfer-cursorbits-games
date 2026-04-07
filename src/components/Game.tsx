import { Canvas, useFrame } from '@react-three/fiber';
import { Player } from './Player';
import { World } from './World';
import { useGameStore } from '../store';
import { CONSTANTS } from '../utils/constants';
import * as THREE from 'three';
import { useRef, useEffect, Suspense } from 'react';
import { globalGameState } from '../utils/gameState';

function CameraController() {
  const statusRef = useRef(useGameStore.getState().status);
  const powerupsRef = useRef(useGameStore.getState().powerups);
  const shakeTime = useRef(0);

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      statusRef.current = state.status;
      powerupsRef.current = state.powerups;
    });
  }, []);
  
  useFrame((state, delta) => {
    const playerPos = globalGameState.playerPosition;
    const status = statusRef.current;

    if (status === 'gameover') {
      if (shakeTime.current < 0.5) {
        shakeTime.current += delta;
        const shakeAmt = (0.5 - shakeTime.current) * 2;
        state.camera.position.x = (Math.random() - 0.5) * shakeAmt;
        state.camera.position.y = 5 + playerPos.y * 0.5 + (Math.random() - 0.5) * shakeAmt;
      }
      return;
    } else {
      shakeTime.current = 0;
    }

    if (status !== 'playing') return;

    const hasJetpack = powerupsRef.current.jetpack > 0;

    // Target camera position
    const targetY = hasJetpack ? CONSTANTS.JETPACK_HEIGHT + 5 : 5 + playerPos.y;
    const targetZ = hasJetpack ? 15 : 10;
    
    // Smoothly interpolate camera position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, playerPos.x * 0.5, delta * 5);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 5);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 5);
    
    // Look at player slightly ahead
    const lookAtTarget = new THREE.Vector3(playerPos.x * 0.2, playerPos.y + 1, -10);
    state.camera.lookAt(lookAtTarget);
  });

  return null;
}

function GameManager() {
  const statusRef = useRef(useGameStore.getState().status);
  const addScore = useGameStore.getState().addScore;
  const increaseSpeed = useGameStore.getState().increaseSpeed;
  const tickPowerups = useGameStore.getState().tickPowerups;

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      statusRef.current = state.status;
    });
  }, []);

  useFrame((state, delta) => {
    if (statusRef.current === 'playing') {
      const speed = useGameStore.getState().speed;
      addScore(speed * delta);
      increaseSpeed(delta * 0.1); // Slowly increase speed
      tickPowerups(delta);
    }
  });

  return null;
}

export function Game() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[20, 40, 20]} 
        castShadow 
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={150}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <CameraController />
      <Player />
      <Suspense fallback={null}>
        <World />
      </Suspense>
      <GameManager />
    </Canvas>
  );
}
