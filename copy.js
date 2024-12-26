const fs = require('fs');
const path = require('path');

const publicSrcDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(path.join(distDir, 'public'))) {
  fs.mkdirSync(path.join(distDir, 'public'), { recursive: true });
}

function copyFiles(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((file) => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      copyFiles(srcFile, destFile);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

fs.readdirSync(publicSrcDir).forEach(file => {
  const srcFile = path.join(publicSrcDir, file);
  const destFile = path.join(distDir, 'public', file);
  copyFiles(srcFile, destFile);
});

console.log('Public folders copied successfully!');
