# TORCHDEEP

**Genre:** turn-based dungeon crawler / web RPG.

Descend seven floors of a dark dungeon with one torch to keep alive. Explore each floor, fight monsters turn by turn, level up, grab gold, potions and torch oil, and find the stairs down. Slay the Ember King on floor 7 to win; lose when your HP reaches zero.

## The twist: the torch

Every step burns 1 torch fuel. Oil flasks refill it by 40. A full torch lights 5 tiles around you; below 30 fuel you see only 3; when the flame dies you see 1 tile and monsters hit 50% harder. Light is a resource you manage alongside HP and MP — explore fast, grab oil, don't get caught in the dark.

## Floors

- 7 floors, each a 13×9 stone room with pillars, 3–5 roaming monsters, and potion / oil / gold loot.
- The stairs down stay sealed until every monster on the floor is defeated (the HUD shows how many remain).
- Descending restores 20 torch fuel. Monsters grow stronger every floor: slimes and rats, then bats and skeletons, spiders and golems, finally ember imps — and the Ember King (130 HP, crowned, with his own HP bar) waiting on floor 7.

## Turn-based combat

Bump into a monster to open the battle screen. Each turn you pick one action, then the monster answers:

- **1 Attack** — your sword, damage = attack + small variance − enemy defence.
- **2 Ember Strike** — 5 MP, double damage, a blaze of fire.
- **3 Potion** — heals 40% of max HP (uses one potion).
- **4 Defend** — halve the next hit.

Winning a fight pays XP and gold; monsters sometimes drop a potion. XP levels you up: +8 max HP, +5 max MP, +2 attack, +1 defence, and a full heal. Score = gold + 100 per level + 50 per floor cleared.

## Controls

- Move: arrow keys / WASD, or tap an adjacent tile (mouse/touch friendly).
- Battle: click an action button or press 1–4.
- Start / restart: click the button or press Enter / Space (restart also on R).
- P pauses, M mutes, Esc resumes.

## HUD

HP and MP bars, level and XP bar, torch bar, gold, potions, floor, and monsters remaining — plus a message line for pickups and hints.

## Look and sound

Dark stone, torch glow, and code-drawn monsters (each kind has its own shape and colour). All text is bold Arial/Helvetica with a dark outline so it reads at a glance. Sound is synthesized Web Audio: steps, sword swings, hits, potions, coins, level-up arpeggios, victory and defeat themes — lazy-initialized on the first gesture and failure-safe.

## Files

- `game/index.html` — page shell, 1280×720 canvas.
- `game/src/main.js` — browser wiring, frame loop, one-second timer.
- `game/src/game.js` — pure state machine (title / explore / battle / pause / win / lose).
- `game/src/dungeon.js` — floor generation, tiles, loot, stairs.
- `game/src/battle.js` — turn-based combat rules.
- `game/src/player.js` — stats, XP, levels, potions, score.
- `game/src/data.js` — monster tables, boss, loot, XP curve.
- `game/src/render.js` — all canvas drawing.
- `game/src/audio.js` — synthesized sound effects.
- `game/src/input.js` — keyboard + mouse/touch input.
