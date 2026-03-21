/**
 * Adds useGenderAccent import and const a = useGenderAccent() to a component.
 * Handles both single-line and multi-line function signatures.
 */
import { readFileSync, writeFileSync } from "fs";

const [,, filePath] = process.argv;
let code = readFileSync(filePath, "utf8");

const importLine = `import { useGenderAccent } from "@/shared/hooks/useGenderAccent";`;

// Add import if not present
if (!code.includes("useGenderAccent")) {
  // Insert after last import block
  code = code.replace(/(import[^;]+;\s*)\n(?!import)/, (m) => m + importLine + "\n");
}

// Add const a = useGenderAccent(); after first { of the default export function
// Handle both single-line and multi-line signatures
if (!code.includes("const a = useGenderAccent()")) {
  // Find "export default function Name(...) {" or "export default function Name(...\n...) {"
  code = code.replace(
    /(export default function \w+[\s\S]*?\)\s*\{)/,
    (m) => m + "\n  const a = useGenderAccent();"
  );
}

writeFileSync(filePath, code);
console.log("hooked:", filePath);
