import { defineCollection } from 'astro:content';

const passthrough = defineCollection({});

export const collections = {
  notes: passthrough,
  projects: passthrough,
  skills: passthrough
};
