import { readFileSync, writeFileSync } from "fs";

const [,, filePath] = process.argv;
let code = readFileSync(filePath, "utf8");

// 1. Exact color string values in style props  -> expression (drop quotes)
code = code.replace(/: "#4ade80"/g,  ": a.accent");
code = code.replace(/: "#22c55e"/g,  ": a.accentMid");
code = code.replace(/: "#16a34a"/g,  ": a.accentDark");
code = code.replace(/: "#15803d"/g,  ": a.accentDeep");

// 2. Standalone rgba strings used as full values  -> expression
code = code.replace(/"rgba\(74,222,128,([\d.]+)\)"/g,  (_, o) => `a.glow(${o})`);
code = code.replace(/"rgba\(34,197,94,([\d.]+)\)"/g,   (_, o) => `a.glowMid(${o})`);

// 3. Green pill gradient as full value
code = code.replace(
  /"linear-gradient\(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%\)"/g,
  "a.gradient"
);
code = code.replace(
  /"linear-gradient\(135deg, rgba\(74,222,128,0\.15\), rgba\(34,197,94,0\.06\)\)"/g,
  "a.gradientSubtle"
);

// 4. rgba embedded inside longer strings (box shadows, compound backgrounds)
//    Convert the whole string to a template literal
code = code.replace(/"([^"]*?)rgba\(74,222,128,([\d.]+)\)([^"]*?)"/g, (_, pre, o, post) => {
  // check if there are more rgba in pre/post - handle recursively via loop below
  return `\`${pre}\${a.glow(${o})}${post}\``;
});
code = code.replace(/"([^"]*?)rgba\(34,197,94,([\d.]+)\)([^"]*?)"/g,  (_, pre, o, post) => {
  return `\`${pre}\${a.glowMid(${o})}${post}\``;
});

// 5. Remaining bare rgba inside already-converted template literals
code = code.replace(/rgba\(74,222,128,([\d.]+)\)/g,  (_, o) => `\${a.glow(${o})}`);
code = code.replace(/rgba\(34,197,94,([\d.]+)\)/g,   (_, o) => `\${a.glowMid(${o})}`);

// 6. Colour hex inside remaining non-converted strings (e.g. inside boxShadow compound strings)
code = code.replace(/"([^"]*?)#4ade80([^"]*?)"/g, (_, pre, post) => `\`${pre}\${a.accent}${post}\``);
code = code.replace(/"([^"]*?)#22c55e([^"]*?)"/g, (_, pre, post) => `\`${pre}\${a.accentMid}${post}\``);
code = code.replace(/"([^"]*?)#16a34a([^"]*?)"/g, (_, pre, post) => `\`${pre}\${a.accentDark}${post}\``);
code = code.replace(/"([^"]*?)#15803d([^"]*?)"/g, (_, pre, post) => `\`${pre}\${a.accentDeep}${post}\``);

writeFileSync(filePath, code);
console.log("done:", filePath);
