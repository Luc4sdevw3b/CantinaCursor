import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webDist = resolve(root, 'dist');
const sourceDir = resolve(root, 'apps-script/src');
const outputDir = resolve(root, 'apps-script/dist');

let html = await readFile(resolve(webDist, 'index.html'), 'utf8');
const stylesheetMatch = html.match(
  /<link rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/,
);
const scriptMatch = html.match(
  /<script type="module"[^>]+src="([^"]+)"[^>]*><\/script>/,
);

if (!stylesheetMatch?.[1] || !scriptMatch?.[1]) {
  throw new Error(
    'BUILD_ERROR: assets do Vite não encontrados no HTML gerado.',
  );
}

const css = await readFile(
  resolve(webDist, stylesheetMatch[1].replace(/^\//, '')),
  'utf8',
);
const javascript = await readFile(
  resolve(webDist, scriptMatch[1].replace(/^\//, '')),
  'utf8',
);

html = html
  .replace('<head>', '<head>\n    <base target="_top" />')
  .replace(stylesheetMatch[0], `<style>${css}</style>`)
  .replace(
    scriptMatch[0],
    `<script>${javascript.replace(/<\/script/gi, '<\\/script')}</script>`,
  );

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(resolve(sourceDir, 'Code.gs'), resolve(outputDir, 'Code.gs'));
await cp(
  resolve(sourceDir, 'appsscript.json'),
  resolve(outputDir, 'appsscript.json'),
);
await writeFile(resolve(outputDir, 'Index.html'), html);

console.log('Apps Script bundle criado em apps-script/dist.');
