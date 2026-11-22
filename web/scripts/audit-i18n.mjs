// Audit translation keys that are never referenced in source code.
// A key counts as used when:
//   - its full literal appears anywhere in source as a complete quoted
//     string (covers t('key') AND data-driven usage like
//     translationKey: 'quickAction.export'), or
//   - some template/concat prefix makes it dynamic (t(`items.${x}`)),
//     covering every key under that branch, or
//   - it is an i18next plural variant (_one/_other/…) whose base key is used.
// Usage: node scripts/audit-i18n.mjs [--json]
// Exit code 1 when unused keys are found (CI-friendly).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const LOCALES = {
  en: join(SRC, 'i18n/locales/en/translation.json'),
  'zh-CN': join(SRC, 'i18n/locales/zh-CN/translation.json'),
};

function flatten(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
}

function listFiles(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'i18n' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const sourceFiles = [...listFiles(SRC, ['.ts', '.tsx']), ...listFiles(join(ROOT, 'e2e'), ['.ts'])];
let source = '';
for (const f of sourceFiles) source += readFileSync(f, 'utf8');

// Dynamic prefixes: t(`items.${`) and t(section + '.title') styles.
const wildcardPrefixes = [];
for (const m of source.matchAll(/`([^`$]*)\$\{/g)) {
  wildcardPrefixes.push(m[1].replace(/\$\{[^}]*\}/g, '*'));
}
const concatPrefixes = [];
for (const m of source.matchAll(/\+\s*['"]([A-Za-z0-9_.\-]+)['"]/g)) concatPrefixes.push(m[1]);

function isCoveredByWildcard(key) {
  return wildcardPrefixes.some((p) => {
    const staticPart = p.split('*')[0];
    return staticPart && key.startsWith(staticPart);
  });
}

function isCoveredByConcat(key) {
  return concatPrefixes.some((p) => p.length > 2 && key.startsWith(p));
}

// i18next resolves plural suffixes (_one/_other/…) at runtime from the base
// key; a plural variant is used whenever its base key is referenced.
const PLURAL_SUFFIX = /_(one|other|zero|two|few|many)$/;

const literalCache = new Map();
function hasLiteral(key) {
  if (literalCache.has(key)) return literalCache.get(key);
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp("['\"`]" + escaped + "['\"`]");
  const found = re.test(source);
  literalCache.set(key, found);
  return found;
}

function isUsed(key) {
  if (hasLiteral(key)) return true;
  if (isCoveredByWildcard(key) || isCoveredByConcat(key)) return true;
  if (PLURAL_SUFFIX.test(key)) {
    const base = key.replace(PLURAL_SUFFIX, '');
    return hasLiteral(base) || isCoveredByWildcard(base) || isCoveredByConcat(base);
  }
  return false;
}

const perLocale = {};
for (const [locale, file] of Object.entries(LOCALES)) {
  const keys = flatten(JSON.parse(readFileSync(file, 'utf8')));
  perLocale[locale] = { total: keys.length, unused: keys.filter((k) => !isUsed(k)) };
}

const zhSet = new Set(perLocale['zh-CN'].unused);
const unusedBoth = perLocale.en.unused.filter((k) => zhSet.has(k));
const enOnly = perLocale.en.unused.filter((k) => !zhSet.has(k));
const zhOnly = perLocale['zh-CN'].unused.filter((k) => !new Set(perLocale.en.unused).has(k));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ unusedBoth, enOnly, zhOnly }, null, 2));
} else {
  console.log(`unused in BOTH locales: ${unusedBoth.length}`);
  for (const k of unusedBoth) console.log(`  ✗ ${k}`);
  for (const [label, list] of [['unused in en only', enOnly], ['unused in zh-CN only', zhOnly]]) {
    if (list.length) {
      console.log(`${label}: ${list.length}`);
      for (const k of list) console.log(`  - ${k}`);
    }
  }
}
if (unusedBoth.length > 0 || enOnly.length > 0 || zhOnly.length > 0) process.exit(1);
