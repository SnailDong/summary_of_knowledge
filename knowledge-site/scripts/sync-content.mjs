import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = dirname(projectRoot);

const contentTargets = [
  {
    from: '03-project-experience',
    to: 'src/content/projects',
    include: (path, rel) => extname(path) === '.md' && !rel.includes('/')
  },
  {
    from: '04-technical-notes',
    to: 'src/content/notes',
    include: (path) => extname(path) === '.md'
  },
  {
    from: '05-ai-workflow-skills',
    to: 'src/content/skills',
    include: (path) => path.endsWith('SKILL.md') || extname(path) === '.md'
  }
];

const resumeAssets = [
  ['01-resume/current/resume-paged.html', 'public/resume/resume-paged.html'],
  ['01-resume/current/chenguodong.pdf', 'public/resume/chenguodong.pdf'],
  ['01-resume/current/resume.md', 'public/resume/resume.md']
];

const interviewNotes = [
  ['02-interview/current/interview-reference.md', 'src/content/notes/interview/面试对答手册 - 简历项目版.md']
];

const walk = async (root) => {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
};

const copyFilteredTree = async ({ from, to, include }) => {
  const source = join(sourceRoot, from);
  const target = join(projectRoot, to);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  const files = await walk(source);
  let copied = 0;
  for (const file of files) {
    const rel = relative(source, file);
    if (!include(file, rel)) continue;
    const dest = join(target, rel);
    await mkdir(dirname(dest), { recursive: true });
    await cp(file, dest);
    copied += 1;
  }
  return copied;
};

const copyResumeAssets = async () => {
  let copied = 0;
  for (const [from, to] of resumeAssets) {
    const source = join(sourceRoot, from);
    const target = join(projectRoot, to);
    try {
      await stat(source);
    } catch {
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
    copied += 1;
  }
  return copied;
};

const copyInterviewNotes = async () => {
  let copied = 0;
  for (const [from, to] of interviewNotes) {
    const source = join(sourceRoot, from);
    const target = join(projectRoot, to);
    try {
      await stat(source);
    } catch {
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
    copied += 1;
  }
  return copied;
};

let total = 0;
for (const target of contentTargets) {
  total += await copyFilteredTree(target);
}
await rm(join(projectRoot, 'src/content/workflow-evidence'), { recursive: true, force: true });
total += await copyInterviewNotes();
total += await copyResumeAssets();

console.log(`Synced ${total} files into knowledge-site.`);
