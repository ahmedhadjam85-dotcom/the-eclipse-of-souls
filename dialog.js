/* =========================================================
   Eclipse of Souls — dialog.js
   Story dialogue, keyed by the story-beat that triggers it.
   Each entry is an array of { speaker, text } lines shown
   one at a time (press attack / tap to advance).
   ========================================================= */

const Dialogues = {

  // Shown once, right after control select, before Chapter 1
  introLucifer: [
    { speaker: 'Lucifer', text: '...' },
    { speaker: 'Lucifer', text: 'كل هذا العالم كان يستحق النهاية.' },
    { speaker: 'Lucifer', text: 'سوف أدمركم... كلكم.' },
    { speaker: '', text: '— يبدأ الفصل الأول —' },
  ],

  // Small intro before each Chapter 1 boss (kept short — it's the tutorial chapter)
  chapter1_kael: [
    { speaker: 'Kael Vantor', text: 'شرف الفارس لا يُهزم بهذه السهولة.' },
  ],
  chapter1_sera: [
    { speaker: 'Sera Duskblade', text: 'لن تراني قادمة حتى تشعر بالنصل.' },
  ],
  chapter1_bram: [
    { speaker: 'Commander Bram', text: 'أنا آخر من يقف بينك وبين ما تبقى.' },
  ],

  // The big twist — shown after Chapter 1 ends, before Jivan begins
  roseReveal: [
    { speaker: 'Rose', text: 'توقف. أرجوك، اسمعني قبل أن تكمل.' },
    { speaker: 'Rose', text: 'من كنت تتحكم به... لم يكن بطلاً.' },
    { speaker: 'Rose', text: 'لوسيفر هو من فتح الطريق لاختفاء آلاف البشر.' },
    { speaker: 'Rose', text: 'كل ما فعلته للتو... كان جزءاً من خطته، لا بداية لنهايته.' },
    { speaker: 'Jivan', text: 'اضن ان علي ان ان اوقف هاذ الفاجر' },
    { speaker: 'Rose', text: 'الآن دورك الحقيقي يبدأ يا Jivan. عليك أن تعرف الحقيقة كاملة.' },
    { speaker: '', text: '— يبدأ الفصل الثاني —' },
  ],

  chapter2_intro: [
    { speaker: 'Jivan', text: 'العالم هنا... لم يعد يشبه ما أعرفه.' },
  ],

  // Before Chapter 3 — stakes are clear, Rassel is still "trusted"
  chapter3_intro: [
    { speaker: 'Rassel', text: 'اقتربنا يا Jivan. النهاية باتت قريبة.' },
    { speaker: 'Jivan', text: 'لن أستطيع الوصول لهذا الحد وحدي. شكراً لوقوفك معي.' },
  ],

  // The betrayal — right before the Rassel fight
  rasselBetrayal: [
    { speaker: 'Rassel', text: 'هل ظننت حقاً أنني كنت إلى جانبك؟' },
    { speaker: 'Jivan', text: 'ماذا...؟' },
    { speaker: 'Rassel', text: 'كل خطوة قدتك إليها... كانت تقودك إلى هنا فقط.' },
    { speaker: 'Rassel', text: 'الآن، سترى شكلي الحقيقي.' },
    { speaker: '', text: '— Rassel يتحول إلى Half-Demon —' },
  ],

  ending: [
    { speaker: 'Jivan', text: '...انتهى الأمر أخيراً.' },
    { speaker: '', text: 'لكن الأسئلة التي بدأت برحيل لوسيفر... لم تُجب كلها بعد.' },
    { speaker: '', text: '— نهاية Eclipse of Souls —' },
  ],
};

// Maps a boss id to the short line shown right before that fight
const BossIntroLines = {
  kael: 'chapter1_kael',
  sera: 'chapter1_sera',
  bram: 'chapter1_bram',
};
