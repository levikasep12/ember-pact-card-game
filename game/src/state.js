// Ember Pact — the game state and one round of the duel, pure logic with no DOM.
// A round: both sides reveal a card, element advantage adds +3, Wild rolls 1–9,
// the higher effective power wins and the loser loses life equal to the gap.
// Mend heals on play, Ward blocks all damage, Siphon heals for damage dealt.
import { START_LIFE, HAND_SIZE, ADVANTAGE_BONUS, ELEMENTS, elementBeats, describeCard } from './config.js';
import { mulberry32, rollDie } from './rng.js';
import { newDrawPile, drawUpTo } from './deck.js';
import { chooseCard } from './ai.js';

export function newGame(seed) {
  const rand = mulberry32(seed);
  const youPile = newDrawPile(rand);
  const oppPile = newDrawPile(rand);
  const state = {
    seed,
    rand,
    round: 1,
    phase: 'title', // title | play | reveal | over
    youLife: START_LIFE,
    oppLife: START_LIFE,
    youHand: [],
    oppHand: [],
    youPile,
    oppPile,
    youDiscard: [],
    oppDiscard: [],
    playedYou: null,
    playedOpp: null,
    youLastElement: null,
    oppLastElement: null,
    log: [`The pact is sealed. Seed ${seed} — both decks shuffled from it.`],
    winner: null,
  };
  drawUpTo(state.youPile, state.youDiscard, state.youHand, HAND_SIZE, rand);
  drawUpTo(state.oppPile, state.oppDiscard, state.oppHand, HAND_SIZE, rand);
  return state;
}

function resolvePower(card, foeElement, rand) {
  if (card.special === 'wild') return { power: rollDie(rand, 9), rolled: true };
  let power = card.power;
  const advantage = foeElement ? elementBeats(card.element, foeElement) : false;
  if (advantage) power += ADVANTAGE_BONUS;
  return { power, advantage, rolled: false };
}

export function playRound(state, youCardId) {
  if (state.phase !== 'play') return null;
  const youIndex = state.youHand.findIndex((c) => c.id === youCardId);
  if (youIndex === -1) return null;
  const youCard = state.youHand.splice(youIndex, 1)[0];

  const pick = chooseCard(state.oppHand, {
    myLife: state.oppLife,
    foeLife: state.youLife,
    foeLastElement: state.youLastElement,
    foeHandHint: null,
    rand: state.rand,
  });
  const oppIndex = state.oppHand.findIndex((c) => c.id === pick.card.id);
  const oppCard = state.oppHand.splice(oppIndex, 1)[0];

  const youRes = resolvePower(youCard, oppCard.element, state.rand);
  const oppRes = resolvePower(oppCard, youCard.element, state.rand);
  state.playedYou = { ...youCard, shownPower: youRes.power, advantage: youRes.advantage, rolled: youRes.rolled };
  state.playedOpp = { ...oppCard, shownPower: oppRes.power, advantage: oppRes.advantage, rolled: oppRes.rolled };
  state.phase = 'reveal';

  const lines = [];
  lines.push(`Round ${state.round}: you play ${describeCard(youCard)}; Rook plays ${describeCard(oppCard)}.`);
  if (youRes.rolled) lines.push(`Your Wild reveals power ${youRes.power}!`);
  if (oppRes.rolled) lines.push(`Rook's Wild reveals power ${oppRes.power}!`);
  if (youRes.advantage) lines.push(`Your ${ELEMENTS[youCard.element].name} has the advantage over ${ELEMENTS[oppCard.element].name} (+3).`);
  if (oppRes.advantage) lines.push(`Rook's ${ELEMENTS[oppCard.element].name} has the advantage over ${ELEMENTS[youCard.element].name} (+3).`);

  let damageToOpp = 0;
  let damageToYou = 0;
  if (youRes.power > oppRes.power) damageToOpp = youRes.power - oppRes.power;
  else if (oppRes.power > youRes.power) damageToYou = oppRes.power - youRes.power;

  if (oppCard.special === 'ward' && damageToOpp > 0) {
    lines.push(`Rook's Ward blocks all ${damageToOpp} damage!`);
    damageToOpp = 0;
  }
  if (youCard.special === 'ward' && damageToYou > 0) {
    lines.push(`Your Ward blocks all ${damageToYou} damage!`);
    damageToYou = 0;
  }
  if (youCard.special === 'mend') {
    state.youLife = Math.min(START_LIFE, state.youLife + 4);
    lines.push('Your Mend heals 4 life.');
  }
  if (oppCard.special === 'mend') {
    state.oppLife = Math.min(START_LIFE, state.oppLife + 4);
    lines.push(`Rook's Mend heals him 4 life.`);
  }

  let outcome = 'tie';
  if (damageToOpp > 0) {
    state.oppLife -= damageToOpp;
    outcome = 'you';
    lines.push(`You win the round — Rook loses ${damageToOpp} life.`);
    if (youCard.special === 'siphon') {
      state.youLife = Math.min(START_LIFE, state.youLife + damageToOpp);
      lines.push(`Your Siphon drinks back ${damageToOpp} life.`);
    }
  } else if (damageToYou > 0) {
    state.youLife -= damageToYou;
    outcome = 'opp';
    lines.push(`Rook wins the round — you lose ${damageToYou} life.`);
    if (oppCard.special === 'siphon') {
      state.oppLife = Math.min(START_LIFE, state.oppLife + damageToYou);
      lines.push(`Rook's Siphon drinks back ${damageToYou} life.`);
    }
  } else {
    lines.push('A dead tie — no life lost on either side.');
  }

  state.log.push(...lines);
  state.youLastElement = youCard.element;
  state.oppLastElement = oppCard.element;
  state.youDiscard.push(youCard);
  state.oppDiscard.push(oppCard);

  const tell = pick.tell;
  if (state.oppLife <= 0 && state.youLife <= 0) {
    state.winner = outcome === 'you' ? 'you' : 'opp';
  } else if (state.oppLife <= 0) state.winner = 'you';
  else if (state.youLife <= 0) state.winner = 'opp';

  if (!state.winner) {
    state.round += 1;
    drawUpTo(state.youPile, state.youDiscard, state.youHand, HAND_SIZE, state.rand);
    drawUpTo(state.oppPile, state.oppDiscard, state.oppHand, HAND_SIZE, state.rand);
  }
  return { outcome, damageToOpp, damageToYou, lines, tell };
}

export function roundsPlayed(state) {
  return state.round - (state.winner ? 0 : 1);
}
