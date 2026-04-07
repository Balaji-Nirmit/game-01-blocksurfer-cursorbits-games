import * as THREE from 'three';

export const globalGameState = {
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerBox: new THREE.Box3(),
  isRolling: false,
};
