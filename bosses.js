/* =========================================================
   Eclipse of Souls — bosses.js
   All 13 boss definitions. Pure data + pattern references —
   no per-boss classes, keeps code size small (Series S friendly).
   ========================================================= */

const BossDefs = {

  // ---------------- CHAPTER 1 — Human Bosses ----------------
  kael: {
    id: 'kael',
    chapter: 1,
    name: 'Kael Vantor',
    title: 'The Duelist',
    color: '#e0533b',
    maxHp: 80,
    patternInterval: 1.5,
    patterns: [
      Patterns.aimedSpread(1, 0, 180, '#e0533b'),   // direct thrust
      Patterns.pincerShots(140, '#e0533b'),          // dash-line attack
    ],
  },

  sera: {
    id: 'sera',
    chapter: 1,
    name: 'Sera Duskblade',
    title: 'The Twin Shade',
    color: '#c93bff',
    maxHp: 95,
    patternInterval: 1.3,
    patterns: [
      Patterns.aimedSpread(2, 50, 150, '#c93bff'),   // twin daggers
      Patterns.radialBurst(6, 100, '#c93bff'),
    ],
  },

  bram: {
    id: 'bram',
    chapter: 1,
    name: 'Commander Bram Ashgate',
    title: 'The Last Loyalist',
    color: '#3b7dff',
    maxHp: 130,
    patternInterval: 1.9,
    patterns: [
      Patterns.shockwaveRing(14, 100, '#3b7dff'),
      Patterns.aimedSpread(3, 20, 120, '#3b7dff'),
    ],
  },

  // ---------------- CHAPTER 2 — Monster Bosses ----------------
  voidmaw: {
    id: 'voidmaw',
    chapter: 2,
    name: 'Voidmaw',
    title: 'The Hungering Dark',
    color: '#1e1e3b',
    maxHp: 140,
    patternInterval: 1.4,
    patterns: [
      Patterns.spiralDrift(6, 80, '#4b3bff'),
      Patterns.radialBurst(10, 90, '#1e1e3b'),
    ],
  },

  hollowChoir: {
    id: 'hollowChoir',
    chapter: 2,
    name: 'The Hollow Choir',
    title: 'Weeping Three',
    color: '#9be0ff',
    maxHp: 120,
    patternInterval: 1.2,
    patterns: [
      Patterns.aimedSpread(3, 60, 130, '#9be0ff'),
      Patterns.spiralDrift(9, 60, '#9be0ff'),
    ],
  },

  ashenWidow: {
    id: 'ashenWidow',
    chapter: 2,
    name: 'Ashen Widow',
    title: 'Weaver of Silence',
    color: '#7a7a7a',
    maxHp: 150,
    patternInterval: 1.5,
    patterns: [
      Patterns.pincerShots(160, '#7a7a7a'),
      Patterns.randomRain(6, 140, '#7a7a7a'),
    ],
  },

  duskwalker: {
    id: 'duskwalker',
    chapter: 2,
    name: 'Duskwalker',
    title: 'The Fading Shade',
    color: '#3b1e5c',
    maxHp: 135,
    patternInterval: 1.1,
    patterns: [
      Patterns.radialBurst(5, 130, '#3b1e5c'),
      Patterns.aimedSpread(1, 0, 200, '#3b1e5c'),
    ],
  },

  gravekeeper: {
    id: 'gravekeeper',
    chapter: 2,
    name: 'The Gravekeeper',
    title: 'Warden of Bone',
    color: '#8a5a2b',
    maxHp: 160,
    patternInterval: 1.6,
    patterns: [
      Patterns.groundSpikes(4, '#8a5a2b'),
      Patterns.groundSpikes(3, '#8a5a2b'),
    ],
  },

  umbraSerpent: {
    id: 'umbraSerpent',
    chapter: 2,
    name: 'Umbra Serpent',
    title: 'Coil of the Eclipse',
    color: '#2b8a5a',
    maxHp: 170,
    patternInterval: 1.3,
    patterns: [
      Patterns.shockwaveRing(16, 120, '#2b8a5a'),
      Patterns.spiralDrift(8, 90, '#2b8a5a'),
    ],
  },

  // ---------------- CHAPTER 3 — Final Trio ----------------
  eclipsedKing: {
    id: 'eclipsedKing',
    chapter: 3,
    name: 'The Eclipsed King',
    title: 'Crowned in Ruin',
    color: '#ffb23b',
    maxHp: 190,
    patternInterval: 1.2,
    patterns: [
      Patterns.aimedSpread(4, 40, 160, '#ffb23b'),
      Patterns.shockwaveRing(14, 110, '#ffb23b'),
    ],
  },

  soulVessel: {
    id: 'soulVessel',
    chapter: 3,
    name: 'Soul Vessel',
    title: 'Vessel of the Lost',
    color: '#d6d6ff',
    maxHp: 200,
    patternInterval: 1.1,
    patterns: [
      Patterns.spiralDrift(10, 85, '#d6d6ff'),
      Patterns.randomRain(7, 150, '#d6d6ff'),
    ],
  },

  hollowShade: {
    id: 'hollowShade',
    chapter: 3,
    name: 'The Hollow Shade',
    title: "Rassel's Doubt",
    color: '#5c1e5c',
    maxHp: 210,
    patternInterval: 1.0,
    patterns: [
      Patterns.aimedSpread(3, 30, 180, '#5c1e5c'),
      Patterns.pincerShots(170, '#5c1e5c'),
      Patterns.radialBurst(8, 110, '#5c1e5c'),
    ],
  },

  // ---------------- FINAL BOSS ----------------
  rassel: {
    id: 'rassel',
    chapter: 3,
    name: 'Rassel',
    title: 'The Half-Demon',
    color: '#ff1b3b',
    maxHp: 320,
    patternInterval: 0.95,
    patterns: [
      Patterns.aimedSpread(5, 50, 170, '#ff1b3b'),
      Patterns.shockwaveRing(18, 130, '#ff1b3b'),
      Patterns.spiralDrift(10, 100, '#ff1b3b'),
      Patterns.randomRain(8, 160, '#ff1b3b'),
      Patterns.pincerShots(190, '#ff1b3b'),
    ],
  },
};

// Chapter order — engine walks through these arrays in sequence
const ChapterOrder = {
  1: ['kael', 'sera', 'bram'],
  2: ['voidmaw', 'hollowChoir', 'ashenWidow', 'duskwalker', 'gravekeeper', 'umbraSerpent'],
  3: ['eclipsedKing', 'soulVessel', 'hollowShade', 'rassel'],
};
