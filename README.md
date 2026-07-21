# Reelbound

![Reelbound key art](assets/reelbound-key-art.png)

**Reelbound** is a cheerful movement-first platformer about Finn Tidewell, a fisherman chasing five legendary catches. The demo uses traditional run-and-jump controls, a contextual fishing rod, and a permanent collection of magical lures.

## Play

Play at [chanman64.github.io/reelbound](https://chanman64.github.io/reelbound/).

| Action | Keyboard |
| --- | --- |
| Move | A/D or left/right |
| Variable jump / double jump | Space, Z, or up |
| Crouch / momentum slide | Ctrl |
| Dash / surge jump starter | Q or Shift |
| Rod attack / retrieve / grapple | E |
| Open tackle box | T or Tab |
| Pause | Escape |

Touch devices use two movement buttons plus Jump, Slide, Dash, Rod, and a smaller Tackle button. Slide-jumps, surge jumps, automatic hook targeting, and three-pearl dash refills keep the expressive movement practical on iPhone and iPad without requiring fighting-game inputs.

## Movement and Reel Flow

Finn's moves are designed to connect. A slide can become a fast skim jump, a dash can be jump-cancelled into a long surge jump, and releasing a grapple with speed preserves the swing. Pearls and enemy takedowns build Reel Flow, which gradually raises running speed and supports longer improvised routes. Finn carries one air dash; landing restores it, while collecting three pearls in the air restores it early.

Enemy contact removes one of three hearts and knocks Finn away. Water and major hazards return him to the last checkpoint. This keeps ordinary encounters playful while preserving stakes around level hazards.

## Demo voyages

1. **Tacklewick Harbor** - docks, boats, and the Ember Minnow.
2. **Glowkelp Grotto** - luminous currents and the Bubble Bobber.
3. **Stormbreak Cliffs** - coastal wind and the Iron Mackerel.
4. **Icewater Village** - slippery footing and the Anchor Grub.
5. **The Star-Sea** - floating islands and the Moon Jelly.

Every main route is completable with the default Old Reliable lure. Special lures are permanent inventory items that change the rod's appearance and behavior, reveal optional secrets, and offer alternate strategies. The tackle box defines eight lure slots for the full game.

## Art and audio

The demo uses an original animated Finn sprite atlas and five original pixel-art environment plates created for Reelbound. Music and responsive sound effects are synthesized in real time with the Web Audio API, so the project has no third-party audio dependencies.

## Technology

Dependency-free JavaScript and HTML5 Canvas at a 960x540 internal resolution, with responsive landscape controls and iPhone/iPad safe-area support.

## License

Copyright (c) 2026. All rights reserved. Source is shared for portfolio and evaluation purposes.
