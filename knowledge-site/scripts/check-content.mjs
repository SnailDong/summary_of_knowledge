import { readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = dirname(projectRoot);

const requiredPaths = [
  join(sourceRoot, '03-project-experience'),
  join(sourceRoot, '04-technical-notes'),
  join(sourceRoot, '05-ai-workflow-skills'),
  join(projectRoot, 'src/content/projects'),
  join(projectRoot, 'src/content/notes'),
  join(projectRoot, 'src/content/skills'),
  join(projectRoot, 'public/resume/resume-paged.html'),
  join(projectRoot, 'public/resume/chenguodong.pdf')
];

const countMarkdown = async (root) => {
  const entries = await readdir(root, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) count += await countMarkdown(path);
    if (entry.isFile() && entry.name.endsWith('.md')) count += 1;
  }
  return count;
};

for (const path of requiredPaths) {
  await stat(path);
}

const notes = await countMarkdown(join(projectRoot, 'src/content/notes'));
const projects = await countMarkdown(join(projectRoot, 'src/content/projects'));
const skills = await countMarkdown(join(projectRoot, 'src/content/skills'));

if (notes < 20) {
  throw new Error(`Expected at least 20 technical notes, found ${notes}.`);
}

if (projects < 4) {
  throw new Error(`Expected at least 4 project summaries, found ${projects}.`);
}

if (projects > 8) {
  throw new Error(`Project module should only contain summary documents, found ${projects}.`);
}

if (skills < 10) {
  throw new Error(`Expected at least 10 skill documents, found ${skills}.`);
}

console.log(`Content check passed: ${notes} notes, ${projects} projects, ${skills} skills.`);
