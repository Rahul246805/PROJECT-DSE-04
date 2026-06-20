const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sourceDir = path.join(rootDir, 'FRONTEND', 'dist');
const targetDir = path.join(rootDir, 'dist');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Frontend build output not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied ${sourceDir} to ${targetDir}`);
