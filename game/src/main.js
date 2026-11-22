// Ember Pact — boot and table wiring: starts a game, takes the player's pick,
// resolves the round after a short beat so the reveal can land, and hands the
// end of the duel to the overlay. `?shot=<name>&seed=<n>` renders a screenshot
// preset instead of a fresh table (see shots.js).
import { newGame, playRound } from './state.js';
import { renderAll, setBanner, setTell, showTitle, showEnd, fillTitleCards } from './render.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

let state = newGame(seed);
if (shotName) {
  state = applyShot(state, shotName);
  state.seed = seed;
}

const ui = {
  onPickCard(card) {
    if (state.phase !== 'play' || state.winner) return;
    const result = playRound(state, card.id);
    if (!result) return;
    setTell(result.tell);
    renderAll(state, ui);
    const banner = document.getElementById('banner');
    banner.classList.add('flash');
    setTimeout(() => banner.classList.remove('flash'), 500);
    if (result.outcome === 'you') setBanner('You take the round.', 'good');
    else if (result.outcome === 'opp') setBanner('Rook takes the round.', 'hurt');
    else setBanner('A dead tie — no life lost.', '');
    if (state.winner) {
      setTimeout(() => {
        renderAll(state, ui);
        showEnd(state);
      }, 900);
    } else {
      setTimeout(() => setBanner('Pick a card to open the duel.'), 1600);
    }
  },
};

function startGame() {
  state = newGame((Date.now() % 2147483646) + 1);
  state.phase = 'play';
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.add('hidden');
  setTell('Rook shuffles the deck and waits…');
  setBanner('Pick a card to open the duel.');
  renderAll(state, ui);
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('again-btn').addEventListener('click', startGame);
document.getElementById('new-btn').addEventListener('click', startGame);
document.getElementById('rules-btn').addEventListener('click', () => {
  document.getElementById('rules-screen').classList.remove('hidden');
});
document.getElementById('rules-close').addEventListener('click', () => {
  document.getElementById('rules-screen').classList.add('hidden');
});

fillTitleCards();
renderAll(state, ui);
if (shotName === 'title') {
  showTitle();
  setBanner('Pick a card to open the duel.');
} else if (shotName === 'play') {
  document.getElementById('title-screen').classList.add('hidden');
  setTell(state.tell ?? 'Rook studies the table…');
  setBanner('Round 4 — your move, after the reveal.');
} else if (shotName === 'win' || shotName === 'loss') {
  document.getElementById('title-screen').classList.add('hidden');
  setTell(state.tell ?? '');
  setBanner(state.winner === 'you' ? 'You take the pact!' : 'Rook takes the pact.');
  showEnd(state);
} else {
  showTitle();
}
