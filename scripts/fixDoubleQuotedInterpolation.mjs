/**
 * Fix patterns where a template expression ended up inside a regular double-quoted string.
 * Handles both static strings and function calls inside ${}.
 *
 * Patterns fixed:
 *   "${expr}"          → expr  (bare expression, no quotes)
 *   "prefix ${expr}"   → `prefix ${expr}`  (template literal)
 *   "${inner static}"  → "inner static"    (static string, simplify)
 */
import { readFileSync, writeFileSync } from "fs";

const [,, ...files] = process.argv;

for (const filePath of files) {
  let code = readFileSync(filePath, "utf8");
  const original = code;

  let prev;
  do {
    prev = code;

    // 1. Static string inside ${}: "prefix ${"value"}" → "prefix value"
    code = code.replace(/"([^"$]*)\$\{"([^"{}]+)"\}"/g, (m, prefix, inner) => {
      return `"${prefix}${inner}"`;
    });

    // 2. Function call expression with no prefix/suffix: "${a.method(x)}" → a.method(x)
    // Match: " ${ identifier.method(args) } "
    code = code.replace(/"(\$\{[a-zA-Z_$][^"{}]*\([^"{}()]*\)\})"(?!")/g, (m, expr) => {
      const inner = expr.slice(2, -1); // strip ${ and }
      return inner;
    });

    // 3. Function call expression with prefix: "prefix text ${a.method(x)}" → `prefix text ${a.method(x)}`
    code = code.replace(/"([^"$]+)(\$\{[a-zA-Z_$][^"{}]*\([^"{}()]*\)\})"/g, (m, prefix, expr) => {
      return `\`${prefix}${expr}\``;
    });

  } while (code !== prev);

  if (code !== original) {
    writeFileSync(filePath, code);
    console.log("fixed:", filePath);
  } else {
    console.log("skip:", filePath);
  }
}
