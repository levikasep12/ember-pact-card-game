// Ember Pact — every pixel on the table: cards, life bars, the log and the overlays.
// Icons are inline SVG drawn here (flame, wind, wave, peak), one shape per element,
// so each suit is told apart by colour AND shape, never by text alone.
import { ELEMENTS, SPECIALS, START_LIFE, describeCard } from './config.js';
import { sortHand } from './deck.js';

const ICONS = {
  flame: '<path d="M32 6 C38 18 50 24 50 40 A18 18 0 1 1 14 40 C14 30 22 26 24 18 C28 24 30 26 32 22 C32 16 30 10 32 6 Z" fill="COLOR"/>',
  wind: '<path d="M8 22 H44 M8 32 H56 M8 42 H36" stroke="COLOR" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="50" cy="22" r="7" fill="none" stroke="COLOR" stroke-width="5"/>',
  wave: '<path d="M6 26 Q16 12 26 26 T46 26 T60 26" stroke="COLOR" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M6 42 Q16 28 26 42 T46 42 T60 42" stroke="COLOR" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>',
  peak: '<path d="M6 52 L24 14 L36 34 L44 22 L58 52 Z" fill="COLOR"/>',
};

export function elementIcon(element, size = 40) {
  const def = ELEMENTS[element];
  const body = ICONS[def.icon].replaceAll('COLOR', def.color);
  return `<svg class="elem-icon" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="${def.name}">${body}</svg>`;
}

export function cardElement(card, opts = {}) {
  const el = document.createElement('div');
  el.className = `card el-${card.element}`;
  el.dataset.cardId = String(card.id);
  const def = ELEMENTS[card.element];
  const powerText = card.special === 'wild' ? '?' : String(opts.shownPower ?? card.power);
  const special = card.special ? SPECIALS[card.special] : null;
  el.innerHTML =
    `<span class="corner">${powerText}</span><span class="corner r">${def.name[0]}</span>` +
    `<span class="power">${powerText}</span>` +
    elementIcon(card.element) +
    `<span class="elem-name">${def.name}</span>` +
    (special ? `<span class="ability">${special.label} — ${special.text}</span>` : '');
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(card));
  if (opts.disabled) el.classList.add('disabled');
  return el;
}

export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card back';
  return el;
}

function lifeBar(fillEl, numEl, life) {
  const pct = Math.max(0, Math.min(100, (life / START_LIFE) * 100));
  fillEl.style.width = `${pct}%`;
  numEl.textContent = String(Math.max(0, life));
}

export function renderAll(state, ui) {
  document.getElementById('round-label').textContent = state.winner
    ? `Duel over — ${state.winner === 'you' ? 'you win' : 'Rook wins'}`
    : `Round ${state.round}`;
  document.getElementById('deck-you').textContent = `Deck ${state.youPile.length}`;
  document.getElementById('deck-opp').textContent = `Deck ${state.oppPile.length}`;
  lifeBar(
    document.getElementById('life-you'),
    document.getElementById('life-you-num'),
    state.youLife,
  );
  lifeBar(
    document.getElementById('life-opp'),
    document.getElementById('life-opp-num'),
    state.oppLife,
  );

  const oppHand = document.getElementById('opp-hand');
  oppHand.replaceChildren();
  for (let i = 0; i < state.oppHand.length; i++) oppHand.appendChild(cardBackElement());

  const youHand = document.getElementById('you-hand');
  youHand.replaceChildren();
  for (const card of sortHand(state.youHand)) {
    youHand.appendChild(cardElement(card, {
      disabled: state.phase !== 'play',
      onClick: (c) => ui.onPickCard(c),
    }));
  }

  const playedYou = document.getElementById('played-you');
  const playedOpp = document.getElementById('played-opp');
  playedYou.querySelectorAll('.card').forEach((n) => n.remove());
  playedOpp.querySelectorAll('.card').forEach((n) => n.remove());
  if (state.playedYou) playedYou.appendChild(cardElement(state.playedYou, { shownPower: state.playedYou.shownPower }));
  if (state.playedOpp) playedOpp.appendChild(cardElement(state.playedOpp, { shownPower: state.playedOpp.shownPower }));

  const log = document.getElementById('log');
  log.replaceChildren();
  for (const line of state.log.slice(-12)) {
    const li = document.createElement('li');
    li.textContent = line;
    log.appendChild(li);
  }
  log.scrollTop = log.scrollHeight;
}

export function setBanner(text, mood = '') {
  const banner = document.getElementById('banner');
  banner.textContent = text;
  banner.className = `banner ${mood}`;
}

export function setTell(text) {
  document.getElementById('tell').textContent = text;
}

export function showTitle() {
  document.getElementById('title-screen').classList.remove('hidden');
  document.getElementById('end-screen').classList.add('hidden');
}

export function showEnd(state) {
  const screen = document.getElementById('end-screen');
  const title = document.getElementById('end-title');
  const sub = document.getElementById('end-sub');
  const stats = document.getElementById('end-stats');
  if (state.winner === 'you') {
    title.textContent = 'VICTORY';
    title.classList.remove('lose');
    sub.textContent = 'Rook bows his head. The pact is yours — the Ember Warden yields.';
    celebrate();
  } else {
    title.textContent = 'DEFEAT';
    title.classList.add('lose');
    sub.textContent = 'Rook takes the pact. Your cards scatter — but the table is still warm.';
  }
  stats.innerHTML =
    `Rounds played: <b>${state.round}</b><br>` +
    `Your life: <b>${Math.max(0, state.youLife)}</b> · Rook's life: <b>${Math.max(0, state.oppLife)}</b><br>` +
    `Seed ${state.seed} — same seed, same decks, if you want a rematch.`;
  screen.classList.remove('hidden');
}

export function celebrate() {
  const colors = ['#e4572e', '#2e86de', '#1faa74', '#b08954', '#e8b64c'];
  for (let i = 0; i < 48; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4200);
  }
}

export function fillTitleCards() {
  const host = document.getElementById('title-cards');
  host.replaceChildren();
  const samples = [
    { id: -1, element: 'ember', power: 9, special: null },
    { id: -2, element: 'tide', power: 5, special: 'siphon' },
    { id: -3, element: 'gale', power: null, special: 'wild' },
  ];
  for (const c of samples) host.appendChild(cardElement(c));
}
