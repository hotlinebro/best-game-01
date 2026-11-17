export const TILE = 48;

// Each character is one 48px tile. Objects are laid over the terrain rows.
// # earth, B breakable bamboo, T tube, o sun drop, S berry, e beetle,
// ^ burr, F flag. Garden layouts deliberately have generous landing zones.
const layouts = [
  { name: 'Firefly Footpath', width: 100, pits: [[24, 26], [49, 51], [75, 78]],
    beetles: [18, 42, 67, 88], burrs: [35, 60], tube: 12,
    shelves: [[25, 10, 2], [50, 10, 2], [76, 10, 2]] },
  { name: 'Amber Canopy', width: 120, pits: [[22, 25], [46, 49], [72, 76], [99, 102]],
    beetles: [16, 38, 64, 90, 110], burrs: [32, 58, 84], tube: 10,
    shelves: [[23, 10, 2], [47, 10, 2], [73, 10, 2], [100, 10, 2]] },
  { name: 'Moonrise Grove', width: 140, pits: [[23, 27], [48, 52], [74, 78], [101, 105], [122, 126]],
    beetles: [17, 40, 66, 94, 114, 133], burrs: [34, 59, 89], tube: 11,
    shelves: [[24, 10, 2], [49, 10, 2], [75, 10, 2], [102, 10, 2]] },
];

function mapFor(layout) {
  const rows = Array.from({ length: 15 }, () => Array(layout.width).fill('.'));
  for (let x = 0; x < layout.width; x++) {
    if (!layout.pits.some(([a, b]) => x >= a && x < b)) {
      rows[12][x] = '#'; rows[13][x] = '#'; rows[14][x] = '#';
    }
  }
  for (let x = 6; x < layout.width - 4; x += 3) rows[10][x] = 'o';
  for (const [x, y, count] of layout.shelves) {
    for (let n = 0; n < count; n++) { rows[y][x + n] = 'B'; rows[y - 1][x + n] = 'o'; }
  }
  rows[9][8] = 'B'; rows[9][9] = 'B';
  for (const x of layout.beetles) rows[11][x] = 'e';
  for (const x of layout.burrs) rows[11][x] = '^';
  rows[11][layout.tube] = 'T';
  rows[11][7] = 'S'; rows[11][layout.width - 4] = 'F';
  return rows.map(row => row.join(''));
}

export const LEVELS = layouts.map(layout => ({ name: layout.name, map: mapFor(layout) }));
export const BONUS = { name: 'Sun Drop Sanctuary', map: [
  '........................', '........................', '........................',
  '........................', '........................', '........................',
  '........................', '........................', '........................',
  '.....ooooo...ooooo......', '....BBBBB...BBBBB.......', '...Toooooooooooooooo....',
  '########################', '########################', '########################',
] };

export function loadLevel(data) {
  const tiles = data.map.map(row => [...row]);
  const entities = [];
  tiles.forEach((row, y) => row.forEach((type, x) => {
    if ('oe^SF'.includes(type)) {
      entities.push({ type, x: x * TILE + 8, y: (y + 1) * TILE - 32,
        w: 32, h: 32, home: x * TILE + 8, vx: type === 'e' ? -65 : 0, alive: true });
      row[x] = '.';
    }
  }));
  return { name: data.name, tiles, entities, width: tiles[0].length * TILE };
}
