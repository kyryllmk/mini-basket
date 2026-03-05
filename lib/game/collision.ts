// Collision detection utilities for Basketball Time

import { Vector2D, Ball, Hoop, RIM_BOUNCE_DAMPING } from './types';
import { distance } from './physics';

// ─── Rim collision ────────────────────────────────────────────────────────────

/**
 * Handle rim collision against any hoop (works for both left and right hoops).
 */
export function handleRimCollision(ball: Ball, hoop: Hoop): Ball {
  const leftRimPoint: Vector2D = {
    x: hoop.position.x - hoop.rimRadius,
    y: hoop.position.y,
  };
  const rightRimPoint: Vector2D = {
    x: hoop.position.x + hoop.rimRadius,
    y: hoop.position.y,
  };

  let updatedBall = checkPointCollision(ball, leftRimPoint);
  updatedBall = checkPointCollision(updatedBall, rightRimPoint);
  return updatedBall;
}

function checkPointCollision(ball: Ball, point: Vector2D): Ball {
  const dist = distance(ball.position, point);
  const rimThickness = 5;

  if (dist < ball.radius + rimThickness) {
    const nx = (ball.position.x - point.x) / dist;
    const ny = (ball.position.y - point.y) / dist;
    const dotProduct = ball.velocity.x * nx + ball.velocity.y * ny;

    return {
      ...ball,
      position: {
        x: point.x + nx * (ball.radius + rimThickness + 1),
        y: point.y + ny * (ball.radius + rimThickness + 1),
      },
      velocity: {
        x: (ball.velocity.x - 2 * dotProduct * nx) * RIM_BOUNCE_DAMPING,
        y: (ball.velocity.y - 2 * dotProduct * ny) * RIM_BOUNCE_DAMPING,
      },
    };
  }

  return ball;
}

// ─── Backboard collision ──────────────────────────────────────────────────────

/**
 * Handle backboard collision for a RIGHT-side hoop (backboard is to the right of rim).
 */
export function handleBackboardCollision(ball: Ball, hoop: Hoop): Ball {
  // Only apply when backboard is on the right (positive offset)
  if (hoop.backboardOffset <= 0) return ball;

  const backboardX = hoop.position.x + hoop.backboardOffset;
  const backboardTop = hoop.position.y - hoop.backboardHeight / 2;
  const backboardBottom = hoop.position.y + hoop.backboardHeight / 2;

  if (
    ball.position.x + ball.radius >= backboardX &&
    ball.position.y >= backboardTop &&
    ball.position.y <= backboardBottom &&
    ball.velocity.x > 0
  ) {
    return {
      ...ball,
      position: { x: backboardX - ball.radius - 1, y: ball.position.y },
      velocity: { x: -ball.velocity.x * RIM_BOUNCE_DAMPING, y: ball.velocity.y },
    };
  }

  return ball;
}

/**
 * Handle backboard collision for a LEFT-side hoop (backboard is to the LEFT of rim).
 */
export function handleBackboardCollisionLeft(ball: Ball, hoop: Hoop): Ball {
  // Only apply when backboard is on the left (negative offset)
  if (hoop.backboardOffset >= 0) return ball;

  const backboardX = hoop.position.x + hoop.backboardOffset; // e.g. 115 - 35 = 80
  const backboardTop = hoop.position.y - hoop.backboardHeight / 2;
  const backboardBottom = hoop.position.y + hoop.backboardHeight / 2;

  if (
    ball.position.x - ball.radius <= backboardX &&
    ball.position.y >= backboardTop &&
    ball.position.y <= backboardBottom &&
    ball.velocity.x < 0
  ) {
    return {
      ...ball,
      position: { x: backboardX + ball.radius + 1, y: ball.position.y },
      velocity: { x: -ball.velocity.x * RIM_BOUNCE_DAMPING, y: ball.velocity.y },
    };
  }

  return ball;
}

// ─── Hoop pass (scoring) ──────────────────────────────────────────────────────

/**
 * Check if ball passes through the hoop from above (ball moving downward).
 * Works for both left and right hoops.
 */
export function checkHoopPass(ball: Ball, prevBallY: number, hoop: Hoop): boolean {
  const hoopY = hoop.position.y;
  const hoopLeft = hoop.position.x - hoop.rimRadius + 5;
  const hoopRight = hoop.position.x + hoop.rimRadius - 5;

  const isWithinHoop = ball.position.x > hoopLeft && ball.position.x < hoopRight;
  const passedThrough = prevBallY < hoopY && ball.position.y >= hoopY;
  const movingDown = ball.velocity.y > 0;

  return isWithinHoop && passedThrough && movingDown;
}

// ─── Bounds ───────────────────────────────────────────────────────────────────

export function isBallOutOfBounds(ball: Ball, courtWidth: number): boolean {
  return ball.position.x < -ball.radius || ball.position.x > courtWidth + ball.radius;
}
