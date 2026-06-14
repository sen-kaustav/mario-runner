# Agent Notes

## Project type

Browser game with no build step. Plain HTML/ES modules plus Phaser 4 loaded from a CDN.

- Entry: `index.html` → `./src/main.js` (ES module)
- Styles: `styles.css` (canvas centering + reset)
- Scenes: `src/BootScene.js` (preload + generated textures), `src/GameScene.js` (gameplay)
- Asset: `assets/player_image_running_sprite.png` (345×635 spritesheet, 5 frames)

## Running locally

Open `index.html` through a static server, not `file://` (ES modules + CDN script will fail from disk).

```bash
# any of these work
python -m http.server 8000
npx serve .
```

Then open `http://localhost:8000`.

## Important implementation details

- **Portrait canvas.** Logical resolution is 450×800 with `Phaser.Scale.FIT`. Centering is handled by CSS (`display: grid; place-items: center`). Layout constants assume portrait.
- **Font.** `Fira Code` is loaded from Google Fonts and used everywhere (`styles.css` + Phaser text objects). Fall back to generic `monospace`.
- **Physics.** Arcade physics, gravity `y: 1600`. Ground collider is a static `tileSprite`.
- **Player sprite scale.** The raw sprite is large (345×635), so the sprite is scaled to `0.18` and the physics body is resized/offset to match the visible character.
- **Procedural textures.** Pipes, ball, and ground block are drawn to canvases in `BootScene`; only the player spritesheet is loaded from disk.
- **Audio requires interaction.** `AudioContext` is created on the first `pointerdown` because of browser autoplay policies.
- **High score persistence.** Uses `localStorage` key `mario_runner_highscore`.

## No tooling

There is no package manager, test runner, linter, formatter, CI, or build config. Just edit and reload in the browser.
