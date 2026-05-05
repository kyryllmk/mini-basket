# Product Requirements Document

## Product Overview

Mini Basket is a compact browser basketball shooting game for portfolio presentation. Players choose a mode, aim shots with drag input, score within a timed round, and review their result at the end of play.

## Target Audience

- Portfolio reviewers evaluating frontend, game, and TypeScript implementation skills.
- Casual desktop browser players looking for a quick arcade-style sports game.
- Developers reviewing a small canvas game architecture.

## Core Gameplay Loop

1. Player starts from the menu and selects Solo or 1v1 AI mode.
2. Player clicks a shooting spot marker to choose a position.
3. Player drags from the ball to set aim and power.
4. Player releases to shoot.
5. The game simulates ball physics, collision, scoring, misses, and ball reset.
6. The round ends when the timer expires, with overtime in tied 1v1 AI games.
7. Player reviews final score, accuracy, result, and can restart or return to menu.

## Main Features

- Solo timed score attack.
- 1v1 AI competition with mirrored hoop and AI shot attempts.
- 2-point and 3-point shot zones.
- Shooting spot selection.
- Drag aiming with trajectory preview and power meter.
- Score, timer, field goal percentage, best score, and game-over summaries.
- Background music toggle and sound effects.
- Browser-local high score storage.

## Non-Goals

- Online multiplayer.
- User accounts or cloud save.
- Real-money competition or betting.
- Full basketball simulation with movement, defense, fouls, or teams.
- Mobile-native app packaging.
- Large-scale level editor or content management.

## Success Criteria

- Game can be started, played, restarted, and completed without runtime crashes.
- Solo and 1v1 AI modes behave consistently with the visible UI rules.
- Scores, shot statistics, timer, and high score display update correctly.
- Production build completes successfully.
- Documentation clearly explains setup, architecture, assets, and release tasks.

## Release Requirements

- `npm install` completes from `package-lock.json`.
- `npm run typecheck` passes.
- `npm run build` passes.
- README includes screenshots and demo link before public portfolio release.
- Asset sources and licenses are confirmed.
- GitHub repository metadata, topics, and description are filled in.
