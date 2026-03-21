/**
 * Fix broken quote/backtick mismatches left by applyAccent.mjs.
 * Patterns to fix:
 *  "text`  →  "text"   (opening quote, no interpolation, closing backtick)
 *  `text"  →  "text"   (opening backtick, no interpolation, closing quote)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function fixFile(filePath) {
  let code = readFileSync(filePath, "utf8");
  const original = code;

  // Pattern 1: "text`  →  "text"
  // A double-quote-opened string that closes with a backtick (no ${ inside)
  code = code.replace(/"([^"$`\n]*)`/g, (m, inner) => {
    // Only fix if no interpolation marker — the inner has no ${
    if (inner.includes("${")) return m;
    return `"${inner}"`;
  });

  // Pattern 2: `text"  →  "text"
  // A backtick-opened string that closes with a double-quote (no ${ inside)
  code = code.replace(/`([^`$"\n]*)"/g, (m, inner) => {
    if (inner.includes("${")) return m;
    return `"${inner}"`;
  });

  if (code !== original) {
    writeFileSync(filePath, code);
    console.log("fixed:", filePath);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walk(full);
    } else if (name.endsWith(".tsx") || name.endsWith(".ts")) {
      fixFile(full);
    }
  }
}

walk("src");
console.log("done");
