# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/hotlinebro/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

MEOW RUN — A little cat. A big adventure. Guide Milo, an original orange tabby, through Alley Dash, Garden Prowl and Rooftop Night. Collect fish, power up with catnip, pounce on mice and avoid dogs and gaps. Break cardboard boxes while big, enter cat flaps for a Fish Feast, and reach each home food bowl. Three lives and 120 seconds per level; reach all three homes to win.

## Run it

```sh
python3 -m http.server 8931 --directory game
```

Then open http://localhost:8931/index.html in desktop Chrome.

- **Controls:** Left/Right or A/D move; Space/W/Up jump (hold for height); Down/S enters cat flaps; P pause, R restart, M mute. Enter/Space/click starts or continues. On-screen buttons support touch play, slide-across directions and newest-direction priority.
- **Design:** see `DESIGN.md`.
- **Tests:** `node tests/regression.mjs` runs 15 groups covering mechanics, three seeded full level completions and touch regressions.

License: MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5rtys7wh&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
