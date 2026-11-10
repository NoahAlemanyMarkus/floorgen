// This is logic only, no dependencies!!
// generateFloor(floorNumber, seed) -> { grid, rooms }
// Same seed + same floor number = same floor.

const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]]
const GRID = 9 
const MIN_BOSS_DIST = 3 // minimum distance (in doors) from the start room to the boss room

//(mulberry32): returns floats in [0, 1)
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// A new room is only added if it touches exactly ONE existing room,
function growRooms(rand, target) {
  const mid = Math.floor(GRID / 2)
  const grid = Array.from({ length: GRID }, () => Array(GRID).fill(-1))
  const rooms = [{ x: mid, y: mid, parent: -1, dist: 0, doors: 0, type: 'combat' }]
  grid[mid][mid] = 0

  for (let tries = 0; rooms.length < target && tries < 600; tries++) {
    const pick = rand() < 0.6
      ? rooms.length - 1 - Math.floor(rand() * Math.min(3, rooms.length))
      : Math.floor(rand() * rooms.length)
    const from = rooms[pick]
    const [dx, dy] = DIRS[Math.floor(rand() * 4)]
    const x = from.x + dx
    const y = from.y + dy
    if (x < 0 || y < 0 || x >= GRID || y >= GRID || grid[y][x] !== -1) continue

    let touching = 0
    for (const [ox, oy] of DIRS) {
      if (grid[y + oy]?.[x + ox] > -1) touching++
    }
    if (touching !== 1) continue

    grid[y][x] = rooms.length
    rooms.push({ x, y, parent: pick, dist: from.dist + 1, doors: 1, type: 'combat' })
    from.doors++
  }
  return rooms.length === target ? { rooms, grid } : null
}

// assign special roles to rooms: start, boss, portal, shop (dead ends, if you need) **clearly inspired by TBOI map logic**
function assignRoles(rooms, rand) {
  const ends = []
  for (let i = 1; i < rooms.length; i++) if (rooms[i].doors === 1) ends.push(i)
  if (ends.length < 3) return false

  const tie = {}
  for (const i of ends) tie[i] = rand() // seeded tie-breaker

  const far = [...ends].sort((a, b) => rooms[b].dist - rooms[a].dist || tie[a] - tie[b])
  const boss = far[0]
  if (rooms[boss].dist < MIN_BOSS_DIST) return false

  const near = ends.filter(i => i !== boss).sort((a, b) => rooms[a].dist - rooms[b].dist || tie[a] - tie[b])
  const portal = near[0]
  const shop = near.slice(1).find(i => rooms[i].parent !== rooms[portal].parent) ?? near[1]

  rooms[0].type = 'start'
  rooms[boss].type = 'boss'
  rooms[portal].type = 'portal'
  rooms[shop].type = 'shop'
  return true
}

//retry and force layout to work
function generateFloor(floorNumber, seed) {
  const target = Math.min(12, 6 + floorNumber * 2)
  for (let attempt = 0; attempt < 100; attempt++) {
    const rand = mulberry32(seed + attempt * 7919)
    const result = growRooms(rand, target)
    if (result && assignRoles(result.rooms, rand)) return result
  }
  throw new Error('Could not generate a floor for seed ' + seed)
}

// debug view!
function floorToText(floor) {
  const letter = { start: 'S', combat: 'o', boss: 'B', portal: 'P', shop: '$' }
  return floor.grid
    .map(row => row.map(id => (id < 0 ? '.' : letter[floor.rooms[id].type])).join(' '))
    .join('\n')
}

if (typeof module !== 'undefined') module.exports = { generateFloor, floorToText }
