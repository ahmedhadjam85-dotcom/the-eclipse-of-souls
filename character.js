/* =========================================================
   Eclipse of Souls — character.js
   Player, Boss, Projectiles, Energy Orbs, Pixel Shapes.
   Everything about "characters" lives in this one file —
   kept lightweight and self-contained on purpose (Xbox
   Series S friendly: no images, no external shape file,
   no physics libs — just small canvas rects).
   ========================================================= */

/* ---------------------------------------------------------
   PIXEL SHAPES
   Each entry is a grid of '0'/'1' rows. '1' = one small
   filled square. Every row in a shape MUST be the same
   length (validated below at load time — see checkShapes()).
   --------------------------------------------------------- */
const PixelShapes = {
  player: [
    "0000001100000",
    "0000011110000",
    "0000111111000",
    "0001111111100",
    "0011111111110",
    "0011111111110",
    "0001111111100",
    "0000111111000",
    "0000111111000",
    "0001111111100",
    "0000100000100",
    "0001000000010",
    "1100000000011",
  ],
  kael: [
    "0000010100000",
    "0000011110100",
    "0000111111010",
    "0001111111100",
    "0011111111110",
    "0011111111110",
    "0001111111100",
    "0001111111100",
    "0001100110000",
    "0001100110000",
    "0011000011000",
    "0011000011000",
    "1100000000011",
  ],
  sera: [
    "0000010100000",
    "0001000100000",
    "0100111111001",
    "0111111111101",
    "0011111111100",
    "0011111111100",
    "0001111111000",
    "0001100011000",
    "0001100011000",
    "0011000001100",
    "0100000000010",
    "1000000000001",
    "1000000000001",
  ],
  bram: [
    "0001111111000",
    "0011111111100",
    "0111111111110",
    "1111111111111",
    "1111111111111",
    "1111111111111",
    "1111111111111",
    "0111111111110",
    "0111111111110",
    "0011000001100",
    "0011000001100",
    "1100000000011",
    "1100000000011",
  ],
  voidmaw: [
    "0101010101010",
    "1011111111101",
    "1111111111111",
    "1111000001111",
    "1111000001111",
    "1111000001111",
    "1111000001111",
    "1111111111111",
    "1111111111111",
    "1011111111101",
    "0101010101010",
  ],
  hollowChoir: [
    "01000100010",
    "11101110111",
    "11101110111",
    "10101010101",
  ],
  ashenWidow: [
    "1000000000001",
    "0100000000010",
    "0010000000100",
    "0001111111000",
    "0011111111100",
    "1111111111111",
    "0011111111100",
    "0001111111000",
    "0010000000100",
    "0100000000010",
    "1000000000001",
  ],
  duskwalker: [
    "0011100",
    "0011100",
    "0001000",
    "0111110",
    "0111110",
    "0001000",
    "0011100",
    "0011100",
    "0001000",
    "0111110",
    "0111110",
    "0001000",
    "0100010",
    "1000001",
  ],
  gravekeeper: [
    "1010101010101",
    "1111111111111",
    "0111111111110",
    "1111111111111",
    "1111111111111",
    "1111111111111",
    "1111111111111",
    "0111111111110",
    "0111111111110",
    "1111111111111",
    "1100000000011",
  ],
  umbraSerpent: [
    "1100110011001",
    "1110111011101",
    "0111011101110",
    "1110111011101",
    "1100110011001",
  ],
  eclipsedKing: [
    "1010101010101",
    "0111111111110",
    "0011111111100",
    "0111111111110",
    "1111111111111",
    "0111111111110",
    "0011111111100",
    "0011111111100",
    "0011000001100",
    "0011000001100",
    "1100000000011",
  ],
  soulVessel: [
    "0001111111000",
    "0011111111100",
    "0001111111000",
    "0000111110000",
    "0000111110000",
    "0001111111000",
    "0011111111100",
    "0011111111100",
    "0001111111000",
    "0001111111000",
    "0000111110000",
  ],
  hollowShade: [
    "0101111101010",
    "0111111111110",
    "1111111111111",
    "0111111111110",
    "0011111111100",
    "0111111111110",
    "1011111111101",
    "1011111111101",
    "1000000000001",
  ],
  rassel: [
    "00000010001000000",
    "00111111111111100",
    "11111111111111111",
    "00111111111111100",
    "00011111111111000",
    "00001111111110000",
    "00000111111100000",
    "00001100000110000",
    "00001100000110000",
  ],
};

// Dev-time safety check: every row in a shape must share one width.
// Falls back to a plain circle (see draw() methods) if a shape is broken,
// so a typo in the data above can never crash the game.
function _shapeIsValid(rows) {
  if (!rows || !rows.length) return false;
  const w = rows[0].length;
  return rows.every(r => r.length === w);
}
const _validShapeCache = {};
function getShape(id) {
  if (_validShapeCache[id] === undefined) {
    const rows = PixelShapes[id];
    _validShapeCache[id] = _shapeIsValid(rows) ? rows : null;
  }
  return _validShapeCache[id];
}

/**
 * Draws a pixel-grid shape centered at (cx, cy).
 * cellSize controls how big each little square is.
 */
function drawPixelShape(ctx, rows, cx, cy, cellSize, color, glow = true) {
  const h = rows.length;
  const w = rows[0].length;
  const startX = cx - (w * cellSize) / 2;
  const startY = cy - (h * cellSize) / 2;

  ctx.save();
  ctx.fillStyle = color;
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }
  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      if (row[c] === '1') {
        ctx.fillRect(
          Math.round(startX + c * cellSize) - 0.5,
          Math.round(startY + r * cellSize) - 0.5,
          cellSize + 1,
          cellSize + 1
        );
      }
    }
  }
  ctx.restore();
}

// ---------- Player ----------
class Player {
  constructor(arena) {
    this.arena = arena;
    this.radius = 8;
    this.x = arena.x + arena.w / 2;
    this.y = arena.y + arena.h / 2;
    this.speed = 160; // px/sec
    this.energy = 0;
    this.maxEnergy = 100;
    this.attackCost = 25;
    this.invuln = 0; // seconds of invulnerability after hit
    this.hitFlash = 0;
  }

  move(dx, dy, dt) {
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    const r = this.radius;
    this.x = Math.max(this.arena.x + r, Math.min(this.arena.x + this.arena.w - r, this.x));
    this.y = Math.max(this.arena.y + r, Math.min(this.arena.y + this.arena.h - r, this.y));
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  canAttack() {
    return this.energy >= this.attackCost;
  }

  spendAttack() {
    this.energy = Math.max(0, this.energy - this.attackCost);
  }

  takeHit() {
    if (this.invuln > 0) return false;
    this.energy = 0;
    this.invuln = 1.0;
    this.hitFlash = 0.25;
    return true;
  }

  update(dt) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  draw(ctx) {
    ctx.save();
    const flashing = this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0;
    const color = flashing ? '#ff5555' : '#e8e8ff';
    const shape = getShape('player');
    if (shape) {
      const cellSize = (this.radius * 2.8) / shape[0].length;
      drawPixelShape(ctx, shape, this.x, this.y, cellSize, color);
    } else {
      ctx.fillStyle = color;
      ctx.shadowColor = '#7a2bff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- Energy Orb (pickup) ----------
class EnergyOrb {
  constructor(arena) {
    this.arena = arena;
    this.radius = 5;
    const pad = 20;
    this.x = arena.x + pad + Math.random() * (arena.w - pad * 2);
    this.y = arena.y + pad + Math.random() * (arena.h - pad * 2);
    this.value = 15;
    this.life = 8;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.life -= dt;
    this.pulse += dt * 4;
  }

  get dead() { return this.life <= 0; }

  draw(ctx) {
    const s = 1 + Math.sin(this.pulse) * 0.15;
    ctx.save();
    ctx.fillStyle = '#ffd23b';
    ctx.shadowColor = '#ffd23b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Projectile (boss attack piece) ----------
class Projectile {
  constructor(x, y, vx, vy, radius = 6, color = '#ff3b3b') {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.life = 6;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
  get dead() { return this.life <= 0; }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* =========================================================
   Boss — generic driver. Each boss definition (see bosses.js)
   supplies: name, title, maxHp, color, patterns.
   The pixel shape is looked up by def.id from PixelShapes above.
   ========================================================= */
class Boss {
  constructor(def, arena) {
    this.def = def;
    this.arena = arena;
    this.hp = def.maxHp;
    this.maxHp = def.maxHp;
    this.x = arena.x + arena.w / 2;
    this.y = arena.y + 40;
    this.radius = 22;
    this.patternTimer = 0;
    this.patternIndex = 0;
    this.hitFlash = 0;
    this.defeated = false;
  }

  get hpRatio() { return Math.max(0, this.hp / this.maxHp); }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.defeated = true;
    }
  }

  update(dt, spawnProjectile) {
    if (this.defeated) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    this.patternTimer -= dt;
    if (this.patternTimer <= 0) {
      const patterns = this.def.patterns;
      const pattern = patterns[this.patternIndex % patterns.length];
      pattern(this, this.arena, spawnProjectile);
      this.patternIndex++;
      const speedUp = 1 - (1 - this.hpRatio) * 0.35;
      this.patternTimer = (this.def.patternInterval || 1.6) * speedUp;
    }
  }

  draw(ctx) {
    ctx.save();
    const color = this.hitFlash > 0 ? '#ffffff' : this.def.color;
    const shape = getShape(this.def.id);
    if (shape) {
      const cellSize = (this.radius * 2.6) / shape[0].length;
      drawPixelShape(ctx, shape, this.x, this.y, cellSize, color);
    } else {
      ctx.fillStyle = color;
      ctx.shadowColor = this.def.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* =========================================================
   Attack Pattern Library — reusable generators shared by
   every boss (see bosses.js) so no boss needs custom code.
   ========================================================= */
const Patterns = {
  radialBurst(count = 8, speed = 90, color = '#ff3b3b') {
    return (boss, arena, spawn) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        spawn(new Projectile(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 6, color));
      }
    };
  },
  aimedSpread(count = 3, spreadDeg = 30, speed = 140, color = '#ff8a3b') {
    return (boss, arena, spawn) => {
      const px = arena.playerRef ? arena.playerRef.x : boss.x;
      const py = arena.playerRef ? arena.playerRef.y : boss.y + 50;
      const baseAngle = Math.atan2(py - boss.y, px - boss.x);
      const spread = (spreadDeg * Math.PI) / 180;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
        const angle = baseAngle + t * spread;
        spawn(new Projectile(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 6, color));
      }
    };
  },
  shockwaveRing(count = 14, speed = 110, color = '#3bafff') {
    return (boss, arena, spawn) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        spawn(new Projectile(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, color));
      }
    };
  },
  randomRain(count = 5, speed = 130, color = '#b23bff') {
    return (boss, arena, spawn) => {
      for (let i = 0; i < count; i++) {
        const x = arena.x + 20 + Math.random() * (arena.w - 40);
        spawn(new Projectile(x, arena.y - 10, 0, speed, 6, color));
      }
    };
  },
  pincerShots(speed = 120, color = '#ff3bcf') {
    return (boss, arena, spawn) => {
      const midY = arena.y + arena.h / 2;
      spawn(new Projectile(arena.x - 10, midY, speed, 0, 6, color));
      spawn(new Projectile(arena.x + arena.w + 10, midY, -speed, 0, 6, color));
    };
  },
  spiralDrift(count = 6, speed = 70, color = '#8a3bff') {
    return (boss, arena, spawn) => {
      const t = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + t;
        spawn(new Projectile(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, color));
      }
    };
  },
  groundSpikes(count = 3, color = '#8a5a2b') {
    return (boss, arena, spawn) => {
      for (let i = 0; i < count; i++) {
        const x = arena.x + 30 + Math.random() * (arena.w - 60);
        const y = arena.y + 30 + Math.random() * (arena.h - 60);
        const spike = new Projectile(x, y, 0, 0, 10, color);
        spike.life = 1.1;
        spawn(spike);
      }
    };
  },
};
