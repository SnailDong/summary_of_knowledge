const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encodePath = (path) => {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
};

export const titleFromSlug = (slug) => {
  const parts = slug.split('/');
  const fileName = parts.at(-1) || slug;
  const parentName = parts.at(-2);
  const name = fileName === 'SKILL.md' && parentName ? parentName : fileName;
  return safeDecode(name)
    .replace(/\.mdx?$/, '')
    .replace(/^\d+-/, '')
    .replace(/_/g, ' ');
};

export const titleFromPath = (path, prefix = '') => {
  const relativePath = path.replace(prefix, '');
  return titleFromSlug(relativePath);
};

const sectionFromSkillPath = (path) => {
  if (path.includes('/custom-skills/')) return 'Custom Skill';
  if (path.includes('/superpowers/')) return 'Superpowers';
  return 'AI Workflow';
};

export const normalizeSlug = (path, prefix) => {
  return path
    .replace(prefix, '')
    .replace(/\.mdx?$/, '')
    .split('/')
    .join('/');
};

export const isStudyNotePath = (path) => {
  const fileName = path.split('/').at(-1) || '';
  return /^study\d+_/i.test(fileName);
};

export const isInterviewNotePath = (path) => path.includes('/interview/');

export const omitReadmePath = (path) => {
  const fileName = path.split('/').at(-1) || '';
  return fileName.toLowerCase() !== 'readme.md';
};

export const buildItems = (modules, prefix, baseHref, section) => {
  return Object.keys(modules)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((path) => {
      const slug = normalizeSlug(path, prefix);
      return {
        href: `${baseHref}/${encodePath(slug)}/`,
        section: section || sectionFromSkillPath(path),
        title: titleFromPath(path, prefix),
        slug
      };
    });
};
