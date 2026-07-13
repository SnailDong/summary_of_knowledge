import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = dirname(projectRoot);
const notesRoot = join(sourceRoot, '04-technical-notes');

const chineseNumbers = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
  '三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十'
];

const walk = async (root) => {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      files.push(path);
    }
  }
  return files;
};

const stripHeadingMarker = (text) => {
  return text
    .replace(/^\s*[一二三四五六七八九十百]+[、.．]\s*/, '')
    .replace(/^\s*\d+[、.．]\s*/, '')
    .replace(/^\s*[(（]\d+[)）]\s*/, '')
    .replace(/^\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
    .trim();
};

const collectHeadingLevels = (lines) => {
  const levels = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) levels.push(match[1].length);
  }
  return levels;
};

const formatHeading = (rank, counters, rawTitle) => {
  const title = stripHeadingMarker(rawTitle);
  if (rank === 1) {
    counters[1] += 1;
    counters[2] = 0;
    counters[3] = 0;
    const marker = chineseNumbers[counters[1] - 1] || String(counters[1]);
    return `## ${marker}、${title}`;
  }
  if (rank === 2) {
    counters[2] += 1;
    counters[3] = 0;
    return `### ${counters[2]}、${title}`;
  }
  counters[3] += 1;
  return `#### (${counters[3]}) ${title}`;
};

const normalizeFile = async (file) => {
  const original = await readFile(file, 'utf8');
  const lines = original.split(/\r?\n/);
  const levels = collectHeadingLevels(lines).filter((level) => level > 1);
  if (levels.length === 0) return false;

  const baseLevel = Math.min(...levels);
  const counters = { 1: 0, 2: 0, 3: 0 };
  let inFence = false;
  let changed = false;

  const next = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) return line;

    const level = match[1].length;
    if (level === 1) return line;

    const rank = Math.min(Math.max(level - baseLevel + 1, 1), 3);
    const formatted = formatHeading(rank, counters, match[2]);
    if (formatted !== line) changed = true;
    return formatted;
  }).join('\n');

  if (changed) {
    await writeFile(file, next, 'utf8');
  }
  return changed;
};

const files = (await walk(notesRoot)).filter((file) => relative(notesRoot, file) !== 'README.md');
const changed = [];
for (const file of files) {
  if (await normalizeFile(file)) {
    changed.push(relative(sourceRoot, file));
  }
}

console.log(`Normalized headings in ${changed.length} files.`);
for (const file of changed) {
  console.log(file);
}
