import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN } from '../src/campaign.js';

test('campaign contains eight complete world plans', () => {
  assert.equal(CAMPAIGN.length, 8);
  CAMPAIGN.forEach((world, index) => {
    assert.equal(world.number, index + 1);
    assert.equal(world.levels.length, 5);
    assert.equal(world.bonuses.length, 2);
    assert.ok(world.catch);
    assert.ok(world.friend);
  });
});

test('all forty main voyages have unique names', () => {
  const names = CAMPAIGN.flatMap(world => world.levels.map(level => level[0]));
  assert.equal(names.length, 40);
  assert.equal(new Set(names).size, 40);
});

test('the five current prototypes anchor the first five worlds', () => {
  assert.deepEqual(CAMPAIGN.map(world => world.prototypeLevel), [0, 1, 2, 3, 4, null, null, null]);
});
