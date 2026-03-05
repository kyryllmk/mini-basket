'use client';

// Game UI components — overlays, score, timer, screens

import React from 'react';
import { GameMode } from '@/lib/game/types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(10,14,30,0.72)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
} as React.CSSProperties;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(148,163,184,0.75)' }}>
      {children}
    </div>
  );
}

function BigNum({ children, glow = 'blue' }: { children: React.ReactNode; glow?: 'blue' | 'orange' | 'red' }) {
  const shadows = {
    blue: '0 0 14px rgba(96,165,250,0.55), 0 0 28px rgba(59,130,246,0.3)',
    orange: '0 0 14px rgba(251,146,60,0.7), 0 0 28px rgba(249,115,22,0.4)',
    red: '0 0 14px rgba(239,68,68,0.7), 0 0 28px rgba(220,38,38,0.4)',
  };
  return (
    <div
      className="text-3xl font-bold tabular-nums leading-none"
      style={{ color: '#f8fafc', textShadow: shadows[glow] }}
    >
      {children}
    </div>
  );
}

// ─── ScoreDisplay ─────────────────────────────────────────────────────────────

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  shotsFired: number;
  shotsHit: number;
}

export function ScoreDisplay({ score, highScore, shotsFired, shotsHit }: ScoreDisplayProps) {
  const pct = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
  const isNewHS = score > 0 && score >= highScore;

  return (
    <div className="absolute top-4 left-4 rounded-xl px-4 py-2.5 min-w-[110px]" style={glass}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <Label>Score</Label>
        {isNewHS && (
          <span
            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.35)' }}
          >
            NEW&nbsp;HI
          </span>
        )}
      </div>
      <BigNum>{score}</BigNum>

      {/* Shooting % row */}
      <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.55)' }}>FG%</div>
          <div
            className="text-sm font-bold tabular-nums"
            style={{ color: pct >= 50 ? '#4ade80' : pct >= 30 ? '#fb923c' : '#f87171' }}
          >
            {pct}%
          </div>
        </div>
        <div>
          <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.55)' }}>FG</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: 'rgba(203,213,225,0.8)' }}>
            {shotsHit}/{shotsFired}
          </div>
        </div>
        <div>
          <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.55)' }}>BEST</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: 'rgba(251,146,60,0.9)' }}>
            {highScore}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TimerDisplay ─────────────────────────────────────────────────────────────

interface TimerDisplayProps {
  timeRemaining: number;
}

export function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining <= 20;

  return (
    <div
      className="absolute top-4 right-4 rounded-xl px-4 py-2.5"
      style={{
        ...glass,
        background: isLow ? 'rgba(30,8,8,0.78)' : glass.background,
        border: isLow ? '1px solid rgba(239,68,68,0.35)' : glass.border,
        boxShadow: isLow
          ? '0 4px 24px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
          : glass.boxShadow,
      }}
    >
      <Label>{isLow ? '⚠ Time' : 'Time'}</Label>
      <div className={isLow ? 'animate-pulse' : ''}>
        <BigNum glow={isLow ? 'red' : 'blue'}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </BigNum>
      </div>
    </div>
  );
}

// ─── VsAI Score Bar ───────────────────────────────────────────────────────────

interface VsAIScoreBarProps {
  playerScore: number;
  aiScore: number;
  timeRemaining: number;
  playerShotsFired: number;
  playerShotsHit: number;
  aiShotsFired: number;
  aiShotsHit: number;
}

export function VsAIScoreBar({
  playerScore,
  aiScore,
  timeRemaining,
  playerShotsFired,
  playerShotsHit,
  aiShotsFired,
  aiShotsHit,
}: VsAIScoreBarProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining <= 20;
  const diff = playerScore - aiScore;
  const playerPct = playerShotsFired > 0 ? Math.round((playerShotsHit / playerShotsFired) * 100) : 0;
  const aiPct = aiShotsFired > 0 ? Math.round((aiShotsHit / aiShotsFired) * 100) : 0;

  return (
    <div
      className="absolute top-6 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-2"
      style={{
        ...glass,
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Player */}
      <div className="text-center">
        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(96,165,250,0.7)' }}>YOU</div>
        <div
          className="text-2xl font-black tabular-nums"
          style={{
            color: diff > 0 ? '#60a5fa' : '#f8fafc',
            textShadow: diff > 0 ? '0 0 14px rgba(96,165,250,0.6)' : 'none',
          }}
        >
          {playerScore}
        </div>
        <div className="text-[10px] font-semibold tabular-nums mt-0.5" style={{ color: 'rgba(191,219,254,0.9)' }}>
          FG {playerShotsHit}/{playerShotsFired} ({playerPct}%)
        </div>
      </div>

      {/* Timer center */}
      <div className="text-center px-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>VS</div>
        <div
          className={`text-lg font-bold tabular-nums ${isLow ? 'animate-pulse' : ''}`}
          style={{ color: isLow ? '#fca5a5' : 'rgba(203,213,225,0.9)' }}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* AI */}
      <div className="text-center">
        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>AI</div>
        <div
          className="text-2xl font-black tabular-nums"
          style={{
            color: diff < 0 ? '#a78bfa' : '#f8fafc',
            textShadow: diff < 0 ? '0 0 14px rgba(167,139,250,0.6)' : 'none',
          }}
        >
          {aiScore}
        </div>
        <div className="text-[10px] font-semibold tabular-nums mt-0.5" style={{ color: 'rgba(216,180,254,0.9)' }}>
          FG {aiShotsHit}/{aiShotsFired} ({aiPct}%)
        </div>
      </div>
    </div>
  );
}

// ─── GameInstructions ─────────────────────────────────────────────────────────

interface GameInstructionsProps {
  visible: boolean;
  mode: GameMode;
}

export function GameInstructions({ visible, mode }: GameInstructionsProps) {
  if (!visible) return null;
  const hint =
    mode === 'vs_ai'
      ? 'Click a spot to move · drag ball to aim · release to shoot'
      : 'Click a spot to move · drag ball to aim · release to shoot';

  return (
    <div
      className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full px-5 py-2"
      style={{ ...glass, whiteSpace: 'nowrap' }}
    >
      <p className="text-xs font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.7)' }}>
        {hint}
      </p>
    </div>
  );
}

// ─── StartScreen ──────────────────────────────────────────────────────────────

interface StartScreenProps {
  onStart: (mode: GameMode) => void;
  highScore: number;
}

export function StartScreen({ onStart, highScore }: StartScreenProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.7) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.7) 0%, transparent 70%)' }} />
      </div>

      <div className="relative text-center px-8 py-10 max-w-sm w-full mx-4">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] mb-5"
          style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(196,181,253,0.9)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
          Sportech Edition
        </div>

        {/* Title */}
        <h1
          className="text-5xl font-bold tracking-tight mb-1 leading-none"
          style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #93c5fd 50%, #f97316 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.45))',
          }}
        >
          Basketball
        </h1>
        <h2
          className="text-5xl font-bold tracking-tight mb-5 leading-none"
          style={{
            background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >
          Time
        </h2>

        {highScore > 0 && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm mb-5"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: 'rgba(251,146,60,0.9)' }}
          >
            <span style={{ fontSize: '11px', opacity: 0.7 }}>🏆 BEST</span>
            <span className="font-black">{highScore}</span>
          </div>
        )}

        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(148,163,184,0.85)' }}>
          Score as many points as you can in 90 seconds.
          <br />
          Click a spot marker, aim, shoot!
        </p>

        {/* Instruction rows */}
        <div className="space-y-2 mb-7">
          <Instruction dot="rgba(96,165,250,0.9)" glow="rgba(59,130,246,0.5)" text="Click a floor marker to pick your spot" />
          <Instruction dot="rgba(167,139,250,0.9)" glow="rgba(124,58,237,0.5)" text="Drag the ball to aim + set power" />
          <Instruction dot="rgba(249,115,22,0.9)"  glow="rgba(249,115,22,0.5)"  text="Behind the arc = 3 points!" />
        </div>

        {/* Mode buttons */}
        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            label="Solo"
            sub="Practice mode"
            gradient="linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)"
            glow="rgba(124,58,237,0.4)"
            onClick={() => onStart('solo')}
          />
          <ModeButton
            label="1v1 AI"
            sub="Beat the machine"
            gradient="linear-gradient(135deg, #f97316 0%, #dc2626 100%)"
            glow="rgba(249,115,22,0.4)"
            onClick={() => onStart('vs_ai')}
          />
        </div>
      </div>
    </div>
  );
}

// ─── GameOverScreen ───────────────────────────────────────────────────────────

interface GameOverScreenProps {
  score: number;
  aiScore: number;
  highScore: number;
  shotsFired: number;
  shotsHit: number;
  mode: GameMode;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score, aiScore, highScore, shotsFired, shotsHit, mode, onRestart, onMenu,
}: GameOverScreenProps) {
  const pct = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
  const isNewHS = score > 0 && score >= highScore;
  const vsResult = score > aiScore ? 'WIN' : score < aiScore ? 'LOSS' : 'TIE';

  const getRating = () => {
    if (score >= 40) return { label: 'S', color: '#f97316' };
    if (score >= 25) return { label: 'A', color: '#a78bfa' };
    if (score >= 12) return { label: 'B', color: '#60a5fa' };
    return { label: 'C', color: 'rgba(148,163,184,0.8)' };
  };
  const rating = getRating();

  const getMessage = () => {
    if (mode === 'vs_ai') {
      if (vsResult === 'WIN') return 'You outplayed the machine.';
      if (vsResult === 'TIE') return 'Dead even. Rematch?';
      return 'The AI wins this time.';
    }
    if (score >= 40) return 'Legendary shooting session.';
    if (score >= 25) return 'Elite-tier performance.';
    if (score >= 12) return 'Solid game. Keep grinding.';
    return 'Good effort. Next time.';
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(6,9,18,0.93)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[10%] w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.7) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.7) 0%, transparent 70%)' }} />
      </div>

      <div className="relative text-center px-8 py-8 max-w-sm w-full mx-4">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] mb-2" style={{ color: 'rgba(148,163,184,0.55)' }}>
          {mode === 'vs_ai' ? 'Match Complete' : 'Time\'s Up'}
        </div>

        {/* 1v1 result banner */}
        {mode === 'vs_ai' && (
          <div
            className="text-5xl font-black mb-1"
            style={{
              background:
                vsResult === 'WIN'
                  ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                  : vsResult === 'TIE'
                  ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                  : 'linear-gradient(135deg, #f97316, #ef4444)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            {vsResult}
          </div>
        )}

        <h2
          className="text-3xl font-bold mb-1"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, rgba(196,181,253,0.9) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >
          Game Over
        </h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(148,163,184,0.75)' }}>{getMessage()}</p>

        {/* Score card */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: 'rgba(13,18,40,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {mode === 'vs_ai' ? (
            <div className="flex items-center justify-around">
              {/* Player */}
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: 'rgba(96,165,250,0.7)' }}>YOU</div>
                <div className="text-4xl font-black tabular-nums" style={{ color: '#60a5fa', textShadow: '0 0 20px rgba(96,165,250,0.5)' }}>{score}</div>
              </div>
              <div className="text-2xl font-black" style={{ color: 'rgba(148,163,184,0.3)' }}>—</div>
              {/* AI */}
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: 'rgba(167,139,250,0.7)' }}>AI</div>
                <div className="text-4xl font-black tabular-nums" style={{ color: '#a78bfa', textShadow: '0 0 20px rgba(167,139,250,0.5)' }}>{aiScore}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-1">
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: 'rgba(148,163,184,0.65)' }}>
                  Final Score {isNewHS && <span style={{ color: '#fb923c' }}>· NEW BEST</span>}
                </div>
                <div className="text-5xl font-bold tabular-nums" style={{ color: '#f8fafc', textShadow: '0 0 20px rgba(96,165,250,0.6)' }}>
                  {score}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                style={{
                  color: rating.color, background: `${rating.color}1a`,
                  border: `1px solid ${rating.color}55`, boxShadow: `0 0 12px ${rating.color}44`,
                }}
              >
                {rating.label}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Stat label="FG%" value={`${pct}%`} color={pct >= 50 ? '#4ade80' : pct >= 30 ? '#fb923c' : '#f87171'} />
            <Stat label="FG" value={`${shotsHit}/${shotsFired}`} color="rgba(203,213,225,0.8)" />
            {mode === 'solo' && <Stat label="Best" value={String(highScore)} color="rgba(251,146,60,0.9)" />}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRestart}
            className="py-3 rounded-xl font-bold text-sm text-white tracking-wide"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 0 25px rgba(249,115,22,0.4)' }}
          >
            Play Again
          </button>
          <button
            onClick={onMenu}
            className="py-3 rounded-xl font-bold text-sm tracking-wide"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(203,213,225,0.8)',
            }}
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function Instruction({ dot, glow, text }: { dot: string; glow: string; text: string }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${glow}` }} />
      <span className="text-sm text-left" style={{ color: 'rgba(203,213,225,0.85)' }}>{text}</span>
    </div>
  );
}

function ModeButton({
  label, sub, gradient, glow, onClick,
}: {
  label: string; sub: string; gradient: string; glow: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="py-3 px-4 rounded-xl text-white transition-all duration-200 text-left"
      style={{ background: gradient, boxShadow: `0 0 28px ${glow}, 0 4px 16px rgba(0,0,0,0.5)` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
    >
      <div className="font-black text-base leading-none">{label}</div>
      <div className="text-[10px] mt-0.5 opacity-70">{sub}</div>
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.55)' }}>{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
