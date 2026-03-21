/**
 * Two-pass repair for quote/backtick mismatches:
 *
 * Pass 1 – undo damage from fixBrokenQuotes.mjs:
 *   Template literals that contain ${…} but now end with " instead of `
 *   Pattern:  `...${...}...`  was turned into  `...${...}..."
 *   We find:  `[any chars including ${...}]*"  where there IS a ${  and restore closing "→`
 *
 * Pass 2 – fix original damage from applyAccent.mjs:
 *   a) "text`  →  "text"   (opening " , no interpolation, closing `)
 *   b) `text"  →  "text"   (opening ` , no interpolation, closing ")
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function fixFile(filePath) {
  let code = readFileSync(filePath, "utf8");
  const original = code;

  // ── Pass 1: Restore closing ` that was wrongly changed to " ──────────────
  // A template literal `...${...}..." should end with `
  // Match: backtick, then any sequence that contains at least one ${...}, ends with "
  // We use a character-by-character scan to be safe.
  code = repairTemplateClosings(code);

  // ── Pass 2a: "text`  →  "text"  (no ${} inside) ──────────────────────────
  code = code.replace(/"([^"$`\n{}()[\]]*)`/g, (m, inner) => {
    if (inner.includes("${")) return m;
    return `"${inner}"`;
  });

  // ── Pass 2b: `text"  →  "text"  (no ${} inside, simple string only) ──────
  // Only match when the backtick is preceded by a property-assignment context
  // i.e., after :, =, (, ,  — not after } (which closes a template expression)
  code = code.replace(/([:,=(]\s*)`([^`$"\n{}()[\]]*?)"/g, (m, prefix, inner) => {
    if (inner.includes("${")) return m;
    return `${prefix}"${inner}"`;
  });

  if (code !== original) {
    writeFileSync(filePath, code);
    console.log("fixed:", filePath);
  }
}

/**
 * Scan the code character by character.
 * When we find a template literal (starting with `) that contains ${...}
 * but ends with " instead of `, fix the closing delimiter.
 */
function repairTemplateClosings(code) {
  const chars = code.split("");
  const result = [];
  let i = 0;

  while (i < chars.length) {
    if (chars[i] === "`") {
      // Start of a potential template literal — collect it
      const start = i;
      let j = i + 1;
      let hasInterp = false;
      let depth = 0; // nesting depth for ${...}

      while (j < chars.length) {
        if (chars[j] === "$" && chars[j + 1] === "{") {
          hasInterp = true;
          depth++;
          j += 2;
          continue;
        }
        if (depth > 0) {
          if (chars[j] === "{") depth++;
          if (chars[j] === "}") {
            depth--;
            j++;
            continue;
          }
        }
        if (depth === 0) {
          if (chars[j] === "`") {
            // Properly closed template literal — output as-is
            result.push(...chars.slice(start, j + 1));
            i = j + 1;
            break;
          }
          if (chars[j] === '"') {
            if (hasInterp) {
              // Broken: template literal closed with " instead of `
              result.push(...chars.slice(start, j));
              result.push("`"); // restore proper close
              i = j + 1;
            } else {
              // No interpolation — this might be applyAccent damage (pass 2 will handle)
              // Output as-is for now
              result.push(...chars.slice(start, j + 1));
              i = j + 1;
            }
            break;
          }
          if (chars[j] === "\n") {
            // Template literals don't span lines in these style objects
            // Bail out — not a template literal, push ` and continue
            result.push(chars[start]);
            i = start + 1;
            break;
          }
        }
        j++;
      }
      if (j >= chars.length) {
        // Reached end without closing — push remainder
        result.push(...chars.slice(start));
        i = chars.length;
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
