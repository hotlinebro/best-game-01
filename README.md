# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

BAMBOO RUN — run, hop and stomp through the bamboo garden. Guide Pip, a little green sprout, through three original side-scrolling gardens at dusk. Collect sun drops, grow with sun berries, stomp beetles, avoid spiky burrs, and discover bonus rooms inside bamboo tubes. Reach all three bamboo flags to win; lose when your three lives or the timer run out.

## Run it

```sh
python3 -m http.server 8931 --directory game
```

Then open http://localhost:8931/index.html in desktop Chrome.

- **Controls:** Left/Right or A/D move; Space/W/Up jump (hold for height); Down enters tubes; P pause, R restart, M mute. Enter/Space/click starts or continues. On-screen buttons support touch play.
- **Design:** see `DESIGN.md`.
- **Tests:** `node tests/regression.mjs` checks mechanics and seeded full level completions headlessly.

License: MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5rtys7wh&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
