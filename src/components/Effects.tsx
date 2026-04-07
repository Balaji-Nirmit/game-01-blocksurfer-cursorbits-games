import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function JetpackThruster({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
      p.push({
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.1, -Math.random() * 0.2, (Math.random() - 0.5) * 0.1),
        life: Math.random(),
        scale: Math.random() * 0.2 + 0.1
      });
    }
    return p;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    particles.forEach((p, i) => {
      p.life -= delta * 2;
      if (p.life <= 0) {
        p.life = 1;
        p.pos.set(0, 0, 0);
      }
      p.pos.addScaledVector(p.vel, delta * 60);
      
      const mesh = groupRef.current!.children[i] as THREE.Mesh;
      if (mesh) {
        mesh.position.copy(p.pos);
        mesh.scale.setScalar(p.life * p.scale);
        (mesh.material as THREE.MeshStandardMaterial).opacity = p.life;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#ffaa00" : "#ff4400"} 
            transparent 
            emissive={i % 2 === 0 ? "#ffaa00" : "#ff4400"}
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
}
