#!/usr/bin/env node
// Scans user-facing source trees for em dash, en dash and banned stock phrases.
// Prints file:line hits and exits nonzero on any hit. Allowlist entries are
// { path, reason } pairs for verbatim outside quotes only.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..', '..');

const BANNED = [
  'leverage', 'empower', 'supercharge', "in today's fast paced world",
  'take your work to the next level', 'seamless', 'cutting edge',
  'world class', 'game changer', 'unlock the power',
];
const DASHES = ['\u2014', '\u2013']; // em dash, en dash

const allowlistPath = join(scriptDir, 'check-copy.allowlist.json');
const allowlist = existsSync(allowlistPath)
  ? new Set(JSON.parse(readFileSync(allowlistPath, 'utf8')).map((e) => e.path))
  : new Set();

const roots = ['apps/desktop/src', 'packages/domain/src', 'packages/app-services/src'];
const exts = new Set(['.ts', '.tsx', '.css']);
let hits = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    const dot = name.lastIndexOf('.');
    if (!exts.has(name.slice(dot))) continue;
    const rel = relative(repoRoot, full);
    if (allowlist.has(rel)) continue;
    const lines = readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const d of DASHES) {
        if (line.includes(d)) { console.log(`${rel}:${i + 1}: dash character found`); hits++; }
      }
      const lower = line.toLowerCase();
      for (const phrase of BANNED) {
        if (lower.includes(phrase)) { console.log(`${rel}:${i + 1}: banned phrase "${phrase}"`); hits++; }
      }
    });
  }
}

for (const root of roots) walk(join(repoRoot, root));
if (hits > 0) { console.error(`check-copy: ${hits} hit(s)`); process.exit(1); }
console.log('check-copy: no hits');
