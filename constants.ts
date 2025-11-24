

// Physics Constants
export const GRAVITY = 0.5; // Slightly heavier feel
export const FRICTION = 0.99;
export const PROJECTILE_SPEED = 22; // Faster, more realistic arrow speed
export const ENEMY_LAUNCH_SPEED_MIN = 12;
export const ENEMY_LAUNCH_SPEED_MAX = 18;
export const BOSS_SPEED = 5;
export const BOSS_HITS_REQUIRED = 15;
export const SPAWN_RATE_MS = 2000; // 2 seconds
export const TOTAL_NUGGETS_LEVEL_1 = 15;

// Dimensions
export const PLAYER_SIZE = 80;
export const NUGGET_SIZE = 70; // Bigger targets
export const BOSS_SIZE = 200; // Giant Nugget
export const MINI_NUGGET_SIZE = 45; // Asteroid chunks
export const PROJECTILE_SIZE = 40;
export const BOX_WIDTH = 300; 
export const BOX_HEIGHT = 200;

// Asset URLs - Pointing to where user files would likely be, with fallbacks
export const ASSET_URLS = {
  LOGO: './nispy_logo.png', 
  BOX: './gettin_frutty_box.jpg', 
  NUGGET: './nugget.png',
  BOSS: './boss_face.png', // The nugget with the face
  RIBBON: './ribbon.png',
  BANANA: './banana.png',
  APPLE: './apple.png',
};

// Colors - More realistic/Modern Palette
export const COLORS = {
  BACKGROUND_GRADIENT_START: '#1a1c20',
  BACKGROUND_GRADIENT_END: '#000000',
  GROUND: '#111', 
  CROSSBOW: '#8B4513', // Wood texture color
  AIM_LINE: 'rgba(255, 0, 0, 0.6)', // Laser sight look
};