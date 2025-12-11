import { ShapeType } from '../types';
import * as THREE from 'three';

const PARTICLE_COUNT = 8000;

const getRandomPointInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

export const generateParticles = (type: ShapeType): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (type) {
      case ShapeType.HEART: {
        // Heart surface/volume
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * Math.PI; 
        // Modified heart shape equation
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // To make it 3D, we rotate or add volume
        const r = Math.sqrt(Math.random()) * 2; // Volume
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI; 
        
        // Use a simpler parametric heart for reliable points
        const tx = 16 * Math.pow(Math.sin(theta), 3);
        const ty = 13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta);
        
        // Scatter slightly for volume
        x = tx * 0.1 + (Math.random() - 0.5) * 0.5;
        y = ty * 0.1 + (Math.random() - 0.5) * 0.5;
        z = (Math.random() - 0.5) * 2 * (1 - Math.abs(ty)/20); // Thinner at bottom
        break;
      }

      case ShapeType.FLOWER: {
        // Rose curve 3D
        const k = 4; // Petals
        const theta = Math.random() * Math.PI * 2;
        const r = Math.cos(k * theta);
        const phi = (Math.random() - 0.5) * Math.PI; 
        
        x = r * Math.cos(theta) * 3;
        y = r * Math.sin(theta) * 3;
        z = Math.sin(phi) * r * 1.5;
        break;
      }

      case ShapeType.SATURN: {
        // Planet + Rings
        const isRing = Math.random() > 0.4;
        if (isRing) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 2;
            x = Math.cos(angle) * dist;
            z = Math.sin(angle) * dist;
            y = (Math.random() - 0.5) * 0.2;
        } else {
            const p = getRandomPointInSphere(1.5);
            x = p.x; y = p.y; z = p.z;
        }
        break;
      }

      case ShapeType.FIREWORKS: {
        // Explosion from center
        const p = getRandomPointInSphere(4);
        x = p.x; y = p.y; z = p.z;
        break;
      }

      case ShapeType.BUDDHA: {
         // Simplified meditating figure using primitives
         const section = Math.random();
         if (section < 0.2) {
             // Head
             const p = getRandomPointInSphere(0.6);
             x = p.x; y = p.y + 1.8; z = p.z;
         } else if (section < 0.6) {
             // Body
             const p = getRandomPointInSphere(1.2);
             x = p.x * 1.2; y = p.y * 1.5; z = p.z * 0.8;
         } else {
             // Legs/Base (Torus-ish)
             const angle = Math.random() * Math.PI * 2; // half circle
             const tubeRadius = 0.5;
             const ringRadius = 1.2;
             const tubeAngle = Math.random() * Math.PI * 2;
             
             x = (ringRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle);
             z = (ringRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle);
             y = tubeRadius * Math.sin(tubeAngle) - 1.2;
         }
         break;
      }

      case ShapeType.SPHERE:
      default: {
        const p = getRandomPointInSphere(3);
        x = p.x; y = p.y; z = p.z;
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};
