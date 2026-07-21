import test from 'node:test';
import assert from 'node:assert/strict';
import { choosePlatformCrop, harborPlatformRecipe, HARBOR_PLATFORM_STYLES, platformDetailFractions, platformMaterialSeed, PLATFORM_VARIANTS, WIDE_PLATFORM } from '../src/platform-style.js';

test('one platform receives one coherent atlas object', () => {
  const seed = platformMaterialSeed({ x: 320, y: 480, w: 128 }, 2);
  assert.equal(choosePlatformCrop(128, seed), PLATFORM_VARIANTS[seed % PLATFORM_VARIANTS.length]);
  assert.equal(choosePlatformCrop(128, seed, true), WIDE_PLATFORM);
});

test('broad platforms prefer landmark art without losing deterministic variety', () => {
  assert.equal(choosePlatformCrop(320, 1), WIDE_PLATFORM);
  assert.notEqual(choosePlatformCrop(320, 3), WIDE_PLATFORM);
  assert.deepEqual(choosePlatformCrop(320, 1), choosePlatformCrop(320, 1));
});

test('surface decoration is sparse deterministic and object-scaled', () => {
  const small = platformDetailFractions(96, 42);
  const large = platformDetailFractions(620, 42);
  assert.equal(small.length, 1);
  assert.equal(large.length, 4);
  assert.deepEqual(large, platformDetailFractions(620, 42));
  assert.ok(large.every(value => value > 0 && value < 1));
});

test('harbor object tags map to visibly distinct recipes', () => {
  assert.equal(harborPlatformRecipe('quay', 400, 1), HARBOR_PLATFORM_STYLES.quay);
  assert.equal(harborPlatformRecipe('cargo', 96, 1), HARBOR_PLATFORM_STYLES.cargo);
  assert.equal(harborPlatformRecipe('gantry', 160, 1), HARBOR_PLATFORM_STYLES.gantry);
  assert.equal(harborPlatformRecipe('piling', 64, 1), HARBOR_PLATFORM_STYLES.piling);
  assert.equal(harborPlatformRecipe('cargo', 96, 1, true), HARBOR_PLATFORM_STYLES.float);
  assert.equal(new Set(Object.values(HARBOR_PLATFORM_STYLES).map(recipe => recipe.accent)).size, 7);
});
