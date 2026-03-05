'use client';

// Main Basketball Game component

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/hooks/use-game-state';
import { GameMode } from '@/lib/game/types';
import { GameCanvas } from './game-canvas';
import {
  ScoreDisplay,
  TimerDisplay,
  VsAIScoreBar,
  StartScreen,
  GameOverScreen,
  GameInstructions,
} from './game-ui';

const MUSIC_KEY = 'basketball-time-music-enabled';

export function BasketballGame() {
  const {
    gameData,
    startGame,
    restartGame,
    goToMenu,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useGameState();
  const [musicEnabled, setMusicEnabled] = useState(true);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const swooshRef = useRef<HTMLAudioElement | null>(null);
  const missRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const prevScoreSumRef = useRef(0);
  const prevMissSumRef = useRef(0);

  const isVsAI = gameData.mode === 'vs_ai';
  const isPlaying = gameData.state === 'playing';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(MUSIC_KEY);
    if (saved !== null) setMusicEnabled(saved === '1');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MUSIC_KEY, musicEnabled ? '1' : '0');
  }, [musicEnabled]);

  const unlockSfx = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const tracks = [swooshRef.current, missRef.current].filter(Boolean) as HTMLAudioElement[];
    if (tracks.length === 0) return;

    audioUnlockedRef.current = true;
    tracks.forEach((a) => {
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        }).catch(() => {
          a.muted = false;
          audioUnlockedRef.current = false;
        });
      } else {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      }
    });
  }, []);

  useEffect(() => {
    const bgm = new Audio('/audio/bulls-theme.mp3');
    bgm.loop = true;
    bgm.volume = 0.35;
    bgm.preload = 'auto';
    bgmRef.current = bgm;

    const swoosh = new Audio('/audio/swoosh.mp3');
    swoosh.volume = 0.65;
    swoosh.preload = 'auto';
    swooshRef.current = swoosh;

    const miss = new Audio('/audio/miss.mp3');
    miss.volume = 0.55;
    miss.preload = 'auto';
    missRef.current = miss;

    const tryStartAudio = () => {
      unlockSfx();
      if (!musicEnabled || !bgmRef.current) return;
      void bgmRef.current.play().catch(() => undefined);
    };

    const tryResumeMusic = () => {
      if (!musicEnabled || !bgmRef.current) return;
      void bgmRef.current.play().catch(() => undefined);
    };

    const stopHandlers = () => {
      window.removeEventListener('pointerdown', tryStartAudio);
      window.removeEventListener('keydown', tryStartAudio);
      window.removeEventListener('focus', tryResumeMusic);
      document.removeEventListener('visibilitychange', tryResumeMusic);
    };

    const oneTimeStart = () => {
      tryStartAudio();
      stopHandlers();
    };

    window.addEventListener('pointerdown', oneTimeStart);
    window.addEventListener('keydown', oneTimeStart);
    window.addEventListener('focus', tryResumeMusic);
    document.addEventListener('visibilitychange', tryResumeMusic);

    return () => {
      stopHandlers();
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
      bgmRef.current = null;
      swooshRef.current = null;
      missRef.current = null;
    };
  }, [musicEnabled, unlockSfx]);

  useEffect(() => {
    if (!bgmRef.current) return;
    if (musicEnabled) {
      void bgmRef.current.play().catch(() => undefined);
    } else {
      bgmRef.current.pause();
    }
  }, [musicEnabled]);

  useEffect(() => {
    const currentScoreSum = gameData.score + gameData.aiScore;
    const currentMissSum = gameData.shotsMissed + gameData.aiShotsMissed;

    if (currentScoreSum > prevScoreSumRef.current && swooshRef.current) {
      unlockSfx();
      swooshRef.current.currentTime = 0;
      void swooshRef.current.play().catch(() => undefined);
    }
    if (currentMissSum > prevMissSumRef.current && missRef.current) {
      unlockSfx();
      missRef.current.currentTime = 0;
      void missRef.current.play().catch(() => undefined);
    }

    prevScoreSumRef.current = currentScoreSum;
    prevMissSumRef.current = currentMissSum;
  }, [gameData.score, gameData.aiScore, gameData.shotsMissed, gameData.aiShotsMissed, unlockSfx]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!bgmRef.current) return;
      if (document.hidden) {
        bgmRef.current.pause();
      } else if (musicEnabled) {
        void bgmRef.current.play().catch(() => undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [musicEnabled]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Game Canvas */}
      <GameCanvas
        gameData={gameData}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* In-game HUD */}
      {isPlaying && (
        <>
          {isVsAI ? (
            <VsAIScoreBar
              playerScore={gameData.score}
              aiScore={gameData.aiScore}
              timeRemaining={gameData.timeRemaining}
              playerShotsFired={gameData.shotsFired}
              playerShotsHit={gameData.shotsHit}
              aiShotsFired={gameData.aiShotsFired}
              aiShotsHit={gameData.aiShotsHit}
            />
          ) : (
            <>
              <ScoreDisplay
                score={gameData.score}
                highScore={gameData.highScore}
                shotsFired={gameData.shotsFired}
                shotsHit={gameData.shotsHit}
              />
              <TimerDisplay timeRemaining={gameData.timeRemaining} />
            </>
          )}
          <GameInstructions
            visible={!gameData.ball.isActive && !gameData.dragState.isDragging}
            mode={gameData.mode}
          />
        </>
      )}

      <button
        type="button"
        onClick={() => setMusicEnabled((v) => !v)}
        className="absolute right-4 bottom-4 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
        style={{
          background: 'rgba(10,14,30,0.78)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: musicEnabled ? '#4ade80' : 'rgba(148,163,184,0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 20,
        }}
      >
        {musicEnabled ? 'Music ON' : 'Music OFF'}
      </button>

      {/* Start Screen */}
      {gameData.state === 'start' && (
        <StartScreen
          onStart={(mode: GameMode) => startGame(mode)}
          highScore={gameData.highScore}
        />
      )}

      {/* Game Over Screen */}
      {gameData.state === 'gameOver' && (
        <GameOverScreen
          score={gameData.score}
          aiScore={gameData.aiScore}
          highScore={gameData.highScore}
          shotsFired={gameData.shotsFired}
          shotsHit={gameData.shotsHit}
          mode={gameData.mode}
          onRestart={restartGame}
          onMenu={goToMenu}
        />
      )}
    </div>
  );
}
