/*
 * Copyright (C) 2020 Antoine CORDIER
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Convention smoke test (no deps). Guards the one bug tsc is blind to: a synth's
 * PARAM_COUNT lives in an untyped worklet JS const (and, for C++ synths, an
 * engine.h enum) that must match the TS param enum — a mismatch silently
 * misaligns every parameter. Run: `npm run check:conventions`.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const INSTRUMENTS = join(ROOT, "src/instruments");

const failures = [];
const notes = [];

/** First `PARAM_COUNT = N` / `PARAM_COUNT: N` in a file, or null. */
function paramCount(file) {
  const m = readFileSync(file, "utf-8").match(/PARAM_COUNT\s*[:=]\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

for (const inst of readdirSync(INSTRUMENTS)) {
  const dir = join(INSTRUMENTS, inst);
  if (!statSync(dir).isDirectory()) continue;

  const sources = {}; // label -> count
  for (const file of walk(dir)) {
    let label = null;
    if (file.endsWith("-params.ts")) label = "params.ts";
    else if (file.endsWith("-engine.h")) label = "engine.h";
    else if (file.endsWith("-processor.js")) label = "processor.js";
    if (!label) continue;
    const n = paramCount(file);
    if (n !== null) sources[label] = n;
  }

  const found = Object.entries(sources);
  if (found.length < 2) {
    notes.push(`  ${inst}: no PARAM_COUNT trio to check (${found.length} source${found.length === 1 ? "" : "s"})`);
    continue;
  }

  const counts = new Set(found.map(([, n]) => n));
  const detail = found.map(([l, n]) => `${l}=${n}`).join(", ");
  if (counts.size === 1) {
    notes.push(`  ${inst}: PARAM_COUNT aligned (${detail})`);
  } else {
    failures.push(`${inst}: PARAM_COUNT MISMATCH — ${detail}`);
  }
}

// The template instrument must stay registered (dev-gated) so it keeps
// compiling and rendering as the living reference.
const rootEl = join(ROOT, "src/components/root-element.ts");
const registerTs = join(INSTRUMENTS, "template/register.ts");
if (!existsSync(registerTs) || !/id:\s*"template"/.test(readFileSync(registerTs, "utf-8"))) {
  failures.push(`template: register.ts missing or does not register id "template"`);
} else if (!/instruments\/template\/register/.test(readFileSync(rootEl, "utf-8"))) {
  failures.push(`template: not imported in root-element.ts (dev registration lost)`);
} else {
  notes.push(`  template: registered (dev-gated in root-element.ts)`);
}

console.log("PARAM_COUNT alignment + template registration:");
for (const n of notes) console.log(n);

if (failures.length) {
  console.error("\n✗ convention check failed:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\n✓ all conventions hold");
