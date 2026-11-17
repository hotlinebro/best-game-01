// MEOW RUN submission entrypoint (Node 22), authored for Milo's cat adventure.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
if (output === root) throw new Error('Choose an output directory separate from the repository.');
mkdirSync(output, { recursive: true });
for (const directory of ['game', 'screenshots']) {
  cpSync(join(root, directory), join(output, directory), { recursive: true, force: true });
}
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
});
writeFileSync(join(output, 'dossier.json'), dossier);
console.log(`MEOW RUN packaged: ${dossier.byteLength} dossier bytes.`);
