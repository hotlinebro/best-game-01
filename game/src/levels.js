export const TILE = 48;
export const FLOOR = 576;

export const layouts = [
  {
    name: 'Alley Dash', theme: 'alley', tiles: 100,
    pits: [[23, 3], [46, 2], [69, 3], [86, 2]],
    shelves: [[10, 3], [34, 3], [58, 4], [78, 3]],
    mice: [17, 37, 55, 80], dogs: [30, 63], flap: 42,
  },
  {
    name: 'Garden Prowl', theme: 'garden', tiles: 120,
    pits: [[22, 3], [45, 4], [68, 3], [91, 4], [108, 2]],
    shelves: [[9, 4], [33, 3], [57, 4], [80, 3], [100, 3]],
    mice: [17, 38, 60, 83, 103], dogs: [29, 54, 97], flap: 73,
  },
  {
    name: 'Rooftop Night', theme: 'rooftop', tiles: 140,
    pits: [[24, 4], [47, 4], [71, 5], [96, 4], [121, 5]],
    shelves: [[10, 3], [35, 4], [59, 4], [84, 3], [109, 4]],
    mice: [18, 39, 62, 87, 113, 131], dogs: [32, 80, 105], flap: 54,
  },
];

const collectible = (kind, x, y) => ({ kind, x, y, w: 26, h: 26, taken: false });

export function createLevel(index) {
  const layout = layouts[index];
  const map = Array.from({ length: 15 }, () => Array(layout.tiles).fill('.'));
  for (let x = 0; x < layout.tiles; x++) {
    if (!layout.pits.some(([start, width]) => x >= start && x < start + width)) {
      for (let y = 12; y < 15; y++) map[y][x] = '#';
    }
  }
  for (const [start, width] of layout.shelves) {
    for (let x = start; x < start + width; x++) map[9][x] = 'B';
  }
  const solids = [];
  map.forEach((row, y) => row.forEach((tile, x) => {
    if (tile !== '.') solids.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, kind: tile === 'B' ? 'box' : 'ground', broken: false });
  }));
  const items = [];
  for (let x = 6; x < layout.tiles - 5; x += 3) {
    if (!layout.pits.some(([start, width]) => x >= start - 1 && x <= start + width)) {
      items.push(collectible('fish', x * TILE + 10, FLOOR - 45));
    }
  }
  for (const [start, width] of layout.shelves) {
    for (let x = start; x < start + width; x++) items.push(collectible('fish', x * TILE + 10, 385));
  }
  for (const [start, width] of layout.pits) {
    for (let x = 0; x < width; x++) items.push(collectible('fish', (start + x) * TILE + 10, 370 - Math.sin(x / width * Math.PI) * 25));
  }
  items.push(collectible('catnip', 7 * TILE, FLOOR - 32));
  items.push(collectible('catnip', (layout.flap + 3) * TILE, FLOOR - 32));
  const enemies = [];
  for (const kind of ['mouse', 'dog']) {
    for (const tile of layout[kind === 'mouse' ? 'mice' : 'dogs']) {
      enemies.push({ kind, x: tile * TILE, y: FLOOR - (kind === 'mouse' ? 28 : 42),
        w: kind === 'mouse' ? 36 : 62, h: kind === 'mouse' ? 28 : 42,
        min: (tile - 1) * TILE, max: (tile + 1) * TILE, direction: -1, alive: true });
    }
  }
  return { ...layout, width: layout.tiles * TILE, map, solids, items, enemies,
    flap: { x: layout.flap * TILE, y: FLOOR - 12, w: 64, h: 12 },
    goal: { x: (layout.tiles - 4) * TILE, y: FLOOR - 110, w: 90, h: 110 } };
}

export function createBonus() {
  const solids = [];
  for (let x = 0; x < 27; x++) solids.push({ x: x * TILE, y: FLOOR, w: TILE, h: 144, kind: 'ground' });
  for (let x = 8; x < 20; x++) solids.push({ x: x * TILE, y: 432, w: TILE, h: TILE, kind: 'box' });
  const items = [];
  for (const y of [530, 385]) {
    for (let x = 6; x < 24; x++) items.push(collectible('fish', x * TILE, y));
  }
  return { name: 'Fish Feast', theme: 'bonus', width: 1296, solids, items, enemies: [],
    flap: { x: 110, y: FLOOR - 12, w: 64, h: 12 }, goal: null, pits: [] };
}
