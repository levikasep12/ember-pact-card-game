// Ember Pact — fixed game data: the four elements, the deck recipe and the rules constants.
// Nothing here is random: the same deck is built for both players and shuffled with a seed.
export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const ADVANTAGE_BONUS = 3;

// The element cycle: each element beats the next one clockwise.
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e4572e', beats: 'gale', icon: 'flame' },
  gale: { name: 'Gale', color: '#1faa74', beats: 'tide', icon: 'wind' },
  tide: { name: 'Tide', color: '#2e86de', beats: 'stone', icon: 'wave' },
  stone: { name: 'Stone', color: '#b08954', beats: 'ember', icon: 'peak' },
};
export const ELEMENT_ORDER = ['ember', 'gale', 'tide', 'stone'];

// Special cards. `power` is the printed power; Wild rolls its power when revealed.
export const SPECIALS = {
  mend: { label: 'Mend', power: 2, text: 'Heal 4 life when played.' },
  ward: { label: 'Ward', power: 1, text: 'Block all damage this round.' },
  siphon: { label: 'Siphon', power: 5, text: 'Heal life equal to the damage you deal.' },
  wild: { label: 'Wild', power: null, text: 'Reveals a random power, 1 to 9.' },
};

// One deck: powers 2..9 of every element (32 cards) plus one of each special
// in a fixed element (4 cards) — 36 cards, identical for both players.
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const el of ELEMENT_ORDER) {
    for (let power = 2; power <= 9; power++) {
      deck.push({ id: id++, element: el, power, special: null });
    }
  }
  deck.push({ id: id++, element: 'ember', power: SPECIALS.mend.power, special: 'mend' });
  deck.push({ id: id++, element: 'stone', power: SPECIALS.ward.power, special: 'ward' });
  deck.push({ id: id++, element: 'tide', power: SPECIALS.siphon.power, special: 'siphon' });
  deck.push({ id: id++, element: 'gale', power: null, special: 'wild' });
  return deck;
}

export function elementBeats(a, b) {
  return ELEMENTS[a].beats === b;
}

export function describeCard(card) {
  const el = ELEMENTS[card.element].name;
  if (card.special === 'wild') return `Wild ${el} (power ?)`;
  if (card.special) return `${SPECIALS[card.special].label} ${el} (${card.power})`;
  return `${el} ${card.power}`;
}
