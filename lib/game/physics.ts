// Physics utilities for Basketball Time

import {
  Vector2D,
  Ball,
  GRAVITY,
  BALL_BOUNCE_DAMPING,
} from './types';

/**
 * Apply gravity to ball velocity
 */
export function applyGravity(velocity: Vector2D): Vector2D {
  return {
    x: velocity.x,
    y: velocity.y + GRAVITY,
  };
}

/**
 * Update ball position based on velocity
 */
export function updatePosition(position: Vector2D, velocity: Vector2D): Vector2D {
  return {
    x: position.x + velocity.x,
    y: position.y + velocity.y,
  };
}

/**
 * Handle ground bounce
 */
export function handleGroundBounce(
  ball: Ball,
  groundY: number
): Ball {
  if (ball.position.y + ball.radius >= groundY) {
    return {
      ...ball,
      position: {
        x: ball.position.x,
        y: groundY - ball.radius,
      },
      velocity: {
        x: ball.velocity.x * 0.95, // Friction
        y: -ball.velocity.y * BALL_BOUNCE_DAMPING,
      },
    };
  }
  return ball;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Calculate shot velocity from drag
 */
export function calculateShotVelocity(
  start: Vector2D,
  end: Vector2D,
  maxPower: number,
  powerMultiplier: number
): Vector2D {
  const dx = start.x - end.x;
  const dy = start.y - end.y;
  const power = Math.min(Math.sqrt(dx * dx + dy * dy) * powerMultiplier, maxPower);
  const normalized = normalize({ x: dx, y: dy });
  
  return {
    x: normalized.x * power,
    y: normalized.y * power,
  };
}

/**
 * Player-oriented shot calculation with light assist:
 * - close shots get more vertical lift
 * - close shots get less horizontal drift
 * - all shots get a minimum arc so paint/mid-range are controllable
 */
export function calculateAssistedShotVelocity(
  start: Vector2D,
  end: Vector2D,
  hoopX: number,
  maxPower: number,
  powerMultiplier: number
): Vector2D {
  const base = calculateShotVelocity(start, end, maxPower, powerMultiplier);
  const distanceToHoop = Math.abs(hoopX - start.x);
  const farFactor = Math.min(distanceToHoop / 560, 1); // 0 = paint, 1 = deep range

  const horizontalScale = 0.82 + farFactor * 0.24;
  const verticalScale = 1.08 + (1 - farFactor) * 0.28;

  const vx = base.x * horizontalScale;
  let vy = base.y * verticalScale;

  // Force an arc for short drags so close shots don't laser into the rim.
  const minArcLift = -(5.6 + (1 - farFactor) * 2.2);
  if (vy > minArcLift) vy = minArcLift;

  return { x: vx, y: vy };
}

/**
 * Check if ball has stopped moving
 */
export function isBallStopped(ball: Ball, groundY: number): boolean {
  const isOnGround = ball.position.y + ball.radius >= groundY - 1;
  const hasLowVelocity = Math.abs(ball.velocity.x) < 0.5 && Math.abs(ball.velocity.y) < 1;
  return isOnGround && hasLowVelocity;
}

/**
 * Predict trajectory points for aiming guide
 */
export function predictTrajectory(
  startPosition: Vector2D,
  velocity: Vector2D,
  steps: number = 30
): Vector2D[] {
  const points: Vector2D[] = [];
  let pos = { ...startPosition };
  let vel = { ...velocity };

  for (let i = 0; i < steps; i++) {
    points.push({ ...pos });
    vel = applyGravity(vel);
    pos = updatePosition(pos, vel);
  }

  return points;
}
