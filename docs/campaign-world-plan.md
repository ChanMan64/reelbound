# Reelbound Campaign Plan

The campaign contains eight worlds. Each world has five main voyages, two optional bonus nodes, one memorable local friend, a focused mechanical identity, and a legendary catch. Main levels should take roughly 6–10 minutes on a first successful run; bonus nodes can be shorter and more specialized.

The first main voyage introduces the world rule safely. Voyages two and three explore it in different contexts. Voyage four combines it with an older mechanic under pressure. Voyage five is a celebratory mastery course and legendary catch—not a traditional combat boss.

The complete names, summaries, friends, catches, colors, and prototype connections live in `src/campaign.js`, which drives the world map directly. This prevents the design document and playable campaign data from drifting apart.

## Map rules

- The player travels between islands by boat and traverses each island through connected level nodes.
- Main nodes unlock in order, but bonus nodes branch from exploration requirements such as pearl totals, secret catches, or character favors.
- A player can return to any cleared world without losing progress.
- The map must show the next destination clearly while still revealing future silhouettes and landmarks.
- Current demo environments serve as prototype anchors for Worlds 1–5. Worlds 6–8 remain visibly uncharted until their first playable levels exist.
- No map node should imply playable content when it is only planned.

## Progression philosophy

- New mechanics appear in a safe context before hazards or enemies demand them.
- Every world reuses earlier movement so Finn’s full kit remains valuable.
- Lures create alternate routes, secrets, and efficiencies; the default lure remains sufficient for main progression.
- Legendary catches function like Mario flags: reaching and reeling the fish completes the voyage.
- Bonus nodes reward curiosity, mastery, and affection for characters rather than blocking the main story.
