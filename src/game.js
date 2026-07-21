import { LEVELS, TILE, LURES } from './levels.js?v=flow1';
import { CAMPAIGN } from './campaign.js?v=flow1';
import { MOVEMENT, flowSpeed, gravityForVelocity, flowRank } from './movement.js?v=flow1';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const ui = {
  overlay: document.querySelector('#overlay'),
  title: document.querySelector('#overlay-title'),
  copy: document.querySelector('#overlay-copy'),
  primary: document.querySelector('#primary'),
  tackle: document.querySelector('#tackle'),
  grid: document.querySelector('#lure-grid'),
  lureDescription: document.querySelector('#lure-description'),
  worldMap: document.querySelector('#world-map'),
  worldIslands: document.querySelector('#world-islands'),
  worldNumber: document.querySelector('#world-number'),
  worldName: document.querySelector('#world-name'),
  worldSubtitle: document.querySelector('#world-subtitle'),
  worldFriend: document.querySelector('#world-friend'),
  worldCatch: document.querySelector('#world-catch'),
  worldLevels: document.querySelector('#world-levels'),
  worldBonuses: document.querySelector('#world-bonuses'),
};

const images = {};
const keys = new Set();
const pressed = new Set();
const save = JSON.parse(localStorage.getItem('reelbound-v4') || '{"unlocked":1,"lures":["classic"],"equipped":"classic","times":{}}');
save.campaign ??= { selectedWorld: 0, clearedPrototypes: [] };
save.caches ??= {};
save.bestPearls ??= {};

let state = 'title';
let levelIndex = 0;
let level;
let player;
let camera = 0;
let elapsed = 0;
let deaths = 0;
let pearls = 0;
let lastTime = 0;
let tip = '';
let tipTimer = 0;
let soundEnabled = true;
let musicTimer = 0;
let musicStep = 0;
let particles = [];
let afterimages = [];
let floatingTexts = [];
let enemyProjectiles = [];
let screenShake = 0;
let hitStop = 0;
let selectedWorld = save.campaign.selectedWorld || 0;
let activeWorld = selectedWorld;

const assetPaths = {
  finn: 'assets/sprites/finn-atlas.png',
  finnActions: 'assets/sprites/finn-crouch-slide-v2.png',
  enemy: 'assets/sprites/enemy-atlas.png',
  lures: 'assets/sprites/lure-atlas.png',
  environment: 'assets/sprites/environment-atlas-v2.png',
  clackett: 'assets/sprites/clackett-atlas-v2.png',
  skipper: 'assets/sprites/skipper-atlas-v2.png',
  bloop: 'assets/sprites/bloop-atlas.png',
  props: 'assets/sprites/prop-atlas.png',
  harbor: 'assets/backgrounds/harbor.png',
  grotto: 'assets/backgrounds/grotto.png',
  cliffs: 'assets/backgrounds/cliffs.png',
  icewater: 'assets/backgrounds/icewater.png',
  starsea: 'assets/backgrounds/starsea.png',
};

await Promise.all(Object.entries(assetPaths).map(([key, src]) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { images[key] = image; resolve(); };
  image.onerror = reject;
  image.src = src;
})));

class AudioSystem {
  constructor() { this.context = null; }
  start() {
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') this.context.resume();
  }
  tone(frequency, duration = 0.08, volume = 0.035, type = 'square', delay = 0) {
    if (!soundEnabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
  pluck(frequency, delay = 0, volume = 0.012) {
    if (!soundEnabled || !this.context) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.value = 1050;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
    oscillator.connect(filter).connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.65);
  }
  noise(duration = 0.08, volume = 0.018, frequency = 950, delay = 0) {
    if (!soundEnabled || !this.context) return;
    const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const start = this.context.currentTime + delay;
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(start); source.stop(start + duration);
  }
  effect(name) {
    this.start();
    const sounds = {
      jump: [430, 0.09], land: [120, 0.05], rod: [250, 0.06], hit: [105, 0.11],
      hurt: [78, 0.25], pearl: [820, 0.1], lure: [540, 0.28], checkpoint: [700, 0.2],
      menu: [350, 0.06], catch: [660, 0.4], dash: [185, 0.08], dashReady: [930, 0.08],
      grapple: [310, 0.1], flow: [1040, 0.08], slide: [145, 0.07],
    };
    const [frequency, duration] = sounds[name] || sounds.menu;
    this.tone(frequency, duration, 0.042, name === 'hurt' ? 'sawtooth' : 'square');
    if (name === 'dash') this.tone(285, 0.06, 0.025, 'triangle', 0.035);
    if (name === 'flow') this.tone(1320, 0.1, 0.022, 'triangle', 0.045);
    if (name === 'grapple') this.tone(465, 0.08, 0.02, 'triangle', 0.04);
    if (name === 'jump') this.tone(590, 0.055, 0.016, 'triangle', 0.035);
    if (name === 'pearl') this.tone(1230, 0.08, 0.014, 'sine', 0.025);
    if (name === 'dash' || name === 'slide') this.noise(0.1, 0.018, name === 'dash' ? 1700 : 620);
    if (name === 'hit' || name === 'hurt' || name === 'land') this.noise(0.07, name === 'hurt' ? 0.03 : 0.016, name === 'hurt' ? 420 : 760);
  }
}

const audio = new AudioSystem();
const musicScales = [
  [196, 220, 262, 294, 330, 392], [174, 196, 220, 262, 294, 349], [196, 220, 247, 294, 330, 370],
  [174, 196, 233, 262, 294, 349], [196, 233, 262, 294, 349, 392],
];
const musicPatterns = [
  { pace: .5, melody: [0,2,4,2,1,3,5,3,0,-1,2,1,4,3,2,-1], bass: [0,3,2,4] },
  { pace: .57, melody: [0,-1,2,4,3,2,-1,1,0,2,5,4,2,-1,1,-1], bass: [0,2,3,1] },
  { pace: .43, melody: [0,2,3,5,4,2,1,3,5,-1,4,3,1,2,0,-1], bass: [0,4,2,3] },
  { pace: .62, melody: [0,1,3,2,-1,4,3,1,0,-1,2,4,3,2,1,-1], bass: [0,3,1,2] },
  { pace: .54, melody: [0,4,2,5,-1,3,1,4,0,2,-1,5,4,2,3,-1], bass: [0,2,4,1] },
];

const isDown = (...codes) => codes.some(code => keys.has(code));
const wasPressed = (...codes) => codes.some(code => pressed.has(code));
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const FINN_SPRITE_SCALE = 0.255;

function persist() { localStorage.setItem('reelbound-v4', JSON.stringify(save)); }

function makeRuntimeLevel() {
  level.runtimePearls = level.pearls.map(p => ({ x: p[0] * TILE + 16, y: p[1] * TILE + 16, taken: false }));
  level.runtimeEnemies = level.enemies.map((e, index) => {
    const width = e[2] === 'bloop' ? 28 : 23;
    const height = e[2] === 'skipper' ? 18 : 20;
    const x = e[0] * TILE + 4;
    const nominalY = e[1] * TILE;
    const groundY = level.platforms
      .filter(platform => x + width / 2 >= platform[0] * TILE && x + width / 2 <= (platform[0] + platform[2]) * TILE && platform[1] * TILE >= nominalY)
      .reduce((nearest, platform) => Math.min(nearest, platform[1] * TILE), (e[1] + 2) * TILE);
    const originY = groundY - height;
    return {
      x, y: e[2] === 'skipper' ? originY - 42 : originY, w: width, h: height, type: e[2],
      vx: index % 2 ? 36 : -36, vy: 0, alive: true, state: 'patrol',
      timer: 1.1 + (index % 3) * 0.45, cooldown: 0.8 + (index % 2), originY,
    };
  });
  level.runtimeMovers = level.movers.map((m, index) => ({
    x: m[0] * TILE, y: m[1] * TILE, w: m[2] * TILE, h: m[3] * TILE,
    baseX: m[0] * TILE, baseY: m[1] * TILE, travelX: m[4], travelY: m[5],
    speed: m[6], phase: index * 0.83, previousX: m[0] * TILE, previousY: m[1] * TILE,
    deltaX: 0, deltaY: 0,
  }));
  level.runtimePickups = level.lurePickups.map(p => ({
    x: p[0] * TILE, y: p[1] * TILE, id: p[2], taken: save.lures.includes(p[2]),
  }));
  level.runtimeSecrets = level.secrets.map((s, index) => ({
    x: s[0] * TILE, y: s[1] * TILE, id: s[2], index,
    taken: (save.caches[levelIndex] || []).includes(index), warned: false,
  }));
  level.signs.forEach(sign => { sign.seen = false; });
}

function safeSpawnY(worldX, hintY) {
  const centerX = worldX + 12;
  const floorY = level.platforms
    .filter(platform => centerX >= platform[0] * TILE && centerX <= (platform[0] + platform[2]) * TILE && platform[1] * TILE >= hintY)
    .reduce((nearest, platform) => Math.min(nearest, platform[1] * TILE), hintY + 2 * TILE);
  return floorY - 52;
}

function spawn(x, y, checkpoint = { x, y }) {
  player = {
    x, y: y + 8, w: 24, h: 44, vx: 0, vy: 0, facing: 1,
    grounded: false, coyote: 0, jumpBuffer: 0, jumpHeld: false,
    wallDirection: 0, lastWallDirection: 0, wallCoyote: 0, wallJumpLock: 0, hook: null, rodTimer: 0, hurtTimer: 0,
    checkpoint, riding: null, animationTime: 0, landingTimer: 0,
    airJumps: 1, crouched: false, crouchTime: 0, sliding: false, slideTimer: 0,
    dashTimer: 0, dashCooldown: 0, dashCharges: 1, dashRefill: 0, afterimageTimer: 0,
    flow: 0, flowTimer: 0, combo: 0, comboTimer: 0, hearts: 3,
  };
}

function startLevel(index = 0) {
  levelIndex = index;
  level = LEVELS[index];
  makeRuntimeLevel();
  const startX = level.start[0] * TILE;
  spawn(startX, safeSpawnY(startX, level.start[1] * TILE));
  camera = elapsed = deaths = pearls = musicStep = 0;
  musicTimer = 0;
  tip = '';
  tipTimer = 0;
  particles = [];
  afterimages = [];
  floatingTexts = [];
  enemyProjectiles = [];
  screenShake = hitStop = 0;
  state = 'play';
  ui.overlay.classList.add('hidden');
  ui.tackle.classList.add('hidden');
  ui.worldMap.classList.add('hidden');
  audio.start();
  renderLureMenu();
}

const WORLD_POSITIONS = [[11, 72], [25, 35], [39, 68], [53, 28], [66, 66], [78, 34], [88, 67], [94, 22]];

function moveMapBoat(index, instant = false) {
  const boat = ui.worldIslands.querySelector('.map-boat');
  if (!boat) return;
  const [x, y] = WORLD_POSITIONS[index];
  if (instant) boat.classList.add('instant');
  else {
    boat.classList.remove('instant', 'sailing');
    void boat.offsetWidth;
    boat.classList.add('sailing');
    setTimeout(() => boat.classList.remove('sailing'), 1150);
  }
  boat.style.setProperty('--boat-x', `${x}%`);
  boat.style.setProperty('--boat-y', `${y}%`);
  if (instant) requestAnimationFrame(() => boat.classList.remove('instant'));
}

function selectWorld(index, instant = false) {
  selectedWorld = index;
  save.campaign.selectedWorld = index;
  persist();
  const world = CAMPAIGN[index];
  [...ui.worldIslands.querySelectorAll('.world-island')].forEach((island, islandIndex) => {
    island.classList.toggle('selected', islandIndex === index);
    island.setAttribute('aria-pressed', islandIndex === index ? 'true' : 'false');
  });
  moveMapBoat(index, instant);
  if (!instant) audio.effect('menu');
  ui.worldNumber.textContent = `WORLD ${world.number}`;
  ui.worldName.textContent = world.name;
  ui.worldName.style.color = world.accent;
  ui.worldSubtitle.textContent = world.subtitle;
  ui.worldFriend.textContent = world.friend;
  ui.worldCatch.textContent = world.catch;
  ui.worldLevels.innerHTML = '';
  world.levels.forEach((stage, stageIndex) => {
    const button = document.createElement('button');
    const playable = stageIndex === 0 && world.prototypeLevel !== null;
    const cleared = save.campaign.clearedPrototypes.includes(world.id) && playable;
    button.className = `level-node ${playable ? 'playable' : 'planned'} ${cleared ? 'cleared' : ''}`;
    button.innerHTML = `<span>${world.number}-${stageIndex + 1}</span><strong>${stage[0]}</strong><small>${playable ? (cleared ? 'REPLAY VOYAGE' : 'PLAY PROTOTYPE') : 'PLANNED VOYAGE'}</small>`;
    button.title = stage[1];
    button.disabled = !playable;
    if (playable) button.onclick = () => {
      activeWorld = index;
      startLevel(world.prototypeLevel);
    };
    ui.worldLevels.append(button);
  });
  ui.worldBonuses.innerHTML = '';
  world.bonuses.forEach(bonus => {
    const node = document.createElement('div');
    node.className = 'bonus-node';
    node.innerHTML = `<span>★</span><div><strong>${bonus[0]}</strong><small>HIDDEN FISHING HOLE</small></div>`;
    node.title = bonus[1];
    ui.worldBonuses.append(node);
  });
}

function renderWorldMap() {
  ui.worldIslands.innerHTML = `<svg class="voyage-route" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M110 432 C160 430 185 250 250 210 S335 405 390 408 S480 175 530 168 S610 395 660 396 S730 210 780 204 S840 390 880 402 S920 175 940 132"/></svg><div class="map-compass" aria-hidden="true"><i></i><b>N</b></div><div class="map-boat instant" aria-hidden="true"><span class="boat-sail"></span><span class="boat-hull"></span><span class="boat-flag"></span><span class="wake wake-one"></span><span class="wake wake-two"></span><span class="wake wake-three"></span><span class="wake wake-four"></span></div>`;
  CAMPAIGN.forEach((world, index) => {
    const island = document.createElement('button');
    island.className = `world-island ${world.prototypeLevel === null ? 'uncharted' : ''}`;
    island.style.setProperty('--world-color', world.color);
    island.style.setProperty('--world-accent', world.accent);
    island.style.setProperty('--island-x', `${WORLD_POSITIONS[index][0]}%`);
    island.style.setProperty('--island-y', `${WORLD_POSITIONS[index][1]}%`);
    island.style.setProperty('--float-delay', `${index * -.47}s`);
    island.setAttribute('aria-pressed', 'false');
    island.innerHTML = `<span class="island-shape"><i>${world.icon}</i></span><span class="world-label"><small>WORLD ${world.number}</small><strong>${world.name}</strong><em>${world.prototypeLevel === null ? 'UNCHARTED' : 'CHARTED'}</em></span>`;
    island.onclick = () => selectWorld(index);
    ui.worldIslands.append(island);
  });
  selectWorld(Math.min(selectedWorld, CAMPAIGN.length - 1), true);
}

function openWorldMap() {
  state = 'map';
  ui.overlay.classList.add('hidden');
  ui.tackle.classList.add('hidden');
  ui.worldMap.classList.remove('hidden');
  renderWorldMap();
  keys.clear();
  pressed.clear();
}

function showTitle() {
  state = 'title';
  ui.worldMap.classList.add('hidden');
  ui.title.textContent = 'The tide is calling';
  ui.copy.textContent = 'Chart a course across eight strange seas, master Finn’s fishing rod, and bring home the legendary catch from every shore.';
  ui.primary.textContent = 'CAST OFF';
  ui.overlay.classList.remove('hidden');
}

function staticSolids() {
  return level.platforms.map((p, index) => ({
    x: p[0] * TILE, y: p[1] * TILE, w: p[2] * TILE, h: p[3] * TILE,
    kind: 'static', id: index,
  }));
}

function allSolids() { return [...staticSolids(), ...level.runtimeMovers.map(m => ({ ...m, kind: 'mover', source: m }))]; }

function updateMovingPlatforms() {
  for (const mover of level.runtimeMovers) {
    mover.previousX = mover.x;
    mover.previousY = mover.y;
    const travel = (Math.sin(elapsed * mover.speed + mover.phase) + 1) / 2;
    mover.x = mover.baseX + mover.travelX * travel;
    mover.y = mover.baseY + mover.travelY * travel;
    mover.deltaX = mover.x - mover.previousX;
    mover.deltaY = mover.y - mover.previousY;
  }
  if (player.riding) {
    player.x += player.riding.deltaX;
    player.y += player.riding.deltaY;
  }
}

function movePlayerAxis(axis, distance) {
  const steps = Math.max(1, Math.ceil(Math.abs(distance) / 4));
  const amount = distance / steps;
  let side = 0;
  let landedOn = null;
  for (let step = 0; step < steps; step++) {
    player[axis] += amount;
    for (const solid of allSolids()) {
      if (!overlaps(player, solid)) continue;
      if (axis === 'x') {
        player.x = amount > 0 ? solid.x - player.w : solid.x + solid.w;
        side = amount > 0 ? 1 : -1;
        player.vx = 0;
      } else {
        if (amount > 0) {
          player.y = solid.y - player.h;
          landedOn = solid.kind === 'mover' ? solid.source : null;
          player.grounded = true;
        } else {
          player.y = solid.y + solid.h;
        }
        player.vy = 0;
      }
    }
  }
  return { side, landedOn };
}

function wallProbe() {
  const left = { x: player.x - 2, y: player.y + 3, w: 2, h: player.h - 6 };
  const right = { x: player.x + player.w, y: player.y + 3, w: 2, h: player.h - 6 };
  if (allSolids().some(solid => overlaps(left, solid))) return -1;
  if (allSolids().some(solid => overlaps(right, solid))) return 1;
  return 0;
}

function setCrouched(crouched) {
  if (crouched === player.crouched) return;
  const difference = 16;
  if (crouched) {
    player.y += difference;
    player.h -= difference;
    player.crouched = true;
    player.crouchTime = 0;
    return;
  }
  const standingBody = { x: player.x, y: player.y - difference, w: player.w, h: player.h + difference };
  if (allSolids().some(solid => overlaps(standingBody, solid))) return;
  player.y -= difference;
  player.h += difference;
  player.crouched = false;
}

function createParticles(x, y, color = '#fff1cf', count = 5, force = 1) {
  for (let i = 0; i < count; i++) particles.push({
    x, y, vx: (Math.random() - 0.5) * 110 * force, vy: (-20 - Math.random() * 85) * force,
    life: 0.36 + Math.random() * 0.28, color, size: 2 + Math.random() * 4,
  });
}

function addFloatingText(text, x, y, color = '#fff1cf', size = 10) {
  floatingTexts.push({ text, x, y, color, size, life: 0.9 });
}

function addFlow(amount, label = '', color = '#7ee4df') {
  player.flow = Math.min(100, player.flow + amount);
  player.flowTimer = 2.5;
  player.combo = player.comboTimer > 0 ? player.combo + 1 : 1;
  player.comboTimer = 2.5;
  if (label) addFloatingText(label, player.x + player.w / 2, player.y - 8, color, player.combo >= 5 ? 12 : 9);
}

function refillDash(label = 'DASH READY') {
  if (player.dashCharges > 0) return;
  player.dashCharges = 1;
  player.dashRefill = 0;
  addFloatingText(label, player.x + player.w / 2, player.y - 20, '#7ee4df', 8);
  createParticles(player.x + player.w / 2, player.y + player.h / 2, '#7ee4df', 7, 0.65);
  audio.effect('dashReady');
}

function releaseHook(boost = false) {
  if (!player.hook) return;
  if (boost) {
    const travel = Math.sign(player.vx) || player.facing;
    player.vx += travel * 72;
    player.vy -= 54;
    addFlow(12, 'REEL RELEASE', '#ffd77d');
    createParticles(player.x + player.w / 2, player.y + 10, '#ffd77d', 8, 0.75);
  }
  player.hook = null;
}

function enemyHurtbox(enemy) {
  if (enemy.type === 'skipper') return { x: enemy.x + 3, y: enemy.y + 3, w: enemy.w - 6, h: enemy.h - 7 };
  return { x: enemy.x + 2, y: enemy.y + 3, w: enemy.w - 4, h: enemy.h - 3 };
}

function launchEnemy(enemy, direction) {
  enemy.state = 'launched';
  enemy.timer = 1.8;
  enemy.vx = direction * 125;
  enemy.vy = -350;
  enemy.rotation = 0;
  audio.effect('hit');
  hitStop = 0.045;
  screenShake = Math.max(screenShake, 7);
  refillDash('DASH REFILLED');
  addFlow(24, 'TIDY TACKLE!', '#ffbd47');
  createParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffbd47', 16, 1.35);
}

function showTip(heading, body) { tip = { heading, body }; tipTimer = 4; }

function drawWrappedText(text, centerX, startY, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, centerX, startY + index * lineHeight));
}

function respawnPlayer() {
  const checkpoint = { ...player.checkpoint };
  deaths++;
  audio.effect('hurt');
  screenShake = 10;
  createParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef6a4c', 14, 1.25);
  spawn(checkpoint.x, checkpoint.y, checkpoint);
  player.hurtTimer = 1;
}

function damagePlayer(sourceX = player.x, fatal = false) {
  if (player.hurtTimer > 0) return;
  if (fatal || player.hearts <= 1) { respawnPlayer(); return; }
  player.hearts--;
  player.hurtTimer = 1.15;
  player.vx = (player.x < sourceX ? -1 : 1) * 245;
  player.vy = -285;
  player.flow = Math.max(0, player.flow - 35);
  player.combo = 0;
  player.comboTimer = 0;
  releaseHook(false);
  audio.effect('hurt');
  screenShake = 9;
  hitStop = 0.06;
  addFloatingText('-1 HEART', player.x + player.w / 2, player.y - 14, '#ff7a63', 11);
  createParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef6a4c', 12, 1.2);
}

function nearestTarget(list, range, filter = () => true) {
  let target = null;
  let bestDistance = range;
  for (const item of list) {
    if (!filter(item)) continue;
    const distance = Math.hypot(item.x - player.x, item.y - player.y);
    if (distance < bestDistance) { target = item; bestDistance = distance; }
  }
  return target;
}

function nearestHookTarget(list, range) {
  let target = null;
  let bestScore = range * 2;
  for (const item of list) {
    const dx = item.x - (player.x + player.w / 2);
    const dy = item.y - (player.y + 12);
    const distance = Math.hypot(dx, dy);
    if (distance > range) continue;
    const behindPenalty = Math.sign(dx) !== player.facing ? 95 : 0;
    const belowPenalty = dy > 80 ? 55 : 0;
    const score = distance + behindPenalty + belowPenalty;
    if (score < bestScore) { target = item; bestScore = score; }
  }
  return target;
}

function castRod() {
  const lure = save.equipped;
  const range = lure === 'magnet' ? 290 : 220;
  const hookTargets = level.hooks.map(h => ({ x: h[0] * TILE + 16, y: h[1] * TILE + 16 }));
  if (lure === 'moon') hookTargets.push(...level.runtimePearls.filter(p => !p.taken));
  const enemy = nearestTarget(level.runtimeEnemies, Math.min(range, 150), e => e.alive && Math.sign(e.x - player.x) === player.facing);
  if (enemy) {
    player.rodTimer = 0.24;
    launchEnemy(enemy, player.facing);
    if (lure === 'storm') {
      for (const chained of level.runtimeEnemies) {
        if (chained !== enemy && chained.alive && Math.hypot(chained.x - enemy.x, chained.y - enemy.y) < 150) {
          launchEnemy(chained, player.facing);
          createParticles(chained.x, chained.y, '#f2d45c', 6);
        }
      }
    }
    return;
  }
  const hook = nearestHookTarget(hookTargets, range);
  if (hook) {
    player.hook = { ...hook, length: Math.max(72, Math.hypot(hook.x - player.x, hook.y - player.y) * 0.72) };
    player.rodTimer = 0.2;
    audio.effect('grapple');
    addFloatingText('HOOKED!', hook.x, hook.y - 18, '#ffd77d', 8);
    return;
  }
  player.rodTimer = 0.22;
  audio.effect('rod');
}

function updateMusic(dt) {
  if (!soundEnabled || !audio.context || state !== 'play') return;
  musicTimer -= dt;
  if (musicTimer > 0) return;
  const pattern = musicPatterns[level.music];
  musicTimer = pattern.pace - (player?.flow || 0) * .00045;
  const scale = musicScales[level.music];
  const melodyIndex = pattern.melody[musicStep % pattern.melody.length];
  if (melodyIndex >= 0) audio.pluck(scale[melodyIndex], 0, 0.0095);
  if (musicStep % 4 === 0) audio.pluck(scale[pattern.bass[(musicStep / 4) % pattern.bass.length | 0]] / 2, 0.04, 0.006);
  if (player.flow >= 65 && melodyIndex >= 0 && musicStep % 2 === 0) audio.pluck(scale[(melodyIndex + 2) % scale.length] * 2, 0.07, 0.0035);
  musicStep++;
}

function update(dt) {
  updateMusic(dt);
  if (state !== 'play') return;
  if (hitStop > 0) { hitStop = Math.max(0, hitStop - dt); pressed.clear(); return; }
  elapsed += dt;
  screenShake = Math.max(0, screenShake - 28 * dt);
  tipTimer = Math.max(0, tipTimer - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.rodTimer = Math.max(0, player.rodTimer - dt);
  player.landingTimer = Math.max(0, player.landingTimer - dt);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.wallJumpLock = Math.max(0, player.wallJumpLock - dt);
  player.flowTimer = Math.max(0, player.flowTimer - dt);
  player.comboTimer = Math.max(0, player.comboTimer - dt);
  if (player.flowTimer <= 0) player.flow = Math.max(0, player.flow - 12 * dt);
  if (player.comboTimer <= 0) player.combo = 0;
  player.animationTime += dt;
  updateMovingPlatforms();

  const inputDirection = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
  const direction = player.wallJumpLock > 0 ? 0 : inputDirection;
  const jumpPressed = wasPressed('Space', 'KeyZ', 'ArrowUp');
  const jumpHeld = isDown('Space', 'KeyZ', 'ArrowUp');
  const crouchHeld = isDown('ControlLeft', 'ControlRight');
  const crouchPressed = wasPressed('ControlLeft', 'ControlRight');
  const dashPressed = wasPressed('KeyQ', 'ShiftLeft', 'ShiftRight');
  const rodHeld = isDown('KeyE');
  if (direction) player.facing = direction;
  if (jumpPressed) player.jumpBuffer = MOVEMENT.jumpBufferTime;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = player.grounded ? MOVEMENT.coyoteTime : Math.max(0, player.coyote - dt);

  if (wasPressed('KeyE')) castRod();
  if (player.hook && !rodHeld) releaseHook(Math.abs(player.vx) > 185);
  if (wasPressed('Tab', 'KeyT')) openTackleBox();

  if (dashPressed && player.dashCooldown <= 0 && player.dashCharges > 0 && !player.crouched) {
    player.dashTimer = MOVEMENT.dashDuration;
    player.dashCooldown = MOVEMENT.dashCooldown;
    player.dashCharges--;
    player.vx = player.facing * MOVEMENT.dashSpeed;
    player.vy = Math.min(-34, player.vy * 0.22);
    releaseHook(false);
    audio.effect('dash');
    screenShake = Math.max(screenShake, 3.5);
    addFlow(7, 'SURGE!', '#7ed9d1');
    createParticles(player.x + player.w / 2, player.y + player.h / 2, '#7ed9d1', 12, 1.1);
  }

  const touchingWall = wallProbe();
  player.wallDirection = touchingWall;
  if (touchingWall) {
    player.lastWallDirection = touchingWall;
    player.wallCoyote = MOVEMENT.wallCoyoteTime;
  } else player.wallCoyote = Math.max(0, player.wallCoyote - dt);
  const canGroundJump = player.coyote > 0;
  const canWallJump = player.wallCoyote > 0 && !player.grounded;
  const canDoubleJump = !player.grounded && !canWallJump && player.airJumps > 0;
  if (player.jumpBuffer > 0 && (canGroundJump || canWallJump || canDoubleJump)) {
    const slideJump = player.sliding;
    const surgeJump = player.dashTimer > 0;
    if (canWallJump) {
      player.vx = -player.lastWallDirection * MOVEMENT.wallJumpHorizontal;
      player.facing = -player.lastWallDirection;
      player.wallJumpLock = 0.11;
      player.vy = -MOVEMENT.wallJumpVelocity;
      addFlow(8, 'WALL KICK', '#b9fff0');
    } else if (canDoubleJump && !canGroundJump) {
      player.airJumps--;
      player.vy = -MOVEMENT.doubleJumpVelocity;
      addFlow(5, 'SECOND WIND', '#9ee9df');
      createParticles(player.x + player.w / 2, player.y + player.h, '#7ed9d1', 11, 0.8);
    } else {
      player.vy = -MOVEMENT.jumpVelocity;
    }
    if (slideJump) {
      player.vx = player.facing * Math.max(MOVEMENT.slideJumpSpeed, Math.abs(player.vx));
      player.sliding = false;
      player.slideTimer = 0;
      addFlow(12, 'SKIM JUMP!', '#ffd77d');
    } else if (surgeJump && !canWallJump) {
      player.vx = player.facing * Math.max(345, Math.abs(player.vx) * 0.88);
      addFlow(10, 'SURGE JUMP!', '#ffd77d');
    }
    player.grounded = false;
    player.riding = null;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.jumpHeld = true;
    audio.effect('jump');
    createParticles(player.x + player.w / 2, player.y + player.h, '#e9f4dc', 7, slideJump || surgeJump ? 1.1 : 0.7);
  }

  if (crouchPressed && player.grounded && Math.abs(player.vx) >= 145) {
    player.sliding = true;
    player.slideTimer = MOVEMENT.slideDuration;
    player.vx = Math.sign(player.vx) * Math.max(MOVEMENT.slideSpeed, Math.abs(player.vx));
    audio.effect('slide');
    addFlow(6, 'SKIM!', '#f4db9a');
    createParticles(player.x + player.w / 2, player.y + player.h, '#d8c696', 8, 0.8);
  }
  player.slideTimer = Math.max(0, player.slideTimer - dt);
  if (!player.slideTimer || !player.grounded) player.sliding = false;
  setCrouched(crouchHeld || player.sliding);
  if (player.crouched) player.crouchTime += dt;

  const maxSpeed = player.crouched && !player.sliding ? MOVEMENT.crouchSpeed : flowSpeed(player.flow);
  const reversing = direction && Math.sign(player.vx) && direction !== Math.sign(player.vx);
  const acceleration = player.grounded ? (reversing ? MOVEMENT.turnAcceleration : MOVEMENT.groundAcceleration) : MOVEMENT.airAcceleration;
  const deceleration = level.gimmick === 'ice' ? MOVEMENT.iceFriction : (player.grounded ? MOVEMENT.groundFriction : MOVEMENT.airDrag);
  if (player.dashTimer > 0) {
    player.vx = player.facing * MOVEMENT.dashSpeed;
    player.afterimageTimer -= dt;
    if (player.afterimageTimer <= 0) {
      afterimages.push({ x: player.x, y: player.y, facing: player.facing, life: 0.17 });
      player.afterimageTimer = 0.035;
    }
  } else if (player.sliding) player.vx = approach(player.vx, 0, MOVEMENT.slideFriction * dt);
  else player.vx = direction ? approach(player.vx, direction * maxSpeed, acceleration * dt) : approach(player.vx, 0, deceleration * dt);
  if (player.dashTimer <= 0) player.vy += gravityForVelocity(player.vy, jumpHeld, Boolean(player.hook)) * dt;
  if (!player.grounded && touchingWall && player.vy > MOVEMENT.wallSlideSpeed && inputDirection === touchingWall) {
    player.vy = MOVEMENT.wallSlideSpeed;
    if (Math.floor(elapsed * 12) % 3 === 0) createParticles(player.x + (touchingWall > 0 ? player.w : 0), player.y + player.h * .7, '#d8e3d8', 1, 0.35);
  }
  if (!jumpHeld && player.jumpHeld && player.vy < -145) player.vy += 1550 * dt;
  if (player.vy >= 0) player.jumpHeld = false;
  if (save.equipped === 'bubble' && rodHeld && player.vy > 90) player.vy = Math.min(player.vy, 120);

  if (player.hook) {
    const dx = player.hook.x - (player.x + player.w / 2);
    const dy = player.hook.y - (player.y + 12);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const tension = Math.max(0.32, Math.min(1.25, distance / player.hook.length));
    player.vx += (dx / distance) * MOVEMENT.grappleAcceleration * tension * dt;
    player.vy += (dy / distance) * MOVEMENT.grappleAcceleration * tension * dt;
    player.vx += inputDirection * 360 * dt;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > MOVEMENT.grappleMaxSpeed) {
      player.vx = player.vx / speed * MOVEMENT.grappleMaxSpeed;
      player.vy = player.vy / speed * MOVEMENT.grappleMaxSpeed;
    }
    if (distance > 285) releaseHook(false);
  }

  for (const current of level.currents) {
    if (overlaps(player, { x: current[0] * TILE, y: current[1] * TILE, w: current[2] * TILE, h: current[3] * TILE })) player.vy -= 500 * dt;
  }
  for (const wind of level.windZones) {
    if (overlaps(player, { x: wind[0] * TILE, y: wind[1] * TILE, w: wind[2] * TILE, h: wind[3] * TILE })) player.vx += wind[4] * dt;
  }

  const impactSpeed = player.vy;
  const wasFalling = impactSpeed > 170;
  player.grounded = false;
  player.riding = null;
  const horizontal = movePlayerAxis('x', player.vx * dt);
  player.wallDirection = horizontal.side;
  const vertical = movePlayerAxis('y', player.vy * dt);
  player.riding = vertical.landedOn;
  player.wallDirection = wallProbe();
  if (player.grounded) {
    player.airJumps = 1;
    if (player.dashTimer <= 0 && player.dashCooldown <= 0) { player.dashCharges = 1; player.dashRefill = 0; }
  }
  if (player.grounded && wasFalling) {
    player.landingTimer = 0.1;
    audio.effect('land');
    if (impactSpeed > 300) screenShake = Math.max(screenShake, 2);
    createParticles(player.x + player.w / 2, player.y + player.h, '#d8e3d8', 6, 0.65);
  }

  if (player.y > 570) damagePlayer(player.x, true);
  for (const hazard of level.hazards) {
    if (overlaps(player, { x: hazard[0] * TILE, y: hazard[1] * TILE, w: hazard[2] * TILE, h: hazard[3] * TILE })) damagePlayer(player.x, true);
  }

  for (const checkpoint of level.checkpoints) {
    if (player.x > checkpoint[0] * TILE && player.checkpoint.x < checkpoint[0] * TILE) {
      const checkpointX = checkpoint[0] * TILE;
      player.checkpoint = { x: checkpointX, y: safeSpawnY(checkpointX, checkpoint[1] * TILE) };
      audio.effect('checkpoint');
      showTip('CHECKPOINT', 'Pip lit the harbor lantern');
    }
  }

  for (const pearl of level.runtimePearls) {
    if (!pearl.taken && Math.hypot(player.x - pearl.x, player.y - pearl.y) < 32) {
      pearl.taken = true;
      pearls += save.equipped === 'golden' ? 2 : 1;
      audio.effect('pearl');
      player.dashRefill++;
      addFlow(7 + Math.min(5, player.combo), player.combo >= 4 ? `${player.combo + 1} FLOW CHAIN` : 'NICE LINE', '#fff1cf');
      if (player.combo > 0 && player.combo % 5 === 0) audio.effect('flow');
      if (player.dashRefill >= 3) refillDash();
      createParticles(pearl.x, pearl.y, '#fff1cf', 7, 0.85);
    }
    if (!pearl.taken && save.equipped === 'magnet' && Math.hypot(player.x - pearl.x, player.y - pearl.y) < 150) {
      pearl.x += (player.x - pearl.x) * dt * 4;
      pearl.y += (player.y - pearl.y) * dt * 4;
    }
  }

  for (const enemy of level.runtimeEnemies) {
    if (!enemy.alive) continue;
    if (enemy.state === 'launched') {
      enemy.timer -= dt;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.vy += 880 * dt;
      enemy.rotation += Math.sign(enemy.vx) * dt * 9;
      if (enemy.y > 600 || enemy.timer <= 0) enemy.alive = false;
      continue;
    }
    if (enemy.state === 'defeated') { enemy.timer -= dt; if (enemy.timer <= 0) enemy.alive = false; continue; }
    enemy.timer -= dt;
    enemy.cooldown -= dt;
    const playerDistance = Math.abs((player.x + player.w / 2) - (enemy.x + enemy.w / 2));
    const targetDirection = Math.sign(player.x - enemy.x) || 1;
    if (enemy.type === 'clackett') {
      if (enemy.state === 'patrol' && enemy.cooldown <= 0 && playerDistance < 230) {
        enemy.state = 'alert'; enemy.timer = 0.55; enemy.vx = 0;
      } else if (enemy.state === 'alert' && enemy.timer <= 0) {
        enemy.state = 'attack'; enemy.timer = 0.85; enemy.vx = targetDirection * 175;
      } else if (enemy.state === 'attack' && enemy.timer <= 0) {
        enemy.state = 'patrol'; enemy.cooldown = 2.2; enemy.vx = -targetDirection * 36;
      }
    } else if (enemy.type === 'skipper') {
      if (enemy.state === 'patrol') {
        enemy.y = enemy.originY - 42 + Math.sin(elapsed * 3 + enemy.x * 0.02) * 8;
        if (enemy.cooldown <= 0 && playerDistance < 250) { enemy.state = 'alert'; enemy.timer = 0.42; enemy.vx = 0; }
      } else if (enemy.state === 'alert' && enemy.timer <= 0) {
        enemy.state = 'attack'; enemy.timer = 0.72; enemy.vx = targetDirection * 145; enemy.vy = 175;
      } else if (enemy.state === 'attack') {
        enemy.y += enemy.vy * dt;
        if (enemy.timer <= 0) { enemy.state = 'patrol'; enemy.cooldown = 2.5; enemy.vx = -targetDirection * 40; enemy.vy = 0; }
      }
    } else if (enemy.type === 'bloop') {
      if (enemy.state === 'patrol' && enemy.cooldown <= 0 && playerDistance < 280) {
        enemy.state = 'alert'; enemy.timer = 0.68; enemy.vx = 0;
      } else if (enemy.state === 'alert' && enemy.timer <= 0) {
        enemy.state = 'attack'; enemy.timer = 0.35; enemy.cooldown = 2.6;
        enemyProjectiles.push({ x: enemy.x + enemy.w / 2, y: enemy.y + 7, vx: targetDirection * 105, life: 3 });
        audio.effect('rod');
      } else if (enemy.state === 'attack' && enemy.timer <= 0) {
        enemy.state = 'patrol'; enemy.vx = -targetDirection * 28;
      }
    }
    enemy.x += enemy.vx * dt;
    if (enemy.type !== 'skipper') {
      const hasGround = staticSolids().some(solid => overlaps({ x: enemy.x, y: enemy.y + enemy.h + 3, w: enemy.w, h: 3 }, solid));
      if (!hasGround) enemy.vx *= -1;
    }
    const hurtbox = enemyHurtbox(enemy);
    if (overlaps(player, hurtbox)) {
      const slideAttack = player.sliding && Math.abs(player.vx) > 120;
      const stompAttack = player.vy > 90 && player.y + player.h <= hurtbox.y + hurtbox.h * 0.62;
      if (slideAttack) {
        launchEnemy(enemy, Math.sign(player.vx) || player.facing);
        player.vx *= 0.94;
      } else if (stompAttack) {
        launchEnemy(enemy, player.facing);
        player.vy = -318;
        addFlow(8, 'DECK BOUNCE!', '#ffd77d');
      } else damagePlayer(enemy.x + enemy.w / 2);
    }
  }
  for (const bubble of enemyProjectiles) {
    bubble.x += bubble.vx * dt;
    bubble.life -= dt;
    if (overlaps(player, { x: bubble.x - 7, y: bubble.y - 7, w: 14, h: 14 })) { bubble.life = 0; damagePlayer(bubble.x); }
  }
  enemyProjectiles = enemyProjectiles.filter(bubble => bubble.life > 0);

  for (const pickup of level.runtimePickups) {
    if (!pickup.taken && Math.hypot(player.x - pickup.x, player.y - pickup.y) < 42) {
      pickup.taken = true;
      if (!save.lures.includes(pickup.id)) save.lures.push(pickup.id);
      save.equipped = pickup.id;
      persist();
      audio.effect('lure');
      showTip('NEW LURE', LURES.find(lure => lure.id === pickup.id).name);
      renderLureMenu();
    }
  }

  for (const secret of level.runtimeSecrets) {
    const secretDistance = Math.hypot(player.x - secret.x, player.y - secret.y);
    if (!secret.taken && secretDistance < 54 && save.equipped !== secret.id && !secret.warned) {
      secret.warned = true;
      showTip('LURE CACHE', `Equip ${LURES.find(lure => lure.id === secret.id).name} to open it`);
    }
    if (!secret.taken && secretDistance < 42 && save.equipped === secret.id) {
      secret.taken = true;
      save.caches[levelIndex] ??= [];
      if (!save.caches[levelIndex].includes(secret.index)) save.caches[levelIndex].push(secret.index);
      persist();
      audio.effect('lure');
      showTip('LURE CACHE OPENED', `${save.caches[levelIndex].length}/3 permanent discoveries found`);
      createParticles(secret.x, secret.y, LURES.find(lure => lure.id === secret.id).color, 14);
    }
  }

  for (const sign of level.signs) {
    if (!sign.seen && Math.abs(player.x - sign[0] * TILE) < 45) {
      sign.seen = true;
      showTip(sign[2], sign[3]);
    }
  }

  if (overlaps(player, { x: level.goal[0] * TILE, y: level.goal[1] * TILE, w: 50, h: 72 })) completeLevel();
  const lookAhead = Math.max(-110, Math.min(150, player.vx * .48));
  const cameraTarget = Math.max(0, Math.min(level.width * TILE - 960, player.x - 340 + lookAhead));
  camera = approach(camera, cameraTarget, (980 + Math.abs(player.vx) * 1.35) * dt);

  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 220 * dt;
    particle.life -= dt;
  }
  particles = particles.filter(particle => particle.life > 0);
  for (const ghost of afterimages) ghost.life -= dt;
  afterimages = afterimages.filter(ghost => ghost.life > 0);
  for (const text of floatingTexts) { text.y -= 25 * dt; text.life -= dt; }
  floatingTexts = floatingTexts.filter(text => text.life > 0);
  pressed.clear();
}

function pearlRank(count, total) {
  const ratio = count / Math.max(1, total);
  if (ratio >= 0.85) return 'TIDE MASTER';
  if (ratio >= 0.6) return 'ROUTE SCOUT';
  return 'DECKHAND';
}

function completeLevel() {
  state = 'complete';
  save.unlocked = Math.max(save.unlocked, levelIndex + 2);
  save.times[levelIndex] = Math.min(save.times[levelIndex] || 9999, elapsed);
  const worldId = CAMPAIGN[activeWorld]?.id;
  if (worldId && !save.campaign.clearedPrototypes.includes(worldId)) save.campaign.clearedPrototypes.push(worldId);
  save.bestPearls[levelIndex] = Math.max(save.bestPearls[levelIndex] || 0, pearls);
  persist();
  ui.title.textContent = `${level.fish} caught!`;
  ui.copy.innerHTML = `${level.name} — ${formatTime(elapsed)} — ${pearls}/${level.pearls.length} pearls — ${pearlRank(pearls, level.pearls.length)} — ${(save.caches[levelIndex] || []).length}/3 caches`;
  ui.primary.textContent = 'RETURN TO WORLD MAP';
  ui.overlay.classList.remove('hidden');
  audio.effect('catch');
}

function renderLureMenu() {
  ui.grid.innerHTML = '';
  LURES.forEach((lure, index) => {
    const button = document.createElement('button');
    const owned = save.lures.includes(lure.id);
    button.className = `lure ${owned ? '' : 'locked'} ${save.equipped === lure.id ? 'equipped' : ''}`;
    button.innerHTML = `<span class="icon" style="background-position:${index * 100 / 7}% 50%"></span><span>${owned ? lure.name : '???'}</span>`;
    button.disabled = !owned;
    button.onclick = () => {
      save.equipped = lure.id;
      persist();
      ui.lureDescription.textContent = lure.desc;
      renderLureMenu();
      audio.effect('menu');
    };
    ui.grid.append(button);
  });
}

function openTackleBox() {
  if (state !== 'play') return;
  state = 'tackle';
  renderLureMenu();
  ui.lureDescription.textContent = LURES.find(lure => lure.id === save.equipped).desc;
  ui.tackle.classList.remove('hidden');
  audio.effect('menu');
}

function closeTackleBox() {
  if (state !== 'tackle') return;
  state = 'play';
  ui.tackle.classList.add('hidden');
  keys.clear();
}

function screenX(worldX) { return Math.round(worldX - camera); }

function drawPlatform(platform, moving = false) {
  const x = screenX(platform.x);
  const y = Math.round(platform.y);
  const w = platform.w;
  const h = platform.h;
  const theme = level.gimmick;
  const atlasRows = {
    boats: [72, 146], current: [260, 146], wind: [451, 145], ice: [671, 128], star: [850, 134],
  };
  const [sourceY, sourceHeight] = atlasRows[theme] || atlasRows.star;
  const variants = [{ x: 76, w: 202 }, { x: 334, w: 212 }, { x: 603, w: 161 }, { x: 826, w: 171 }];
  const tileX = Math.round(platform.x / TILE);
  const tileY = Math.round(platform.y / TILE);
  const materialSeed = Math.abs(tileX * 31 + tileY * 17 + Math.round(w / TILE) * 13 + levelIndex * 7);
  const segmentWidth = moving ? w : Math.min(88, w);
  const visualHeight = moving ? Math.max(42, h + 14) : Math.max(48, h + 12);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 5, y - 3, w + 10, Math.max(h + 22, visualHeight));
  ctx.clip();
  if (moving) {
    ctx.drawImage(images.environment, 1060, sourceY, 390, sourceHeight, x - 4, y - 2, w + 8, visualHeight);
  } else {
    let segment = 0;
    for (let offset = 0; offset < w; offset += segmentWidth - 1, segment++) {
      const drawWidth = Math.min(segmentWidth, w - offset + 1);
      const variant = variants[(materialSeed + segment) % variants.length];
      ctx.drawImage(images.environment, variant.x, sourceY, variant.w, sourceHeight, x + offset, y - 2, drawWidth, visualHeight);
    }
  }
  ctx.restore();
  drawPlatformSurfaceDetails(theme, x, y, w, materialSeed, moving);
}

function drawPlatformSurfaceDetails(theme, x, y, w, seed, moving) {
  ctx.save();
  if (theme === 'boats') {
    ctx.fillStyle = '#ffe08a';
    for (let px = 15 + seed % 18; px < w; px += 61) {
      ctx.fillRect(x + px, y + 3, 3, 3);
      ctx.fillStyle = '#56311f'; ctx.fillRect(x + px + 1, y + 4, 1, 1); ctx.fillStyle = '#ffe08a';
    }
    if (moving) { ctx.strokeStyle = '#d6a65d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 8, y + 12); ctx.quadraticCurveTo(x + w / 2, y + 22, x + w - 8, y + 12); ctx.stroke(); }
  } else if (theme === 'current') {
    for (let px = 12 + seed % 22; px < w; px += 42) {
      const sway = Math.sin(elapsed * 2 + px * .07) * 3;
      ctx.strokeStyle = '#62d99b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + px, y + 4); ctx.quadraticCurveTo(x + px + sway, y - 3, x + px + sway * .5, y - 9); ctx.stroke();
      ctx.fillStyle = '#b9fff0aa'; ctx.fillRect(x + px + 7, y - 5 - ((elapsed * 18 + px) % 8), 2, 2);
    }
  } else if (theme === 'wind') {
    ctx.strokeStyle = '#d6e26f'; ctx.lineWidth = 2;
    for (let px = 5 + seed % 17; px < w; px += 25) {
      const sway = Math.sin(elapsed * 3 + px) * 2;
      ctx.beginPath(); ctx.moveTo(x + px, y + 2); ctx.lineTo(x + px + sway, y - 6 - (px % 5)); ctx.stroke();
    }
  } else if (theme === 'ice') {
    ctx.fillStyle = '#ffffffcc';
    for (let px = 11 + seed % 27; px < w; px += 53) {
      const glow = .45 + Math.sin(elapsed * 3.2 + px) * .3;
      ctx.globalAlpha = glow; ctx.fillRect(x + px, y + 2, 5, 1); ctx.fillRect(x + px + 2, y, 1, 5);
    }
  } else {
    const starColors = ['#7ee4df', '#d4b5ff', '#ffd27a'];
    for (let px = 10 + seed % 21, index = 0; px < w; px += 37, index++) {
      ctx.globalAlpha = .5 + Math.sin(elapsed * 4 + px) * .38;
      ctx.fillStyle = starColors[(seed + index) % starColors.length];
      ctx.fillRect(x + px, y + 10 + (px % 19), 3, 3);
      ctx.fillRect(x + px + 1, y + 7 + (px % 19), 1, 9);
      ctx.fillRect(x + px - 2, y + 11 + (px % 19), 7, 1);
    }
  }
  ctx.restore();
}

function drawAtlasCell(image, columns, index, x, y, w, h, flip = false) {
  const cellWidth = image.width / columns;
  ctx.save();
  if (flip) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(image, index * cellWidth, 0, cellWidth, image.height, 0, y, w, h); }
  else ctx.drawImage(image, index * cellWidth, 0, cellWidth, image.height, x, y, w, h);
  ctx.restore();
}

function drawAtlasGridCell(image, index, x, y, w, h, flip = false) {
  const cellWidth = image.width / 4;
  const cellHeight = image.height / 2;
  const sourceX = (index % 4) * cellWidth;
  const sourceY = Math.floor(index / 4) * cellHeight;
  ctx.save();
  if (flip) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(image, sourceX, sourceY, cellWidth, cellHeight, 0, y, w, h); }
  else ctx.drawImage(image, sourceX, sourceY, cellWidth, cellHeight, x, y, w, h);
  ctx.restore();
}

function drawPropCell(index, x, y, w, h) {
  const image = images.props;
  const cellWidth = image.width / 4;
  const cellHeight = image.height / 3;
  ctx.drawImage(image, (index % 4) * cellWidth, Math.floor(index / 4) * cellHeight, cellWidth, cellHeight, x, y, w, h);
}

function drawFinnAfterimage(ghost) {
  const image = images.finn;
  const cellWidth = image.width / 4;
  const cellHeight = image.height / 2;
  const [cropX, cropY, cropW, cropH] = [15, 112, 350, 355];
  const sourceX = 3 * cellWidth + cropX;
  const width = cropW * FINN_SPRITE_SCALE;
  const height = cropH * FINN_SPRITE_SCALE;
  const x = screenX(ghost.x + player.w / 2) - width / 2;
  const y = ghost.y + player.h - height;
  ctx.save();
  ctx.globalAlpha = Math.max(0, ghost.life / .17) * .32;
  ctx.filter = 'hue-rotate(135deg) saturate(1.6)';
  if (ghost.facing < 0) { ctx.translate(x + width, 0); ctx.scale(-1, 1); ctx.drawImage(image, sourceX, cropY, cropW, cropH, 0, y, width, height); }
  else ctx.drawImage(image, sourceX, cropY, cropW, cropH, x, y, width, height);
  ctx.restore();
}

function drawFinn() {
  let frame = 0;
  if (player.hurtTimer > 0) frame = 7;
  else if (player.rodTimer > 0 || player.hook) frame = 6;
  else if (!player.grounded) frame = player.vy < 0 ? 4 : 5;
  else if (Math.abs(player.vx) > 150) frame = 3;
  else if (Math.abs(player.vx) > 12) frame = 1 + Math.floor(player.animationTime * 6) % 2;
  if (player.crouched) {
    const image = images.finnActions;
    const actionFrame = player.sliding ? (player.slideTimer > .42 ? 2 : 3) : (player.crouchTime < .12 ? 0 : 1);
    const actionCrops = [[120,160,290,420],[575,170,300,410],[980,225,410,360],[1450,280,430,310]];
    const [sourceX, cropY, cropW, cropH] = actionCrops[actionFrame];
    const width = cropW * FINN_SPRITE_SCALE;
    const height = cropH * FINN_SPRITE_SCALE;
    const x = screenX(player.x + player.w / 2) - width / 2;
    const y = Math.round(player.y + player.h - height);
    ctx.save();
    if (player.facing < 0) { ctx.translate(x + width, 0); ctx.scale(-1, 1); ctx.drawImage(image, sourceX, cropY, cropW, cropH, 0, y, width, height); }
    else ctx.drawImage(image, sourceX, cropY, cropW, cropH, x, y, width, height);
    ctx.restore();
    if (player.sliding) {
      ctx.fillStyle = '#d8c69688';
      for (let streak = 0; streak < 3; streak++) ctx.fillRect(screenX(player.x) - player.facing * (13 + streak * 9), player.y + player.h - 3 - streak * 3, 9 + streak * 3, 2);
    }
  } else {
    const image = images.finn;
    const cellWidth = image.width / 4;
    const cellHeight = image.height / 2;
    const crops = [
      [45, 92, 205, 390], [20, 92, 285, 390], [8, 90, 312, 392], [15, 112, 350, 355],
      [26, 35, 292, 390], [18, 70, 300, 400], [0, 72, 382, 400], [34, 70, 330, 375],
    ];
    const [cropX, cropY, cropW, cropH] = crops[frame];
    const sourceX = (frame % 4) * cellWidth + cropX;
    const sourceY = Math.floor(frame / 4) * cellHeight + cropY;
    const landingScale = player.landingTimer > 0 ? 0.94 : 1;
    const width = cropW * FINN_SPRITE_SCALE / landingScale;
    const height = cropH * FINN_SPRITE_SCALE * landingScale;
    const x = screenX(player.x + player.w / 2) - width / 2;
    const y = Math.round(player.y + player.h - height);
    ctx.save();
    if (player.facing < 0) { ctx.translate(x + width, 0); ctx.scale(-1, 1); ctx.drawImage(image, sourceX, sourceY, cropW, cropH, 0, y, width, height); }
    else ctx.drawImage(image, sourceX, sourceY, cropW, cropH, x, y, width, height);
    ctx.restore();
  }
  if (player.hook) {
    ctx.strokeStyle = LURES.find(lure => lure.id === save.equipped).color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX(player.x + player.w / 2), player.y + 12);
    ctx.quadraticCurveTo(screenX((player.x + player.hook.x) / 2), player.y + 60, screenX(player.hook.x), player.hook.y);
    ctx.stroke();
  }
}

function draw() {
  if (!level) { ctx.fillStyle = '#071726'; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
  const background = images[level.bg.replace('.png', '')];
  const backgroundOffset = -((camera * 0.07) % 140);
  ctx.drawImage(background, backgroundOffset, 0, 1100, 540);
  ctx.fillStyle = '#06152228'; ctx.fillRect(0, 0, 960, 540);
  ctx.save();
  if (screenShake > 0) ctx.translate((Math.random() - .5) * screenShake, (Math.random() - .5) * screenShake);

  for (const current of level.currents) {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = level.gimmick === 'stars' ? '#c7a8f380' : '#71e5d080';
      const rise = (elapsed * 65 + i * 61) % (current[3] * TILE);
      ctx.fillRect(screenX(current[0] * TILE + 10 + (i % 3) * 55), (current[1] + current[3]) * TILE - rise, 4, 17);
    }
  }
  for (const wind of level.windZones) {
    const direction = Math.sign(wind[4]);
    const zoneX = wind[0] * TILE;
    const zoneWidth = wind[2] * TILE;
    ctx.strokeStyle = '#eef4cc55'; ctx.lineWidth = 2;
    for (let gust = 0; gust < 8; gust++) {
      const travel = ((elapsed * (55 + gust * 3) + gust * 83) % zoneWidth);
      const worldX = direction > 0 ? zoneX + travel : zoneX + zoneWidth - travel;
      const y = wind[1] * TILE + 38 + (gust * 57) % Math.max(70, wind[3] * TILE - 55);
      const x = screenX(worldX);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + direction * 18, y - 5, x + direction * 42, y); ctx.stroke();
    }
  }
  for (const platform of staticSolids()) drawPlatform(platform);
  for (const mover of level.runtimeMovers) drawPlatform(mover, true);
  for (const ghost of afterimages) drawFinnAfterimage(ghost);

  for (const hazard of level.hazards) {
    const x = screenX(hazard[0] * TILE), y = hazard[1] * TILE, w = hazard[2] * TILE;
    const waterColors = level.gimmick === 'ice' ? ['#4c91ac', '#235e79'] : level.gimmick === 'star' ? ['#54428e', '#211d58'] : ['#167f91', '#07516d'];
    ctx.fillStyle = waterColors[1]; ctx.fillRect(x, y + 8, w, hazard[3] * TILE - 8);
    ctx.fillStyle = waterColors[0]; ctx.fillRect(x, y + 3, w, 13);
    ctx.fillStyle = '#dff5e8';
    for (let hx = -6; hx < w + 8; hx += 15) {
      const bob = Math.round(Math.sin(elapsed * 2.2 + hx * 0.08) * 2);
      ctx.beginPath(); ctx.arc(x + hx, y + 4 + bob, 7, 0, Math.PI); ctx.fill();
    }
    ctx.fillStyle = '#ffffff45';
    for (let hx = 8; hx < w; hx += 31) ctx.fillRect(x + hx, y + 19 + (hx % 3), 13, 2);
  }
  for (const hook of level.hooks) {
    const x = screenX(hook[0] * TILE + 16), y = hook[1] * TILE + 16;
    drawPropCell(1, x - 20, y - 20, 40, 40);
  }
  for (const pearl of level.runtimePearls) if (!pearl.taken) {
    drawPropCell(0, screenX(pearl.x) - 12, pearl.y - 12, 24, 24);
  }
  for (const pickup of level.runtimePickups) if (!pickup.taken) {
    const pickupX = screenX(pickup.x), lure = LURES.find(item => item.id === pickup.id);
    ctx.save(); ctx.globalAlpha = .28 + Math.sin(elapsed * 4) * .08; ctx.fillStyle = lure.color;
    ctx.beginPath(); ctx.arc(pickupX, pickup.y, 32, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    drawPropCell(4, pickupX - 27, pickup.y - 27, 54, 54);
    ctx.fillStyle = lure.color; ctx.font = 'bold 7px DM Mono'; ctx.textAlign = 'center';
    ctx.fillText('NEW LURE', pickupX, pickup.y - 31); ctx.textAlign = 'left';
  }
  for (const secret of level.runtimeSecrets) if (!secret.taken) {
    const secretX = screenX(secret.x), lure = LURES.find(item => item.id === secret.id);
    ctx.save(); ctx.strokeStyle = lure.color; ctx.lineWidth = 2; ctx.globalAlpha = .75;
    ctx.strokeRect(secretX - 19, secret.y - 19, 38, 38); ctx.restore();
    drawPropCell(5, secretX - 22, secret.y - 22, 44, 44);
    ctx.fillStyle = lure.color; ctx.font = 'bold 7px DM Mono'; ctx.textAlign = 'center';
    ctx.fillText('LURE CACHE', secretX, secret.y - 25); ctx.textAlign = 'left';
  }
  for (const enemy of level.runtimeEnemies) if (enemy.alive) {
    let frame = 1 + Math.floor(elapsed * 6) % 2;
    if (enemy.state === 'alert') frame = enemy.type === 'bloop' ? 4 : 3;
    if (enemy.state === 'attack') frame = enemy.type === 'clackett' && enemy.timer > 0.35 ? 4 : 5;
    if (enemy.state === 'defeated') frame = 7;
    if (enemy.state === 'launched') frame = 7;
    const size = enemy.type === 'clackett' ? 82 : (enemy.type === 'skipper' ? 88 : 92);
    const drawX = screenX(enemy.x + enemy.w / 2) - size / 2;
    const drawY = enemy.y + enemy.h - size + (enemy.type === 'skipper' ? 25 : 7);
    if (enemy.state === 'launched') {
      ctx.save();
      ctx.translate(drawX + size / 2, drawY + size / 2);
      ctx.rotate(enemy.rotation);
      drawAtlasGridCell(images[enemy.type], frame, -size / 2, -size / 2, size, size, false);
      ctx.restore();
    } else drawAtlasGridCell(images[enemy.type], frame, drawX, drawY, size, size, enemy.vx < 0);
  }
  for (const bubble of enemyProjectiles) {
    const x = screenX(bubble.x), y = bubble.y;
    drawPropCell(11, x - 13, y - 13, 26, 26);
  }
  for (const checkpoint of level.checkpoints) {
    const active = player.checkpoint.x >= checkpoint[0] * TILE;
    ctx.save(); ctx.globalAlpha = active ? 1 : 0.62;
    drawPropCell(2, screenX(checkpoint[0] * TILE) - 9, checkpoint[1] * TILE - 34, 52, 52);
    ctx.restore();
  }
  for (const sign of level.signs) {
    drawPropCell(3, screenX(sign[0] * TILE) - 22, sign[1] * TILE - 24, 54, 54);
  }
  for (const particle of particles) { ctx.fillStyle = particle.color; ctx.fillRect(screenX(particle.x), particle.y, particle.size, particle.size); }

  drawPropCell(6 + levelIndex, screenX(level.goal[0] * TILE) - 34, level.goal[1] * TILE - 20, 76, 76);
  drawFinn();

  if (Math.abs(player.vx) > 285) {
    ctx.fillStyle = '#b9fff055';
    for (let streak = 0; streak < 5; streak++) {
      const trailX = screenX(player.x) - player.facing * (25 + streak * 18);
      ctx.fillRect(trailX, player.y + 5 + streak * 8, 18 + streak * 5, 2);
    }
  }
  for (const text of floatingTexts) {
    ctx.save(); ctx.globalAlpha = Math.min(1, text.life * 2); ctx.fillStyle = text.color;
    ctx.font = `bold ${text.size}px DM Mono`; ctx.textAlign = 'center';
    ctx.fillText(text.text, screenX(text.x), text.y); ctx.restore();
  }
  ctx.restore();

  ctx.fillStyle = '#09232eea'; ctx.fillRect(14, 14, 610, 78);
  ctx.strokeStyle = '#d8a344'; ctx.lineWidth = 2; ctx.strokeRect(14, 14, 610, 78);
  ctx.strokeStyle = '#5c442d'; ctx.lineWidth = 1; ctx.strokeRect(19, 19, 600, 68);
  ctx.fillStyle = '#e7b450';
  for (const rivetX of [21, 617]) { ctx.beginPath(); ctx.arc(rivetX, 21, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff1cf'; ctx.font = 'bold 14px DM Mono'; ctx.fillText(`${levelIndex + 1}/5  ${level.name.toUpperCase()}`, 31, 39);
  for (let heart = 0; heart < 3; heart++) {
    ctx.fillStyle = heart < player.hearts ? '#ef6a4c' : '#493945';
    const heartX = 524 + heart * 23;
    ctx.fillRect(heartX, 27, 6, 5); ctx.fillRect(heartX + 8, 27, 6, 5);
    ctx.fillRect(heartX - 2, 31, 18, 5); ctx.fillRect(heartX + 1, 36, 12, 4); ctx.fillRect(heartX + 4, 40, 6, 3);
  }
  ctx.fillStyle = '#78d9d0'; ctx.fillRect(29, 46, 566, 1);
  ctx.fillStyle = LURES.find(lure => lure.id === save.equipped).color; ctx.font = '9px DM Mono';
  ctx.fillText(`${formatTime(elapsed)}  •  PEARLS ${pearls}/${level.pearls.length}  •  CACHES ${(save.caches[levelIndex] || []).length}/3  •  ${LURES.find(lure => lure.id === save.equipped).name.toUpperCase()}`, 31, 60);
  ctx.fillStyle = '#06151ddd'; ctx.fillRect(103, 69, 300, 9);
  const flowColor = player.flow >= 85 ? '#ffd45a' : player.flow >= 50 ? '#72dfe0' : '#487e83';
  ctx.fillStyle = flowColor; ctx.fillRect(104, 70, 2.98 * player.flow, 7);
  ctx.fillStyle = '#d8f4e9'; ctx.font = 'bold 8px DM Mono'; ctx.fillText(`REEL FLOW  ${flowRank(player.flow)}`, 31, 78);
  ctx.fillStyle = player.dashCharges ? '#7ee4df' : '#405962'; ctx.fillRect(425, 68, 73, 12);
  ctx.fillStyle = '#071726'; ctx.font = 'bold 7px DM Mono'; ctx.fillText(player.dashCharges ? 'DASH READY' : `${player.dashRefill}/3 REFILL`, 433, 77);
  if (player.combo >= 3 && player.comboTimer > 0) {
    ctx.fillStyle = '#ffd77d'; ctx.font = 'bold 11px DM Mono'; ctx.fillText(`CHAIN x${player.combo}`, 512, 78);
  }
  if (tipTimer > 0) {
    ctx.fillStyle = '#071726ed'; ctx.fillRect(155, 448, 650, 66);
    ctx.strokeStyle = '#d6b56a'; ctx.strokeRect(155, 448, 650, 66);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffd77d'; ctx.font = 'bold 10px DM Mono'; ctx.fillText(tip.heading, 480, 466);
    ctx.fillStyle = '#fff1cf'; ctx.font = 'bold 9px DM Mono'; drawWrappedText(tip.body, 480, 483, 610, 13, 2); ctx.textAlign = 'left';
  }
}

function loop(time) {
  const dt = Math.min(0.025, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function pauseGame() {
  state = 'paused';
  ui.title.textContent = 'Lines slackened';
  ui.copy.textContent = 'The tide will wait.';
  ui.primary.textContent = 'RESUME';
  ui.overlay.classList.remove('hidden');
}

addEventListener('keydown', event => {
  if (!keys.has(event.code)) pressed.add(event.code);
  keys.add(event.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    if (state === 'tackle') closeTackleBox();
    else if (state === 'play') pauseGame();
  }
});
addEventListener('keyup', event => keys.delete(event.code));

for (const button of document.querySelectorAll('[data-key]')) {
  const code = button.dataset.key;
  const press = event => { event.preventDefault(); if (!keys.has(code)) pressed.add(code); keys.add(code); button.classList.add('active'); };
  const release = event => { event.preventDefault(); keys.delete(code); button.classList.remove('active'); };
  button.onpointerdown = press;
  button.onpointerup = release;
  button.onpointercancel = release;
  button.onpointerleave = release;
}

document.querySelector('#touch-tackle').onclick = openTackleBox;
document.querySelector('#close-tackle').onclick = closeTackleBox;
document.querySelector('#close-map').onclick = showTitle;
ui.primary.onclick = () => {
  if (state === 'title') openWorldMap();
  else if (state === 'paused') { state = 'play'; ui.overlay.classList.add('hidden'); }
  else if (state === 'complete') openWorldMap();
};
document.querySelector('#sound').onclick = event => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) audio.start();
  event.target.textContent = `MUSIC + SFX: ${soundEnabled ? 'ON' : 'OFF'}`;
};
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });

renderLureMenu();
renderWorldMap();
requestAnimationFrame(loop);
