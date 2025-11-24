
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  Enemy, 
  Projectile, 
  ProjectileType, 
  GameAssets,
  Particle,
  FloatingText,
  PowerUp,
  Star
} from '../types';
import { 
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
  TOTAL_NUGGETS_LEVEL_1,
  POWERUP_SIZE,
  WAVE_SIZE,
  WAVE_DELAY_MS
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
  
  // Game State Refs
  const scoreRef = useRef(0);
  const projectiles = useRef<Projectile[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const powerUps = useRef<PowerUp[]>([]);
  const stars = useRef<Star[]>([]);
  
  const playerAngle = useRef(-Math.PI / 2);
  const lastSpawnTime = useRef(0);
  const totalSpawnedNuggets = useRef(0);
  const waveNuggetCount = useRef(0);
  const isWavePause = useRef(false);
  const wavePauseStartTime = useRef(0);

  const animationFrameId = useRef<number>(0);
  const bossEntity = useRef<Enemy | null>(null);
  const currentAmmo = useRef<ProjectileType>(ProjectileType.APPLE);
  const mousePos = useRef({ x: 0, y: 0 });

  // "Juice" Refs
  const screenShake = useRef({ x: 0, y: 0, intensity: 0 });
  const comboCount = useRef(0);
  const comboTimer = useRef(0);
  const vestigalModeUntil = useRef(0); // Timestamp when powerup ends
  
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

  // --- Helpers ---
  const addShake = (intensity: number) => {
    screenShake.current.intensity = Math.min(screenShake.current.intensity + intensity, 20);
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string = '#fff', scale: number = 1) => {
    floatingTexts.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      life: 1.0,
      color,
      vy: -2,
      scale
    });
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10, isCrumbs: boolean = false) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * (isCrumbs ? 20 : 15),
        vy: (Math.random() - 0.5) * (isCrumbs ? 20 : 15),
        width: isCrumbs ? 2 + Math.random() * 6 : 4 + Math.random() * 4,
        height: isCrumbs ? 2 + Math.random() * 6 : 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        isDead: false,
        life: 1.0,
        maxLife: 1.0,
        color,
        gravity: isCrumbs ? 0.5 : 0
      });
    }
  };

  // --- Init ---
  const initGame = useCallback(() => {
    projectiles.current = [];
    enemies.current = [];
    particles.current = [];
    floatingTexts.current = [];
    powerUps.current = [];
    scoreRef.current = 0;
    totalSpawnedNuggets.current = 0;
    waveNuggetCount.current = 0;
    isWavePause.current = false;
    bossEntity.current = null;
    lastSpawnTime.current = 0;
    comboCount.current = 0;
    vestigalModeUntil.current = 0;
    
    // Create Stars
    stars.current = [];
    for(let i=0; i<50; i++) {
        stars.current.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1,
            brightness: Math.random()
        });
    }

    setScore(0);
    setBossHp(BOSS_HITS_REQUIRED);
  }, [setScore, setBossHp]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Spawning ---
  const spawnNugget = (timestamp: number, width: number, height: number) => {
    if (gameState !== GameState.PLAYING) return;
    if (totalSpawnedNuggets.current >= TOTAL_NUGGETS_LEVEL_1) return;

    // Wave Logic
    if (isWavePause.current) {
        if (timestamp - wavePauseStartTime.current > WAVE_DELAY_MS) {
            isWavePause.current = false;
            waveNuggetCount.current = 0;
            spawnFloatingText(width/2, height/2, "NEXT WAVE!", '#ff0000', 2);
        }
        return;
    }

    if (timestamp - lastSpawnTime.current > SPAWN_RATE_MS) {
      const boxY = height - BOX_HEIGHT - 120;
      const boxX = width / 2;
      const angle = (Math.PI / 2) + (Math.random() * 0.4 - 0.2);
      const speed = ENEMY_LAUNCH_SPEED_MIN + Math.random() * (ENEMY_LAUNCH_SPEED_MAX - ENEMY_LAUNCH_SPEED_MIN);

      const newNugget: Enemy = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'NUGGET',
        x: boxX,
        y: boxY + 50,
        width: NUGGET_SIZE,
        height: NUGGET_SIZE,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI,
        isDead: false,
        hp: 1,
        maxHp: 1
      };

      enemies.current.push(newNugget);
      totalSpawnedNuggets.current += 1;
      waveNuggetCount.current += 1;
      lastSpawnTime.current = timestamp;
      playSound('LAUNCH');

      if (waveNuggetCount.current >= WAVE_SIZE) {
          isWavePause.current = true;
          wavePauseStartTime.current = timestamp;
      }
    }
  };

  const spawnBoss = (width: number, height: number) => {
    const newBoss: Enemy = {
      id: 'BOSS',
      type: 'BOSS',
      x: width / 2,
      y: -BOSS_SIZE,
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
    addShake(10);
  };

  const spawnMiniNuggets = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 / 15) * i;
        const speed = 3 + Math.random() * 3;
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
    addShake(20);
  };

  const spawnPowerUp = (x: number, y: number) => {
     powerUps.current.push({
         id: Math.random().toString(),
         type: 'VESTIGAL',
         x,
         y,
         vx: (Math.random() - 0.5) * 2,
         vy: -5, // Pop up
         width: POWERUP_SIZE,
         height: POWERUP_SIZE,
         rotation: 0,
         isDead: false,
         pulse: 0
     });
  };

  // --- Update Loop ---
  const update = useCallback((timestamp: number, width: number, height: number) => {
    
    // Shake Decay
    if (screenShake.current.intensity > 0) {
        screenShake.current.x = (Math.random() - 0.5) * screenShake.current.intensity;
        screenShake.current.y = (Math.random() - 0.5) * screenShake.current.intensity;
        screenShake.current.intensity *= 0.9; // Decay
    } else {
        screenShake.current.x = 0;
        screenShake.current.y = 0;
    }

    // Combo Decay
    if (comboCount.current > 0) {
        comboTimer.current -= 16; // Approx ms per frame
        if (comboTimer.current <= 0) {
            comboCount.current = 0;
        }
    }

    // Stars Background
    stars.current.forEach(s => {
        s.y += s.speed;
        if (s.y > height) s.y = 0;
    });

    // Win/Boss Logic
    if (gameState === GameState.BOSS_FIGHT && !bossEntity.current && enemies.current.length === 0) {
        setGameState(GameState.WON);
        playSound('WIN');
    }

    if (gameState === GameState.PLAYING && totalSpawnedNuggets.current >= TOTAL_NUGGETS_LEVEL_1 && enemies.current.length === 0 && !bossEntity.current) {
       setGameState(GameState.BOSS_INTRO);
       setTimeout(() => spawnBoss(width, height), 2500); 
    }

    // Powerups
    powerUps.current.forEach(p => {
        p.vy += 0.2; // Gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += 0.05;
        p.pulse += 0.1;
        
        if (p.y > height) p.isDead = true;
        
        // Check collision with projectile (shoot to collect)
        projectiles.current.forEach(proj => {
            if (proj.isDead || p.isDead) return;
            const dx = proj.x - p.x;
            const dy = proj.y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < (p.width + proj.width)/2) {
                p.isDead = true;
                proj.isDead = true;
                // Activate Vestigal Mode
                vestigalModeUntil.current = timestamp + 5000;
                spawnFloatingText(p.x, p.y, "VESTIGAL SISTER POWER!", COLORS.SZECHUAN_GLOW, 2);
                createExplosion(p.x, p.y, COLORS.SZECHUAN_GLOW, 20);
                playSound('WIN'); // Reuse happy sound
                addShake(10);
            }
        });
    });

    // Projectiles
    projectiles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation = Math.atan2(p.vy, p.vx);
      
      // Add Trail
      p.trail.push({x: p.x, y: p.y});
      if (p.trail.length > 5) p.trail.shift();

      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.isDead = true;
      }
    });

    // Enemies
    enemies.current.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      
      if (e.type === 'NUGGET' || e.type === 'MINI_NUGGET' || e.type === 'BOSS') {
          // Physics updates
          if (e.type === 'NUGGET') {
              e.rotation += 0.05;
              const speed = Math.sqrt(e.vx*e.vx + e.vy*e.vy);
              if (speed > 4) { e.vx *= 0.96; e.vy *= 0.96; }
          }
          if (e.type === 'BOSS') { e.rotation += 0.01; }
          
          // Screen Bounds Bounce
          if (e.x < e.width/2 || e.x > width - e.width/2) {
             e.vx *= -1;
             e.x = Math.max(e.width/2, Math.min(width - e.width/2, e.x));
          }
          if (e.y < e.height/2 || e.y > height) { 
             e.vy *= -1;
             e.y = Math.max(e.height/2, Math.min(height, e.y));
          }
      }
    });

    // Particles
    particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 0.02;
        if (p.life <= 0) p.isDead = true;
    });

    // Floating Text
    floatingTexts.current.forEach(t => {
        t.y += t.vy;
        t.vy *= 0.9; // Slow down ascent
        t.life -= 0.02;
    });
    floatingTexts.current = floatingTexts.current.filter(t => t.life > 0);

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
          
          // Hit Logic
          addShake(2);
          comboCount.current += 1;
          comboTimer.current = 2000; // 2 seconds to keep combo
          const scoreVal = 100 * comboCount.current;
          
          spawnFloatingText(e.x, e.y, `${scoreVal}`, '#fff', 1 + (comboCount.current * 0.1));
          if (comboCount.current > 2) spawnFloatingText(e.x, e.y - 20, `${comboCount.current}x COMBO!`, '#ffff00', 1.2);

          if (e.type === 'BOSS') {
            playSound('BOSS_HIT');
            createExplosion(p.x, p.y, '#FF0000', 5);
          } else {
            playSound('HIT');
            createExplosion(e.x, e.y, '#D4AF37', 8, true); // Crumbs
          }

          if (e.hp <= 0) {
            e.isDead = true;
            addShake(5);
            
            // Chance to drop powerup (if not boss)
            if (e.type !== 'BOSS' && Math.random() < 0.1) {
                spawnPowerUp(e.x, e.y);
            }

            if (e.type === 'BOSS') {
                bossEntity.current = null;
                createExplosion(e.x, e.y, '#FFD700', 100);
                spawnMiniNuggets(e.x, e.y);
                spawnFloatingText(e.x, e.y, "CRUMBLING!", '#ff0000', 3);
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
    powerUps.current = powerUps.current.filter(p => !p.isDead);

    spawnNugget(timestamp, width, height);

  }, [gameState, setGameState, setScore, setBossHp]);

  // --- Draw Loop ---
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Clear & Background
    ctx.fillStyle = COLORS.BACKGROUND_GRADIENT_START;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = 'white';
    stars.current.forEach(s => {
        ctx.globalAlpha = s.brightness * 0.8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Apply Screen Shake
    ctx.save();
    ctx.translate(screenShake.current.x, screenShake.current.y);

    // 2. Draw Box (Behind everything)
    const boxX = (width/2) - (BOX_WIDTH/2);
    const boxY = height - BOX_HEIGHT - 120; 

    if (assets?.box && assets.box.width >= 50) {
        ctx.drawImage(assets.box, boxX, boxY, BOX_WIDTH, BOX_HEIGHT);
    } else {
        // Procedural Box
        ctx.beginPath();
        ctx.rect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT);
        ctx.fillStyle = '#a07a53';
        ctx.fill();
        ctx.strokeStyle = '#6d4c41';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Branding
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(boxX + 20, boxY + 50, BOX_WIDTH - 40, 80);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        // Small "GETTIN"
        ctx.font = 'bold 15px "Press Start 2P"';
        ctx.fillText("GETTIN", width/2, boxY + 80);
        
        // Large "FRUTTY"
        ctx.font = 'bold 30px "Press Start 2P"';
        ctx.fillText("FRUTTY", width/2, boxY + 115);
    }

    // 3. Draw Player
    const px = width / 2;
    const py = height - 50;
    
    // Laser Sight
    ctx.beginPath();
    ctx.strokeStyle = COLORS.AIM_LINE;
    ctx.lineWidth = 2;
    ctx.moveTo(px, py);
    const aimX = px + Math.cos(playerAngle.current) * 2000;
    const aimY = py + Math.sin(playerAngle.current) * 2000;
    ctx.lineTo(aimX, aimY);
    ctx.stroke();

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerAngle.current);
    
    // Crossbow Model
    const isVestigal = performance.now() < vestigalModeUntil.current;
    
    ctx.shadowColor = isVestigal ? COLORS.SZECHUAN_GLOW : 'black';
    ctx.shadowBlur = isVestigal ? 20 : 10;
    
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-20, -10, 80, 20);
    ctx.beginPath();
    ctx.strokeStyle = isVestigal ? COLORS.SZECHUAN_GLOW : '#2c3e50';
    ctx.lineWidth = 6;
    ctx.moveTo(40, -60);
    ctx.quadraticCurveTo(20, 0, 40, 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.moveTo(40, -60);
    ctx.lineTo(0, 0);
    ctx.lineTo(40, 60);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Projectiles
    projectiles.current.forEach(p => {
        // Trails
        if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = p.width / 2;
            ctx.lineCap = 'round';
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for(let i=1; i<p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Glow if Vestigal
        if (isVestigal) {
            ctx.shadowColor = COLORS.SZECHUAN_GLOW;
            ctx.shadowBlur = 15;
        }

        // Draw Fruit
        ctx.fillStyle = p.type === ProjectileType.APPLE ? '#e74c3c' : '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, p.width/2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });

    // 5. PowerUps
    powerUps.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const scale = 1 + Math.sin(p.pulse) * 0.1;
        ctx.scale(scale, scale);
        
        ctx.shadowColor = COLORS.SZECHUAN_GLOW;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = COLORS.SZECHUAN_GLOW;
        ctx.beginPath();
        ctx.rect(-15, -20, 30, 40); // Packet shape
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VSTGL', 0, 5);
        
        ctx.restore();
    });

    // 6. Draw Enemies
    enemies.current.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);
        
        // Hit Flash
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 10;

        // Procedural Gold Nugget
        const nuggetGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, e.width/2);
        nuggetGrad.addColorStop(0, '#e1c699'); 
        nuggetGrad.addColorStop(0.4, '#d4af37'); 
        nuggetGrad.addColorStop(1, '#aa8830'); 
        ctx.fillStyle = nuggetGrad;

        if (e.type === 'BOSS') {
            // Boss Glow
            projectiles.current.forEach(p => {
                const dist = Math.sqrt((p.x-e.x)**2 + (p.y-e.y)**2);
                if (dist < 300) {
                     ctx.shadowColor = 'red';
                     ctx.shadowBlur = 30 * (1 - dist/300);
                }
            });
            
            ctx.beginPath();
            ctx.arc(0, 0, e.width/2, 0, Math.PI*2);
            ctx.fill();
            
            // Mega Pierre Face
            // Eyes (Angry Slanted)
            ctx.fillStyle = '#222';
            ctx.beginPath();
            // Left Eye
            ctx.moveTo(-45, -25);
            ctx.lineTo(-15, -15);
            ctx.lineTo(-30, -5);
            ctx.fill();
            // Right Eye
            ctx.moveTo(45, -25);
            ctx.lineTo(15, -15);
            ctx.lineTo(30, -5);
            ctx.fill();

            // Eyebrows (Thick)
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-50, -35);
            ctx.lineTo(-10, -25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(50, -35);
            ctx.lineTo(10, -25);
            ctx.stroke();

            // Mouth (Angry Frown)
            ctx.beginPath();
            ctx.arc(0, 50, 30, Math.PI + 0.5, 2 * Math.PI - 0.5);
            ctx.lineWidth = 5;
            ctx.stroke();

            // Goatee
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(0, 50);
            ctx.lineTo(-10, 90);
            ctx.lineTo(10, 90);
            ctx.fill();

        } else {
             // Lumpy Nugget
            ctx.beginPath();
            const r = e.width/2;
            for(let i=0; i<7; i++) {
                const angle = (i/7) * Math.PI * 2;
                const rad = r + (Math.sin(i*132) * 5); 
                ctx.lineTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
            }
            ctx.fill();
        }

        ctx.restore();
    });

    // 7. Particles
    particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width/2, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 8. Floating Text
    floatingTexts.current.forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.font = "bold 24px 'Press Start 2P'";
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });

    ctx.restore(); // End Shake

  }, [assets]);

  // --- Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.w;
    canvas.height = dimensions.h;

    const loop = (timestamp: number) => {
      update(timestamp, dimensions.w, dimensions.h);
      draw(ctx, dimensions.w, dimensions.h);
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [dimensions, draw, update]);

  // --- Inputs ---
  useEffect(() => {
    if (gameState === GameState.START) initGame();
  }, [gameState, initGame]);

  const handleInputMove = (clientX: number, clientY: number) => {
    mousePos.current = { x: clientX, y: clientY };
    const px = dimensions.w / 2;
    const py = dimensions.h - 50;
    playerAngle.current = Math.atan2(clientY - py, clientX - px);
  };

  const fireProjectile = (angle: number, speedMult: number = 1) => {
    const px = dimensions.w / 2;
    const py = dimensions.h - 50;
    
    projectiles.current.push({
        id: Math.random().toString(),
        type: currentAmmo.current,
        x: px,
        y: py,
        width: PROJECTILE_SIZE,
        height: PROJECTILE_SIZE,
        vx: Math.cos(angle) * PROJECTILE_SPEED * speedMult,
        vy: Math.sin(angle) * PROJECTILE_SPEED * speedMult,
        rotation: angle,
        isDead: false,
        trail: []
    });
  };

  const handleShoot = () => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.BOSS_FIGHT) return;

    const angle = playerAngle.current;
    addShake(5);
    playSound('SHOOT');

    if (performance.now() < vestigalModeUntil.current) {
        // VESTIGAL MODE: TRIPLE SHOT
        fireProjectile(angle);
        fireProjectile(angle - 0.2);
        fireProjectile(angle + 0.2);
    } else {
        fireProjectile(angle);
    }
    
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
