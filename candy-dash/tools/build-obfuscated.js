// Produces dist/game.js — an obfuscated build of game.js for deployment.
// game.js itself stays the readable source of truth; nothing here changes
// how the game runs locally (index.html always loads plain game.js).
//
// Settings deliberately avoid the obfuscator's heavier transforms
// (controlFlowFlattening, deadCodeInjection, selfDefending, splitStrings) —
// this is a 60fps canvas game with a real per-frame physics/render loop,
// and those transforms trade meaningful runtime cost for marginal extra
// obscurity. What's left (identifier renaming, string-array encoding,
// whitespace compaction) already makes the source unpleasant to read
// without touching hot-path performance.
//
// Usage: npm run build  (after `npm install` once)

const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const repoRoot = path.join(__dirname, "..");
const srcPath = path.join(repoRoot, "game.js");
const distDir = path.join(repoRoot, "dist");
const distPath = path.join(distDir, "game.js");

const source = fs.readFileSync(srcPath, "utf8");

const result = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  splitStrings: false,
  transformObjectKeys: false,
  numbersToExpressions: false,
  simplify: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ["base64"],
  rotateStringArray: true,
  shuffleStringArray: true,
});

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(distPath, result.getObfuscatedCode());

const srcSize = Buffer.byteLength(source, "utf8");
const distSize = fs.statSync(distPath).size;
console.log(`Built dist/game.js (${srcSize} -> ${distSize} bytes)`);
