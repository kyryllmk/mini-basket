# Game Design

## Game Concept

Mini Basket is an arcade basketball shooting challenge. The player scores as many points as possible before time expires, either alone or against an automated AI shooter.

## Controls

- Click a floor marker to move the player ball to that shooting spot.
- Drag from the ball to aim and set shot power.
- Release the drag to shoot.
- Use the music toggle to enable or disable background music.

## Rules

- Each round lasts 90 seconds.
- A shot is counted when the player releases a valid drag.
- The ball must pass downward through the hoop to score.
- Misses are counted when an active ball stops or leaves the court without scoring.
- In Solo mode, the player shoots at the right hoop.
- In 1v1 AI mode, the player shoots at the right hoop and AI shoots at the left hoop.
- If 1v1 AI mode ends in a tie and overtime has not been used, the game adds a 30-second overtime.

## Scoring and Win Conditions

- Shots from behind the player 3-point line are worth 3 points.
- Other made shots are worth 2 points.
- Solo mode goal: maximize final score and beat the saved high score.
- 1v1 AI goal: finish with a higher score than the AI.

## Player Feedback

- The HUD shows score, timer, field goals made/attempted, field goal percentage, and high score.
- The 1v1 AI HUD shows both scores and both shooting percentages.
- A dotted trajectory preview appears while aiming.
- A power meter appears above the ball while aiming.
- Made shots and missed shots trigger audio cues.
- The timer changes visual emphasis near the end of the round.
- Game-over screens summarize result, score, accuracy, and rank/message.

## UI/UX Notes

- The visual style is a dark, neon sport-tech court with glass HUD overlays.
- The first screen is the playable mode menu, not a marketing landing page.
- The canvas is fixed at 800 by 500 internal game units and scales through layout.
- Current interaction handlers are mouse-based; touch support should be verified before claiming mobile support.

## Difficulty and Balance Notes

- Player shot assistance adjusts horizontal and vertical velocity based on distance to the hoop.
- Four shooting spots provide a mix of 2-point and 3-point choices.
- AI accuracy is intentionally imperfect and includes random miss variance.
- Overtime only occurs once in tied 1v1 AI games.
