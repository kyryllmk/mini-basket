'use client';

// Game Canvas — handles all visual rendering

import { useRef, useEffect, useCallback } from 'react';
import {
  GameData,
  Vector2D,
  Ball,
  Hoop,
  Court,
  MAX_POWER,
  POWER_MULTIPLIER,
  SOLO_SPOTS,
  VS_AI_PLAYER_SPOTS,
  THREE_POINT_X,
  AI_THREE_POINT_X,
} from '@/lib/game/types';
import { calculateAssistedShotVelocity, predictTrajectory } from '@/lib/game/physics';

interface GameCanvasProps {
  gameData: GameData;
  onMouseDown: (position: Vector2D) => void;
  onMouseMove: (position: Vector2D) => void;
  onMouseUp: () => void;
}

export function GameCanvas({ gameData, onMouseDown, onMouseMove, onMouseUp }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Vector2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCourt(ctx, gameData);
    drawThreePointLines(ctx, gameData);
    drawShootingSpots(ctx, gameData);
    drawHoop(ctx, gameData.hoop, 'right', gameData.mode === 'vs_ai');
    if (gameData.mode === 'vs_ai') drawHoop(ctx, gameData.leftHoop, 'left', true);
    drawBall(ctx, gameData.ball, false);
    if (gameData.mode === 'vs_ai' && gameData.aiData) drawBall(ctx, gameData.aiData.ball, true);

    if (
      gameData.dragState.isDragging &&
      gameData.dragState.startPosition &&
      gameData.dragState.currentPosition
    ) {
      drawAimingGuide(ctx, gameData);
    }
  }, [gameData]);

  return (
    <canvas
      ref={canvasRef}
      width={gameData.court.width}
      height={gameData.court.height}
      className="rounded-2xl cursor-crosshair select-none"
      style={{
        background: '#060912',
        boxShadow:
          '0 0 60px rgba(99,102,241,0.15), 0 0 120px rgba(59,130,246,0.08), 0 25px 50px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      onMouseDown={(e) => onMouseDown(getMousePos(e))}
      onMouseMove={(e) => onMouseMove(getMousePos(e))}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}

// ─── Court ────────────────────────────────────────────────────────────────────

function drawCourt(ctx: CanvasRenderingContext2D, gameData: GameData) {
  const { court } = gameData;
  const { width, height, groundY } = court;
  const isVsAI = gameData.mode === 'vs_ai';

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#060912');
  sky.addColorStop(0.6, isVsAI ? '#0b1230' : '#0b1225');
  sky.addColorStop(1, '#0d1530');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  // Ambient glows
  paintRadialGlow(ctx, width * 0.55, groundY * 0.4, width * 0.42, 'rgba(55,20,100,0.28)', 0, width, groundY);
  paintRadialGlow(ctx, width * 0.87, groundY * 0.35, 160, 'rgba(249,115,22,0.12)', 0, width, groundY);
  if (isVsAI) {
    paintRadialGlow(ctx, width * 0.13, groundY * 0.35, 160, 'rgba(59,130,246,0.12)', 0, width, groundY);
  }

  // Floor
  const floor = ctx.createLinearGradient(0, groundY, 0, height);
  floor.addColorStop(0, '#0c1222');
  floor.addColorStop(1, '#080e1a');
  ctx.fillStyle = floor;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Floor sheen
  const sheen = ctx.createLinearGradient(0, groundY, 0, groundY + 30);
  sheen.addColorStop(0, 'rgba(60,100,220,0.18)');
  sheen.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, groundY, width, 30);

  // Baseline
  ctx.strokeStyle = 'rgba(80,120,220,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Floor planks
  ctx.strokeStyle = 'rgba(20,32,70,0.65)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Center divider in vs_ai
  if (isVsAI) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function paintRadialGlow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, color: string,
  x: number, w: number, h: number
) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, w, h);
}

// ─── Three-point lines ────────────────────────────────────────────────────────

function drawThreePointLines(ctx: CanvasRenderingContext2D, gameData: GameData) {
  const { court, mode } = gameData;

  // Player 3pt line
  drawDashedLine(ctx, THREE_POINT_X, court.groundY, 'rgba(129,140,248,0.85)', '3PT', 'right');

  // AI 3pt line (vs_ai only)
  if (mode === 'vs_ai') {
    drawDashedLine(ctx, AI_THREE_POINT_X, court.groundY, 'rgba(251,146,60,0.85)', '3PT', 'left');
  }
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  color: string,
  label: string,
  labelSide: 'left' | 'right'
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([9, 5]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.fillStyle = color;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(label, labelSide === 'right' ? x - 22 : x + 6, 16);
}

// ─── Shooting spot markers ────────────────────────────────────────────────────

function drawShootingSpots(ctx: CanvasRenderingContext2D, gameData: GameData) {
  if (gameData.state !== 'playing' || gameData.ball.isActive) return;

  const spots = gameData.mode === 'vs_ai' ? VS_AI_PLAYER_SPOTS : SOLO_SPOTS;
  const selectedIdx = gameData.shootingSpotIndex;

  spots.forEach((spot, i) => {
    const isSelected = i === selectedIdx;
    const isThree = spot.x < gameData.court.threePointX;

    const baseColor = isThree ? '#818cf8' : '#fb923c';
    const glowColor = isThree ? 'rgba(129,140,248,0.5)' : 'rgba(251,146,60,0.5)';

    ctx.save();

    // Outer glow ring for selected
    if (isSelected) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
    }

    // Circle marker
    ctx.beginPath();
    ctx.arc(spot.x, spot.y + spot.y * 0 + gameData.court.groundY - 2, 8, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? baseColor : `${baseColor}66`;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // Cross inside
    const crossY = gameData.court.groundY - 2;
    ctx.strokeStyle = isSelected ? baseColor : `${baseColor}66`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = isSelected ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(spot.x - 4, crossY);
    ctx.lineTo(spot.x + 4, crossY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(spot.x, crossY - 4);
    ctx.lineTo(spot.x, crossY + 4);
    ctx.stroke();

    ctx.restore();

    // Label above
    ctx.fillStyle = isSelected ? baseColor : `${baseColor}88`;
    ctx.font = `${isSelected ? 'bold ' : ''}9px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(spot.label, spot.x, gameData.court.groundY - 14);
    ctx.textAlign = 'left';
  });
}

// ─── Hoop ─────────────────────────────────────────────────────────────────────

function drawHoop(
  ctx: CanvasRenderingContext2D,
  hoop: Hoop,
  side: 'left' | 'right',
  isVsAI: boolean
) {
  ctx.save();

  const boardW = 12;
  const boardH = hoop.backboardHeight;
  const bbX = hoop.position.x + hoop.backboardOffset - boardW / 2;
  const bbY = hoop.position.y - hoop.backboardHeight / 2;
  const rimY = hoop.position.y + 4;
  const rimDir = side === 'right' ? -1 : 1;
  const boardEdgeTowardRim = side === 'right' ? bbX : bbX + boardW;

  // Distinct hoop palettes: player = warm, AI = cool.
  const glyph = side === 'left' ? 'rgba(167,139,250,0.95)' : 'rgba(251,191,36,0.95)';
  const boardGlyph = side === 'left'
    ? (isVsAI ? 'rgba(167,139,250,0.6)' : glyph)
    : (isVsAI ? 'rgba(251,191,36,0.6)' : glyph);
  ctx.fillStyle = boardGlyph;
  ctx.strokeStyle = glyph;

  // Backboard pillar
  ctx.fillRect(bbX, bbY, boardW, boardH);

  // Triangular brace between board and rim arm
  ctx.beginPath();
  ctx.moveTo(boardEdgeTowardRim, rimY - 18);
  ctx.lineTo(boardEdgeTowardRim + rimDir * 16, rimY - 8);
  ctx.lineTo(boardEdgeTowardRim + rimDir * 16, rimY + 18);
  ctx.lineTo(boardEdgeTowardRim, rimY + 28);
  ctx.closePath();
  ctx.fill();

  // Thick rim bar
  const rimInnerX = boardEdgeTowardRim + rimDir * 3;
  const rimOuterX = rimInnerX + rimDir * 62;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(rimInnerX, rimY);
  ctx.lineTo(rimOuterX, rimY);
  ctx.stroke();

  // Net frame (box + cross hatch, glyph style)
  const netNearX = rimInnerX + rimDir * 22;
  const netFarX = netNearX + rimDir * 34;
  const netLeft = Math.min(netNearX, netFarX);
  const netW = Math.abs(netFarX - netNearX);
  const netTop = rimY + 3;
  const netH = 28;

  ctx.lineWidth = 5;
  ctx.strokeRect(netLeft, netTop, netW, netH);

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(netLeft, netTop);
  ctx.lineTo(netLeft + netW, netTop + netH);
  ctx.moveTo(netLeft + netW, netTop);
  ctx.lineTo(netLeft, netTop + netH);
  ctx.moveTo(netLeft, netTop + netH * 0.5);
  ctx.lineTo(netLeft + netW, netTop + netH * 0.5);
  ctx.stroke();

  ctx.restore();
}

// ─── Basketball (realistic skin with rotation) ────────────────────────────────

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, isAI: boolean) {
  const { x, y } = ball.position;
  const r = ball.radius;

  ctx.save();

  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath();
  ctx.ellipse(x, ball.position.y + r + 2, r * 0.9, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Distinct ball palettes: player = orange, AI = blue/purple.
  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x + r * 0.2, y + r * 0.25, r * 1.15);
  if (isAI) {
    grad.addColorStop(0, '#c4b5fd');
    grad.addColorStop(0.45, '#6366f1');
    grad.addColorStop(1, '#312e81');
  } else {
    grad.addColorStop(0, '#ffb757');
    grad.addColorStop(0.45, '#ff6d1a');
    grad.addColorStop(1, '#b23808');
  }
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Pebble texture (dense micro dots)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = isAI ? 'rgba(32,28,78,0.24)' : 'rgba(86,32,7,0.22)';
  const step = Math.max(2.1, r / 7);
  for (let i = -r; i <= r; i += step) {
    for (let j = -r; j <= r; j += step) {
      const px = x + i + (((Math.round(j / step) % 2) === 0) ? step * 0.35 : -step * 0.35);
      const py = y + j + (((Math.round(i / step) % 2) === 0) ? -step * 0.2 : step * 0.2);
      if ((px - x) * (px - x) + (py - y) * (py - y) < (r - 0.8) * (r - 0.8)) {
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.45, step * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // Surface highlight
  const shine = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x - r * 0.3, y - r * 0.3, r * 0.65);
  shine.addColorStop(0, isAI ? 'rgba(224,231,255,0.35)' : 'rgba(255,230,180,0.35)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Seams: realistic panel layout for a small rendered ball.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ball.rotation);

  ctx.strokeStyle = isAI ? 'rgba(23,23,60,0.92)' : 'rgba(41,18,9,0.92)';
  ctx.lineWidth = Math.max(1.6, r * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();

  // Vertical seam
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();

  // Left side C-curve
  ctx.beginPath();
  ctx.moveTo(-r * 0.96, -r * 0.82);
  ctx.bezierCurveTo(-r * 0.62, -r * 0.48, -r * 0.62, r * 0.48, -r * 0.96, r * 0.82);
  ctx.stroke();

  // Right side C-curve
  ctx.beginPath();
  ctx.moveTo(r * 0.96, -r * 0.82);
  ctx.bezierCurveTo(r * 0.62, -r * 0.48, r * 0.62, r * 0.48, r * 0.96, r * 0.82);
  ctx.stroke();

  ctx.restore();

  // Ball edge
  ctx.strokeStyle = isAI ? 'rgba(49,46,129,0.9)' : 'rgba(92,34,6,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  if (isAI && !ball.isActive) {
    ctx.fillStyle = 'rgba(226,232,240,0.82)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI', x, y - r - 6);
    ctx.textAlign = 'left';
  }
}

function drawAimingGuide(ctx: CanvasRenderingContext2D, gameData: GameData) {
  const { dragState, ball } = gameData;
  if (!dragState.startPosition || !dragState.currentPosition) return;

  ctx.save();

  const velocity = calculateAssistedShotVelocity(
    dragState.startPosition,
    dragState.currentPosition,
    gameData.hoop.position.x,
    MAX_POWER,
    POWER_MULTIPLIER
  );

  // Slingshot rubber-band line: ball → drag point (subtle, 1px)
  // startPosition is always anchored at ball.position (set in handleMouseDown),
  // so this line is always visually rooted at the ball.
  ctx.strokeStyle = 'rgba(168,85,247,0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(dragState.startPosition.x, dragState.startPosition.y);
  ctx.lineTo(dragState.currentPosition.x, dragState.currentPosition.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trajectory preview — 60 steps as dots that shrink and fade in the last 40%
  const pts = predictTrajectory(ball.position, velocity, 60);
  ctx.fillStyle = 'rgba(96,165,250,1)';
  for (let i = 1; i < pts.length; i += 2) {
    const progress = i / pts.length;
    // Full opacity for first 60%, then fade to 0
    const alpha = progress < 0.6 ? 0.75 : (1 - progress) / 0.4 * 0.75;
    const size = Math.max(0.8, 2.8 - progress * 2.2);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Power meter — wider and repositioned for clarity
  const power = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  const pct = Math.min(power / MAX_POWER, 1);
  const mW = 80, mH = 8, mX = ball.position.x - mW / 2, mY = ball.position.y - ball.radius - 28, mR = 4;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, mX, mY, mW, mH, mR);
  ctx.fill();

  if (pct > 0) {
    const fillColor = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#f97316' : '#6366f1';
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = fillColor;
    roundRect(ctx, mX, mY, mW * pct, mH, mR);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, mX, mY, mW, mH, mR);
  ctx.stroke();

  ctx.restore();
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

