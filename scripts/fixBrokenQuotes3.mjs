/**
 * Final repair pass:
 *
 * fixBrokenQuotes.mjs created patterns like:
 *   "text ${expr}" → missing opening backtick, has opening " instead
 *   These are double-quote-started strings that contain ${...} and close with `
 *
 * Fix: "content ${...} rest`  →  `content ${...} rest`
 *      "content ${...} rest"  →  (scanner from pass1 already handled — nothing to do)
 *
 * Also: catch any remaining `content" → "content" when no interpolation
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function fixFile(filePath) {
  let code = readFileSync(filePath, "utf8");
  const original = code;

  // Pass A: "...${...}...`  →  `...${...}...`
  // A double-quote that opens a string containing ${…} closed by backtick
  // Use character scan to avoid regex pitfalls
  code = fixQuoteOpenedTemplateLiterals(code);

  // Pass B: remaining `text"  →  "text"  (simple strings only, no interpolation)
  // Only when preceded by property context (:, =, (, ,)
  code = code.replace(/([:,=(,]\s*)`([^`$"\n{}()[\]]{1,60})"/g, (m, prefix, inner) => {
    if (inner.includes("${")) return m;
    return `${prefix}"${inner}"`;
  });

  if (code !== original) {
    writeFileSync(filePath, code);
    console.log("fixed:", filePath);
  }
}

/**
 * Scan character by character.
 * Find sequences: "  [any chars including ${...}]  `
 * where the sequence contains at least one ${
 * Replace opening " with ` to restore proper template literal
 */
function fixQuoteOpenedTemplateLiterals(code) {
  const chars = code.split("");
  const result = [];
  let i = 0;

  while (i < chars.length) {
    if (chars[i] === '"') {
      // Start of a potential broken template literal (should be `)
      const start = i;
      let j = i + 1;
      let hasInterp = false;
      let depth = 0;

      while (j < chars.length) {
        if (chars[j] === "$" && chars[j + 1] === "{") {
          hasInterp = true;
          depth++;
          j += 2;
          continue;
        }
        if (depth > 0) {
          if (chars[j] === "{") depth++;
          else if (chars[j] === "}") {
            depth--;
            j++;
            continue;
          }
          j++;
          continue;
        }
        // depth === 0
        if (chars[j] === "`") {
          // Ends with backtick — if it has interpolation, this was a template literal
          if (hasInterp) {
            // Replace opening " with `
            result.push("`");
            result.push(...chars.slice(start + 1, j + 1)); // content + closing `
            i = j + 1;
          } else {
            // No interpolation, broken in a different way — pass through
            result.push(chars[start]);
            i = start + 1;
          }
          break;
        }
        if (chars[j] === '"') {
          // Another double-quote before a backtick — not our pattern
          result.push(chars[start]);
          i = start + 1;
          break;
        }
        if (chars[j] === "\n") {
          // Newline without closing — not our pattern
          result.push(chars[start]);
          i = start + 1;
          break;
        }
        j++;
      }
      if (j >= chars.length && i === start) {
        result.push(chars[start]);
        i = start + 1;
      }
    } else {
      result.push(chars[i]);
      i++;
    }
  }

  return result.join("");
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
