// Deck and hand management: draw, discard and reshuffle from the discard pile.
import { buildDeck } from './config.js';
import { shuffle } from './rng.js';

export function newDrawPile(rand) {
  return shuffle(buildDeck(), rand);
}

export function drawUpTo(pile, discard, hand, target, rand) {
  while (hand.length < target) {
    if (pile.length === 0) {
      if (discard.length === 0) return; // out of cards entirely: play with what is left
      pile.push(...shuffle(discard.splice(0), rand));
    }
    hand.push(pile.pop());
  }
}

// Sort a hand for display: element groups, then power descending, specials last.
export function sortHand(hand) {
  const order = { ember: 0, gale: 1, tide: 2, stone: 3 };
  return hand.slice().sort((a, b) => {
    if (a.special && !b.special) return 1;
    if (!a.special && b.special) return -1;
    if (order[a.element] !== order[b.element]) return order[a.element] - order[b.element];
    return (b.power ?? 0) - (a.power ?? 0);
  });
}
