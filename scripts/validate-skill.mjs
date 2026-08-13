import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(root, '.agents/skills/cantina-v2appscript');
const skillPath = join(skillDir, 'SKILL.md');
const errors = [];

function fail(message) {
  errors.push(message);
}

if (!existsSync(skillPath)) {
  fail('SKILL.md ausente');
} else {
  const text = readFileSync(skillPath, 'utf8');
  if (!text.startsWith('---\n')) {
    fail('frontmatter ausente');
  } else {
    const end = text.indexOf('\n---', 4);
    if (end === -1) {
      fail('frontmatter não fechado');
    } else {
      const frontmatter = text.slice(4, end);
      if (!/^name:\s*cantina-v2appscript\s*$/m.test(frontmatter)) {
        fail('frontmatter.name inválido');
      }
      if (!/^description:\s*\S+/m.test(frontmatter)) {
        fail('frontmatter.description ausente');
      }

      const refs = [...text.matchAll(/`references\/([a-z0-9.-]+\.md)`/g)].map(
        (match) => match[1],
      );

      if (refs.length === 0) {
        fail('nenhuma referência declarada na Skill');
      }

      for (const ref of new Set(refs)) {
        if (!existsSync(join(skillDir, 'references', ref))) {
          fail(`referência ausente: ${ref}`);
        }
      }
    }
  }
}

const requiredRootFiles = [
  ['Implementation Plan', 'IMPLEMENTATION_PLAN_CANTINA_V2APPSCRIPT.md'],
  ['changelog', 'V2APPSCRIPT_CHANGELOG.md'],
  ['VERSION', 'VERSION'],
];

for (const [label, relativePath] of requiredRootFiles) {
  if (!existsSync(join(root, relativePath))) {
    fail(`${label} ausente`);
  }
}

if (errors.length > 0) {
  console.error('VALIDAÇÃO ESTRUTURAL: FALHOU');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('VALIDAÇÃO ESTRUTURAL: OK');
