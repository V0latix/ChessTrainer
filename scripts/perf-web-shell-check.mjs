import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const webDist = path.join(rootDir, 'apps', 'web', 'dist');
const assetsDir = path.join(webDist, 'assets');
const targetMs = 2000;

function bytesToKiB(bytes) {
  return bytes / 1024;
}

function estimateLoadMs({ htmlBytes, jsBytes, cssBytes }) {
  // Conservative desktop baseline budget approximation:
  // - 10 Mbps effective bandwidth
  // - 150 ms network/setup overhead
  // - 250 ms parse/exec/render overhead
  const bandwidthBytesPerMs = 1250; // 10 Mbps
  const transferMs = (htmlBytes + jsBytes + cssBytes) / bandwidthBytesPerMs;
  return 150 + transferMs + 250;
}

const html = readFileSync(path.join(webDist, 'index.html'), 'utf8');
const htmlBytes = Buffer.byteLength(html);

const assetFiles = readdirSync(assetsDir);
const jsFiles = assetFiles.filter((file) => file.endsWith('.js'));
const cssFiles = assetFiles.filter((file) => file.endsWith('.css'));

if (jsFiles.length === 0) {
  throw new Error('No JS bundle found in apps/web/dist/assets');
}

const totalJsBytes = jsFiles.reduce((sum, file) => sum + statSync(path.join(assetsDir, file)).size, 0);
const totalCssBytes = cssFiles.reduce((sum, file) => sum + statSync(path.join(assetsDir, file)).size, 0);

const estimatedMs = estimateLoadMs({
  htmlBytes,
  jsBytes: totalJsBytes,
  cssBytes: totalCssBytes,
});

console.log(`HTML size: ${bytesToKiB(htmlBytes).toFixed(2)} KiB`);
console.log(`JS size: ${bytesToKiB(totalJsBytes).toFixed(2)} KiB`);
console.log(`CSS size: ${bytesToKiB(totalCssBytes).toFixed(2)} KiB`);
console.log(`Estimated initial load: ${estimatedMs.toFixed(2)} ms`);

if (estimatedMs > targetMs) {
  throw new Error(`Performance check failed: estimated ${estimatedMs.toFixed(2)}ms > ${targetMs}ms target`);
}

console.log('Performance check passed (< 2s estimated load budget).');
