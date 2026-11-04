/**
 * Generator of Vulog back office widget projects (`npm create @vulog/bo-widget`), and its
 * functions for scripts: {@link createWidgetProject} copies a template into a new folder.
 *
 * @packageDocumentation
 */
export {
  createWidgetProject,
  titleFromName,
  validateWidgetName,
  WIDGET_NAME_MAX_LENGTH,
  WIDGET_NAME_PATTERN,
  type CreateOptions,
  type CreateResult,
} from './create.js';
export { CreateBoWidgetError } from './errors.js';
export { DEFAULT_TEMPLATE, isTemplateName, TEMPLATES, type TemplateName } from './templates.js';
