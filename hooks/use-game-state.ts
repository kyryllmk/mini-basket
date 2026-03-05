// Game state management hook for Basketball Time

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameData,
  GameMode,
  Ball,
  Vector2D,
  GAME_DURATION,
  MAX_POWER,
  POWER_MULTIPLIER,
  GRAVITY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  BALL_RADIUS,
  THREE_POINT_X,
  AI_THREE_POINT_X,
  SOLO_SPOTS,
  VS_AI_PLAYER_SPOTS,
  RIGHT_HOOP,
  LEFT_HOOP,
  AI_BALL_START,
} from '@/lib/game/types';
import {
  applyGravity,
  updatePosition,
  handleGroundBounce,
  isBallStopped,
  calculateAssistedShotVelocity,
} from '@/lib/game/physics';
import {
  handleRimCollision,
  handleBackboardCollision,
  handleBackboardCollisionLeft,
  checkHoopPass,
  isBallOutOfBounds,
} from '@/lib/game/collision';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the correct shooting spots array for the given game mode. */
function getSpots(mode: GameMode) {
  return mode === 'vs_ai' ? VS_AI_PLAYER_SPOTS : SOLO_SPOTS;
}

const HS_KEY = 'basketball-time-hs';

function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(window.localStorage.getItem(HS_KEY) ?? '0', 10) || 0;
}

function saveHighScore(score: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HS_KEY, String(score));
}

function makeBall(pos: Vector2D): Ball {
  return {
    position: { ...pos },
    velocity: { x: 0, y: 0 },
    radius: BALL_RADIUS,
    isActive: false,
    rotation: 0,
  };
}

/**
 * Calculate the velocity the AI needs to lob the ball into the target hoop.
 * Solves projectile equations for a chosen flight time, then adds noise.
 */
function calcAIShotVelocity(
  from: Vector2D,
  target: Vector2D,
  accuracy: number          // 0–1; higher = more accurate
): Vector2D {
  const inaccuracy = 1 - accuracy;
  const willHardMiss = Math.random() < 0.18 + inaccuracy * 0.35;
  const sideBias = Math.random() < 0.5 ? -1 : 1;

  const aimX =
    target.x +
    (Math.random() - 0.5) * (20 + inaccuracy * 24) +
    (willHardMiss ? sideBias * (10 + Math.random() * 16) : 0);
  const aimY = target.y - 6 + (Math.random() - 0.5) * (8 + inaccuracy * 14);

  const dx = aimX - from.x;
  const dy = aimY - from.y;

  const baseT = Math.max(34, Math.abs(dx) / (6.4 - inaccuracy * 1.4));
  const t = baseT + (Math.random() - 0.5) * (8 + inaccuracy * 16);
  const vx = dx / t;
  const vy = (dy - 0.5 * GRAVITY * t * t) / t;

  // Clamp to MAX_POWER
  const spd = Math.sqrt(vx * vx + vy * vy);
  const scale = spd > MAX_POWER ? MAX_POWER / spd : 1;

  const noise = inaccuracy * 6.8;
  return {
    x: vx * scale + (Math.random() - 0.5) * noise,
    y: vy * scale + (Math.random() - 0.5) * noise * 1.15,
  };
}

// ─── Initial state builders ────────────────────────────────────────────────────

function buildInitialData(mode: GameMode): GameData {
  const spots = getSpots(mode);
  const defaultSpot = spots[0];

  return {
    mode,
    state: 'playing',
    score: 0,
    aiScore: 0,
    highScore: loadHighScore(),
    shotsFired: 0,
    shotsHit: 0,
    shotsMissed: 0,
    aiShotsFired: 0,
    aiShotsHit: 0,
    aiShotsMissed: 0,
    overtimeUsed: false,
    timeRemaining: GAME_DURATION,
    ball: makeBall(defaultSpot),
    hoop: RIGHT_HOOP,
    leftHoop: LEFT_HOOP,
    court: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      groundY: GROUND_Y,
      threePointX: THREE_POINT_X,
    },
    dragState: { isDragging: false, startPosition: null, currentPosition: null },
    shotOrigin: null,
    ballPassedThroughHoop: false,
    shootingSpotIndex: 0,
    aiData:
      mode === 'vs_ai'
        ? {
            ball: makeBall(AI_BALL_START),
            cooldown: 90,  // 1.5 s before first shot
            shotOrigin: null,
            ballPassedThroughHoop: false,
          }
        : null,
  };
}

/** Start-screen state — derived from buildInitialData to avoid duplication. */
function buildStartScreenData(): GameData {
  return { ...buildInitialData('solo'), state: 'start', highScore: 0 };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameState() {
  const [gameData, setGameData] = useState<GameData>({
    ...buildStartScreenData(),
    highScore: loadHighScore(),
  });

  const prevBallY = useRef<number>(SOLO_SPOTS[0].y);
  const prevAIBallY = useRef<number>(AI_BALL_START.y);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Game start / restart ────────────────────────────────────────────────────

  const startGame = useCallback((mode: GameMode = 'solo') => {
    const data = buildInitialData(mode);
    prevBallY.current = data.ball.position.y;
    prevAIBallY.current = AI_BALL_START.y;
    setGameData(data);
  }, []);

  const restartGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameData((prev) => buildInitialData(prev.mode));
  }, []);

  const goToMenu = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setGameData((prev) => ({
      ...buildStartScreenData(),
      highScore: prev.highScore,
    }));
  }, []);

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((position: Vector2D) => {
    setGameData((prev) => {
      if (prev.state !== 'playing' || prev.ball.isActive) return prev;

      // Check if click is near a shooting spot marker — move ball there
      const spots = getSpots(prev.mode);
      for (let i = 0; i < spots.length; i++) {
        const s = spots[i];
        const dx = position.x - s.x;
        const dy = position.y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < 28 && i !== prev.shootingSpotIndex) {
          prevBallY.current = s.y;
          return { ...prev, shootingSpotIndex: i, ball: makeBall(s) };
        }
      }

      // Start drag anchored at the ball (slingshot: drag back, shoot forward).
      // startPosition is always the ball's position so the drag line and
      // trajectory arc are visually connected.
      return {
        ...prev,
        dragState: {
          isDragging: true,
          startPosition: { ...prev.ball.position },
          currentPosition: position,
        },
      };
    });
  }, []);

  const handleMouseMove = useCallback((position: Vector2D) => {
    setGameData((prev) => {
      if (!prev.dragState.isDragging) return prev;
      return {
        ...prev,
        dragState: { ...prev.dragState, currentPosition: position },
      };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setGameData((prev) => {
      if (
        !prev.dragState.isDragging ||
        !prev.dragState.startPosition ||
        !prev.dragState.currentPosition
      ) {
        return prev;
      }

      const velocity = calculateAssistedShotVelocity(
        prev.dragState.startPosition,
        prev.dragState.currentPosition,
        prev.hoop.position.x,
        MAX_POWER,
        POWER_MULTIPLIER
      );

      if (Math.abs(velocity.x) < 0.5 && Math.abs(velocity.y) < 0.5) {
        return {
          ...prev,
          dragState: { isDragging: false, startPosition: null, currentPosition: null },
        };
      }

      return {
        ...prev,
        ball: { ...prev.ball, velocity, isActive: true },
        dragState: { isDragging: false, startPosition: null, currentPosition: null },
        shotOrigin: { ...prev.ball.position },
        ballPassedThroughHoop: false,
        shotsFired: prev.shotsFired + 1,
      };
    });
  }, []);

  // ── Ball reset helpers (called from physics loop) ───────────────────────────

  const resetPlayerBall = useCallback((spotIndex: number, mode: GameMode) => {
    const spots = getSpots(mode);
    const spot = spots[spotIndex] ?? spots[0];
    prevBallY.current = spot.y;
    setGameData((prev) => {
      if (prev.state !== 'playing') return prev;
      return { ...prev, ball: makeBall(spot), shotOrigin: null, ballPassedThroughHoop: false };
    });
  }, []);

  const resetAIBall = useCallback(() => {
    prevAIBallY.current = AI_BALL_START.y;
    setGameData((prev) => {
      if (prev.state !== 'playing' || !prev.aiData) return prev;
      return {
        ...prev,
        aiData: {
          ...prev.aiData,
          ball: makeBall(AI_BALL_START),
          cooldown: 90,
          shotOrigin: null,
          ballPassedThroughHoop: false,
        },
      };
    });
  }, []);

  // ── Physics update loop ─────────────────────────────────────────────────────

  useEffect(() => {
    if (gameData.state !== 'playing') return;

    const updatePhysics = () => {
      setGameData((prev) => {
        if (prev.state !== 'playing') return prev;

        let next = prev;

        // ── Player ball ──────────────────────────────────────────────────────
        if (prev.ball.isActive) {
          let b = { ...prev.ball };
          const curY = b.position.y;

          b.velocity = applyGravity(b.velocity);
          b.position = updatePosition(b.position, b.velocity);
          b.rotation = b.rotation + b.velocity.x * 0.05;

          b = handleGroundBounce(b, prev.court.groundY);
          b = handleRimCollision(b, prev.hoop);
          b = handleBackboardCollision(b, prev.hoop);

          let newScore = prev.score;
          let passed = prev.ballPassedThroughHoop;
          let newShotsHit = prev.shotsHit;
          let newShotsMissed = prev.shotsMissed;

          if (!passed && checkHoopPass(b, prevBallY.current, prev.hoop)) {
            const isThree = prev.shotOrigin
              ? prev.shotOrigin.x < prev.court.threePointX
              : false;
            newScore += isThree ? 3 : 2;
            passed = true;
            newShotsHit += 1;
          }

          prevBallY.current = curY;

          if (
            isBallStopped(b, prev.court.groundY) ||
            isBallOutOfBounds(b, prev.court.width)
          ) {
            // Schedule reset after short delay
            const si = prev.shootingSpotIndex;
            const mode = prev.mode;
            if (!passed) newShotsMissed += 1;
            setTimeout(() => resetPlayerBall(si, mode), 500);

            next = {
              ...next,
              ball: { ...b, isActive: false },
              score: newScore,
              ballPassedThroughHoop: passed,
              shotsHit: newShotsHit,
              shotsMissed: newShotsMissed,
            };
          } else {
            next = {
              ...next,
              ball: b,
              score: newScore,
              ballPassedThroughHoop: passed,
              shotsHit: newShotsHit,
              shotsMissed: newShotsMissed,
            };
          }
        }

        // ── AI ball (vs_ai mode) ─────────────────────────────────────────────
        if (prev.mode === 'vs_ai' && prev.aiData) {
          const ai = prev.aiData;

          if (ai.ball.isActive) {
            let ab = { ...ai.ball };
            const curAIY = ab.position.y;

            ab.velocity = applyGravity(ab.velocity);
            ab.position = updatePosition(ab.position, ab.velocity);
            ab.rotation = ab.rotation - ab.velocity.x * 0.05; // spins opposite dir

            ab = handleGroundBounce(ab, prev.court.groundY);
            ab = handleRimCollision(ab, prev.leftHoop);
            ab = handleBackboardCollisionLeft(ab, prev.leftHoop);

            let newAIScore = prev.aiScore;
            let aiPassed = ai.ballPassedThroughHoop;
            let newAIShotsHit = prev.aiShotsHit;
            let newAIShotsMissed = prev.aiShotsMissed;

            if (!aiPassed && checkHoopPass(ab, prevAIBallY.current, prev.leftHoop)) {
              const aiIsThree = ai.shotOrigin
                ? ai.shotOrigin.x > AI_THREE_POINT_X
                : false;
              newAIScore += aiIsThree ? 3 : 2;
              aiPassed = true;
              newAIShotsHit += 1;
            }

            prevAIBallY.current = curAIY;

            if (
              isBallStopped(ab, prev.court.groundY) ||
              isBallOutOfBounds(ab, prev.court.width)
            ) {
              if (!aiPassed) newAIShotsMissed += 1;
              setTimeout(() => resetAIBall(), 500);
              next = {
                ...next,
                aiScore: newAIScore,
                aiShotsHit: newAIShotsHit,
                aiShotsMissed: newAIShotsMissed,
                aiData: {
                  ...ai,
                  ball: { ...ab, isActive: false },
                  ballPassedThroughHoop: aiPassed,
                },
              };
            } else {
              next = {
                ...next,
                aiScore: newAIScore,
                aiShotsHit: newAIShotsHit,
                aiShotsMissed: newAIShotsMissed,
                aiData: { ...ai, ball: ab, ballPassedThroughHoop: aiPassed },
              };
            }
          } else if (ai.cooldown > 0) {
            // Countdown
            next = {
              ...next,
              aiData: { ...ai, cooldown: ai.cooldown - 1 },
            };
          } else if (ai.cooldown === 0) {
            // AI shoots!
            const velocity = calcAIShotVelocity(
              ai.ball.position,
              prev.leftHoop.position,
              0.46
            );
            next = {
              ...next,
              aiShotsFired: prev.aiShotsFired + 1,
              aiData: {
                ...ai,
                ball: { ...ai.ball, velocity, isActive: true },
                cooldown: -1,
                shotOrigin: { ...ai.ball.position },
                ballPassedThroughHoop: false,
              },
            };
          }
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameData.state]); // resetPlayerBall/resetAIBall are stable (empty-dep useCallback)

  // ── Timer countdown ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameData.state !== 'playing') return;

    timerRef.current = setInterval(() => {
      setGameData((prev) => {
        if (prev.timeRemaining <= 1) {
          if (
            prev.mode === 'vs_ai' &&
            !prev.overtimeUsed &&
            prev.score === prev.aiScore
          ) {
            return {
              ...prev,
              timeRemaining: 30,
              overtimeUsed: true,
            };
          }

          // Save high score
          const finalScore = prev.score;
          if (finalScore > prev.highScore) {
            saveHighScore(finalScore);
          }
          return {
            ...prev,
            state: 'gameOver',
            timeRemaining: 0,
            highScore: Math.max(finalScore, prev.highScore),
          };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameData.state]);

  return {
    gameData,
    startGame,
    restartGame,
    goToMenu,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
