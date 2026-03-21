/**
 * Adds const a = useGenderAccent() to every function component
 * that uses a.glow or a.accent but doesn't have the hook yet.
 * Handles both "export default function" and "export function" and inner "function".
 */
import { readFileSync, writeFileSync } from "fs";

const [,, ...files] = process.argv;

for (const filePath of files) {
  let code = readFileSync(filePath, "utf8");
  let changed = false;

  // Ensure import exists
  const importLine = `import { useGenderAccent } from "@/shared/hooks/useGenderAccent";`;
  if (!code.includes("useGenderAccent")) {
    code = code.replace(/(import[^;]+;\s*)\n(?!import)/, (m) => m + importLine + "\n");
    changed = true;
  }

  // Find all function declarations that:
  // 1. Have "a.glow" or "a.accent" somewhere in their body
  // 2. Don't already have "const a = useGenderAccent()"
  // Strategy: find opening braces of function bodies, check if hook is present, add if not
  
  // Match: (export )?(default )?function Name(...)(...) {
  // or arrow functions: const Name = (...) => {
  // We'll use a character-level approach to find function bodies
  
  const funcPattern = /\bfunction\s+\w+[\s\S]*?\)\s*\{/g;
  let match;
  const insertions = []; // { pos, text }
  
  while ((match = funcPattern.exec(code)) !== null) {
    const funcStart = match.index;
    const openBrace = match.index + match[0].length - 1; // position of opening {
    
    // Find the closing brace of this function
    let depth = 1;
    let pos = openBrace + 1;
    while (pos < code.length && depth > 0) {
      if (code[pos] === '{') depth++;
      else if (code[pos] === '}') depth--;
      pos++;
    }
    const funcEnd = pos; // exclusive
    
    const body = code.slice(openBrace + 1, funcEnd - 1);
    
    // Check if body uses a.glow or a.accent
    if (!/\ba\.(glow|accent|accentMid|accentDark)\b/.test(body)) continue;
    
    // Check if body already has the hook
    if (/const a = useGenderAccent\(\)/.test(body)) continue;
    
    // Find position right after opening brace (accounting for newline)
    const insertPos = openBrace + 1;
    const indent = "  "; // default indent
    insertions.push({ pos: insertPos, text: `\n${indent}const a = useGenderAccent();` });
  }
  
  // Apply insertions in reverse order (to preserve positions)
  insertions.sort((a, b) => b.pos - a.pos);
  for (const ins of insertions) {
    code = code.slice(0, ins.pos) + ins.text + code.slice(ins.pos);
    changed = true;
  }
  
  if (changed) {
    writeFileSync(filePath, code);
    console.log("fixed:", filePath, `(${insertions.length} insertions)`);
  } else {
    console.log("skip:", filePath);
  }
}
