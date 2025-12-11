export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Meditate',
  FIREWORKS = 'Fireworks',
  SPHERE = 'Sphere'
}

export interface ParticleState {
  expansion: number; // 0.0 to 1.0 (Closed to Open)
  tension: number;   // 0.0 to 1.0 (Relaxed to Tense/Fists)
  color: string;
  shape: ShapeType;
}

export interface HandGestureData {
  expansion: number;
  tension: number;
}
