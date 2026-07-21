export const MOVEMENT = Object.freeze({
  runSpeed: 232,
  flowRunSpeed: 264,
  crouchSpeed: 105,
  groundAcceleration: 1750,
  turnAcceleration: 2450,
  airAcceleration: 920,
  groundFriction: 1120,
  airDrag: 105,
  iceFriction: 235,
  gravity: 1260,
  apexGravity: 760,
  jumpVelocity: 438,
  doubleJumpVelocity: 398,
  wallJumpVelocity: 414,
  wallJumpHorizontal: 302,
  wallSlideSpeed: 82,
  dashSpeed: 424,
  dashDuration: 0.14,
  dashCooldown: 0.28,
  slideSpeed: 270,
  slideDuration: 0.68,
  slideFriction: 205,
  slideJumpSpeed: 326,
  grappleAcceleration: 940,
  grappleMaxSpeed: 470,
  coyoteTime: 0.16,
  wallCoyoteTime: 0.13,
  jumpBufferTime: 0.16,
});

export function flowSpeed(flow) {
  const amount = Math.max(0, Math.min(100, flow)) / 100;
  return MOVEMENT.runSpeed + (MOVEMENT.flowRunSpeed - MOVEMENT.runSpeed) * amount;
}

export function gravityForVelocity(vy, jumpHeld, grappling = false) {
  let gravity = Math.abs(vy) < 88 && jumpHeld ? MOVEMENT.apexGravity : MOVEMENT.gravity;
  if (grappling) gravity *= 0.58;
  return gravity;
}

export function flowRank(flow) {
  if (flow >= 85) return 'HIGH TIDE';
  if (flow >= 50) return 'ON A ROLL';
  return 'BUILD FLOW';
}
