# Technical Overview

## Framework and Language

Mini Basket is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, and Canvas 2D rendering.

## Main Architecture

- `app/page.tsx` renders the page shell and mounts `BasketballGame`.
- `components/game/basketball-game.tsx` coordinates game state, canvas rendering, overlays, audio, and mode screens.
- `components/game/game-canvas.tsx` renders the court, hoops, balls, shooting spots, aiming guide, and visual effects to an HTML canvas.
- `components/game/game-ui.tsx` contains HUD, start screen, instructions, score bars, and game-over overlays.
- `hooks/use-game-state.ts` owns gameplay state, input handling, timer, shot resolution, AI shots, scoring, and high score persistence.
- `lib/game/types.ts` defines game data structures, constants, court dimensions, hoops, and shooting spots.
- `lib/game/physics.ts` contains gravity, position updates, bounce handling, shot velocity, and trajectory prediction.
- `lib/game/collision.ts` contains rim, backboard, hoop pass, and bounds checks.

## Important Folders and Files

| Path | Purpose |
| --- | --- |
| `app/` | Next.js routes, layout, metadata, and global app styles. |
| `components/game/` | Game-specific React components and canvas renderer. |
| `components/ui/` | Reusable UI primitives available to the app. |
| `hooks/` | Custom React hooks, including the gameplay state hook. |
| `lib/game/` | Game model, constants, physics, and collision logic. |
| `public/audio/` | Background music and shot/miss sound effects. |
| `public/` | Icons and placeholder image assets. |
| `next.config.mjs` | Next.js configuration. |
| `tsconfig.json` | TypeScript compiler configuration. |

## State Management Approach

The game uses local React state inside `useGameState`. Gameplay state is represented by a `GameData` object that includes mode, state, scores, timer, ball data, hoop data, drag state, shot statistics, and optional AI state.

Animation uses `requestAnimationFrame` while a game is playing. The countdown uses a one-second interval. High scores and music preferences are stored in browser `localStorage`.

## Asset Handling

Static assets are served from `public/`. Audio is loaded by path through browser `Audio` objects:

- `/audio/bulls-theme.mp3`
- `/audio/swoosh.mp3`
- `/audio/miss.mp3`

Browser autoplay restrictions are handled by attempting to unlock audio after the first pointer or keyboard interaction.

## Build and Deployment Notes

- Local development uses `npm run dev`.
- Production build uses `npm run build`.
- Production start uses `npm run start` after a successful build.
- TypeScript validation uses `npm run typecheck`.
- The project is compatible with common Next.js hosts such as Vercel.
- `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`; keep `npm run typecheck` in CI to avoid hiding type errors.
