# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

TORCHDEEP — a turn-based dungeon crawler. Descend seven floors of a dark dungeon with one torch to keep alive. Explore, fight monsters turn by turn, level up, find gold, potions and torch oil, and slay the Ember King on floor 7. Win by beating the boss; lose when your HP reaches zero.

## Run it

```sh
python3 -m http.server 8931 --directory game
```

Then open http://localhost:8931/index.html in desktop Chrome.

- **Controls:** arrows/WASD or tap a tile to move; click or press 1–4 in battle; P pause, R restart, M mute.
- **Design:** see `DESIGN.md`.
- **Tests:** `node tests/regression.mjs` simulates full playthroughs headlessly.

License: MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5rtys7wh&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
