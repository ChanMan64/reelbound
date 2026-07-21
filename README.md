# Reelbound

![Reelbound key art](assets/reelbound-key-art.png)

**Reelbound** is a five-stage pixel platformer about a fisherman chasing legendary catches across a dangerous coast. Sprint, air-dash, stomp hostile crabs, collect hidden pearls, and use your fishing line as a grappling hook to reach the catch at each stage's finish.

## Play

Open `index.html` through any local web server. For example:

```sh
python -m http.server 8080
```

Then visit `http://localhost:8080`.

| Action | Keyboard |
| --- | --- |
| Move | A/D or arrow keys |
| Jump / release line | Space or Z |
| Cast / retract | E or X |
| Air dash | Shift or C |
| Pause | Escape |

## The demo

1. **Harbor Run** — learn momentum, dashes, and short casts.
2. **Kelp Caverns** — climb a flooded cavern with tighter hook routes.
3. **Stormbreak Cliffs** — compensate for hard coastal wind.
4. **Icewater Reach** — master slippery platforms and long transfers.
5. **Moonlit Leviathan** — combine every skill to land the Starwhale.

Each stage tracks time, pearls, falls, score, and rank. Best times and unlocked catches are saved locally in the browser.

## Technology

Reelbound is built with dependency-free JavaScript and HTML5 Canvas. The game renders at a fixed 960×540 internal resolution for crisp pixel scaling. All gameplay art is rendered procedurally; the repository cover was generated specifically for this project with OpenAI image generation.

## Roadmap

- Gamepad and touch controls
- Original chiptune soundtrack
- Boss encounters and rod upgrades
- Level-select harbor hub
- GitHub Pages release

## License

Copyright © 2026. All rights reserved. Source is shared for portfolio and evaluation purposes.
