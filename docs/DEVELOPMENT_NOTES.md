# Development Notes

## Local Development Workflow

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Edit game code in `components/game`, `hooks/use-game-state.ts`, and `lib/game`.
4. Run `npm run typecheck` before committing.
5. Run `npm run build` before publishing.

## Important Implementation Notes

- The game uses a fixed internal canvas size of 800 by 500.
- Ball motion is simulated manually with gravity, bounce damping, rim collision, and backboard collision.
- Player input is currently handled through React mouse events on the canvas.
- Drag velocity is assisted so shots remain playable from different spot distances.
- AI shot velocity is calculated from projectile equations with randomized inaccuracy.
- Solo high score is stored under `basketball-time-hs` in `localStorage`.
- Music preference is stored under `basketball-time-music-enabled` in `localStorage`.
- Audio files must remain at the paths documented in `public/audio/README.txt`.

## Technical Debt

- ESLint is not configured even though the previous package script referenced it.
- Several source comments contain encoding artifacts from an earlier edit/export.
- `next.config.mjs` ignores TypeScript build errors; CI should run type checking separately.
- Touch input and small-screen gameplay need a dedicated verification pass.
- Asset source/license information needs confirmation before public release.

## Future Improvement Ideas

- Add pointer event support to cover mouse, touch, and pen input with one handler path.
- Add a screenshot and short gameplay GIF to the README.
- Add a lightweight smoke test for rendering the home page.
- Add an ESLint configuration compatible with the current Next.js version.
- Add a settings panel for audio volume and round length.
