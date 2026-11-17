# MEOW RUN
A little cat. A big adventure.

Milo is an original orange tabby on a three-level side-scrolling adventure: Alley Dash (back alley at dusk), Garden Prowl and Rooftop Night. Reach the cat flap home and food bowl in each level to win. Three lives, 120 seconds per level. Gaps and unprotected enemy contact cost a life and restart the level; zero lives or an expired timer ends the run.

## Feel and rules
The proven terrain layouts are unchanged: 48px tiles, responsive 1280×720 canvas, fixed 120Hz simulation, acceleration and braking, smooth camera, 100ms coyote time and jump buffering. Hold jump for a full leap, release for a shorter hop.

Fish award +10, pouncing on grey mice +50, catnip +25, and level completion awards remaining displayed seconds ×10. Brown dogs cannot be pounced on. Catnip grows Milo; one hit shrinks him with 1.6 seconds of protection. Big Milo breaks cardboard boxes from below. Growth waits under a low ceiling. Death resets level objects and timer, preserving score and fish.

Stand on a cardboard cat flap and press Down to enter Fish Feast. Down on its flap returns Milo to his saved position with size and fish retained. The timer continues in the bonus room.

## Controls and presentation
Arrows/A/D move; Space/W/Up jump; Down/S enters flaps; P pauses, R restarts, M mutes. Enter/Space/click starts or continues. Touch buttons offer left, right, down and jump. Keyboard opposing directions retain their original cancellation behavior.

Touch holds track pointer IDs and press order, with the most recent opposing direction winning. Buttons never request capture; implicit browser capture is released. Pointer-enter while pressed supports sliding; pointer-up, cancel, leave and lost capture release holds. Window up/cancel provides a safety net, with stray releases clearing all touch holds. Blur and hidden-page transitions clear input and pause. Jump/down remain edge-triggered.

Original Canvas art includes Milo's ears, whiskers, stripes and tail, mice, dogs, fish, catnip, cardboard, cat flaps and food bowls. Parallax dusk buildings, garden trees and night rooftops distinguish levels. Bold outlined Arial/Helvetica text accompanies the level/lives/fish/score/timer/progress/message HUD. The title sprite remains at x=270, y=420 away from text. Title, pause, level-complete, THE ALLEY FADES and victory screens have HTML action buttons.

Original synthesized Web Audio jump, pounce, fish, catnip, flap, win and lose effects initialize lazily and fail safely. All files are local; no external assets, fonts or network requests.

## Architecture and verification
The level loader, physics, player, enemies and Game state machine retain their existing structure. The browser exposes window.MEOWRUN. The input module exports createTouchState for Node use; regression tests also drive actual listener wiring with fake DOM targets.

Run node tests/regression.mjs: 12 original mechanic/autoplay groups plus three touch groups (newest direction, pointer-leave/slide, stray window release). main.ts keeps deterministic copying and dossier generation; the vendor kit and MIT license are unchanged.

Browser rendering, actual mobile slide gestures and 3–4 replacement screenshots must be verified by the parent. Obsolete BAMBOO RUN screenshots are removed. No commit or submission is performed here.
