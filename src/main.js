import './style.css';
import { load, press, release, SOUND_NAMES } from 'button-sounds';

// ---------- elements ----------
const $ = (id) => document.getElementById(id);
const el = {
  source: $('source'), minWpm: $('minWpm'), maxWpm: $('maxWpm'),
  paraMode: $('paraMode'), volume: $('volume'), volOut: $('volOut'),
  pitch: $('pitch'), pitchOut: $('pitchOut'),
  spaceSound: $('spaceSound'), typos: $('typos'),
  soundList: $('soundList'), soundCount: $('soundCount'),
  start: $('start'), pause: $('pause'), reset: $('reset'), status: $('status'),
  page: $('page'), typed: $('typed'), caret: $('caret'),
  meterText: $('meterText'), meterBar: $('meterBar'),
};

// ---------- helpers ----------
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

// Keyboard sounds that have a dedicated space-bar sibling
const SPACE_VARIANT = (name) => {
  const family = ['hi75', 'asus-kbd', 'halo', 'uhk'].find((f) => name.startsWith(f + '-'));
  const candidate = family && `${family}-space`;
  return candidate && SOUND_NAMES.includes(candidate) ? candidate : name;
};

// Neighbouring keys on a QWERTY layout, used for believable typos
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function neighbour(ch) {
  const lower = ch.toLowerCase();
  for (let r = 0; r < ROWS.length; r++) {
    const c = ROWS[r].indexOf(lower);
    if (c === -1) continue;
    const options = [ROWS[r][c - 1], ROWS[r][c + 1], ROWS[r - 1]?.[c], ROWS[r - 1]?.[c + 1], ROWS[r + 1]?.[c], ROWS[r + 1]?.[c - 1]].filter(Boolean);
    const pick = options[Math.floor(Math.random() * options.length)];
    return ch === lower ? pick : pick.toUpperCase();
  }
  return null;
}

// ---------- sound picker ----------
const DEFAULT_SOUNDS = new Set(['hi75-soft', 'halo-soft', 'uhk-soft']);
const loaded = new Set();
const ensureLoaded = (name) => {
  if (loaded.has(name)) return;
  try { load(name); loaded.add(name); } catch (e) { console.warn('Could not load', name, e); }
};

for (const name of SOUND_NAMES) {
  const label = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.value = name;
  box.checked = DEFAULT_SOUNDS.has(name);
  box.addEventListener('change', () => {
    updateSoundCount();
    if (box.checked) { ensureLoaded(name); setTimeout(() => preview(name), 150); }
  });
  label.append(box, name);
  el.soundList.append(label);
}

const selectedSounds = () => {
  const list = [...el.soundList.querySelectorAll('input:checked')].map((i) => i.value);
  return list.length ? list : ['hi75-soft'];
};
function updateSoundCount() {
  el.soundCount.textContent = `(${el.soundList.querySelectorAll('input:checked').length} selected)`;
}
updateSoundCount();

const volume = () => Number(el.volume.value) / 100;
const pitchAmount = () => Number(el.pitch.value) / 100;
el.volume.addEventListener('input', () => (el.volOut.textContent = `${el.volume.value}%`));
el.pitch.addEventListener('input', () => (el.pitchOut.textContent = `${el.pitch.value}%`));

function playKey(name) {
  const opts = {
    volume: clamp(volume() * rand(0.85, 1.1), 0, 1),
    playbackRate: 1 + rand(-pitchAmount(), pitchAmount()),
  };
  try {
    press(name, opts);
    setTimeout(() => { try { release(name, opts); } catch {} }, rand(45, 110));
  } catch (e) {
    console.warn('Sound failed', e);
  }
}
const preview = (name) => playKey(name);

// ---------- typing state ----------
let runId = 0;        // bumping this cancels a running loop
let paused = false;
let text = '';        // what is currently shown
let index = 0;        // position in the source text
let plan = null;      // per-character paragraph sound plan

function buildPlan(source) {
  const pool = selectedSounds();
  pool.forEach(ensureLoaded);
  const mode = el.paraMode.value;
  const paraOf = new Array(source.length);
  let para = 0, sawBreak = false;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') sawBreak = true;
    else if (sawBreak) { para++; sawBreak = false; }
    paraOf[i] = para;
  }
  const names = [];
  for (let p = 0; p <= para; p++) {
    let pick;
    if (mode === 'same') pick = pool[0];
    else if (mode === 'cycle') pick = pool[p % pool.length];
    else {
      do { pick = pool[Math.floor(Math.random() * pool.length)]; }
      while (pool.length > 1 && pick === names[p - 1]);
    }
    names.push(pick);
  }
  if (el.spaceSound.checked) names.forEach((n) => ensureLoaded(SPACE_VARIANT(n)));
  return { paraOf, names };
}

function soundFor(ch, i) {
  const base = plan.names[plan.paraOf[i]];
  return el.spaceSound.checked && (ch === ' ' || ch === '\n') ? SPACE_VARIANT(base) : base;
}

// ---------- speed model ----------
let wpm = 60, targetWpm = 60, untilRetarget = 0;
function nextDelay(ch, prev) {
  const lo = clamp(Number(el.minWpm.value) || 40, 5, 400);
  const hi = clamp(Number(el.maxWpm.value) || 80, lo, 400);
  if (untilRetarget-- <= 0) { targetWpm = rand(lo, hi); untilRetarget = Math.floor(rand(6, 22)); }
  wpm += (targetWpm - wpm) * 0.18;          // ease toward target so changes feel organic
  wpm = clamp(wpm, lo, hi);
  const base = 12000 / wpm;                  // ms per character (5 chars = 1 word)
  let d = base * rand(0.6, 1.5);             // keystroke-to-keystroke jitter
  if (ch === ' ') d *= rand(0.9, 1.3);
  if (/[,;:]/.test(prev)) d += rand(90, 220);
  if (/[.!?]/.test(prev)) d += rand(220, 520);
  if (prev === '\n') d += rand(450, 950);    // breath between paragraphs
  if (Math.random() < 0.015) d += rand(300, 900); // brief "thinking" pause
  return { d, shownWpm: wpm };
}

// ---------- rendering ----------
function render() {
  el.typed.textContent = text;
  el.page.scrollTop = el.page.scrollHeight;
}
function setMeter(w) {
  const hi = Math.max(Number(el.maxWpm.value) || 100, 1);
  el.meterText.textContent = `${Math.round(w)} wpm`;
  el.meterBar.style.width = `${clamp((w / hi) * 100, 0, 100)}%`;
}
const setStatus = (s) => (el.status.textContent = s);

// ---------- main loop ----------
async function typeLoop(source, id) {
  let prev = '';
  while (index < source.length) {
    if (id !== runId) return;
    while (paused) { await sleep(80); if (id !== runId) return; }

    const ch = source[index];
    const { d, shownWpm } = nextDelay(ch, prev);
    setMeter(shownWpm);
    el.caret.classList.add('typing');
    await sleep(d);
    if (id !== runId) return;
    while (paused) { await sleep(80); if (id !== runId) return; }

    // occasional typo: hit a neighbouring key, notice, backspace, retype
    if (el.typos.checked && /[a-z]/i.test(ch) && Math.random() < 0.025) {
      const wrong = neighbour(ch);
      if (wrong) {
        playKey(soundFor(wrong, index));
        text += wrong; render();
        await sleep(rand(160, 420));        // "oh no" moment
        if (id !== runId) return;
        playKey(soundFor('x', index));       // backspace
        text = text.slice(0, -1); render();
        await sleep(rand(70, 160));
        if (id !== runId) return;
      }
    }

    playKey(soundFor(ch, index));
    text += ch; render();
    prev = ch;
    index++;
    el.caret.classList.remove('typing');
    setStatus(`Typing… ${Math.round((index / source.length) * 100)}%`);
  }
  if (id === runId) finish();
}

function finish() {
  el.start.disabled = false; el.start.textContent = 'Type again';
  el.pause.disabled = true; el.pause.textContent = 'Pause';
  el.caret.classList.remove('typing');
  setMeter(0);
  setStatus('Done.');
}

// ---------- controls ----------
el.start.addEventListener('click', () => {
  const source = el.source.value.replace(/\r\n?/g, '\n').trimEnd();
  if (!source) { setStatus('Paste some text first.'); el.source.focus(); return; }
  runId++; paused = false; text = ''; index = 0;
  plan = buildPlan(source);
  wpm = targetWpm = (Number(el.minWpm.value) + Number(el.maxWpm.value)) / 2 || 60;
  untilRetarget = 0;
  render();
  el.start.disabled = true; el.pause.disabled = false; el.pause.textContent = 'Pause';
  setStatus('Typing…');
  typeLoop(source, runId);   // started from a click, so the browser allows audio
});

el.pause.addEventListener('click', () => {
  paused = !paused;
  el.pause.textContent = paused ? 'Resume' : 'Pause';
  setStatus(paused ? 'Paused.' : 'Typing…');
});

el.reset.addEventListener('click', () => {
  runId++; paused = false; text = ''; index = 0;
  render(); setMeter(0);
  el.start.disabled = false; el.start.textContent = 'Start typing';
  el.pause.disabled = true; el.pause.textContent = 'Pause';
  el.caret.classList.remove('typing');
  setStatus('Ready.');
});

// warm up the default sounds so the first keystroke isn't late
selectedSounds().forEach(ensureLoaded);
