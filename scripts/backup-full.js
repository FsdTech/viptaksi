const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const backupDir = path.join(root, "backup-full");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const now = new Date();
const date = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);
const finalName = `vipstar-full-${date}.zip`;
const finalPath = path.join(backupDir, finalName);

const tmpDir = path.join(os.tmpdir(), "viptaksi-full-backup");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
const tmpZip = path.join(tmpDir, finalName);

function moveIntoPlace() {
  try {
    fs.renameSync(tmpZip, finalPath);
  } catch {
    fs.copyFileSync(tmpZip, finalPath);
    fs.unlinkSync(tmpZip);
  }
}

function runZip(callback) {
  const quoted = `"${tmpZip.replace(/"/g, '\\"')}"`;
  const cmd = `zip -r ${quoted} .`;
  exec(cmd, { cwd: root, maxBuffer: 1024 * 1024 * 64 }, callback);
}

function runTar(callback) {
  const quoted = `"${tmpZip.replace(/"/g, '\\"')}"`;
  const cmd = `tar -a -c -f ${quoted} .`;
  exec(cmd, { cwd: root, maxBuffer: 1024 * 1024 * 64 }, callback);
}

console.log("📦 FULL backup starting...");

runZip((zipErr) => {
  if (!zipErr) {
    moveIntoPlace();
    console.log("✅ FULL backup created:", finalPath);
    return;
  }
  runTar((tarErr) => {
    if (tarErr) {
      console.error("❌ Backup error (zip):", zipErr.message || zipErr);
      console.error("❌ Backup error (tar):", tarErr.message || tarErr);
      process.exitCode = 1;
      return;
    }
    moveIntoPlace();
    console.log("✅ FULL backup created:", finalPath);
  });
});
