/* =========================================================
   Eclipse of Souls — music.js
   Fully procedural music (Web Audio API — no audio files).

   v2 changes:
   - Every voice now runs through a lowpass filter, which removes
     the harsh buzzing edge a raw sawtooth drone has on its own.
   - A shared delay/feedback bus adds depth and space, so the
     music reads as bigger/deeper instead of a single thin voice.
   - Chords now move through a short progression instead of
     sitting on one static root — the piece feels longer and
     more alive instead of looping the same bar forever.
   - A dedicated, calmer MENU theme plays on the title/control
     screens; boss themes still use the mysterious/exciting/
     finalMix moods from before.
   ========================================================= */

function semitoneRatio(n) { return Math.pow(2, n / 12); }

const MusicMoods = {
  mysterious: {
    tempo: 92,
    droneType: 'sawtooth',
    droneGain: 0.05,
    arpType: 'sine',
    arpGain: 0.06,
    scale: [1, 1.19, 1, 1.5, 1, 1.19, 1.68, 1],
    noteEvery: 2,
    sadMelody: null,
    filterFreq: 650,
  },
  exciting: {
    tempo: 150,
    droneType: 'sawtooth',
    droneGain: 0.045,
    arpType: 'triangle',
    arpGain: 0.09,
    scale: [1, 1.26, 1.5, 1.68, 2, 1.68, 1.5, 1.26],
    noteEvery: 1,
    sadMelody: null,
    filterFreq: 950,
  },
  finalMix: {
    tempo: 138,
    droneType: 'sawtooth',
    droneGain: 0.055,
    arpType: 'triangle',
    arpGain: 0.075,
    scale: [1, 1.19, 1.5, 1.19, 1.78, 1.5, 1.19, 1],
    noteEvery: 1,
    sadMelody: { ratios: [1, 0.89, 0.75, 0.89], type: 'sine', gain: 0.05, stepMultiplier: 4 },
    filterFreq: 800,
  },
};

// A short, moody chord progression the root note steps through —
// i, VII, VI, V (descending) — the same shape used in a lot of
// "epic but dark" trailer music. Each chord holds for a few bars.
const CHORD_PROGRESSION = [0, -2, -4, -5];
const CHORD_HOLD_STEPS = 8; // arpeggio steps per chord

class MusicManager {
  constructor() {
    this.ctx = null;
    this.timer = null;
    this.sadTimer = null;
    this.menuTimer = null;
    this.voices = [];       // active long-lived nodes to clean up on stop()
    this.masterGain = null;
    this.delaySend = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      // Cheap "depth" bus: a short delay with feedback, fed a little
      // of every voice, mixed back in quietly. Makes everything feel
      // bigger/deeper without needing real reverb.
      this.delaySend = this.ctx.createDelay(1.0);
      this.delaySend.delayTime.value = 0.32;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.28;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.22;
      this.delaySend.connect(feedback).connect(this.delaySend);
      this.delaySend.connect(wet).connect(this.masterGain);
      this._feedback = feedback;
      this._wet = wet;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Builds osc -> filter -> gain -> (masterGain + delaySend), returns {osc, filter, gain}
  _voice(freq, type, filterFreq) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.6;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(filter).connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.delaySend);
    return { osc, filter, gain };
  }

  _rootFreqFor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    const notes = [110, 123.5, 130.8, 146.8, 164.8, 174.6, 196];
    return notes[hash % notes.length];
  }

  _moodFor(bossDef) {
    if (bossDef.id === 'rassel') return MusicMoods.finalMix;
    if (bossDef.chapter === 1) return MusicMoods.mysterious;
    if (bossDef.chapter === 2) return MusicMoods.exciting;
    return MusicMoods.finalMix;
  }

  playForBoss(bossDef) {
    this._ensureCtx();
    this.stop();

    const baseRoot = this._rootFreqFor(bossDef.id);
    const mood = this._moodFor(bossDef);
    const isFinal = bossDef.id === 'rassel';
    const tempo = isFinal ? mood.tempo * 1.15 : mood.tempo;
    const stepTime = 60 / tempo / 2;

    let chordStep = 0;
    const currentRoot = () => {
      const chordIdx = Math.floor(chordStep / CHORD_HOLD_STEPS) % CHORD_PROGRESSION.length;
      return baseRoot * semitoneRatio(CHORD_PROGRESSION[chordIdx]);
    };

    // --- sub-bass + drone layer (the "mysterious" foundation) ---
    const subVoice = this._voice(baseRoot / 4, 'sine', 220);
    subVoice.gain.gain.value = mood.droneGain * 0.5;
    subVoice.osc.start();

    const droneVoice = this._voice(baseRoot / 2, mood.droneType, mood.filterFreq);
    droneVoice.gain.gain.value = mood.droneGain;
    droneVoice.osc.start();
    this.voices.push(subVoice, droneVoice);

    // --- arpeggio layer (rhythmic, "exciting" part) ---
    let step = 0;
    const playNote = () => {
      const root = currentRoot();
      // slowly retune the drone/sub as chords change, instead of
      // hard-cutting — reads as one evolving piece, not loops
      const now = this.ctx.currentTime;
      droneVoice.osc.frequency.setTargetAtTime(root / 2, now, 0.6);
      subVoice.osc.frequency.setTargetAtTime(root / 4, now, 0.6);

      if (step % mood.noteEvery === 0) {
        const freq = root * 2 * mood.scale[step % mood.scale.length];
        const v = this._voice(freq, isFinal ? 'square' : mood.arpType, mood.filterFreq * 1.4);
        v.gain.gain.exponentialRampToValueAtTime(mood.arpGain, now + 0.02);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, now + stepTime * 0.9);
        v.osc.start(now);
        v.osc.stop(now + stepTime);
      }
      step++;
      chordStep++;
    };
    this.timer = setInterval(playNote, stepTime * 1000);

    // --- sad melody layer (finalMix mood only) ---
    if (mood.sadMelody) {
      let sadStep = 0;
      const sadStepTime = stepTime * mood.sadMelody.stepMultiplier;
      const playSadNote = () => {
        const root = currentRoot();
        const ratios = mood.sadMelody.ratios;
        const freq = root * ratios[sadStep % ratios.length];
        const v = this._voice(freq, mood.sadMelody.type, 900);
        const now = this.ctx.currentTime;
        v.gain.gain.exponentialRampToValueAtTime(mood.sadMelody.gain, now + 0.08);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, now + sadStepTime * 0.95);
        v.osc.start(now);
        v.osc.stop(now + sadStepTime);
        sadStep++;
      };
      this.sadTimer = setInterval(playSadNote, sadStepTime * 1000);
    }
  }

  // Calm ambient pad for the main menu / control-select screens —
  // two slow detuned voices + the chord progression, much quieter
  // and slower than any boss theme.
  playMenuTheme() {
    this._ensureCtx();
    this.stop();

    const root = 130.8; // C3 — calm, neutral
    const chordHoldMs = 4200;
    let chordIdx = 0;

    const swapChord = () => {
      const now = this.ctx.currentTime;
      const freq = root * semitoneRatio(CHORD_PROGRESSION[chordIdx % CHORD_PROGRESSION.length]);
      this._menuPadA.osc.frequency.setTargetAtTime(freq / 2, now, 1.2);
      this._menuPadB.osc.frequency.setTargetAtTime((freq / 2) * 1.5, now, 1.2); // a fifth above
      chordIdx++;
    };

    this._menuPadA = this._voice(root / 2, 'triangle', 500);
    this._menuPadA.gain.gain.value = 0.045;
    this._menuPadA.osc.detune.value = -6;
    this._menuPadA.osc.start();

    this._menuPadB = this._voice((root / 2) * 1.5, 'sine', 500);
    this._menuPadB.gain.gain.value = 0.035;
    this._menuPadB.osc.detune.value = 6;
    this._menuPadB.osc.start();

    this.voices.push(this._menuPadA, this._menuPadB);
    swapChord();
    this.menuTimer = setInterval(swapChord, chordHoldMs);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.sadTimer) { clearInterval(this.sadTimer); this.sadTimer = null; }
    if (this.menuTimer) { clearInterval(this.menuTimer); this.menuTimer = null; }
    this.voices.forEach(v => {
      try { v.osc.stop(); } catch (e) {}
    });
    this.voices = [];
  }
}
