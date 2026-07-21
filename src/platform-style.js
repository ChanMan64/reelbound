export const PLATFORM_VARIANTS = Object.freeze([
  { x: 76, w: 202, kind: 'braced' },
  { x: 334, w: 212, kind: 'decorated' },
  { x: 603, w: 161, kind: 'narrow' },
  { x: 826, w: 171, kind: 'edged' },
]);

export const WIDE_PLATFORM = Object.freeze({ x: 1060, w: 390, kind: 'landmark' });

export function platformMaterialSeed(platform, levelIndex, tileSize = 32) {
  const tileX = Math.round(platform.x / tileSize);
  const tileY = Math.round(platform.y / tileSize);
  return Math.abs(tileX * 31 + tileY * 17 + Math.round(platform.w / tileSize) * 13 + levelIndex * 7);
}

export function choosePlatformCrop(width, seed, moving = false) {
  if (moving) return WIDE_PLATFORM;
  if (width >= 240 && seed % 3 !== 0) return WIDE_PLATFORM;
  return PLATFORM_VARIANTS[seed % PLATFORM_VARIANTS.length];
}

function seededUnit(seed, salt) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function platformDetailFractions(width, seed) {
  const count = Math.max(1, Math.min(4, Math.ceil(width / 180)));
  const fractions = [];
  for (let index = 0; index < count; index++) {
    const sectionStart = index / count;
    fractions.push(sectionStart + (.18 + seededUnit(seed, index + 1) * .64) / count);
  }
  return fractions.sort((a, b) => a - b);
}
