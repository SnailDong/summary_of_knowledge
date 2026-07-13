# Knowledge Site Agent Guide

## Project Purpose

This project turns the local knowledge repository into a responsive static HTML site using Astro and Markdown.

## Dev Workflow Rules

- User stories location: `docs/product/user-stories/`.
- Each US must have AC in Given/When/Then format.
- L3 black-box checks are mandatory for every implemented user story AC.
- Test files location: `docs/testing/`.
- Documents must be updated before implementation changes.

## Commands

- `npm install`: install Astro dependencies.
- `npm run sync`: copy source Markdown and resume assets into the Astro project.
- `npm run dev`: sync content and start local preview.
- `npm run build`: export static HTML into `dist/`.
- `npm run preview`: preview the exported site locally.
- `npm run check:content`: verify expected source folders and synced content.

## Boundaries

- Source content stays in the parent knowledge repository.
- Generated site content lives under `src/content/` and `public/resume/`.
- Do not publish `02-interview/` by default because it can contain private interview material.
