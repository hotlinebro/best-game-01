[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![make.fun · rank](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![make.fun · reward](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# MEOW RUN

**A little cat. A big adventure.** Pounce through the city with Milo the orange tabby.

An original, dependency-free canvas platformer for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). Cross Alley Dash, Garden Prowl, and Rooftop Night to find the food bowl at home. Three lives, 120 seconds per neighborhood, and plenty of fish along the way.

## Play

Serve `game/` with a static server, or use the repository's existing `node serve.ts`. Open the page in a modern browser. All game assets are drawn locally; sound is synthesized after interaction. No network assets or build step are needed.

Move with Left/Right or A/D; jump with Space, W, or Up. Hold jump for a longer leap. Press Down on a cat flap to visit Fish Feast, and Down on its flap to return. P pauses, R restarts the adventure, and M mutes. Enter, Space, or the menu button starts and continues. HTML touch buttons support multiple fingers and sliding between directions; the latest direction wins.

Fish award 10 points, mouse pounces 50, and catnip 25. Dogs cannot be stomped. Catnip provides one protective hit and lets Milo break cardboard from below. Each completed level awards the remaining displayed seconds times ten. Falling costs a life; death restarts the neighborhood and rolls back that attempt's fish and points to prevent farming. Running out of time ends the run.

## Verify and package

Run `node tests/regression.mjs` for logic, touch-event regressions, and three seeded complete-adventure autoplayer runs. Run `node --check` on source modules for syntax validation. `window.MEOWRUN` exposes the live state machine for browser inspection.

With Node 22.18 or newer, `MAKEFUN_OUTPUT_DIR=/tmp/meow-output node main.ts` copies the game and screenshots and writes the canonical dossier using the unchanged kit library. The default destination is `/output`. The parent must first capture 3–4 genuine browser screenshots in `screenshots/`, with the alphabetically first image as cover, each no larger than 256 KiB and 1280 pixels on its long side, and at least 480 pixels on its short side. Screenshots were intentionally not generated in the rebuild sandbox.

Original procedural illustration, game code, and synthesized audio. MIT licensed; see LICENSE.
