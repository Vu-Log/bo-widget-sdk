import { fileURLToPath } from 'node:url';

/** The templates of a widget project, by name, with the line shown to choose one. */
export const TEMPLATES = Object.freeze({
  'react-mui': 'React and MUI, with @vulog/bo-widget-react',
  svelte: 'Svelte 5 component compiled as a custom element',
  vue: 'Vue 3.5 component defined as a custom element',
  lit: 'Lit element',
  vanilla: 'Plain Web Component in TypeScript, no framework',
} as const);

/** Name of a template of a widget project. */
export type TemplateName = keyof typeof TEMPLATES;

/** The template used when none is chosen. */
export const DEFAULT_TEMPLATE: TemplateName = 'react-mui';

/** Tells whether `name` is the name of a template. */
export const isTemplateName = (name: string): name is TemplateName =>
  Object.hasOwn(TEMPLATES, name);

/** Folder of a template, in the published package (next to `src` and `dist`). */
export const templateDir = (template: TemplateName): string =>
  fileURLToPath(new URL(`../templates/${template}`, import.meta.url));
