/* =========================================================
   Eclipse of Souls — game.js
   Full engine: input (PC/Xbox/Phone), procedural music,
   arena combat loop, energy system, dialogue runner,
   chapter/boss progression.
   ========================================================= */

// ---------------------------------------------------------
// Screen / menu wiring
// ---------------------------------------------------------
const Screens = {
  mainMenu: document.getElementById('mainMenu'),
  controlSelect: document.getElementById('controlSelect'),
  gameScreen: document.getElementById('gameScreen'),
};

const State = { controlMode: null };

function showScreen(name) {
  Object.values(Screens).forEach(el => el.classList.add('hidden'));
  Screens[name].classList.remove('hidden');
}

document.getElementById('newGameBtn').addEventListener('click', () => {
  showScreen('controlSelect');
});

const controlBoxes = document.querySelectorAll('.controlBox');
controlBoxes.forEach(box => {
  box.addEventListener('click', () => {
    controlBoxes.forEach(b => b.classList.remove('selected'));
    box.classList.add('selected');
    State.controlMode = box.dataset.mode;
    setTimeout(() => {
      showScreen('gameScreen');
      Engine.start(State.controlMode);
    }, 200);
  });
});

// ---------------------------------------------------------
// InputManager — unifies Keyboard / Gamepad / Touch
// ---------------------------------------------------------
class InputManager {
  constructor(mode) {
    this.mode = mode; // 'xbox' | 'phone' | 'pc'
    this.dx = 0; this.dy = 0;
    this.attackPressed = false;   // edge-triggered (true for one frame)
    this._attackHeldPrev = false;
    this._attackHeldNow = false;

    this._keys = {};
    window.addEventListener('keydown', e => this._keys[e.code] = true);
    window.addEventListener('keyup', e => this._keys[e.code] = false);

    if (mode === 'phone') this._setupTouch();
  }

  _setupTouch() {
    const zone = document.getElementById('joystickZone');
    const stick = document.getElementById('joystickStick');
    const atk = document.getElementById('attackBtn');
    let dragging = false;
    let originX = 0, originY = 0;
    const maxDist = 40;

    const start = (x, y) => {
      dragging = true;
      const rect = zone.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    };
    const move = (x, y) => {
      if (!dragging) return;
      let ddx = x - originX, ddy = y - originY;
      const len = Math.hypot(ddx, ddy);
      if (len > maxDist) { ddx = (ddx / len) * maxDist; ddy = (ddy / len) * maxDist; }
      stick.style.transform = `translate(${ddx}px, ${ddy}px)`;
      this.dx = ddx / maxDist;
      this.dy = ddy / maxDist;
    };
    const end = () => {
      dragging = false;
      this.dx = 0; this.dy = 0;
      stick.style.transform = 'translate(0px, 0px)';
    };

    zone.addEventListener('touchstart', e => { start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    zone.addEventListener('touchmove', e => { move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    zone.addEventListener('touchend', end);

    atk.addEventListener('touchstart', e => { e.preventDefault(); this._attackHeldNow = true; }, { passive: false });
    atk.addEventListener('touchend', () => { this._attackHeldNow = false; });
  }

  // Call once per frame BEFORE using dx/dy/attackPressed
  poll() {
    if (this.mode === 'pc') {
      let dx = 0, dy = 0;
      if (this._keys['ArrowLeft'] || this._keys['KeyA']) dx -= 1;
      if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1;
      if (this._keys['ArrowUp'] || this._keys['KeyW']) dy -= 1;
      if (this._keys['ArrowDown'] || this._keys['KeyS']) dy += 1;
      this.dx = dx; this.dy = dy;
      this._attackHeldNow = !!(this._keys['Space'] || this._keys['KeyZ']);
    }

    if (this.mode === 'xbox') {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads && pads[0];
      if (pad) {
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
        this.dx = Math.abs(ax) > 0.15 ? ax : 0;
        this.dy = Math.abs(ay) > 0.15 ? ay : 0;
        this._attackHeldNow = !!(pad.buttons[0] && pad.buttons[0].pressed); // A button
      } else {
        // fallback to keyboard if no gamepad detected yet
        let dx = 0, dy = 0;
        if (this._keys['ArrowLeft'] || this._keys['KeyA']) dx -= 1;
        if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1;
        if (this._keys['ArrowUp'] || this._keys['KeyW']) dy -= 1;
        if (this._keys['ArrowDown'] || this._keys['KeyS']) dy += 1;
        this.dx = dx; this.dy = dy;
        this._attackHeldNow = !!this._keys['Space'];
      }
    }

    // phone mode dx/dy/_attackHeldNow already kept updated by touch handlers

    // edge-trigger the attack button so holding it doesn't spam attacks
    this.attackPressed = this._attackHeldNow && !this._attackHeldPrev;
    this._attackHeldPrev = this._attackHeldNow;
  }
}

// MusicManager now lives in music.js (loaded before this file) —
// gives each chapter its own distinct mood (see music.js header).

// ---------------------------------------------------------
// DialogueRunner — shows lines one at a time, resolves a
// promise when the sequence finishes so the engine can await it.
// ---------------------------------------------------------
class DialogueRunner {
  constructor() {
    this.box = document.getElementById('dialogueBox');
    this.speakerEl = document.getElementById('dialogueSpeaker');
    this.textEl = document.getElementById('dialogueText');
    this.lines = [];
    this.index = 0;
    this.resolve = null;
    this.box.addEventListener('click', () => this._advance());
    this._advanceViaAttack = () => this._advance();
  }

  play(lines) {
    return new Promise(resolve => {
      this.lines = lines;
      this.index = 0;
      this.resolve = resolve;
      this.box.classList.remove('hidden');
      this._render();
    });
  }

  _render() {
    const line = this.lines[this.index];
    this.speakerEl.textContent = line.speaker || '';
    this.textEl.textContent = line.text;
  }

  _advance() {
    this.index++;
    if (this.index >= this.lines.length) {
      this.box.classList.add('hidden');
      const r = this.resolve;
      this.resolve = null;
      if (r) r();
    } else {
      this._render();
    }
  }
}

// ---------------------------------------------------------
// Helpers: chapter banner
// ---------------------------------------------------------
function showChapterBanner(text) {
  return new Promise(resolve => {
    const banner = document.getElementById('chapterBanner');
    const textEl = document.getElementById('chapterBannerText');
    textEl.textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
      resolve();
    }, 2600);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------
// Engine — the main game state machine + render loop
// ---------------------------------------------------------
const Engine = {
  canvas: null, ctx: null,
  input: null, music: new MusicManager(), dialogue: new DialogueRunner(),
  arena: null, player: null, boss: null,
  orbs: [], projectiles: [],
  spawnTimer: 0,
  lastTime: 0,
  running: false,
  attackFlashTimer: 0,

  // --- juice: screen shake, particles, floating damage numbers ---
  particles: [],
  floatTexts: [],
  shakeTime: 0,
  shakeMag: 0,

  shake(mag, time) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTime = Math.max(this.shakeTime, time);
  },

  burst(x, y, color, count = 10, speed = 90) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x, y, color,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        size: 2 + Math.random() * 2,
      });
    }
  },

  floatText(x, y, text, color = '#fff') {
    this.floatTexts.push({ x, y, text, color, life: 0.8, maxLife: 0.8 });
  },

  async start(mode) {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputManager(mode);
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this._resetArenaEntities();

    // --- Story sequence ---
    await showChapterBanner('CHAPTER 1 — THE BEGINNING');
    await this.dialogue.play(Dialogues.introLucifer);
    await this._runChapter(1);

    await this.dialogue.play(Dialogues.roseReveal);
    await showChapterBanner('CHAPTER 2 — THE TRUTH');
    await this.dialogue.play(Dialogues.chapter2_intro);
    await this._runChapter(2);

    await showChapterBanner('CHAPTER 3 — THE END');
    await this.dialogue.play(Dialogues.chapter3_intro);
    // first 3 bosses of chapter 3 (everything except rassel)
    const ch3 = ChapterOrder[3].filter(id => id !== 'rassel');
    for (const id of ch3) await this._runBoss(id);

    await this.dialogue.play(Dialogues.rasselBetrayal);
    await this._runBoss('rassel');

    this.music.stop();
    await this.dialogue.play(Dialogues.ending);
    showScreen('mainMenu');
  },

  async _runChapter(num) {
    for (const id of ChapterOrder[num]) {
      await this._runBoss(id);
    }
  },

  async _runBoss(id) {
    const def = BossDefs[id];
    const introKey = BossIntroLines[id];
    if (introKey) await this.dialogue.play(Dialogues[introKey]);

    document.getElementById('bossNameTag').classList.remove('hidden');
    document.getElementById('bossName').textContent = def.name;
    document.getElementById('bossTitle').textContent = def.title;

    this.music.playForBoss(def);
    await this._fight(def);
  },

  _fight(def) {
    return new Promise(resolve => {
      this._resetArenaEntities();
      this.boss = new Boss(def, this.arena);
      this.orbs = [];
      this.projectiles = [];
      this.spawnTimer = 0;
      this._fightResolve = resolve;
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame(t => this._loop(t));
    });
  },

  _resetArenaEntities() {
    const c = this.canvas;
    this.arena = { x: 24, y: 24, w: c.width - 48, h: c.height - 48 };
    this.player = new Player(this.arena);
    this.player.hp = 100;
    this.player.maxHp = 100;
  },

  _resize() {
    const maxW = Math.min(window.innerWidth - 20, 520);
    this.canvas.width = maxW;
    this.canvas.height = Math.min(window.innerHeight * 0.5, maxW * 0.75);
    if (this.player) {
      this.arena = { x: 24, y: 24, w: this.canvas.width - 48, h: this.canvas.height - 48 };
      this.player.arena = this.arena;
    }
  },

  _spawnOrb() {
    if (this.orbs.length >= 3) return;
    this.orbs.push(new EnergyOrb(this.arena));
  },

  _loop(now) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    dt = Math.min(dt, 0.05); // clamp to avoid huge jumps on tab-switch
    this.lastTime = now;

    this.input.poll();
    this.arena.playerRef = this.player;

    // --- update player movement ---
    this.player.move(this.input.dx, this.input.dy, dt);
    this.player.update(dt);

    // --- energy orb spawning ---
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnOrb();
      this.spawnTimer = 1.8 + Math.random() * 1.4;
    }
    this.orbs.forEach(o => o.update(dt));
    this.orbs = this.orbs.filter(o => {
      const d = Math.hypot(o.x - this.player.x, o.y - this.player.y);
      if (d < o.radius + this.player.radius) {
        this.player.addEnergy(o.value);
        this.burst(o.x, o.y, '#ffd23b', 8, 70);
        return false;
      }
      return !o.dead;
    });

    // --- boss ---
    this.boss.update(dt, p => this.projectiles.push(p));

    // --- projectiles ---
    this.projectiles.forEach(p => p.update(dt));
    this.projectiles = this.projectiles.filter(p => {
      const d = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (d < p.radius + this.player.radius) {
        const landed = this.player.takeHit();
        this.player.hp -= 14;
        if (landed) {
          this.burst(this.player.x, this.player.y, '#ff5555', 12, 120);
          this.shake(6, 0.25);
        }
        return false;
      }
      return !p.dead;
    });

    // --- attack input ---
    if (this.attackFlashTimer > 0) this.attackFlashTimer -= dt;
    if (this.input.attackPressed && this.player.canAttack()) {
      this.player.spendAttack();
      this.attackFlashTimer = 0.12;
      const d = Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y);
      const attackRange = this.boss.radius + this.player.radius + 26;
      if (d <= attackRange) {
        this.boss.takeDamage(12);
        this.burst(this.boss.x, this.boss.y, this.boss.def.color, 10, 100);
        this.floatText(this.boss.x, this.boss.y - this.boss.radius, '-12', '#ffffff');
        this.shake(4, 0.15);
      } else {
        this.floatText(this.player.x, this.player.y - 20, 'MISS', '#888888');
      }
    }

    // --- update particles & floating text (pure visual, no gameplay effect) ---
    this.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    this.particles = this.particles.filter(p => p.life > 0);
    this.floatTexts.forEach(t => { t.y -= 40 * dt; t.life -= dt; });
    this.floatTexts = this.floatTexts.filter(t => t.life > 0);
    if (this.shakeTime > 0) this.shakeTime -= dt; else this.shakeMag = 0;

    // --- HUD ---
    document.getElementById('bossBar').style.width = (this.boss.hpRatio * 100) + '%';
    document.getElementById('energyBar').style.width = (this.player.energy / this.player.maxEnergy * 100) + '%';

    // --- win/lose checks ---
    if (this.boss.defeated) {
      this.running = false;
      document.getElementById('bossNameTag').classList.add('hidden');
      this.burst(this.boss.x, this.boss.y, this.boss.def.color, 30, 160);
      this.shake(10, 0.4);
      const flash = document.createElement('div');
      flash.className = 'screenFlash';
      document.getElementById('gameScreen').appendChild(flash);
      setTimeout(() => flash.remove(), 450);
      const resolve = this._fightResolve;
      sleep(700).then(resolve);
      this._render(); // draw final frame
      return;
    }
    if (this.player.hp <= 0) {
      this.running = false;
      // simple retry: reset and refight same boss after a beat
      sleep(900).then(() => {
        this.player.hp = this.player.maxHp;
        this.player.energy = 0;
        this.player.x = this.arena.x + this.arena.w / 2;
        this.player.y = this.arena.y + this.arena.h / 2;
        this.boss.hp = this.boss.maxHp;
        this.boss.defeated = false;
        this.projectiles = [];
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(t => this._loop(t));
      });
      this._render();
      return;
    }

    this._render();
    requestAnimationFrame(t => this._loop(t));
  },

  _render() {
    const ctx = this.ctx, a = this.arena;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // screen shake: small random offset applied to everything below
    ctx.save();
    if (this.shakeMag > 0) {
      const sx = (Math.random() * 2 - 1) * this.shakeMag;
      const sy = (Math.random() * 2 - 1) * this.shakeMag;
      ctx.translate(sx, sy);
    }

    // arena box (Undertale-style)
    ctx.fillStyle = '#0d0d16';
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.strokeStyle = this.attackFlashTimer > 0 ? '#ffffff' : '#7a2bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x, a.y, a.w, a.h);

    this.orbs.forEach(o => o.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));

    // attack-ready ring — a soft pulsing outline around the player once
    // they have enough energy to land a hit (readable "you can act now" cue)
    if (this.player.canAttack()) {
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.15;
      ctx.save();
      ctx.strokeStyle = '#ffd23b';
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, (this.player.radius + 6) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.boss.draw(ctx);
    this.player.draw(ctx);

    // particles (energy pickups, hit sparks, boss-defeat burst)
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // floating damage numbers / MISS text
    this.floatTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // player HP as small text (compact HUD to save space on Series S UI)
    ctx.fillStyle = '#ff9a9a';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.max(0, Math.ceil(this.player.hp))}`, a.x + 6, a.y + a.h - 8);

    ctx.restore(); // end shake translate

    // low-HP warning vignette — pulsing red border, drawn OUTSIDE the
    // shake transform so it stays anchored to the screen edge
    if (this.player.hp > 0 && this.player.hp <= 30) {
      const pulse = 0.25 + Math.sin(performance.now() * 0.008) * 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(255,40,40,${pulse})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
      ctx.restore();
    }
  },
};
