import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENT, flowSpeed, gravityForVelocity, flowRank } from '../src/movement.js';

test('movement tuning favors responsive control and expressive momentum', () => {
  assert.ok(MOVEMENT.groundAcceleration > MOVEMENT.groundFriction);
  assert.ok(MOVEMENT.turnAcceleration > MOVEMENT.groundAcceleration);
  assert.ok(MOVEMENT.dashSpeed > MOVEMENT.flowRunSpeed);
  assert.ok(MOVEMENT.slideJumpSpeed > MOVEMENT.runSpeed);
  assert.ok(MOVEMENT.coyoteTime >= 0.14);
  assert.ok(MOVEMENT.jumpBufferTime >= 0.14);
});

test('flow grants a meaningful but controlled speed reward', () => {
  assert.equal(flowSpeed(0), MOVEMENT.runSpeed);
  assert.equal(flowSpeed(100), MOVEMENT.flowRunSpeed);
  assert.equal(flowSpeed(200), MOVEMENT.flowRunSpeed);
  assert.ok(flowSpeed(50) > flowSpeed(0));
});

test('held jumps receive apex hang time without removing gravity', () => {
  assert.ok(gravityForVelocity(20, true) < gravityForVelocity(220, true));
  assert.ok(gravityForVelocity(20, true) > 0);
  assert.ok(gravityForVelocity(220, true, true) < gravityForVelocity(220, true));
});

test('flow ranks communicate three readable states', () => {
  assert.equal(flowRank(0), 'BUILD FLOW');
  assert.equal(flowRank(50), 'ON A ROLL');
  assert.equal(flowRank(85), 'HIGH TIDE');
});
