import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { generateParticles } from '../utils/math';

interface ParticleSceneProps {
  shape: ShapeType;
  expansion: number;
  tension: number;
  color: string;
}

const ParticleScene: React.FC<ParticleSceneProps> = ({ shape, expansion, tension, color }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Store current positions and target positions
  const { positions, originalPositions } = useMemo(() => {
    const pos = generateParticles(shape);
    return {
      positions: new Float32Array(pos), // Current render positions
      originalPositions: pos // The ideal shape positions
    };
  }, [shape]);

  // Animation Refs to manage smooth transitions
  const currentPositionsRef = useRef<Float32Array>(new Float32Array(positions.length));
  
  // Initialize current positions
  useEffect(() => {
      // When shape changes, we want to morph from *current* visual state to *new* shape.
      // So we don't reset currentPositionsRef immediately, we just update the target (originalPositions).
  }, [shape]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const currentPos = currentPositionsRef.current;
    
    // Animate
    // High tension = jitter/vibrate
    // Expansion = scale multiplier from center
    
    // Faster lerp for snappier control (5.0 instead of 3.0)
    const lerpFactor = 5.0 * delta; 
    
    // Global rotation based on time and tension
    pointsRef.current.rotation.y += delta * (0.1 + tension * 2.0);

    for (let i = 0; i < originalPositions.length; i += 3) {
      const tx = originalPositions[i];
      const ty = originalPositions[i + 1];
      const tz = originalPositions[i + 2];

      // Calculate Target with Expansion
      // Expansion 1.0 = normal size * 1.5
      // Expansion 0.0 = collapsed to center (scale 0.1)
      const scale = 0.2 + (expansion * 1.8); 
      
      let targetX = tx * scale;
      let targetY = ty * scale;
      let targetZ = tz * scale;

      // Add Tension (Jitter)
      if (tension > 0.1) {
        const jitter = tension * 0.5; 
        targetX += (Math.random() - 0.5) * jitter;
        targetY += (Math.random() - 0.5) * jitter;
        targetZ += (Math.random() - 0.5) * jitter;
      }

      // Lerp current to target
      currentPos[i] += (targetX - currentPos[i]) * lerpFactor;
      currentPos[i+1] += (targetY - currentPos[i+1]) * lerpFactor;
      currentPos[i+2] += (targetZ - currentPos[i+2]) * lerpFactor;

      // Update geometry attribute
      posAttr.setXYZ(i / 3, currentPos[i], currentPos[i+1], currentPos[i+2]);
    }
    
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions} // Initial render
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.05}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleScene;