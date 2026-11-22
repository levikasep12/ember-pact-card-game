// Rook, the AI rival: a readable opponent. He plans around what you just played,
// guards his life when it runs low, and spends his big cards only when he must.
// Every branch returns a `tell` — a line the table shows before the reveal —
// so a player who watches him can read his plan and counter it.
import { ELEMENTS, elementBeats, SPECIALS } from './config.js';

function effectivePower(card, foeElement) {
  if (card.special === 'wild') return 5; // unknown: valued in the middle
  let p = card.power;
  if (foeElement && elementBeats(card.element, foeElement)) p += 3;
  return p;
}

function mostCommonElement(hand) {
  const counts = {};
  for (const c of hand) counts[c.element] = (counts[c.element] ?? 0) + 1;
  let best = null;
  for (const el of Object.keys(counts)) {
    if (!best || counts[el] > counts[best]) best = el;
  }
  return best;
}

export function chooseCard(hand, ctx) {
  const { myLife, foeLife, foeLastElement, foeHandHint, rand } = ctx;
  const playable = hand.slice();
  const bySpecial = (name) => playable.find((c) => c.special === name);

  // 1. Hurt and holding a Mend: heal first, say so plainly.
  if (myLife <= 8) {
    const mend = bySpecial('mend');
    if (mend) return { card: mend, tell: 'Rook clutches his chest and reaches for a Mend…' };
    const ward = bySpecial('ward');
    if (ward && foeLife > myLife) return { card: ward, tell: 'Rook raises a Ward — he is buying time.' };
  }

  // 2. Counter what you played last round: pick the element that beats it.
  if (foeLastElement) {
    const counter = playable
      .filter((c) => !c.special && elementBeats(c.element, foeLastElement))
      .sort((a, b) => b.power - a.power)[0];
    if (counter) {
      return {
        card: counter,
        tell: `Rook eyes your last ${ELEMENTS[foeLastElement].name} card and answers in kind…`,
      };
    }
  }

  // 3. Ahead by a wide margin: spend little, save the big cards.
  const ahead = myLife - foeLife >= 6;
  const numbered = playable.filter((c) => !c.special).sort((a, b) => a.power - b.power);
  if (ahead && numbered.length > 0) {
    const low = numbered[0];
    return { card: low, tell: 'Rook plays small, confident — he is saving his strength.' };
  }

  // 4. Otherwise play the strongest card against your most common element.
  const hint = foeHandHint ?? mostCommonElement(playable);
  let best = null;
  let bestScore = -1;
  for (const c of playable) {
    const score = effectivePower(c, hint) + (c.special === 'siphon' ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best) best = playable[Math.floor(rand() * playable.length)];

  const tell =
    best.special === 'siphon'
      ? 'Rook smiles thinly — a Siphon is coming for your life.'
      : best.special === 'wild'
        ? 'Rook flips a Wild card and shrugs. Anything could happen.'
        : best.power >= 8
          ? 'Rook sets a heavy card down like a gauntlet.'
          : 'Rook plays, watching your face for a flinch.';
  return { card: best, tell };
}
