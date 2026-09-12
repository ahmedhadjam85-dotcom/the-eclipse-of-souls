/* =========================================================
   Eclipse of Souls — music.js
   Fully procedural background music (Web Audio API — no audio
   files at all). Each CHAPTER gets its own mood profile:

     Chapter 1 — MYSTERIOUS   : slow, sparse, minor, quiet drone
     Chapter 2 — EXCITING     : fast, driving, brighter rhythm
     Chapter 3 — MYSTERIOUS +
                 EXCITING +
                 SAD          : moderate-fast tempo, minor key,
                                 a slow mournful melody layered
                                 UNDER the faster arpeggio

   Rassel (final boss) reuses the Chapter 3 profile but pushed
   further (faster, louder, harsher oscillator) for the climax.
   ========================================================= */

const MusicMoods = {

  mysterious: {
    tempo: 92,
    droneType: 'sawtooth',
    droneGain: 0.045,
    arpType: 'sine',
    arpGain: 0.06,
    // wide, slow-feeling intervals — lots of space between notes
    scale: [1, 1.19, 1, 1.5, 1, 1.19, 1.68, 1],
    noteEvery: 2, // play an arpeggio note only every Nth step (sparse)
    sadMelody: null,
  },

  exciting: {
    tempo: 150,
    droneType: 'sawtooth',
    droneGain: 0.04,
    arpType: 'triangle',
    arpGain: 0.085,
    // brighter, more "major-ish" bounce, steady eighth notes
    scale: [1, 1.26, 1.5, 1.68, 2, 1.68, 1.5, 1.26],
    noteEvery: 1,
    sadMelody: null,
  },

  finalMix: { // mysterious + exciting + sad, all at once
    tempo: 138,
    droneType: 'sawtooth',
    droneGain: 0.05,
    arpType: 'triangle',
    arpGain: 0.07,
    scale: [1, 1.19, 1.5, 1.19, 1.78, 1.5, 1.19, 1],
    noteEvery: 1,
    // a slow, mournful line played under the arpeggio on a soft sine —
    // this is what makes it read as "sad" instead of just "tense"
    sadMelody: { ratios: [1, 0.89, 0.75, 0.89], type: 'sine', gain: 0.05, stepMultiplier: 4 },
  },
};

class MusicManager {
  constructor() {
    this.ctx = null;
    this.timer = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.sadTimer = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Turns a boss id into a stable-but-varied root frequency
  _rootFreqFor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    const notes = [110, 123.5, 130.8, 146.8, 164.8, 174.6, 196]; // A minor-ish palette (Hz)
    return notes[hash % notes.length];
  }

  _moodFor(bossDef) {
    if (bossDef.id === 'rassel') return MusicMoods.finalMix;
    if (bossDef.chapter === 1) return MusicMoods.mysterious;
    if (bossDef.chapter === 2) return MusicMoods.exciting;
    return MusicMoods.finalMix; // chapter 3 (non-final too)
  }

  playForBoss(bossDef) {
    this._ensureCtx();
    this.stop();

    const root = this._rootFreqFor(bossDef.id);
    const mood = this._moodFor(bossDef);
    const isFinal = bossDef.id === 'rassel';
    const tempo = isFinal ? mood.tempo * 1.15 : mood.tempo;
    const stepTime = 60 / tempo / 2; // eighth notes

    // --- low drone layer (present in every mood, sets the "key") ---
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = mood.droneType;
    this.droneOsc.frequency.value = root / 2;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = mood.droneGain;
    this.droneOsc.connect(this.droneGain).connect(this.ctx.destination);
    this.droneOsc.start();

    // --- arpeggio layer (the "exciting"/rhythmic part) ---
    let step = 0;
    const playNote = () => {
      if (step % mood.noteEvery === 0) {
        const freq = root * 2 * mood.scale[step % mood.scale.length];
        const osc = this.ctx.createOscillator();
        osc.type = isFinal ? 'square' : mood.arpType;
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(mood.arpGain, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + stepTime * 0.9);
        osc.start(now);
        osc.stop(now + stepTime);
      }
      step++;
    };
    this.timer = setInterval(playNote, stepTime * 1000);

    // --- sad melody layer (only present in the finalMix mood) ---
    if (mood.sadMelody) {
      let sadStep = 0;
      const sadStepTime = stepTime * mood.sadMelody.stepMultiplier;
      const playSadNote = () => {
        const ratios = mood.sadMelody.ratios;
        const freq = root * ratios[sadStep % ratios.length];
        const osc = this.ctx.createOscillator();
        osc.type = mood.sadMelody.type;
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(mood.sadMelody.gain, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + sadStepTime * 0.95);
        osc.start(now);
        osc.stop(now + sadStepTime);
        sadStep++;
      };
      this.sadTimer = setInterval(playSadNote, sadStepTime * 1000);
    }
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.sadTimer) { clearInterval(this.sadTimer); this.sadTimer = null; }
    if (this.droneOsc) {
      try { this.droneOsc.stop(); } catch (e) {}
      this.droneOsc = null;
    }
  }
}
