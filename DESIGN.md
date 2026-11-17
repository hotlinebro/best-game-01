# BAMBOO RUN

Run, hop and stomp through the bamboo garden. Pip is a little green sprout on an original three-garden platforming adventure: Firefly Footpath, Amber Canopy, and Moonrise Grove. Reach each bamboo flag; finish garden three to win. Three lives, 120 seconds per garden. Pits and unprotected enemy contact cost a life and restart the current garden; zero lives or a depleted timer ends the run.

## Feel and rules

48px tiles on a responsive 1280×720 canvas. Fixed 120Hz simulation, acceleration and braking, smooth camera, 100ms coyote time and jump buffering. Holding jump gives a full leap; releasing cuts upward velocity. Later gardens introduce wider gaps and more hazards, with safe landing areas.

Sun drops award 10 points, beetle stomps 50, and sun berries 25. Completing a garden awards remaining displayed seconds ×10. Berries grow Pip: one hit shrinks him, followed by 1.6 seconds of protection. Big Pip breaks bamboo blocks with his head. Beetles patrol and can be stomped from above; spiky burrs cannot. Death resets the current garden's objects and timer while preserving accumulated score and sun drops.

Stand on a bamboo tube and press Down to visit the Sun Drop Sanctuary. Its tube returns Pip to the same garden and position, retaining size and collectibles. The level timer continues in the sanctuary. Growth under a low ceiling waits until there is room.

## Controls and presentation

Left/Right or A/D move; Space, W or Up jump; Down enters tubes; P pauses; R restarts the whole run; M toggles sound. Enter, Space or click starts, continues, or restarts from an intermission screen. HTML pointer controls support simultaneous movement and jumping, plus tube, pause and sound buttons. Blur pauses the game and clears held inputs.

The HUD shows garden, lives, sun drops, score, timer, progress and contextual guidance. Title, pause, garden-complete, defeat (THE GARDEN FADES), and victory screens have an accessible HTML action button. Bold outlined Arial/Helvetica text, dusk gradients, parallax hills, bamboo silhouettes, fireflies, and all characters are drawn locally with Canvas. Original synthesized Web Audio effects initialize on interaction and fail safely. No external assets, requests, fonts or music.

## Architecture and verification

- `levels.js`: data-driven string tile maps and object loading.
- `physics.js`: collision and movement primitives.
- `player.js`: movement feel, growth and shrinking.
- `enemies.js`: beetle patrol and stomp classification.
- `game.js`: pure state machine, exposed as `window.BAMBOORUN`.
- `render.js`, `audio.js`, `input.js`, `main.js`: canvas art, sound, controls and browser loop.
- `tests/regression.mjs`: mechanics regressions and three seeded input-only full level completions.

Run `node tests/regression.mjs` for headless verification. `main.ts` retains the supplied deterministic copy-and-dossier behavior and unchanged vendor kit. Browser rendering, mobile interaction and real screenshots are validated by the parent outside this sandbox. Old TORCHDEEP screenshots are removed; replacement screenshots must be captured before submission. MIT license retained.
