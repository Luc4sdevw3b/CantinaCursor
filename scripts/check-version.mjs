import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const appVersionSource = readFileSync(join(root, 'src/app-version.ts'), 'utf8');
const appVersionMatch = appVersionSource.match(
  /export const APP_VERSION = '([^']+)'/,
);
const mismatches = [];

if (pkg.version !== version) {
  mismatches.push(`package.json.version=${pkg.version} !== VERSION=${version}`);
}

if (!appVersionMatch) {
  mismatches.push('APP_VERSION ausente em src/app-version.ts');
} else if (appVersionMatch[1] !== version) {
  mismatches.push(`APP_VERSION=${appVersionMatch[1]} !== VERSION=${version}`);
}

if (mismatches.length > 0) {
  console.error('VERSION check failed:');
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch}`);
  }
  process.exit(1);
}

console.log(`VERSION ${version} consistente`);
