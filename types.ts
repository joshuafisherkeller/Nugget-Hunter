
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
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  color: string;
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
