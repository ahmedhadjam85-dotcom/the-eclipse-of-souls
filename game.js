/* =========================================================
   Eclipse of Souls — game.js
   Full engine: input (PC/Xbox/Phone), procedural music + sfx,
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
  SFX.menuSelect();
  showScreen('controlSelect');
});

const controlBoxes = document.querySelectorAll('.controlBox');
controlBoxes.forEach(box => {
  box.addEventListener('click', () => {
    controlBoxes.forEach(b => b.classList.remove('selected'));
    box.classList.add('selected');
    State.controlMode = box.dataset.mode;
    SFX.menuSelect();
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
    this.dx = 0; this.dy = 0;           // smoothed, what the game actually uses
    this._targetDx = 0; this._targetDy = 0; // raw input this frame, before smoothing
    this.attackPressed = false;   // edge-triggered (true for one frame)
    this._attackHeldPrev = false;
    this._attackHeldNow = false;

    this._keys = {};
    window.addEventListener('keydown', e => this._keys[e.code] = true);
    window.addEventListener('keyup', e => this._keys[e.code] = false);

    this._gamepadIndex = null;
    window.addEventListener('gamepadconnected', e => { this._gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this._gamepadIndex = null; });

    if (mode === 'phone') this._setupTouch();
  }

  _setupTouch() {
    const zone = document.getElementById('joystickZone');
    const stick = document.getElementById('joystickStick');
    const atk = document.getElementById('attackBtn');
    const maxDist = 40;

    // Track each control's own finger by touch identifier, so dragging
    // the joystick and tapping attack with a second finger both work.
    let joystickTouchId = null;
    let originX = 0, originY = 0;

    const deadzone = 6; // px — ignores tiny finger jitter near center
    const moveStick = (x, y) => {
      let ddx = x - originX, ddy = y - originY;
      const len = Math.hypot(ddx, ddy);
      if (len > maxDist) { ddx = (ddx / len) * maxDist; ddy = (ddy / len) * maxDist; }
      stick.style.transform = `translate(${ddx}px, ${ddy}px)`;
      if (len < deadzone) {
        this._targetDx = 0; this._targetDy = 0;
      } else {
        this._targetDx = ddx / maxDist;
        this._targetDy = ddy / maxDist;
      }
    };
    const resetStick = () => {
      joystickTouchId = null;
      this._targetDx = 0; this._targetDy = 0;
      stick.style.transform = 'translate(0px, 0px)';
    };

    zone.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      joystickTouchId = t.identifier;
      const rect = zone.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      moveStick(t.clientX, t.clientY);
    }, { passive: true });

    zone.addEventListener('touchmove', e => {
      for (const t of e.touches) {
        if (t.identifier === joystickTouchId) { moveStick(t.clientX, t.clientY); break; }
      }
    }, { passive: true });

    const endJoystickTouch = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId) { resetStick(); break; }
      }
    };
    zone.addEventListener('touchend', endJoystickTouch);
    zone.addEventListener('touchcancel', endJoystickTouch);

    // Attack button tracked independently so it never fights the joystick
    atk.addEventListener('touchstart', e => { e.preventDefault(); this._attackHeldNow = true; }, { passive: false });
    atk.addEventListener('touchend', () => { this._attackHeldNow = false; });
    atk.addEventListener('touchcancel', () => { this._attackHeldNow = false; });
  }

  _rumble(strength = 0.5, duration = 120) {
    if (this._gamepadIndex === null) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && pads[this._gamepadIndex];
    const actuator = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
    if (!actuator) return;
    try {
      if (actuator.playEffect) {
        actuator.playEffect('dual-rumble', {
          duration, startDelay: 0,
          strongMagnitude: strength, weakMagnitude: strength * 0.7,
        });
      } else if (actuator.pulse) {
        actuator.pulse(strength, duration);
      }
    } catch (e) { /* rumble is best-effort — never break gameplay over it */ }
  }

  // Call once per frame BEFORE using dx/dy/attackPressed
  poll(dt) {
    if (this.mode === 'pc') {
      let dx = 0, dy = 0;
      if (this._keys['ArrowLeft'] || this._keys['KeyA']) dx -= 1;
      if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1;
      if (this._keys['ArrowUp'] || this._keys['KeyW']) dy -= 1;
      if (this._keys['ArrowDown'] || this._keys['KeyS']) dy += 1;
      this._targetDx = dx; this._targetDy = dy;
      this._attackHeldNow = !!(this._keys['Space'] || this._keys['KeyZ']);
    }

    if (this.mode === 'xbox') {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = this._gamepadIndex !== null ? pads[this._gamepadIndex] : (pads && pads[0]);
      if (pad) {
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
        this._targetDx = Math.abs(ax) > 0.15 ? ax : 0;
        this._targetDy = Math.abs(ay) > 0.15 ? ay : 0;
        this._attackHeldNow = !!(pad.buttons[0] && pad.buttons[0].pressed); // A button
      } else {
        // fallback to keyboard if no gamepad detected yet
        let dx = 0, dy = 0;
        if (this._keys['ArrowLeft'] || this._keys['KeyA']) dx -= 1;
        if (this._keys['ArrowRight'] || this._keys['KeyD']) dx += 1;
        if (this._keys['ArrowUp'] || this._keys['KeyW']) dy -= 1;
        if (this._keys['ArrowDown'] || this._keys['KeyS']) dy += 1;
        this._targetDx = dx; this._targetDy = dy;
        this._attackHeldNow = !!this._keys['Space'];
      }
    }

    // phone mode: _targetDx/_targetDy/_attackHeldNow already kept updated by touch handlers

    // Smooth digital (keyboard) input toward its target so movement
    // accelerates/decelerates instead of snapping to full speed.
    // Framerate-independent: converges at the same rate regardless of dt.
    const rate = this.mode === 'phone' ? 22 : 14; // touch feels snappier, keyboard/pad softer
    const t = 1 - Math.exp(-rate * (dt || 0.016));
    this.dx += (this._targetDx - this.dx) * t;
    this.dy += (this._targetDy - this.dy) * t;

    // edge-trigger the attack button so holding it doesn't spam attacks
    this.attackPressed = this._attackHeldNow && !this._attackHeldPrev;
    this._attackHeldPrev = this._attackHeldNow;
  }
}

// MusicManager lives in music.js, SFX lives in sfx.js
// (both loaded before this file).

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

    // Xbox mode has no mouse/touch to tap the box, so watch the
    // gamepad's Y button (index 3) directly while dialogue is showing.
    this._watchingPad = false;
    this._prevY = false;
    this._watchGamepad();
  }

  play(lines) {
    return new Promise(resolve => {
      this.lines = lines;
      this.index = 0;
      this.resolve = resolve;
      this.box.classList.remove('hidden');
      this._watchingPad = true;
      const hint = document.getElementById('dialogueHint');
      if (hint) {
        hint.textContent = State.controlMode === 'xbox'
          ? 'اضغط Y للمتابعة ▶'
          : 'اضغط للمتابعة ▶';
      }
      this._render();
    });
  }

  _watchGamepad() {
    // Runs continuously in the background (cheap: one array read per
    // frame) but only acts while a dialogue box is actually open.
    const loop = () => {
      if (this._watchingPad) {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const pad = pads && pads[0];
        const yPressed = !!(pad && pad.buttons[3] && pad.buttons[3].pressed);
        if (yPressed && !this._prevY) this._advance();
        this._prevY = yPressed;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
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
      this._watchingPad = false;
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

    this.input.poll(dt);

    const p = this.player;
    if (p) {
      const moveX = this.input.dx;
      const moveY = this.input.dy;
      const len = Math.hypot(moveX, moveY);
      const nx = len > 0 ? moveX / len : 0;
      const ny = len > 0 ? moveY / len : 0;
      const speed = p.speed || 220;
      p.x += nx * speed * dt * (len > 0 ? 1 : 0);
      p.y += ny * speed * dt * (len > 0 ? 1 : 0);

      const pad = this.arena;
      p.x = Math.max(pad.x + 12, Math.min(pad.x + pad.w - 12, p.x));
      p.y = Math.max(pad.y + 12, Math.min(pad.y + pad.h - 12, p.y));

      if (this.input.attackPressed && p.canAttack && typeof p.attack === 'function') {
        p.attack();
      }
    }

    if (this.boss && typeof this.boss.update === 'function') {
      this.boss.update(dt, this.player, this);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      if (!projectile || projectile.dead) {
        this.projectiles.splice(i, 1);
        continue;
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0) this.projectiles.splice(i, 1);
    }

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      if (!orb || orb.dead) {
        this.orbs.splice(i, 1);
        continue;
      }
      orb.update(dt, this.player, this);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const text = this.floatTexts[i];
      text.life -= dt;
      text.y -= 24 * dt;
      if (text.life <= 0) this.floatTexts.splice(i, 1);
    }

    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.shakeMag *= 0.86;

    if (this.boss && this.boss.hp <= 0) {
      this.running = false;
      this._fightResolve?.();
      return;
    }

    this._render();
    requestAnimationFrame(t => this._loop(t));
  },

  _render() {
    const { ctx, canvas } = this;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shiftX = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeMag : 0;
    const shiftY = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeMag : 0;
    ctx.save();
    ctx.translate(shiftX, shiftY);

    ctx.fillStyle = '#080d1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#3a4d73';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.arena.x, this.arena.y, this.arena.w, this.arena.h);

    if (this.boss) this.boss.draw(ctx, this.arena);
    if (this.player) this.player.draw(ctx, this.arena);

    for (const orb of this.orbs) if (orb && typeof orb.draw === 'function') orb.draw(ctx);
    for (const projectile of this.projectiles) if (projectile && typeof projectile.draw === 'function') projectile.draw(ctx);
    for (const particle of this.particles) {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }

    for (const text of this.floatTexts) {
      ctx.fillStyle = text.color;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(text.text, text.x, text.y);
    }

    ctx.restore();
  },
};
