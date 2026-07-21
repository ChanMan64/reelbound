import { LEVELS, TILE, LURES } from './levels.js';

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
};

const images = {};
const keys = new Set();
const pressed = new Set();
const save = JSON.parse(localStorage.getItem('reelbound-v4') || '{"unlocked":1,"lures":["classic"],"equipped":"classic","times":{}}');

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
let enemyProjectiles = [];

const assetPaths = {
  finn: 'assets/sprites/finn-atlas.png',
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
  effect(name) {
    this.start();
    const sounds = {
      jump: [430, 0.09], land: [120, 0.05], rod: [250, 0.06], hit: [105, 0.11],
      hurt: [78, 0.25], pearl: [820, 0.1], lure: [540, 0.28], checkpoint: [700, 0.2],
      menu: [350, 0.06], catch: [660, 0.4],
    };
    const [frequency, duration] = sounds[name] || sounds.menu;
    this.tone(frequency, duration, 0.042, name === 'hurt' ? 'sawtooth' : 'square');
  }
}

const audio = new AudioSystem();
const musicScales = [
  [196, 220, 262, 294, 330, 392], [174, 196, 220, 262, 294, 349], [196, 220, 247, 294, 330, 370],
  [174, 196, 233, 262, 294, 349], [196, 233, 262, 294, 349, 392],
];
const musicMelody = [0, 2, 4, 2, 1, 3, 5, 3, 0, -1, 2, 1, 4, 3, 2, -1];

const isDown = (...codes) => codes.some(code => keys.has(code));
const wasPressed = (...codes) => codes.some(code => pressed.has(code));
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function persist() { localStorage.setItem('reelbound-v4', JSON.stringify(save)); }

function makeRuntimeLevel() {
  level.runtimePearls = level.pearls.map(p => ({ x: p[0] * TILE + 16, y: p[1] * TILE + 16, taken: false }));
  level.runtimeEnemies = level.enemies.map((e, index) => ({
    x: e[0] * TILE + 4, y: e[1] * TILE + (e[2] === 'skipper' ? -36 : 7),
    w: e[2] === 'bloop' ? 28 : 23, h: e[2] === 'skipper' ? 18 : 20, type: e[2],
    vx: index % 2 ? 36 : -36, vy: 0, alive: true, state: 'patrol',
    timer: 1.1 + (index % 3) * 0.45, cooldown: 0.8 + (index % 2), originY: e[1] * TILE + 7,
  }));
  level.runtimeMovers = level.movers.map((m, index) => ({
    x: m[0] * TILE, y: m[1] * TILE, w: m[2] * TILE, h: m[3] * TILE,
    baseX: m[0] * TILE, baseY: m[1] * TILE, travelX: m[4], travelY: m[5],
    speed: m[6], phase: index * 0.83, previousX: m[0] * TILE, previousY: m[1] * TILE,
    deltaX: 0, deltaY: 0,
  }));
  level.runtimePickups = level.lurePickups.map(p => ({
    x: p[0] * TILE, y: p[1] * TILE, id: p[2], taken: save.lures.includes(p[2]),
  }));
  level.runtimeSecrets = level.secrets.map(s => ({ x: s[0] * TILE, y: s[1] * TILE, id: s[2], taken: false }));
  level.signs.forEach(sign => { sign.seen = false; });
}

function spawn(x, y, checkpoint = { x, y }) {
  player = {
    x, y: y + 8, w: 24, h: 44, vx: 0, vy: 0, facing: 1,
    grounded: false, coyote: 0, jumpBuffer: 0, jumpHeld: false,
    wallDirection: 0, hook: null, rodTimer: 0, hurtTimer: 0,
    checkpoint, riding: null, animationTime: 0, landingTimer: 0,
    airJumps: 1, crouched: false, sliding: false, slideTimer: 0,
    dashTimer: 0, dashCooldown: 0,
  };
}

function startLevel(index = 0) {
  levelIndex = index;
  level = LEVELS[index];
  makeRuntimeLevel();
  spawn(level.start[0] * TILE, level.start[1] * TILE);
  camera = elapsed = deaths = pearls = musicStep = 0;
  musicTimer = 0;
  tip = '';
  tipTimer = 0;
  particles = [];
  enemyProjectiles = [];
  state = 'play';
  ui.overlay.classList.add('hidden');
  ui.tackle.classList.add('hidden');
  audio.start();
  renderLureMenu();
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
    return;
  }
  const standingBody = { x: player.x, y: player.y - difference, w: player.w, h: player.h + difference };
  if (allSolids().some(solid => overlaps(standingBody, solid))) return;
  player.y -= difference;
  player.h += difference;
  player.crouched = false;
}

function createParticles(x, y, color = '#fff1cf', count = 5) {
  for (let i = 0; i < count; i++) particles.push({
    x, y, vx: (Math.random() - 0.5) * 90, vy: -20 - Math.random() * 70,
    life: 0.4 + Math.random() * 0.2, color,
  });
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
  createParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffbd47', 12);
}

function showTip(heading, body) { tip = `${heading} — ${body}`; tipTimer = 4; }

function damagePlayer() {
  if (player.hurtTimer > 0) return;
  const checkpoint = { ...player.checkpoint };
  deaths++;
  audio.effect('hurt');
  createParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef6a4c', 10);
  spawn(checkpoint.x, checkpoint.y, checkpoint);
  player.hurtTimer = 1;
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

function castRod() {
  const lure = save.equipped;
  const range = lure === 'magnet' ? 290 : 220;
  const hookTargets = level.hooks.map(h => ({ x: h[0] * TILE + 16, y: h[1] * TILE + 16 }));
  if (lure === 'moon') hookTargets.push(...level.runtimePearls.filter(p => !p.taken));
  const hook = nearestTarget(hookTargets, range);
  if (hook) {
    player.hook = hook;
    player.rodTimer = 0.2;
    audio.effect('rod');
    return;
  }
  const enemy = nearestTarget(level.runtimeEnemies, range, e => e.alive && Math.sign(e.x - player.x) === player.facing);
  if (enemy) {
    enemy.state = 'defeated'; enemy.timer = 0.55; enemy.vx = 0;
    player.rodTimer = 0.24;
    audio.effect('hit');
    createParticles(enemy.x + 15, enemy.y + 12, '#ffbd47', 8);
    if (lure === 'storm') {
      for (const chained of level.runtimeEnemies) {
        if (chained.alive && Math.hypot(chained.x - enemy.x, chained.y - enemy.y) < 150) {
          chained.state = 'defeated'; chained.timer = 0.55; chained.vx = 0;
          createParticles(chained.x, chained.y, '#f2d45c', 6);
        }
      }
    }
    return;
  }
  player.rodTimer = 0.22;
  audio.effect('rod');
}

function updateMusic(dt) {
  if (!soundEnabled || !audio.context || state !== 'play') return;
  musicTimer -= dt;
  if (musicTimer > 0) return;
  musicTimer = 0.54;
  const scale = musicScales[level.music];
  const melodyIndex = musicMelody[musicStep % musicMelody.length];
  if (melodyIndex >= 0) audio.pluck(scale[melodyIndex], 0, 0.011);
  if (musicStep % 4 === 0) audio.pluck(scale[(musicStep / 4) % 3 | 0] / 2, 0.04, 0.007);
  musicStep++;
}

function update(dt) {
  updateMusic(dt);
  if (state !== 'play') return;
  elapsed += dt;
  tipTimer = Math.max(0, tipTimer - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.rodTimer = Math.max(0, player.rodTimer - dt);
  player.landingTimer = Math.max(0, player.landingTimer - dt);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.animationTime += dt;
  updateMovingPlatforms();

  const direction = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
  const jumpPressed = wasPressed('Space', 'KeyZ', 'ArrowUp');
  const jumpHeld = isDown('Space', 'KeyZ', 'ArrowUp');
  const crouchHeld = isDown('KeyS', 'KeyC', 'ArrowDown');
  const crouchPressed = wasPressed('KeyS', 'KeyC', 'ArrowDown');
  const dashPressed = wasPressed('KeyQ', 'ShiftLeft', 'ShiftRight');
  const rodHeld = isDown('KeyE', 'KeyX');
  if (direction) player.facing = direction;
  if (jumpPressed) player.jumpBuffer = 0.13;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - dt);

  if (wasPressed('KeyE', 'KeyX')) castRod();
  if (player.hook && !rodHeld) player.hook = null;
  if (wasPressed('Tab', 'KeyT')) openTackleBox();

  if (dashPressed && player.dashCooldown <= 0 && !player.crouched) {
    player.dashTimer = 0.16;
    player.dashCooldown = 0.68;
    player.vx = player.facing * 355;
    player.vy = 0;
    player.hook = null;
    audio.effect('rod');
    createParticles(player.x + player.w / 2, player.y + player.h / 2, '#7ed9d1', 10);
  }

  const touchingWall = wallProbe();
  player.wallDirection = touchingWall;
  const canGroundJump = player.coyote > 0;
  const canWallJump = touchingWall && !player.grounded;
  const canDoubleJump = !player.grounded && !canWallJump && player.airJumps > 0;
  if (player.jumpBuffer > 0 && (canGroundJump || canWallJump || canDoubleJump)) {
    if (canWallJump) {
      player.vx = -touchingWall * 265;
      player.facing = -touchingWall;
    } else if (canDoubleJump && !canGroundJump) {
      player.airJumps--;
      createParticles(player.x + player.w / 2, player.y + player.h, '#7ed9d1', 9);
    }
    player.vy = canWallJump ? -405 : -425;
    player.grounded = false;
    player.riding = null;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.jumpHeld = true;
    audio.effect('jump');
    createParticles(player.x + player.w / 2, player.y + player.h, '#e9f4dc', 5);
  }

  if (crouchPressed && player.grounded && Math.abs(player.vx) >= 145) {
    player.sliding = true;
    player.slideTimer = 0.58;
    player.vx = Math.sign(player.vx) * Math.max(225, Math.abs(player.vx));
    audio.effect('land');
  }
  player.slideTimer = Math.max(0, player.slideTimer - dt);
  if (!player.slideTimer || !player.grounded) player.sliding = false;
  setCrouched(crouchHeld || player.sliding);

  const maxSpeed = player.crouched && !player.sliding ? 90 : 205;
  const acceleration = player.grounded ? 1050 : 620;
  const deceleration = level.gimmick === 'ice' ? 260 : (player.grounded ? 1350 : 180);
  if (player.dashTimer > 0) player.vx = player.facing * 355;
  else if (player.sliding) player.vx = approach(player.vx, 0, 185 * dt);
  else player.vx = direction ? approach(player.vx, direction * maxSpeed, acceleration * dt) : approach(player.vx, 0, deceleration * dt);
  if (player.dashTimer <= 0) player.vy += 1120 * dt;
  if (!player.grounded && touchingWall && player.vy > 95 && direction === touchingWall) player.vy = 95;
  if (!jumpHeld && player.jumpHeld && player.vy < -150) player.vy += 1350 * dt;
  if (player.vy >= 0) player.jumpHeld = false;
  if (save.equipped === 'bubble' && rodHeld && player.vy > 90) player.vy = Math.min(player.vy, 120);

  if (player.hook) {
    const dx = player.hook.x - (player.x + player.w / 2);
    const dy = player.hook.y - (player.y + 12);
    const distance = Math.max(1, Math.hypot(dx, dy));
    player.vx += (dx / distance) * 500 * dt;
    player.vy += (dy / distance) * 500 * dt;
    if (distance > 250) player.hook = null;
  }

  for (const current of level.currents) {
    if (overlaps(player, { x: current[0] * TILE, y: current[1] * TILE, w: current[2] * TILE, h: current[3] * TILE })) player.vy -= 500 * dt;
  }
  for (const wind of level.windZones) {
    if (overlaps(player, { x: wind[0] * TILE, y: wind[1] * TILE, w: wind[2] * TILE, h: wind[3] * TILE })) player.vx += wind[4] * dt;
  }

  const wasFalling = player.vy > 170;
  player.grounded = false;
  player.riding = null;
  const horizontal = movePlayerAxis('x', player.vx * dt);
  player.wallDirection = horizontal.side;
  const vertical = movePlayerAxis('y', player.vy * dt);
  player.riding = vertical.landedOn;
  player.wallDirection = wallProbe();
  if (player.grounded) player.airJumps = 1;
  if (player.grounded && wasFalling) {
    player.landingTimer = 0.1;
    audio.effect('land');
    createParticles(player.x + player.w / 2, player.y + player.h, '#d8e3d8', 4);
  }

  if (player.y > 570) damagePlayer();
  for (const hazard of level.hazards) {
    if (overlaps(player, { x: hazard[0] * TILE, y: hazard[1] * TILE, w: hazard[2] * TILE, h: hazard[3] * TILE })) damagePlayer();
  }

  for (const checkpoint of level.checkpoints) {
    if (player.x > checkpoint[0] * TILE && player.checkpoint.x < checkpoint[0] * TILE) {
      player.checkpoint = { x: checkpoint[0] * TILE, y: checkpoint[1] * TILE };
      audio.effect('checkpoint');
      showTip('CHECKPOINT', 'Pip lit the harbor lantern');
    }
  }

  for (const pearl of level.runtimePearls) {
    if (!pearl.taken && Math.hypot(player.x - pearl.x, player.y - pearl.y) < 32) {
      pearl.taken = true;
      pearls += save.equipped === 'golden' ? 2 : 1;
      audio.effect('pearl');
      createParticles(pearl.x, pearl.y);
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
        player.vx *= 0.82;
      } else if (stompAttack) {
        enemy.state = 'defeated'; enemy.timer = 0.55; enemy.vx = 0;
        player.vy = -300;
        audio.effect('hit');
        createParticles(enemy.x, enemy.y, '#ef6a4c', 7);
      } else damagePlayer();
    }
  }
  for (const bubble of enemyProjectiles) {
    bubble.x += bubble.vx * dt;
    bubble.life -= dt;
    if (overlaps(player, { x: bubble.x - 7, y: bubble.y - 7, w: 14, h: 14 })) { bubble.life = 0; damagePlayer(); }
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
    if (!secret.taken && Math.hypot(player.x - secret.x, player.y - secret.y) < 42 && save.equipped === secret.id) {
      secret.taken = true;
      pearls += 5;
      audio.effect('lure');
      showTip('SECRET CATCH', 'Special-lure pearl cache +5');
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
  camera = approach(camera, Math.max(0, Math.min(level.width * TILE - 960, player.x - 360)), 900 * dt);

  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 220 * dt;
    particle.life -= dt;
  }
  particles = particles.filter(particle => particle.life > 0);
  pressed.clear();
}

function completeLevel() {
  state = 'complete';
  save.unlocked = Math.max(save.unlocked, levelIndex + 2);
  save.times[levelIndex] = Math.min(save.times[levelIndex] || 9999, elapsed);
  persist();
  ui.title.textContent = `${level.fish} caught!`;
  ui.copy.innerHTML = `${level.name} — ${formatTime(elapsed)} — ${pearls} pearls — ${deaths} falls`;
  ui.primary.textContent = levelIndex === 4 ? 'VIEW TACKLE LOG' : 'NEXT VOYAGE';
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
  const sourceX = moving ? 1060 : 76;
  const sourceWidth = moving ? 390 : 202;
  const segmentWidth = moving ? w : Math.min(96, w);
  const visualHeight = moving ? Math.max(42, h + 14) : Math.max(48, h + 12);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 5, y - 3, w + 10, Math.max(h + 22, visualHeight));
  ctx.clip();
  if (moving) {
    ctx.drawImage(images.environment, sourceX, sourceY, sourceWidth, sourceHeight, x - 4, y - 2, w + 8, visualHeight);
  } else {
    for (let offset = 0; offset < w; offset += segmentWidth - 1) {
      const drawWidth = Math.min(segmentWidth, w - offset + 1);
      ctx.drawImage(images.environment, sourceX, sourceY, sourceWidth, sourceHeight, x + offset, y - 2, drawWidth, visualHeight);
    }
  }
  ctx.restore();
  return;
  if (theme === 'boats') {
    ctx.fillStyle = moving ? '#72513d' : '#5b4032'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c58a4a'; ctx.fillRect(x, y, w, 8);
    ctx.strokeStyle = '#2b211f'; ctx.lineWidth = 2;
    for (let px = 0; px < w; px += 32) { ctx.strokeRect(x + px, y + 9, 31, Math.min(22, h - 10)); ctx.fillRect(x + px + 5, y + 15, 3, 3); }
    if (!moving && h > 40) { ctx.fillStyle = '#2d2827'; for (let px = 12; px < w; px += 48) ctx.fillRect(x + px, y + 26, 8, h - 26); }
  } else if (theme === 'current') {
    ctx.fillStyle = '#183a42'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#55c9a4'; ctx.fillRect(x, y, w, 7);
    ctx.strokeStyle = '#2b5960'; for (let px = 0; px < w; px += 28) ctx.strokeRect(x + px, y + 10 + (px % 3), 24, 14);
    ctx.fillStyle = '#6de6ba'; for (let px = 10; px < w; px += 44) ctx.fillRect(x + px, y - 4, 4, 8);
  } else if (theme === 'wind') {
    ctx.fillStyle = '#3d4b51'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#a7b28a'; ctx.fillRect(x, y, w, 7);
    ctx.strokeStyle = '#59666a'; for (let px = 8; px < w; px += 30) { ctx.beginPath(); ctx.moveTo(x + px, y + 9); ctx.lineTo(x + px - 8, y + Math.min(h, 34)); ctx.stroke(); }
    ctx.fillStyle = '#829564'; for (let px = 3; px < w; px += 38) ctx.fillRect(x + px, y - 3, 18, 4);
  } else if (theme === 'ice') {
    ctx.fillStyle = '#38677c'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#edf9f4'; ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = '#9dd8e5'; ctx.fillRect(x, y + 8, w, 5);
    ctx.strokeStyle = '#4f8ca1'; for (let px = 0; px < w; px += 32) ctx.strokeRect(x + px, y + 14, 31, 18);
  } else {
    ctx.fillStyle = '#3b3268'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c7a8f3'; ctx.fillRect(x, y, w, 7);
    ctx.strokeStyle = '#685396'; for (let px = 8; px < w; px += 28) { ctx.beginPath(); ctx.moveTo(x + px, y + 11); ctx.lineTo(x + px + 9, y + 24); ctx.lineTo(x + px - 3, y + 35); ctx.stroke(); }
    ctx.fillStyle = '#8ce4df'; for (let px = 14; px < w; px += 50) ctx.fillRect(x + px, y + 14, 3, 3);
  }
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

function drawFinn() {
  let frame = 0;
  if (player.hurtTimer > 0) frame = 7;
  else if (player.rodTimer > 0 || player.hook) frame = 6;
  else if (!player.grounded) frame = player.vy < 0 ? 4 : 5;
  else if (Math.abs(player.vx) > 150) frame = 3;
  else if (Math.abs(player.vx) > 12) frame = 1 + Math.floor(player.animationTime * 6) % 2;
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
  const spriteScale = 0.255;
  let width = cropW * spriteScale / landingScale;
  let height = cropH * spriteScale * landingScale;
  if (player.crouched) { width *= player.sliding ? 1.12 : 1.04; height *= player.sliding ? 0.7 : 0.78; }
  const x = screenX(player.x + player.w / 2) - width / 2;
  const y = Math.round(player.y + player.h - height);
  ctx.save();
  if (player.facing < 0) { ctx.translate(x + width, 0); ctx.scale(-1, 1); ctx.drawImage(image, sourceX, sourceY, cropW, cropH, 0, y, width, height); }
  else ctx.drawImage(image, sourceX, sourceY, cropW, cropH, x, y, width, height);
  ctx.restore();
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

  for (const current of level.currents) {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = '#71e5d080';
      ctx.fillRect(screenX(current[0] * TILE + 10 + (i % 3) * 55), current[1] * TILE + ((elapsed * 65 + i * 61) % (current[3] * TILE)), 4, 17);
    }
  }
  for (const platform of staticSolids()) drawPlatform(platform);
  for (const mover of level.runtimeMovers) drawPlatform(mover, true);

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
    drawPropCell(4, screenX(pickup.x) - 27, pickup.y - 27, 54, 54);
  }
  for (const secret of level.runtimeSecrets) if (!secret.taken) {
    drawPropCell(5, screenX(secret.x) - 22, secret.y - 22, 44, 44);
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
  for (const particle of particles) { ctx.fillStyle = particle.color; ctx.fillRect(screenX(particle.x), particle.y, 4, 4); }

  drawPropCell(6 + levelIndex, screenX(level.goal[0] * TILE) - 34, level.goal[1] * TILE - 20, 76, 76);
  drawFinn();

  ctx.fillStyle = '#09232eea'; ctx.fillRect(14, 14, 530, 64);
  ctx.strokeStyle = '#d8a344'; ctx.lineWidth = 2; ctx.strokeRect(14, 14, 530, 64);
  ctx.strokeStyle = '#5c442d'; ctx.lineWidth = 1; ctx.strokeRect(19, 19, 520, 54);
  ctx.fillStyle = '#e7b450';
  for (const rivetX of [21, 537]) { ctx.beginPath(); ctx.arc(rivetX, 21, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff1cf'; ctx.font = 'bold 14px DM Mono'; ctx.fillText(`${levelIndex + 1}/5  ${level.name.toUpperCase()}`, 31, 39);
  ctx.fillStyle = '#78d9d0'; ctx.fillRect(29, 48, 482, 1);
  ctx.fillStyle = LURES.find(lure => lure.id === save.equipped).color; ctx.font = '11px DM Mono';
  ctx.fillText(`${formatTime(elapsed)}  •  PEARLS ${pearls}  •  ${LURES.find(lure => lure.id === save.equipped).name.toUpperCase()}`, 31, 67);
  if (tipTimer > 0) {
    ctx.fillStyle = '#071726ed'; ctx.fillRect(205, 457, 550, 50);
    ctx.strokeStyle = '#d6b56a'; ctx.strokeRect(205, 457, 550, 50);
    ctx.fillStyle = '#fff1cf'; ctx.textAlign = 'center'; ctx.font = 'bold 11px DM Mono'; ctx.fillText(tip, 480, 487); ctx.textAlign = 'left';
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

for (const button of document.querySelectorAll('[data-level]')) button.onclick = () => startLevel(Number(button.dataset.level));
document.querySelector('#touch-tackle').onclick = openTackleBox;
document.querySelector('#close-tackle').onclick = closeTackleBox;
ui.primary.onclick = () => {
  if (state === 'title') startLevel(0);
  else if (state === 'paused') { state = 'play'; ui.overlay.classList.add('hidden'); }
  else if (state === 'complete') { if (levelIndex < 4) startLevel(levelIndex + 1); else location.reload(); }
};
document.querySelector('#sound').onclick = event => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) audio.start();
  event.target.textContent = `MUSIC + SFX: ${soundEnabled ? 'ON' : 'OFF'}`;
};
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });

renderLureMenu();
requestAnimationFrame(loop);
