/**
 * In module-level code (before first export function/default function),
 * replace a.accent → "#4ade80", a.accentMid → "#22c55e", a.accentDark → "#16a34a",
 * a.glow(X) → "rgba(74,222,128,X)".
 *
 * Handles several broken patterns:
 *   - "${a.glow(X)}"     → "rgba(74,222,128,X)"
 *   - `${a.glow(X)}`     → "rgba(74,222,128,X)"  (inside template literals)
 *   - a.glow(X)          → "rgba(74,222,128,X)"  (bare call)
 */
import { readFileSync, writeFileSync } from "fs";

const [,, ...files] = process.argv;

function replaceAccentCalls(str) {
  // First: fix "${a.glow(X)}" → "rgba(74,222,128,X)"  (string containing template expr)
  str = str.replace(/"\$\{a\.glow\(([\d.]+)\)\}"/g, (_, x) => `"rgba(74,222,128,${x})"`);
  str = str.replace(/"\$\{a\.glowMid\(([\d.]+)\)\}"/g, (_, x) => `"rgba(34,197,94,${x})"`);
  str = str.replace(/"\$\{a\.accent\}"/g, '"#4ade80"');
  str = str.replace(/"\$\{a\.accentMid\}"/g, '"#22c55e"');
  str = str.replace(/"\$\{a\.accentDark\}"/g, '"#16a34a"');

  // Second: inside template literals: ${a.glow(X)} → rgba(74,222,128,X)  (no quotes)
  str = str.replace(/\$\{a\.glow\(([\d.]+)\)\}/g, (_, x) => `rgba(74,222,128,${x})`);
  str = str.replace(/\$\{a\.glowMid\(([\d.]+)\)\}/g, (_, x) => `rgba(34,197,94,${x})`);
  str = str.replace(/\$\{a\.accent\}/g, '#4ade80');
  str = str.replace(/\$\{a\.accentMid\}/g, '#22c55e');
  str = str.replace(/\$\{a\.accentDark\}/g, '#16a34a');

  // Third: bare calls (standalone, not inside ${})
  str = str.replace(/\ba\.glow\(([\d.]+)\)/g, (_, x) => `"rgba(74,222,128,${x})"`);
  str = str.replace(/\ba\.glowMid\(([\d.]+)\)/g, (_, x) => `"rgba(34,197,94,${x})"`);
  str = str.replace(/\ba\.accent\b/g, '"#4ade80"');
  str = str.replace(/\ba\.accentMid\b/g, '"#22c55e"');
  str = str.replace(/\ba\.accentDark\b/g, '"#16a34a"');
  str = str.replace(/\ba\.accentDeep\b/g, '"#15803d"');
  str = str.replace(/\ba\.gradient\b/g, '"linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)"');
  return str;
}

for (const filePath of files) {
  let code = readFileSync(filePath, "utf8");

  // Find where the first export function/default export starts
  const exportMatch = code.match(/(export\s+default\s+function|export\s+function)/);
  if (!exportMatch) {
    console.log("skip (no export function):", filePath);
    continue;
  }

  const splitAt = exportMatch.index;
  let modulePart = code.slice(0, splitAt);
  const componentPart = code.slice(splitAt);

  // Check if module part has a.glow or a.accent
  if (!/\ba\.(glow|glowMid|accent|accentMid|accentDark|accentDeep|gradient)\b|\$\{a\./.test(modulePart)) {
    console.log("skip (no module-level a.*):", filePath);
    continue;
  }

  const fixedModulePart = replaceAccentCalls(modulePart);

  if (fixedModulePart === modulePart) {
    console.log("unchanged:", filePath);
    continue;
  }

  writeFileSync(filePath, fixedModulePart + componentPart);
  console.log("fixed:", filePath);
}
