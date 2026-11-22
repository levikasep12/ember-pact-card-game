// Screenshot presets for the maker's own screenshots (?shot=title|play|win|loss).
// Each preset rebuilds the table into one fixed, fully played-looking state with
// no randomness at all, so the four screenshots are reproducible shot after shot.
// These are presentation states of the real game code — the same render path,
// the same cards — never an edited or borrowed image.
import { newGame } from './state.js';
import { describeCard } from './config.js';

function fixedHand(cards) {
  return cards.map(([element, power, special], i) => ({
    id: 100 + i, element, power, special: special ?? null,
  }));
}

function baseState(seed) {
  const state = newGame(seed);
  state.phase = 'play';
  return state;
}

function dealForShot(state, youCards, oppCards) {
  state.youHand = fixedHand(youCards);
  state.oppHand = fixedHand(oppCards);
  state.youPile = state.youPile.slice(0, 24);
  state.oppPile = state.oppPile.slice(0, 24);
}

export function applyShot(state, name) {
  if (name === 'title') {
    state.phase = 'title';
    state.log = ['The pact is sealed. Seed 1 — both decks shuffled from it.'];
    return state;
  }
  if (name === 'play') {
    const s = baseState(1);
    s.round = 4;
    s.youLife = 14;
    s.oppLife = 17;
    dealForShot(
      s,
      [['ember', 8, null], ['tide', 6, null], ['gale', 4, null], ['stone', 3, 'mend'], ['ember', 2, 'ward']],
      [['ember', 5, null], ['tide', 7, null], ['gale', 9, null], ['stone', 6, null], ['tide', 4, 'siphon']],
    );
    s.playedYou = { id: 200, element: 'ember', power: 8, special: null, shownPower: 8, advantage: false, rolled: false };
    s.playedOpp = { id: 201, element: 'gale', power: 7, special: null, shownPower: 10, advantage: true, rolled: false };
    s.phase = 'reveal';
    s.log = [
      'The pact is sealed. Seed 1 — both decks shuffled from it.',
      'Round 1: you play Tide 6; Rook plays Stone 8.',
      "Rook's Stone has the advantage over Tide (+3). Rook wins the round — you lose 5 life.",
      'Round 2: you play Stone 7; Rook plays Ember 5. Your Stone has the advantage over Ember (+3). You win the round — Rook loses 5 life.',
      'Round 3: you play Gale 9; Rook plays Tide 4. You win the round — Rook loses 5 life.',
      'Round 4: you play Ember 8; Rook plays Gale 7.',
    ];
    s.tell = 'Rook eyes your last Gale card and answers in kind…';
    return s;
  }
  if (name === 'win') {
    const s = baseState(1);
    s.round = 7;
    s.youLife = 8;
    s.oppLife = 0;
    s.winner = 'you';
    s.phase = 'over';
    dealForShot(
      s,
      [['ember', 9, null], ['tide', 3, null]],
      [['gale', 2, null]],
    );
    s.playedYou = { id: 200, element: 'ember', power: 9, special: null, shownPower: 12, advantage: true, rolled: false };
    s.playedOpp = { id: 201, element: 'gale', power: 4, special: null, shownPower: 4, advantage: false, rolled: false };
    s.log = [
      'The pact is sealed. Seed 1 — both decks shuffled from it.',
      'Round 6: you play Siphon Tide (5); Rook plays Stone 6. Your Siphon drinks back 4 life.',
      'Round 7: you play Ember 9; Rook plays Gale 4. Your Ember has the advantage over Gale (+3). You win the round — Rook loses 12 life.',
    ];
    s.tell = 'Rook bows his head. The pact is yours.';
    return s;
  }
  if (name === 'loss') {
    const s = baseState(1);
    s.round = 6;
    s.youLife = 0;
    s.oppLife = 11;
    s.winner = 'opp';
    s.phase = 'over';
    dealForShot(
      s,
      [['stone', 2, null]],
      [['ember', 8, null], ['tide', 6, null], ['gale', 5, null]],
    );
    s.playedYou = { id: 200, element: 'stone', power: 3, special: null, shownPower: 3, advantage: false, rolled: false };
    s.playedOpp = { id: 201, element: 'ember', power: 9, special: null, shownPower: 9, advantage: false, rolled: false };
    s.log = [
      'The pact is sealed. Seed 1 — both decks shuffled from it.',
      'Round 5: you play Ward Stone (1); Rook plays Tide 8. Your Ward blocks all 7 damage!',
      'Round 6: you play Stone 3; Rook plays Ember 9. Rook wins the round — you lose 6 life.',
    ];
    s.tell = 'Rook takes the pact. Your cards scatter.';
    return s;
  }
  return state;
}

export function describeShotCard(card) {
  return describeCard(card);
}
