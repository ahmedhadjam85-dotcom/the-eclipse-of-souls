/* =========================================================
   Eclipse of Souls — dialog.js
   Story dialogue, keyed by the story-beat that triggers it.
   Each entry is an array of { speaker, text } lines shown
   one at a time (tap / press Y / press Space to advance).

   Written in English for a wider (streaming) audience, and
   deliberately structured so the FIRST chapter teaches the
   rules through character voice instead of a tutorial popup:
     - move to dodge (there is no dash)
     - collect energy motes
     - energy is what lets you strike at all
     - getting hit empties your energy completely
   ========================================================= */

const Dialogues = {

  // ---------- OPENING ----------
  // Lucifer's introduction. Plays as a villain monologue that the
  // player is meant to read as heroic defiance — the Chapter 2
  // reveal recontextualizes every line of it.
  introLucifer: [
    { speaker: '', text: 'They said the vanishing began without warning. They were wrong.' },
    { speaker: '', text: 'It began with a promise. And the one who made it is still walking.' },
    { speaker: 'Lucifer', text: 'So the old world sends its champions to stop me.' },
    { speaker: 'Lucifer', text: 'Good. Let them come. Let them all come.' },
    { speaker: 'Lucifer', text: 'I will tear this ruined world down to its foundation...' },
    { speaker: 'Lucifer', text: 'and every last one of you will burn with it.' },
    { speaker: '', text: '— CHAPTER ONE —' },
  ],

  // ---------- CHAPTER 1 — bosses double as the tutorial ----------
  chapter1_kael: [
    { speaker: 'Kael Vantor', text: "You carry yourself like a king. Let's see what's underneath." },
    { speaker: 'Kael Vantor', text: 'I fought men twice your size. None of them could outrun a blade.' },
    { speaker: '', text: 'MOVE to dodge his strikes. There is no dash — your footwork is all you have.' },
    { speaker: '', text: 'Gather the golden ENERGY MOTES in the arena. Without energy, you cannot strike back.' },
  ],

  chapter1_sera: [
    { speaker: 'Sera Duskblade', text: "Kael fought you honestly. That was his mistake." },
    { speaker: 'Sera Duskblade', text: "I won't be where you're looking." },
    { speaker: '', text: 'Get CLOSE to the enemy before you attack — strikes from too far away will MISS.' },
    { speaker: 'Sera Duskblade', text: 'Come on, then. Try to touch me.' },
  ],

  chapter1_bram: [
    { speaker: 'Commander Bram', text: 'I held this line when there was still a world behind it.' },
    { speaker: 'Commander Bram', text: 'There are eleven thousand people who never came home. I counted every one.' },
    { speaker: '', text: 'WARNING: if you are hit, your ENERGY drops to zero instantly. Survival comes before greed.' },
    { speaker: 'Commander Bram', text: "You'll answer for them. One way or another." },
  ],

  // ---------- THE TWIST ----------
  // Rose reframes everything the player just did.
  roseReveal: [
    { speaker: '???', text: 'Stop. Whatever you think you just won — stop.' },
    { speaker: 'Rose', text: 'My name is Rosalin. I have been looking for you for a long time, Jivan.' },
    { speaker: 'Jivan', text: 'Jivan? I... those fights. That was me. I felt them.' },
    { speaker: 'Rose', text: 'You felt HIM. You were watching through Lucifer\'s eyes.' },
    { speaker: 'Jivan', text: 'Lucifer...' },
    { speaker: 'Rose', text: 'Those three you cut down were the last people trying to stop the vanishing.' },
    { speaker: 'Rose', text: 'Kael. Sera. Bram. They died defending what was left of us.' },
    { speaker: 'Jivan', text: 'No. No, I thought— they attacked me. I was defending myself.' },
    { speaker: 'Rose', text: 'That is what he wanted you to believe. That is how he works.' },
    { speaker: 'Rose', text: 'Lucifer did not arrive after the world broke, Jivan. He is why it broke.' },
    { speaker: 'Jivan', text: '...Where is he now?' },
    { speaker: 'Rose', text: 'Gone. He opened something and walked through it, and what came out the other side—' },
    { speaker: 'Rose', text: 'You will see it soon enough. It is already here.' },
    { speaker: 'Rose', text: 'You cannot undo what he did through you. But you can face what he left behind.' },
    { speaker: '', text: '— CHAPTER TWO —' },
  ],

  chapter2_intro: [
    { speaker: 'Jivan', text: 'This is not the world I fell asleep in.' },
    { speaker: 'Rose', text: 'No. The vanishing did not empty this place — it replaced what it took.' },
    { speaker: 'Rose', text: 'Every person who disappeared left something standing in their shape.' },
    { speaker: 'Jivan', text: 'Then these things were people.' },
    { speaker: 'Rose', text: 'Some of them still remember being people. That is the cruel part.' },
    { speaker: 'Rassel', text: 'She is right about that much.' },
    { speaker: 'Jivan', text: 'Who—' },
    { speaker: 'Rassel', text: 'Rassel. I have been tracking these things longer than either of you.' },
    { speaker: 'Rassel', text: 'Stay close to me and you might see the other side of this.' },
    { speaker: 'Rose', text: '...We could use the help.' },
  ],

  // ---- Chapter 2 boss intro scenes ----
  chapter2_voidmaw: [
    { speaker: 'Rose', text: 'Careful. That one does not attack out of anger — it attacks because it is empty.' },
    { speaker: 'Jivan', text: 'Empty how?' },
    { speaker: 'Rose', text: 'It used to be someone who was afraid of running out of things. Time. Money. Love.' },
    { speaker: 'Rose', text: 'Now it just runs out of everything, forever, and it wants company.' },
    { speaker: 'Rassel', text: 'Beautiful. Can we kill it now?' },
  ],

  chapter2_hollowChoir: [
    { speaker: 'Jivan', text: 'There are three of them. They are... singing?' },
    { speaker: 'Rose', text: 'They were a family once. I think they still are, in whatever way is left to them.' },
    { speaker: 'Rassel', text: 'They will not thank you for ending it. Do it anyway.' },
    { speaker: 'Rose', text: 'Rassel.' },
    { speaker: 'Rassel', text: 'What. Kindness does not make this easier for them, Rose. It only makes it slower.' },
  ],

  chapter2_ashenWidow: [
    { speaker: 'Rassel', text: 'This one nests. It has been weaving through this ruin for longer than the others.' },
    { speaker: 'Jivan', text: 'How long is "longer"?' },
    { speaker: 'Rassel', text: 'Long enough that I stopped trying to guess whose shape it started as.' },
    { speaker: 'Rose', text: 'That is not comforting.' },
    { speaker: 'Rassel', text: "It wasn't meant to be." },
  ],

  chapter2_duskwalker: [
    { speaker: 'Rose', text: 'Watch the edges of your vision, not the center. This one does not stay where you last saw it.' },
    { speaker: 'Jivan', text: 'A shadow that moves on its own.' },
    { speaker: 'Rassel', text: 'They all move on their own now, Jivan. That is rather the problem.' },
    { speaker: 'Rose', text: 'He is not wrong. Stay sharp.' },
  ],

  chapter2_gravekeeper: [
    { speaker: 'Rose', text: 'This place used to be a cemetery. I think it remembers that much, at least.' },
    { speaker: 'Jivan', text: 'It is guarding the graves?' },
    { speaker: 'Rose', text: 'Or it is still trying to be buried. I am honestly not sure which is sadder.' },
    { speaker: 'Rassel', text: 'Sad does not stop a fist made of bone. Move.' },
  ],

  chapter2_umbraSerpent: [
    { speaker: 'Rassel', text: 'Last one of this chapter. After this, the path opens toward the true edge of the vanishing.' },
    { speaker: 'Jivan', text: 'You say that like you already know what is waiting there.' },
    { speaker: 'Rassel', text: 'I have my suspicions. Let us confirm them one fight at a time.' },
    { speaker: 'Rose', text: 'Jivan — whatever happens after this, thank you for not walking away when you could have.' },
    { speaker: 'Jivan', text: 'Rose, you are talking like this is an ending.' },
    { speaker: 'Rose', text: 'Everything is, eventually. Go on. I will catch up.' },
  ],

  // ---- Chapter 3 boss intro scenes ----
  chapter3_eclipsedKing: [
    { speaker: 'Jivan', text: 'A king? Here?' },
    { speaker: 'Rassel', text: 'He ruled something, once. Before the crown outlived the kingdom.' },
    { speaker: 'Jivan', text: 'Where is Rose? She said she would catch up.' },
    { speaker: 'Rassel', text: 'She will. Focus on the ruin in front of you.' },
  ],

  chapter3_soulVessel: [
    { speaker: 'Rassel', text: 'Listen closely and you can hear them. All the ones it swallowed on the way here.' },
    { speaker: 'Jivan', text: 'That is not a monster. That is a grave that learned to walk.' },
    { speaker: 'Rassel', text: 'Most of them are, if you look closely enough. You are simply looking now.' },
  ],

  chapter3_hollowShade: [
    { speaker: 'Rassel', text: 'This one is closer to the source than the rest. It thinks. It hesitates.' },
    { speaker: 'Jivan', text: 'You sound like you understand it.' },
    { speaker: 'Rassel', text: '...I understand hesitation. Yes.' },
    { speaker: 'Jivan', text: 'Rassel—' },
    { speaker: 'Rassel', text: "Finish it, Jivan. We're almost there." },
  ],

  // ---------- CHAPTER 3 ----------
  chapter3_intro: [
    { speaker: 'Rassel', text: 'We are close now. I can feel the edge of it.' },
    { speaker: 'Jivan', text: 'Rose should be here. She said she would meet us.' },
    { speaker: 'Rassel', text: 'She will catch up. She always does.' },
    { speaker: 'Jivan', text: 'You have not asked me once what I did in that first chapter.' },
    { speaker: 'Rassel', text: 'Because it does not matter what a blade did before someone picked it up.' },
    { speaker: 'Jivan', text: '...I have never been able to tell if you mean that kindly.' },
    { speaker: 'Rassel', text: 'Neither have I. Come on.' },
    { speaker: '', text: '— CHAPTER THREE —' },
  ],

  // ---------- THE BETRAYAL ----------
  rasselBetrayal: [
    { speaker: 'Jivan', text: 'That was the last of them. Rassel — we did it.' },
    { speaker: 'Rassel', text: 'Yes. You did exactly what you were supposed to.' },
    { speaker: 'Jivan', text: 'What?' },
    { speaker: 'Rassel', text: 'Every one of those things you killed was a door holding itself shut.' },
    { speaker: 'Rassel', text: 'I could not open them. But you could. So I walked you to each one.' },
    { speaker: 'Jivan', text: 'Rose— where is Rose?' },
    { speaker: 'Rassel', text: 'She understood before you did. That was unfortunate for her.' },
    { speaker: 'Jivan', text: 'You— why? WHY?' },
    { speaker: 'Rassel', text: 'Because Lucifer never finished what he started. He only opened the way.' },
    { speaker: 'Rassel', text: 'Someone had to walk it to the end. I volunteered.' },
    { speaker: 'Jivan', text: 'You are not taking anything else from me.' },
    { speaker: 'Rassel', text: 'Then stop me. Properly, this time.' },
    { speaker: '', text: 'RASSEL BECOMES THE HALF-DEMON' },
  ],

  ending: [
    { speaker: 'Jivan', text: '...It is over.' },
    { speaker: 'Jivan', text: 'Rose. Kael. Bram. Sera. All of them, and I still do not know if that counts as making it right.' },
    { speaker: '', text: 'The world did not come back. It simply stopped getting worse.' },
    { speaker: '', text: 'Somewhere past the edge of it, a door that Lucifer opened is still open.' },
    { speaker: '', text: 'And Lucifer never did come back to close it.' },
    { speaker: '', text: '— ECLIPSE OF SOULS —' },
    { speaker: '', text: 'Awd Gaming' },
  ],
};

// Maps a boss id to the short scene shown right before that fight
const BossIntroLines = {
  kael: 'chapter1_kael',
  sera: 'chapter1_sera',
  bram: 'chapter1_bram',
  voidmaw: 'chapter2_voidmaw',
  hollowChoir: 'chapter2_hollowChoir',
  ashenWidow: 'chapter2_ashenWidow',
  duskwalker: 'chapter2_duskwalker',
  gravekeeper: 'chapter2_gravekeeper',
  umbraSerpent: 'chapter2_umbraSerpent',
  eclipsedKing: 'chapter3_eclipsedKing',
  soulVessel: 'chapter3_soulVessel',
  hollowShade: 'chapter3_hollowShade',
  // rassel's scene is the betrayal itself (Dialogues.rasselBetrayal),
  // already played right before that fight in game.js — no separate
  // entry needed here.
};
