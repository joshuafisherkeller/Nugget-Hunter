
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  BOSS_INTRO = 'BOSS_INTRO',
  BOSS_FIGHT = 'BOSS_FIGHT',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER'
}

export enum ProjectileType {
  BANANA = 'BANANA',
  APPLE = 'APPLE'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  isDead: boolean;
}

export interface Enemy extends Entity {
  type: 'NUGGET' | 'BOSS' | 'MINI_NUGGET';
  hp: number;
  maxHp: number;
}

export interface Projectile extends Entity {
  type: ProjectileType;
  trail: Vector2[]; // For smoke trails
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  vy: number;
  scale: number;
}

export interface PowerUp extends Entity {
  type: 'VESTIGAL';
  pulse: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface GameAssets {
  logo: HTMLImageElement;
  box: HTMLImageElement;
  nugget: HTMLImageElement;
  boss: HTMLImageElement;
  ribbon: HTMLImageElement;
  banana: HTMLImageElement;
  apple: HTMLImageElement;
}
