import { readFileSync, writeFileSync } from "fs";

const [,, filePath] = process.argv;
let code = readFileSync(filePath, "utf8");

const importLine = `import { useGenderAccent } from "@/shared/hooks/useGenderAccent";`;

// Add import if not present
if (!code.includes("useGenderAccent")) {
  // Insert after last import block
  code = code.replace(/(import[^;]+;)\s*\n(?!import)/, (m) => m + importLine + "\n");
}

// Add const a = useGenderAccent(); after the first { of the default export function
if (!code.includes("const a = useGenderAccent()")) {
  code = code.replace(
    /export default function \w+\([^)]*\)\s*\{/,
    (m) => m + "\n  const a = useGenderAccent();"
  );
}

writeFileSync(filePath, code);
console.log("hooked:", filePath);
