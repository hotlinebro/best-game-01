# MEOW RUN — design notes

Milo is an original orange tabby with a berry collar, cream muzzle, striped coat, and a very important dinner appointment. The city moves from warm dusk alleys through a leafy garden to moonlit rooftops. Soft silhouettes, glowing windows, hanging lamps, caramel cardboard, and fish-shaped rewards make a welcoming miniature world.

The 1280×720 canvas uses 48-pixel tiles. The title card reserves a separate right-hand illustration column for Milo; all explanatory text stays in the left column. Bold Arial with dark outlines, a persistent progress bar, generous touch targets, and responsive scaling keep the game legible. The HUD shows level, lives, fish, score, and time. Every menu includes an HTML action button and keyboard continuation.

## Loop and mechanics

Three data-driven layouts span 100, 120, and 140 tiles. Each has distinct pits, cardboard shelves, four to six mice, two or three dogs, a bonus flap, catnip, and a home bowl. Gaps grow from two to five tiles with safe approach and landing space. Movement is 340 pixels per second, gravity 1850 pixels per second squared, and the initial jump impulse is 790 pixels per second. Holding jump clears the widest gaps; releasing early cuts upward velocity. A tenth-second coyote window and jump buffer soften near misses.

Mice can be pounced on from above; dogs always hurt. Catnip grants a protective hit and allows breaking cardboard from below. Bonus-room state persists during each attempt so fish cannot be repeatedly farmed. Returning preserves the exact world position and foot height. The timer continues in Fish Feast but freezes while paused. Death spends one life and resets the current level, including its score checkpoint; timeout ends the run. Completion grants a time bonus once; the third home wins the adventure.

## Structure

- `levels.js`: layout descriptions, tile maps, entities, bonus room.
- `physics.js`: bounding boxes, clamping, axis-separated solid collision.
- `player.js`: movement, jumping, growth, shrinking, cardboard.
- `enemies.js`: patrols and contact classification.
- `state.js`: scoring, lives, timer, flap travel, level and menu states.
- `input.js`: independent input sources, press ordering, keyboard and pointer bindings.
- `render.js`: original canvas illustration, parallax, HUD, menus.
- `audio.js`: lazy and failure-safe synthesized effects.
- `main.js`: DOM controls, fixed-step simulation, debug exposure.

Touch never captures pointers. Button release handles pointerup, pointercancel, pointerleave, and lostpointercapture. Window pointerup/cancel clears all touch holds as a safety net while preserving keyboard holds. Pointerenter with buttons down presses the new direction. Opposing directions resolve by most recent press, and jump/down are rising edges. Blur and document hiding clear input and pause.

## Verification boundary

Node regression tests exercise real logic and event bindings, including complete seeded runs without teleportation or invulnerability. Browser rendering, audio output, device touch behavior, and genuine screenshots require the parent's browser dry run. Packaging requires those screenshots; the build intentionally rejects an empty screenshot set through the kit library. No screenshots, commits, network access, or submission are part of this rebuild.
