const fs = require("fs");
const path = require("path");

const frontendDistDir = path.resolve(__dirname, "../../FRONTEND/dist");
const backendPublicDir = path.resolve(__dirname, "../public");

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

if (!fs.existsSync(frontendDistDir)) {
  throw new Error(`Frontend build not found at ${frontendDistDir}`);
}

fs.rmSync(backendPublicDir, { recursive: true, force: true });
copyDir(frontendDistDir, backendPublicDir);

console.log(`Copied frontend build to ${backendPublicDir}`);
