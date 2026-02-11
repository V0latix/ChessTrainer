import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const webDist = path.join(rootDir, 'apps', 'web', 'dist');

if (!existsSync(webDist)) {
  throw new Error('Missing apps/web/dist. Run build before security check.');
}

function listFilesRecursively(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listFilesRecursively(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

const forbiddenMarkers = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'SUPABASE_JWT_SECRET',
  'postgresql://',
];

const configuredServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (configuredServiceRole && configuredServiceRole.length > 20) {
  forbiddenMarkers.push(configuredServiceRole);
}

const candidateFiles = listFilesRecursively(webDist).filter((file) =>
  ['.js', '.css', '.html'].includes(path.extname(file)),
);

const findings = [];

for (const file of candidateFiles) {
  const content = readFileSync(file, 'utf8');

  for (const marker of forbiddenMarkers) {
    if (content.includes(marker)) {
      findings.push({ file, marker });
    }
  }
}

if (findings.length > 0) {
  const details = findings
    .map((finding) => `- ${path.relative(rootDir, finding.file)} includes forbidden marker: ${finding.marker}`)
    .join('\n');

  throw new Error(`Client bundle secret exposure detected:\n${details}`);
}

console.log('Security baseline check passed: no forbidden secret markers in client bundle.');
