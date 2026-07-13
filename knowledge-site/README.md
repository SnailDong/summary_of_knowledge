# Knowledge Site

Astro + Markdown 静态站工程，用于把父目录中的个人知识库导出成手机和桌面都可访问的静态 HTML。

## 内容来源

- `../01-resume/current/`
- `../03-project-experience/`
- `../04-technical-notes/`
- `../05-ai-workflow-skills/`

`../02-interview/`、`../99-archive/`、项目内 `skills/` 证据材料默认不发布。

## 网站模块边界

- `个人介绍`：由原简历模块生成，包含当前简历 HTML / PDF / Markdown。
- `项目经验`：只放项目总结和经历主线，不放项目内部 skill 原文。
- `技术笔记`：Java、Android、性能、开源库、网络数据库等复习笔记。
- `AI Workflow`：通用 skills 和方法论资产。

## 使用方式

```bash
npm install
npm run dev
```

导出静态站：

```bash
npm run build
```

导出目录：

```text
dist/
```

手机端查看建议使用部署后的 URL，或在同一局域网中访问本机预览服务。
