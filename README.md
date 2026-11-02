# Popiół i Dzwon — browser Diablo-like (T01 / G03)

An original, offline-playable dark-fantasy action-RPG vertical slice. A ruined chapel, wandering ashen guardians, an awakening bell. Source: standalone HTML/CSS/JavaScript and deterministic procedural pixel art. **No third-party artwork, dependencies, network requests, or installed game engine required.**

## Run

From this directory:

```bash
python -m http.server 8765
```

Open `http://localhost:8765/` in current Chrome/Edge. `index.html` also works directly as a local file in browsers that permit sibling JS resources.

## Controls and goal

- WASD / arrow keys: move (collisions and world bounds)
- Mouse: aim; left mouse button or Space: sword (cone attack and recovery)
- Shift: dodge with brief invulnerability and cooldown
- E: drink a healing potion; some enemies drop more
- F: awaken the bell after collecting four sparks from defeated guardians
- R: restart immediately; on overlay use Enter or the button

Lose all HP to die and restart. Win by harvesting four sparks, reaching the bell in the north-east chapel and pressing F. The bottom HUD is authoritative (current HP/potions/sparks/cooldowns); enemy health bars appear after hits.

## Files

- `art.js`: original procedural 32px material-ground generator, depth-sorted props, characters with animation, ambient effects, consistent foot-anchor drawing (no sprites copied from Skills demos).
- `game.js`: actual browser runtime: player input, physics, collisions, AI state machine (patrol, chase, windup, lunge, recover, stagger), melee cone combat, rewards, potions, roll, death, victory, restart and read-only QA seam `window.AshenQA`.
- `index.html` / `style.css`: native HUD, pause/ending overlays, instructions and presentation.
- `tests/`: headless browser smoke and interaction tests.

## Techniques actually selected from Skills

- `game-project-router/SKILL.md`, `shared/GAME-CREATION-CONTRACT.md`: select browser game runtime; action → authoritative state → feedback → goal, independent of Godot.
- `shared/GENERATIVE-SKILL-CONTRACT.md`: derive original environment, enemies and props instead of copying example coordinates/assets.
- `rts-sprite-router/SKILL.md` and `retro-rts-sprites/SKILL.md`: constrained material ramp, silhouette-first readability, native pixel resolution, stable anchors, distinct shadow and foreground occlusion, 1× validation. **Reference principles only**: `spritekit.js` and `pixelcraft.py` were not run or copied.
- `modern-pixel-character-animation/SKILL.md`: stationary foot anchor and pose-dependent weapons inspired a custom draw routine. **Its generation API was not executed**; it explicitly lacks verified production walk/attack for web.

No G1a/VQ24/XYZ/Unity/Godot: those solve a different problem.

## Developer note

The ground is seeded (1701); props are local original geometry composed with a painterly palette, native Canvas 2D raster and sorted by foot Y. Missing browser adapter, engine loop, 2D player animation, melee, AI, damage model, loot, and UI were all implemented in this test folder rather than adding misleading shared-skill dependencies.

The 640×360 internally rendered scene scales with `image-rendering: pixelated`. Pixel detail is best assessed at 1×/2× native scale. Art still requires independent human visual approval before treating the T01/G03 experiment as an accepted release.
