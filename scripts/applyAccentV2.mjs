/**
 * Correct version of applyAccent.mjs
 * Replaces green color values with gender-accent variables.
 * Only targets style object values (preceded by ": ") to avoid JSX prop confusion.
 * JSX props like stroke="rgba(...)" become stroke={a.glow(...)} via separate logic.
 */
import { readFileSync, writeFileSync } from "fs";

const [,, filePath] = process.argv;
let code = readFileSync(filePath, "utf8");

// 1. Exact hex color string values in style props  (": "value"" → ": value")
code = code.replace(/: "#4ade80"/g, ': a.accent');
code = code.replace(/: "#22c55e"/g, ': a.accentMid');
code = code.replace(/: "#16a34a"/g, ': a.accentDark');
code = code.replace(/: "#15803d"/g, ': a.accentDeep');

// 2. Standalone rgba strings as full style values
code = code.replace(/: "rgba\(74,222,128,([\d.]+)\)"/g,  (_, o) => `: a.glow(${o})`);
code = code.replace(/: "rgba\(34,197,94,([\d.]+)\)"/g,   (_, o) => `: a.glowMid(${o})`);

// 3. Green pill gradient as full style value
code = code.replace(
  /: "linear-gradient\(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%\)"/g,
  ': a.gradient'
);
code = code.replace(
  /: "linear-gradient\(135deg, rgba\(74,222,128,0\.15\), rgba\(34,197,94,0\.06\)\)"/g,
  ': a.gradientSubtle'
);

// 4. rgba embedded inside longer style value strings → template literal
// Only match when preceded by ": " to avoid JSX attr values
code = code.replace(/: "([^"]*?)rgba\(74,222,128,([\d.]+)\)([^"]*?)"/g, (_, pre, o, post) => {
  return `: \`${pre}\${a.glow(${o})}${post}\``;
});
code = code.replace(/: "([^"]*?)rgba\(34,197,94,([\d.]+)\)([^"]*?)"/g, (_, pre, o, post) => {
  return `: \`${pre}\${a.glowMid(${o})}${post}\``;
});

// 5. Remaining bare rgba inside already-converted template literals (after step 4)
code = code.replace(/rgba\(74,222,128,([\d.]+)\)/g,  (_, o) => `\${a.glow(${o})}`);
code = code.replace(/rgba\(34,197,94,([\d.]+)\)/g,   (_, o) => `\${a.glowMid(${o})}`);

// 6. Hex colours inside longer style value strings → template literal
// Only match when preceded by ": " to avoid JSX attr values
code = code.replace(/: "([^"]*?)#4ade80([^"]*?)"/g, (_, pre, post) => `: \`${pre}\${a.accent}${post}\``);
code = code.replace(/: "([^"]*?)#22c55e([^"]*?)"/g, (_, pre, post) => `: \`${pre}\${a.accentMid}${post}\``);
code = code.replace(/: "([^"]*?)#16a34a([^"]*?)"/g, (_, pre, post) => `: \`${pre}\${a.accentDark}${post}\``);
code = code.replace(/: "([^"]*?)#15803d([^"]*?)"/g, (_, pre, post) => `: \`${pre}\${a.accentDeep}${post}\``);

// 7. JSX props (no colon prefix): stroke="rgba(...)" → stroke={a.glow(...)}
//    These are SVG/HTML element attributes, not style object props
code = code.replace(/(\w+)="rgba\(74,222,128,([\d.]+)\)"/g,  (_, attr, o) => `${attr}={a.glow(${o})}`);
code = code.replace(/(\w+)="rgba\(34,197,94,([\d.]+)\)"/g,   (_, attr, o) => `${attr}={a.glowMid(${o})}`);
code = code.replace(/(\w+)="#4ade80"/g,  (_, attr) => `${attr}={a.accent}`);
code = code.replace(/(\w+)="#22c55e"/g,  (_, attr) => `${attr}={a.accentMid}`);
code = code.replace(/(\w+)="#16a34a"/g,  (_, attr) => `${attr}={a.accentDark}`);
code = code.replace(/(\w+)="#15803d"/g,  (_, attr) => `${attr}={a.accentDeep}`);

writeFileSync(filePath, code);
console.log("done:", filePath);
