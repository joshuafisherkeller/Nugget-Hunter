
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  Entity, 
  Enemy, 
  Projectile, 
  ProjectileType, 
  GameAssets,
  Particle
} from '../types';
import { 
  GRAVITY, 
  PROJECTILE_SPEED, 
  ENEMY_LAUNCH_SPEED_MIN, 
  ENEMY_LAUNCH_SPEED_MAX,
  BOSS_SPEED,
  BOSS_HITS_REQUIRED,
  SPAWN_RATE_MS,
  COLORS,
  NUGGET_SIZE,
  BOSS_SIZE,
  MINI_NUGGET_SIZE,
  BOX_WIDTH,
  BOX_HEIGHT,
  PROJECTILE_SIZE,
  TOTAL_NUGGETS_LEVEL_1
} from '../constants';
import { playSound } from '../services/audioService';

interface GameCanvasProps {
  assets: GameAssets | null;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setBossHp: (hp: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  assets, 
  gameState, 
  setGameState, 
  setScore,
  setBossHp 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable Game State
  const scoreRef = useRef(0);
  const projectiles = useRef<Projectile[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const particles = useRef<Particle[]>([]);
  const playerAngle = useRef(-Math.PI / 2); // Point up by default
  const lastSpawnTime = useRef(0);
  const spawnedNuggets = useRef(0);
  const animationFrameId = useRef<number>(0);
  const bossEntity = useRef<Enemy | null>(null);
  const currentAmmo = useRef<ProjectileType>(ProjectileType.APPLE);
  
  const mousePos = useRef({ x: 0, y: 0 });

  const initGame = useCallback(() => {
    projectiles.current = [];
    enemies.current = [];
    particles.current = [];
    scoreRef.current = 0;
    spawnedNuggets.current = 0;
    bossEntity.current = null;
    lastSpawnTime.current = 0;
    setScore(0);
    setBossHp(BOSS_HITS_REQUIRED);
  }, [setScore, setBossHp]);

  // Use Window dimensions directly to avoid container collapse issues
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
          w: window.innerWidth,
          h: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    // Force initial resize to catch any loading shifts
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spawn Logic
  const spawnNugget = (timestamp: number, width: number, height: number) => {
    if (gameState !== GameState.PLAYING) return;

    // Stop spawning regular nuggets if we reached the limit
    if (spawnedNuggets.current >= TOTAL_NUGGETS_LEVEL_1) return;

    if (timestamp - lastSpawnTime.current > SPAWN_RATE_MS) {
      // Calculate box position (same as draw logic)
      const boxY = height - BOX_HEIGHT - 120; // Move up to clear crossbow
      const boxX = width / 2;
      
      const angle = (Math.PI / 2) + (Math.random() * 0.4 - 0.2); // Tighter upward cone
      const speed = ENEMY_LAUNCH_SPEED_MIN + Math.random() * (ENEMY_LAUNCH_SPEED_MAX - ENEMY_LAUNCH_SPEED_MIN);

      const newNugget: Enemy = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'NUGGET',
        x: boxX,
        y: boxY + 50, // Start inside box
        width: NUGGET_SIZE,
        height: NUGGET_SIZE,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed, // Launch Upwards
        rotation: Math.random() * Math.PI,
        isDead: false,
        hp: 1,
        maxHp: 1
      };

      enemies.current.push(newNugget);
      spawnedNuggets.current += 1;
      lastSpawnTime.current = timestamp;
      playSound('LAUNCH');
    }
  };

  const spawnBoss = (width: number, height: number) => {
    const newBoss: Enemy = {
      id: 'BOSS',
      type: 'BOSS',
      x: width / 2,
      y: -BOSS_SIZE, // Start from top
      width: BOSS_SIZE,
      height: BOSS_SIZE,
      vx: 3,
      vy: 2, 
      rotation: 0,
      isDead: false,
      hp: BOSS_HITS_REQUIRED,
      maxHp: BOSS_HITS_REQUIRED
    };
    bossEntity.current = newBoss;
    enemies.current.push(newBoss);
    setGameState(GameState.BOSS_FIGHT);
    playSound('LAUNCH');
  };

  const spawnMiniNuggets = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 / 15) * i;
        const speed = 2 + Math.random() * 2;
        const mini: Enemy = {
            id: `MINI_${i}_${Math.random()}`,
            type: 'MINI_NUGGET',
            x: x,
            y: y,
            width: MINI_NUGGET_SIZE,
            height: MINI_NUGGET_SIZE,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI,
            isDead: false,
            hp: 1,
            maxHp: 1
        };
        enemies.current.push(mini);
    }
    playSound('LAUNCH');
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        isDead: false,
        life: 1.0,
        maxLife: 1.0,
        color
      });
    }
  };

  const update = useCallback((timestamp: number, width: number, height: number) => {
    // Win Condition Check
    if (gameState === GameState.BOSS_FIGHT && !bossEntity.current && enemies.current.length === 0) {
        setGameState(GameState.WON);
        playSound('WIN');
    }

    // Boss Intro Trigger - Wait until all nuggets are spawned AND destroyed
    if (gameState === GameState.PLAYING && spawnedNuggets.current >= TOTAL_NUGGETS_LEVEL_1 && enemies.current.length === 0 && !bossEntity.current) {
       setGameState(GameState.BOSS_INTRO);
       setTimeout(() => spawnBoss(width, height), 2500); 
    }

    // Projectiles
    projectiles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation = Math.atan2(p.vy, p.vx); // Rotate to follow trajectory
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.isDead = true;
      }
    });

    // Enemies
    enemies.current.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      
      if (e.type === 'NUGGET') {
          // New "Floating" Physics
          e.rotation += 0.05;

          // Drag effect - slow down initial launch to a float speed
          const speed = Math.sqrt(e.vx*e.vx + e.vy*e.vy);
          if (speed > 4) {
              e.vx *= 0.96;
              e.vy *= 0.96;
          }

          // Bounce off walls (Asteroid style)
          if (e.x < e.width/2 || e.x > width - e.width/2) {
             e.vx *= -1;
             e.x = Math.max(e.width/2, Math.min(width - e.width/2, e.x));
          }
          if (e.y < e.height/2 || e.y > height - 100) { 
             e.vy *= -1;
             e.y = Math.max(e.height/2, Math.min(height - 100, e.y));
          }

      } else if (e.type === 'BOSS') {
          // Boss Logic: Float and Bounce
          e.rotation += 0.01;
          
          // Bounce off walls
          if (e.x < e.width/2 || e.x > width - e.width/2) {
              e.vx *= -1;
              e.x = Math.max(e.width/2, Math.min(width - e.width/2, e.x));
          }
          if (e.y < e.height/2 || e.y > height - e.height/2 - 100) { // Keep above player
              e.vy *= -1;
              e.y = Math.max(e.height/2, Math.min(height - e.height/2 - 100, e.y));
          }

          // Randomly change direction slightly for natural float
          if (Math.random() < 0.02) {
              e.vx += (Math.random() - 0.5) * 2;
              e.vy += (Math.random() - 0.5) * 2;
              // Clamp speed
              const speed = Math.sqrt(e.vx*e.vx + e.vy*e.vy);
              if (speed > BOSS_SPEED) {
                  e.vx = (e.vx / speed) * BOSS_SPEED;
                  e.vy = (e.vy / speed) * BOSS_SPEED;
              }
          }
      } else if (e.type === 'MINI_NUGGET') {
          // Mini Nugget Logic: Float slowly like asteroids
          e.rotation += 0.03;
          
          // Bounce
          if (e.x < 0 || e.x > width) e.vx *= -1;
          if (e.y < 0 || e.y > height) e.vy *= -1;
      }
    });

    // Particles
    particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Particle gravity
        p.life -= 0.03;
        if (p.life <= 0) p.isDead = true;
    });

    // Collisions
    projectiles.current.forEach(p => {
      if (p.isDead) return;
      
      enemies.current.forEach(e => {
        if (e.isDead || p.isDead) return;
        
        const dx = (p.x) - (e.x);
        const dy = (p.y) - (e.y);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radiusSum = (p.width/2) + (e.width/2);

        if (dist < radiusSum * 0.9) { 
          p.isDead = true;
          e.hp -= 1;
          
          if (e.type === 'BOSS') {
            playSound('BOSS_HIT');
            createExplosion(p.x, p.y, '#FF0000', 5);
          } else {
            playSound('HIT');
            createExplosion(e.x, e.y, '#D4AF37', 15);
          }

          if (e.hp <= 0) {
            e.isDead = true;
            if (e.type === 'BOSS') {
                // BOSS DEFEATED - Split into minis
                bossEntity.current = null;
                createExplosion(e.x, e.y, '#FFD700', 50);
                spawnMiniNuggets(e.x, e.y);
                // Don't set WON yet
            } else if (e.type === 'NUGGET') {
               scoreRef.current += 1;
               setScore(scoreRef.current);
            }
          } else if (e.type === 'BOSS') {
              setBossHp(e.hp);
          }
        }
      });
    });

    projectiles.current = projectiles.current.filter(p => !p.isDead);
    enemies.current = enemies.current.filter(e => !e.isDead);
    particles.current = particles.current.filter(p => !p.isDead);

    spawnNugget(timestamp, width, height);

  }, [gameState, setGameState, setScore, setBossHp]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Realistic Background
    const gradient = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
    gradient.addColorStop(0, COLORS.BACKGROUND_GRADIENT_START);
    gradient.addColorStop(1, COLORS.BACKGROUND_GRADIENT_END);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Box (Spawn Point) - Adjusted position to NOT be blocked by crossbow
    const boxX = (width/2) - (BOX_WIDTH/2);
    // Move box up so it sits "behind" the player in perspective
    const boxY = height - BOX_HEIGHT - 120; 

    if (assets?.box && assets.box.width >= 50) { // Check if real image loaded
        ctx.drawImage(assets.box, boxX, boxY, BOX_WIDTH, BOX_HEIGHT);
    } else {
        // Fallback: Code-drawn realistic box
        ctx.save();
        
        // Shadow
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 30;
        
        // Box shape (Trapezoid for 3D effect)
        ctx.beginPath();
        ctx.moveTo(boxX + 10, boxY); // Top Left
        ctx.lineTo(boxX + BOX_WIDTH - 10, boxY); // Top Right
        ctx.lineTo(boxX + BOX_WIDTH, boxY + BOX_HEIGHT); // Bottom Right
        ctx.lineTo(boxX, boxY + BOX_HEIGHT); // Bottom Left
        ctx.closePath();
        
        // Cardboard/Wood Gradient
        const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + BOX_HEIGHT);
        boxGrad.addColorStop(0, '#d3a87c'); // Light cardboard
        boxGrad.addColorStop(1, '#a07a53'); // Darker bottom
        ctx.fillStyle = boxGrad;
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#8d6e4b';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Branding Background
        ctx.fillStyle = '#c0392b'; // Red brand color
        ctx.beginPath();
        ctx.rect(boxX + 20, boxY + 50, BOX_WIDTH - 40, 80);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText("Gettin'", width/2, boxY + 80);
        
        ctx.font = 'bold italic 45px "Press Start 2P", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText("FRUTTY", width/2, boxY + 120);
        
        ctx.restore();
    }

    // Draw Player (Modern Crossbow)
    const px = width / 2;
    const py = height - 50;
    
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerAngle.current);
    
    // Laser Sight
    ctx.beginPath();
    ctx.strokeStyle = COLORS.AIM_LINE;
    ctx.lineWidth = 2;
    ctx.moveTo(30, 0);
    ctx.lineTo(1000, 0);
    ctx.stroke();
    
    // Crossbow Render
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    
    // Stock
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-20, -10, 80, 20);
    
    // Limbs
    ctx.beginPath();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 6;
    ctx.moveTo(40, -60);
    ctx.quadraticCurveTo(20, 0, 40, 60);
    ctx.stroke();
    
    // String
    ctx.beginPath();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.moveTo(40, -60);
    ctx.lineTo(0, 0);
    ctx.lineTo(40, 60);
    ctx.stroke();

    ctx.restore();

    // Draw Enemies (Realistic rendering)
    enemies.current.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);
        
        // Drop shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 10;

        if (e.type === 'BOSS' && assets?.boss && assets.boss.width >= 50) {
             // If boss asset loaded
            ctx.drawImage(assets.boss, -e.width/2, -e.height/2, e.width, e.height);
        } else if ((e.type === 'NUGGET' || e.type === 'MINI_NUGGET') && assets?.nugget && assets.nugget.width >= 50) {
             // If nugget asset loaded
            ctx.drawImage(assets.nugget, -e.width/2, -e.height/2, e.width, e.height);
        } else {
            // High fidelity fallback drawing
            if (e.type === 'BOSS') {
                // Giant Golden Nugget Boss with Shading
                const bossGrad = ctx.createRadialGradient(-10, -10, 20, 0, 0, e.width/1.5);
                bossGrad.addColorStop(0, '#ffd700'); // Highlight
                bossGrad.addColorStop(0.5, '#daa520'); // Gold
                bossGrad.addColorStop(1, '#b8860b'); // Shadow
                ctx.fillStyle = bossGrad;
                
                ctx.beginPath();
                const r = e.width/2;
                ctx.moveTo(r, 0);
                for(let i=0; i<8; i++) {
                    const angle = (i/8) * Math.PI * 2;
                    const rad = r + (Math.sin(i*3) * 10);
                    ctx.lineTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
                }
                ctx.closePath();
                ctx.fill();
                
                // Face
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(-30, -20, 15, 0, Math.PI*2); // Eye L
                ctx.arc(30, -20, 15, 0, Math.PI*2); // Eye R
                ctx.fill();
                
                // Eyebrows (Angry)
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(-50, -40); ctx.lineTo(-10, -25);
                ctx.moveTo(50, -40); ctx.lineTo(10, -25);
                ctx.stroke();

                // Mouth
                ctx.beginPath();
                ctx.arc(0, 30, 40, 0.2, Math.PI - 0.2, false);
                ctx.lineWidth = 5;
                ctx.stroke();
            } else {
                // Realistic Nugget shape (lumpy 3D)
                // Gradient for roundness
                const nuggetGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, e.width/2);
                nuggetGrad.addColorStop(0, '#e1c699'); // Highlight (Breading light)
                nuggetGrad.addColorStop(0.4, '#d4af37'); // Golden
                nuggetGrad.addColorStop(1, '#aa8830'); // Darker crisp
                
                if (e.type === 'MINI_NUGGET') {
                     // Slightly redder/darker for cooked chunks
                     nuggetGrad.addColorStop(0, '#e6cdac'); 
                     nuggetGrad.addColorStop(1, '#a0522d');
                }
                
                ctx.fillStyle = nuggetGrad;

                ctx.beginPath();
                const r = e.width/2;
                ctx.moveTo(r, 0);
                for(let i=0; i<7; i++) {
                    const angle = (i/7) * Math.PI * 2;
                    const rad = r + (Math.random() * 6 - 3); // Lumpy
                    ctx.lineTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
                }
                ctx.closePath();
                ctx.fill();
                
                // Texture details (pepper flakes / breading shadow)
                ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
                for(let i=0; i<3; i++) {
                    ctx.beginPath();
                    const tx = (Math.random() - 0.5) * e.width * 0.6;
                    const ty = (Math.random() - 0.5) * e.height * 0.6;
                    ctx.arc(tx, ty, 2, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    });

    // Draw Projectiles
    projectiles.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        let img = assets?.apple;
        if (p.type === ProjectileType.BANANA) img = assets?.banana;

        if (img && img.width > 10) {
            // Draw sprite rotated 90deg to face direction of travel if needed, assume sprite is upright
            ctx.drawImage(img, -p.width/2, -p.height/2, p.width, p.height);
        } else {
            // Draw realistic fruit fallback
            if (p.type === ProjectileType.APPLE) {
                ctx.fillStyle = '#e74c3c'; // Red Apple
                ctx.beginPath();
                ctx.arc(0, 0, p.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.arc(-5, -5, 5, 0, Math.PI*2);
                ctx.fill();

                // Leaf
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath();
                ctx.ellipse(0, -15, 5, 10, Math.PI/4, 0, Math.PI*2);
                ctx.fill();
            } else {
                // Banana
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.ellipse(0, 0, p.width/2, p.height/4, 0, 0, Math.PI*2);
                ctx.fill();
                // Ends
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(-p.width/2, 0, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.restore();
    });

    // Draw Particles
    particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width/2, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

  }, [assets]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${dimensions.w}px`;
    canvas.style.height = `${dimensions.h}px`;

    const loop = (timestamp: number) => {
      update(timestamp, dimensions.w, dimensions.h);
      draw(ctx, dimensions.w, dimensions.h);
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [dimensions, draw, update]);

  // Init
  useEffect(() => {
    if (gameState === GameState.START) initGame();
  }, [gameState, initGame]);

  // Inputs
  const handleInputMove = (clientX: number, clientY: number) => {
    mousePos.current = { x: clientX, y: clientY };
    const px = dimensions.w / 2;
    const py = dimensions.h - 50;
    playerAngle.current = Math.atan2(clientY - py, clientX - px);
  };

  const handleShoot = () => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.BOSS_FIGHT) return;

    const px = dimensions.w / 2;
    const py = dimensions.h - 50;
    const angle = playerAngle.current;

    const newProjectile: Projectile = {
        id: Math.random().toString(),
        type: currentAmmo.current,
        x: px,
        y: py,
        width: PROJECTILE_SIZE,
        height: PROJECTILE_SIZE,
        vx: Math.cos(angle) * PROJECTILE_SPEED,
        vy: Math.sin(angle) * PROJECTILE_SPEED,
        rotation: angle,
        isDead: false
    };

    projectiles.current.push(newProjectile);
    playSound('SHOOT');
    
    // Auto-swap ammo
    currentAmmo.current = currentAmmo.current === ProjectileType.APPLE ? ProjectileType.BANANA : ProjectileType.APPLE;
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      onTouchMove={(e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
      onMouseDown={handleShoot}
      onTouchStart={handleShoot}
    >
      <canvas 
        ref={canvasRef} 
        className="block cursor-crosshair absolute top-0 left-0 touch-none" 
      />
    </div>
  );
};

export default GameCanvas;
