const fs = require('node:fs');
const path = require('node:path');

const pngSignature = '89504e470d0a1a0a';

const files = [
  { file: 'assets/images/logo.png', minWidth: 1024, minHeight: 1024, requireAlpha: true },
  { file: 'assets/images/icon.png', minWidth: 1024, minHeight: 1024, requireAlpha: false },
  { file: 'assets/images/adaptive-icon.png', minWidth: 1024, minHeight: 1024, requireAlpha: true },
  { file: 'assets/images/adaptive-icon-monochrome.png', minWidth: 1024, minHeight: 1024, requireAlpha: false },
  { file: 'assets/images/splash-icon.png', minWidth: 1024, minHeight: 1024, requireAlpha: true },
  { file: 'assets/images/favicon.png', minWidth: 48, minHeight: 48, requireAlpha: false },
];

let failed = false;

for (const entry of files) {
  const absolutePath = path.resolve(entry.file);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing asset: ${entry.file}`);
    failed = true;
    continue;
  }

  const buffer = fs.readFileSync(absolutePath);
  const signature = buffer.subarray(0, 8).toString('hex');

  if (signature !== pngSignature) {
    console.error(`Asset is not a PNG: ${entry.file}`);
    failed = true;
    continue;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer.readUInt8(25);
  const hasAlpha = colorType === 4 || colorType === 6;

  if (width < entry.minWidth || height < entry.minHeight) {
    console.error(
      `Asset dimensions are too small: ${entry.file} (${width}x${height}, expected at least ${entry.minWidth}x${entry.minHeight})`,
    );
    failed = true;
  }

  if (entry.requireAlpha && !hasAlpha) {
    console.error(`Asset should include an alpha channel: ${entry.file}`);
    failed = true;
  }

  if (buffer.byteLength > 2 * 1024 * 1024) {
    console.error(`Asset file is unexpectedly large: ${entry.file} (${buffer.byteLength} bytes)`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Branding assets look valid.');
