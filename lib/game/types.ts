// Game state types for Basketball Time

export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  isActive: boolean;
  rotation: number; // radians — drives seam spin animation
}

export interface ShootingSpot {
  id: string;
  x: number;
  y: number;   // ball-center Y when standing here
  label: string;
}

export interface Hoop {
  position: Vector2D; // center of rim
  rimRadius: number;
  backboardWidth: number;
  backboardHeight: number;
  /** positive = backboard to the RIGHT of rim; negative = to the LEFT */
  backboardOffset: number;
}

export interface Court {
  width: number;
  height: number;
  groundY: number;
  /** Absolute X of the player's 3-point line (shots from x < this are 3PT) */
  threePointX: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Vector2D | null;
  currentPosition: Vector2D | null;
}

export interface AIState {
  ball: Ball;
  /** frames remaining before AI shoots; -1 = already shot / in flight */
  cooldown: number;
  shotOrigin: Vector2D | null;
  ballPassedThroughHoop: boolean;
}

export type GameMode = 'solo' | 'vs_ai';
export type GameState = 'start' | 'playing' | 'gameOver';

export interface GameData {
  mode: GameMode;
  state: GameState;
  /** Player score (and solo score) */
  score: number;
  aiScore: number;
  highScore: number;
  shotsFired: number;
  shotsHit: number;
  shotsMissed: number;
  aiShotsFired: number;
  aiShotsHit: number;
  aiShotsMissed: number;
  overtimeUsed: boolean;
  timeRemaining: number;
  ball: Ball;
  /** Right-side hoop — player's target */
  hoop: Hoop;
  /** Left-side hoop — AI's target in vs_ai */
  leftHoop: Hoop;
  court: Court;
  dragState: DragState;
  shotOrigin: Vector2D | null;
  ballPassedThroughHoop: boolean;
  /** Index into SHOOTING_SPOTS (or VS_AI_PLAYER_SPOTS in vs_ai mode) */
  shootingSpotIndex: number;
  /** null in solo mode */
  aiData: AIState | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const GAME_DURATION = 90;       // seconds
export const GRAVITY = 0.4;
export const BALL_BOUNCE_DAMPING = 0.6;
export const RIM_BOUNCE_DAMPING = 0.5;
export const MAX_POWER = 25;
export const POWER_MULTIPLIER = 0.22; // raised: ~80px drag reaches a far 3PT shot (was 0.15 → ~117px)

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const GROUND_Y = 420;
export const BALL_RADIUS = 15;

/** 3-point line at absolute x=370; shots from player at x < 370 → 3PT */
export const THREE_POINT_X = 370;

/** AI 3-point line (symmetric): shots from AI at x > 800-370=430 → 3PT */
export const AI_THREE_POINT_X = CANVAS_WIDTH - THREE_POINT_X; // 430

// ─── Shooting spots ───────────────────────────────────────────────────────────

/** Player spots for solo mode (single right hoop) */
export const SOLO_SPOTS: ShootingSpot[] = [
  { id: 'deep-3',   x: 140, y: GROUND_Y - BALL_RADIUS, label: '3PT' },
  { id: 'arc-3',    x: 280, y: GROUND_Y - BALL_RADIUS, label: '3PT' },
  { id: 'mid',      x: 440, y: GROUND_Y - BALL_RADIUS, label: '2PT' },
  { id: 'paint',    x: 565, y: GROUND_Y - BALL_RADIUS, label: '2PT' },
];

/** Player spots for vs_ai mode — shifted right to clear the left hoop */
export const VS_AI_PLAYER_SPOTS: ShootingSpot[] = [
  { id: 'deep-3',   x: 190, y: GROUND_Y - BALL_RADIUS, label: '3PT' },
  { id: 'arc-3',    x: 300, y: GROUND_Y - BALL_RADIUS, label: '3PT' },
  { id: 'mid',      x: 430, y: GROUND_Y - BALL_RADIUS, label: '2PT' },
  { id: 'paint',    x: 555, y: GROUND_Y - BALL_RADIUS, label: '2PT' },
];

// ─── Hoop definitions ─────────────────────────────────────────────────────────

export const RIGHT_HOOP: Hoop = {
  position: { x: 685, y: 180 },
  rimRadius: 30,
  backboardWidth: 10,
  backboardHeight: 100,
  backboardOffset: 35,  // backboard to the RIGHT
};

export const LEFT_HOOP: Hoop = {
  position: { x: 115, y: 180 },
  rimRadius: 30,
  backboardWidth: 10,
  backboardHeight: 100,
  backboardOffset: -35, // backboard to the LEFT
};

/** AI ball starting position */
export const AI_BALL_START: Vector2D = { x: 610, y: GROUND_Y - BALL_RADIUS };
