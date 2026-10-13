'use strict';
/* Static port of the fallback in src/app.py (retrieve + big_picture) for the
   GitHub Pages preview. Same data, same wording, same priority order:
   big-picture reference answers are checked before the local dataset
   intents, so "how many stars are in the Milky Way" is never mistaken
   for a count inside the dataset. */

/* Python-style float formatting: format(x, ".Nf") rounds the exact binary
   value, ties to even. JS toFixed picks the larger neighbour on ties
   (4.25 -> "4.3" instead of Python's "4.2"), so format via an exact
   decimal expansion and round the digits here. */
function pyFormat(x, digits) {
  const neg = x < 0;
  let s = Math.abs(x).toFixed(30);
  const dot = s.indexOf('.');
  let intPart = s.slice(0, dot);
  let frac = s.slice(dot + 1);
  if (frac.length > digits) {
    const kept = frac.slice(0, digits);
    const rest = frac.slice(digits);
    let up = false;
    if (rest[0] > '5') up = true;
    else if (rest[0] === '5') {
      if (/[1-9]/.test(rest.slice(1))) up = true;
      else {
        const lastKept = digits > 0 ? kept[kept.length - 1] : intPart[intPart.length - 1];
        up = (parseInt(lastKept, 10) % 2) === 1;   /* tie: round to even */
      }
    }
    if (up) {
      const digs = (intPart + kept).split('');
      let i = digs.length - 1, carry = 1;
      while (i >= 0 && carry) {
        const d = digs[i].charCodeAt(0) - 48 + carry;
        digs[i] = String.fromCharCode(48 + (d % 10));
        carry = d >= 10 ? 1 : 0;
        i--;
      }
      if (carry) digs.unshift('1');
      const joined = digs.join('');
      intPart = digits > 0 ? joined.slice(0, joined.length - digits) : joined;
      frac = digits > 0 ? joined.slice(joined.length - digits) : '';
    } else {
      frac = kept;
    }
  }
  frac = frac.padEnd(digits, '0');
  return (neg ? '-' : '') + intPart + (digits > 0 ? '.' + frac : '');
}
function pyRound(x, digits) { return parseFloat(pyFormat(x, digits)); }

/* Famous stars with no usable entry in this Gaia DR3 extract (textbook
   Hipparcos distances), same table as app.py REFERENCE_ONLY. */
const REFERENCE_ONLY = [
  ['vega', 'Vega', 25.0],
  ['alpha centauri', 'Alpha Centauri', 4.37],
  ['procyon', 'Procyon', 11.5],
  ['altair', 'Altair', 16.7],
  ['pollux', 'Pollux', 33.8],
  ['arcturus', 'Arcturus', 36.7],
  ['capella', 'Capella', 42.9]
];

/* Big-picture reference answers, verbatim from app.py. */
const BIG_PICTURE = {
  MILKY_WAY_COUNT: "Astronomers estimate that the Milky Way holds somewhere between 100 and 400 billion stars, and about 200 billion is the number most often quoted. Nobody counted them one by one: the estimate comes from weighing the galaxy and working out how much of its mass is in stars. This app maps the 1,113 stars within 49 light years of home, a tiny local sample of that huge number.",
  MILKY_WAY_SIZE: "The Milky Way is a spiral galaxy about 100,000 light years across, with a disk roughly 1,000 light years thick. That size is an estimate built from mapping its spiral arms and rotation, not something anyone measured directly. The whole 49 light year neighbourhood mapped in this app would be a tiny speck inside it.",
  ANDROMEDA: "The nearest large galaxy to ours is Andromeda, about 2.5 million light years away. Its light has been travelling for 2.5 million years, yet on a dark night you can just see it with the naked eye as a faint smudge. The stars in this app, all within 49 light years, are far closer to home.",
  NAKED_EYE: "On a really dark night, far from city lights, you can see roughly 2,500 stars with the naked eye at one time. Counting the whole sky over both hemispheres, there are perhaps 5,000 to 9,000 visible in total, depending on your eyes and the sky. It feels like millions, but it is a few thousand of the galaxy's billions.",
  LIGHT_YEAR: "A light year is a distance, not a time: it is how far light travels in one year, about 9.46 trillion kilometres. Light moves at 300,000 kilometres every second, but space is so big that starlight still takes years to reach us. So when this app says a star is 11.9 light years away, it also means the light you see left it 11.9 years ago.",
  UNIVERSE_AGE: "The universe is about 13.8 billion years old, counting from the Big Bang. That figure comes mainly from the cosmic microwave background, the faint leftover glow of the hot early universe, measured very precisely by satellites such as Planck. The stars in this app all formed much later, in a universe already billions of years old.",
  MOON: "The Moon is about 384,000 kilometres from Earth, so its light reaches us in about 1.3 seconds. It is by far the closest thing in the sky, roughly 400 times closer than the Sun. Compared with even the nearest star in this app, 4.3 light years away, it is practically next door.",
  SUN: "The Sun is about 150 million kilometres from Earth, a distance astronomers call one astronomical unit, or 1 AU. Its light takes about 8 minutes 20 seconds to reach us, so we always see the Sun as it was 8 minutes ago. The nearest star beyond it, Proxima Centauri, is about 270,000 times farther away."
};

function bigPicture(q) {
  if (q.includes('andromeda') || q.includes('nearest galaxy') || q.includes('closest galaxy')) {
    return BIG_PICTURE.ANDROMEDA;
  }
  if (q.includes('milky way')) {
    if (['big', 'wide', 'across', 'diameter', 'size', 'large'].some(w => q.includes(w))) {
      return BIG_PICTURE.MILKY_WAY_SIZE;
    }
    return BIG_PICTURE.MILKY_WAY_COUNT;
  }
  if (q.includes('naked eye') || q.includes('can i see') || q.includes('can you see') || q.includes('see at night')) {
    return BIG_PICTURE.NAKED_EYE;
  }
  if (q.includes('light year') && ['what', 'mean', 'is a light', 'how long', 'how far is a'].some(w => q.includes(w))) {
    return BIG_PICTURE.LIGHT_YEAR;
  }
  if (q.includes('universe') && ['old', 'age', 'begin', 'born'].some(w => q.includes(w))) {
    return BIG_PICTURE.UNIVERSE_AGE;
  }
  if (q.includes('moon') && ['far', 'distance', 'away', 'close'].some(w => q.includes(w))) {
    return BIG_PICTURE.MOON;
  }
  if (q.includes('sun') && q.includes('how far')) {
    return BIG_PICTURE.SUN;
  }
  return null;
}

/* Star rows use the compact payload keys: id, n (name), d (distance_ly),
   m (g_mag), t (teff_k), c (bp_rp), x, y, z. STARS is sorted by distance,
   nearest first, exactly as app.py loads it. */
const STARS = window.STARS_DATA;
const NAMED = new Map();
for (const s of STARS) { if (s.n) NAMED.set(s.n.toLowerCase(), s); }
const MAX_LY = STARS.length ? STARS[STARS.length - 1].d : 0.0;

function fmtStar(s) { return s.n ? s.n : 'Gaia DR3 ' + s.id; }

function describe(s) {
  const bits = [fmtStar(s) + ' is ' + pyFormat(s.d, 1) + ' light years away'];
  if (s.m !== null && s.m !== undefined) {
    bits.push('apparent magnitude ' + pyFormat(s.m, 1) + ' in the Gaia G band');
  }
  if (s.t) {
    bits.push('surface temperature about ' + pyFormat(s.t, 0) + ' K');
  }
  return bits.join('; ') + '.';
}

function focusPayload(s) {
  if (!s) return null;
  return {
    source_id: s.id,
    name: fmtStar(s),
    distance_ly: pyRound(s.d, 2),
    distance_pc: pyRound(s.d / 3.26156, 2),
    g_mag: s.m,
    teff_k: s.t,
    bp_rp: s.c,
    x: s.x,
    y: s.y,
    z: s.z
  };
}

function retrieve(question) {
  const q = question.toLowerCase().trim().split(/\s+/).join(' ');

  const bp = bigPicture(q);
  if (bp) return {answer: bp, focus: null};

  for (const [name, s] of NAMED) {
    if (q.includes(name)) {
      const text = describe(s);
      return {answer: text, focus: focusPayload(s)};
    }
  }
  for (const [key, label, ly] of REFERENCE_ONLY) {
    if (q.includes(key)) {
      const text = label + ' is one of the very brightest stars in the sky, and Gaia ' +
        'cannot measure stars that bright accurately, so it is not in this ' +
        'Gaia dataset. Its textbook distance (from the Hipparcos mission) ' +
        'is about ' + pyFormat(ly, 0) + ' light years.';
      return {answer: text, focus: null};
    }
  }

  const m = q.match(/within (\d+(?:\.\d+)?)\s*(light ?years|ly|parsecs?|pc)/);
  if (m || q.includes('how many')) {
    let limit = m ? parseFloat(m[1]) : 10.0;
    if (m && m[2].startsWith('p')) limit *= 3.26156;
    let n = 0;
    for (const s of STARS) { if (s.d <= limit) n++; }
    const text = 'There are ' + n + ' stars in this Gaia DR3 dataset within ' +
      pyFormat(limit, 0) + ' light years of the Sun. The dataset holds ' +
      STARS.length + ' stars out to ' + pyFormat(MAX_LY, 0) + ' light years.';
    return {answer: text, focus: null};
  }

  if (q.includes('closest') || q.includes('nearest')) {
    const top = STARS.slice(0, 3);
    let text = 'The closest stars to the Sun in this dataset are: ' +
      top.map((s, i) => (i + 1) + '. ' + describe(s)).join(' ');
    text += ' The Sun itself is not in the list, since Gaia measures other stars ' +
      'as seen from our solar system.';
    return {answer: text, focus: focusPayload(top[0])};
  }

  if (q.includes('brightest') || q.includes('bright')) {
    const bright = STARS.filter(s => s.m !== null && s.m !== undefined)
      .sort((a, b) => a.m - b.m).slice(0, 5);
    let text = 'The brightest nearby stars, by apparent magnitude as seen from Earth ' +
      '(smaller number means brighter), are: ' +
      bright.map((s, i) => (i + 1) + '. ' + describe(s)).join(' ');
    text += " One warning: Gaia's brightness readings for the very brightest " +
      'stars are unreliable, because they overload its detectors. Sirius ' +
      'is the brightest star in our night sky, but Gaia\'s value for it ' +
      'in this table (magnitude 8.5) is far too faint, so it does not ' +
      'appear in the list above.';
    return {answer: text, focus: focusPayload(bright[0])};
  }

  if (q.includes('hottest') || q.includes('temperature')) {
    const hot = STARS.filter(s => s.t).sort((a, b) => b.t - a.t).slice(0, 3);
    const text = 'The hottest stars in this nearby dataset are: ' +
      hot.map((s, i) => (i + 1) + '. ' + describe(s)).join(' ');
    return {answer: text, focus: focusPayload(hot[0])};
  }

  if (q.includes('how far') || q.includes('distance')) {
    const text = 'Ask me about a specific star by name, for example Sirius, Vega, ' +
      'Tau Ceti or TRAPPIST-1, and I will look it up. The closest star in ' +
      'the data is ' + describe(STARS[0]);
    return {answer: text, focus: null};
  }

  const text = 'This dataset holds ' + STARS.length + ' real stars measured by the Gaia ' +
    'space telescope, out to ' + pyFormat(MAX_LY, 0) + ' light years. You can ask: what ' +
    'is the closest star, which nearby stars are brightest, how far is a ' +
    'named star such as Sirius or Tau Ceti, or how many stars lie within ' +
    '10 light years. You can also ask big-picture questions, like how ' +
    'many stars are in the Milky Way or what a light year is.';
  return {answer: text, focus: null};
}

window.STATIC_ASK = function (question) {
  const r = retrieve(question);
  return {answer: r.answer, source: 'data-fallback', facts: r.answer, focus: r.focus};
};
