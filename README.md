# floorgen
Seeded floor generation logic from my latest project (JS, no dependencies)

A dungeon floor generator I pulled out of my game (Eko-Echo). Plain JavaScript, no dependencies, just the logic.

The whole thing is obviously heavily inspired by how The Binding of Isaac builds its maps.

```js
const { generateFloor, floorToText } = require('./floorgen.js')
const floor = generateFloor(1, 12345) // floor number, seed
console.log(floorToText(floor))
```

Same seed + same floor number = same floor every time

## How it works

1. **Grow the map.** Start in the middle of a 9x9 grid and add rooms one at a time. A new room only gets added if it touches exactly one room that's already there. That's what keeps it branching instead of turning into a big blob.
2. **Pick the special rooms.** Rooms with only one door are dead ends, so those are the ideal candidates. Boss is the farthest dead end, item room is the closest, and shop is the next closest one that isn't attached to the same room as the portal.
3. **Retry if it's bad.** If the boss ends up too close to the start or there aren't enough dead ends, it tries again with a new seed derived from the original one. That way it's still the same result every time for a given seed.

The random numbers come from mulberry32. I didn't write that part, it's a well known snippet. If you've never heard of it check youtube.

## Outputs

`floor.grid` is a 9x9 array of room ids (-1 = empty). `floor.rooms[id]` has `x`, `y`, `dist` (doors distance away from start) and `type`, which is one of `start`, `combat`, `boss`, `portal` or `shop` (room types)

`index.html` is a demo that prints the map as text. Pick a seed and hit generate.

MIT license.
