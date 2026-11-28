// GRAVY HEIST — make.fun turkey-run-game-01 entry (Node 22, standard library only).
//
// The game lives in game/: plain static files a desktop browser loads offline
// (game/index.html plus its ES modules, no libraries, no network requests).
// This program hands the game in: it copies game/ and screenshots/ from beside
// this file into /output and writes /output/dossier.json, the summary the judge
// reads, using the vendored make.fun library.
//
// The game itself: a turkey has stolen the farmer's gravy boat and must escape
// across three farm zones — the Barnyard, the Corn Maze, Creek Road — to the
// getaway goose. Gravy is both health and money: hits cost it, drips and corn
// refill it, toll gates take a 15-gravy bribe (or a clean jump), and spilling
// grease (8 gravy) sends pursuers sliding into the pond. Seeded runs
// (?seed=N) make every layout deterministic; screenshots/ holds 4 JPEGs of
// the game running, the first by name is the cover.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(out, { recursive: true });
copyTree(join(here, 'game'), join(out, 'game'));
if (existsSync(join(here, 'screenshots'))) {
  copyTree(join(here, 'screenshots'), join(out, 'screenshots'));
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files in all; or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));
