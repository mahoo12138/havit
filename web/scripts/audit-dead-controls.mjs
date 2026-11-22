// Audit interactive controls that render but have no behavior ("dead buttons").
// Scans feature/page tsx files for <Button>/<button> JSX elements lacking
// onClick, type="submit", or an href/to navigation. Elements receiving props
// via spread are listed separately (cannot be resolved statically).
//
// Usage: node scripts/audit-dead-controls.mjs [--json]
// Exit code 1 when dead controls are found (CI-friendly).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const TARGET_DIRS = ['features', 'pages', 'routes', 'app'].map((d) => join(SRC, d));

function listTsx(dir) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listTsx(full));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

function exists(p) {
  try { statSync(p); return true; } catch { return false; }
}

function analyze(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const dead = [];
  const spread = [];

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText();
      if (tag === 'Button' || tag === 'button') {
        const attrs = node.attributes.properties;
        let hasHandler = false;
        let hasSpread = false;
        for (const attr of attrs) {
          if (ts.isJsxAttribute(attr)) {
            const name = attr.name.getText();
            if (name === 'onClick' || name === 'onSubmit') hasHandler = true;
            if (name === 'type' && attr.initializer?.getText()?.includes('submit')) hasHandler = true;
            if (name === 'to' || name === 'href' || name === 'asChild') hasHandler = true;
          }
          if (ts.isJsxSpreadAttribute(attr)) hasSpread = true;
        }
        const loc = `${relative(ROOT, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
        if (hasHandler) { /* alive */ }
        else if (hasSpread) spread.push(loc);
        else dead.push(loc);
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return { dead, spread };
}

const files = TARGET_DIRS.flatMap(listTsx);
const result = { dead: [], spread: [] };
for (const file of files) {
  const { dead, spread } = analyze(file);
  result.dead.push(...dead);
  result.spread.push(...spread);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`dead controls: ${result.dead.length}`);
  for (const loc of result.dead) console.log(`  ✗ ${loc}`);
  if (result.spread.length) {
    console.log(`spread-propagated (unresolvable, review manually): ${result.spread.length}`);
    for (const loc of result.spread) console.log(`  ? ${loc}`);
  }
}
if (result.dead.length > 0) process.exit(1);
