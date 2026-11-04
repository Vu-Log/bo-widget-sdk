/**
 * Command line of the Vulog back office widgets (`bo-widget validate`, `pack`, `dev`), and its
 * functions for scripts: {@link validateWidgetArchive} checks a widget zip with the rules applied
 * on publication, {@link packWidget} zips a build into `{id}-{version}.zip`.
 *
 * @packageDocumentation
 */
export {
  validateWidgetArchive,
  WIDGET_ARCHIVE_EXTENSIONS,
  WIDGET_ARCHIVE_LIMITS,
  WIDGET_MANIFEST_FILE,
  type WidgetArchiveError,
  type WidgetArchiveErrorCode,
  type WidgetArchiveFile,
  type WidgetArchiveIssue,
  type WidgetArchiveIssueCode,
  type WidgetArchiveLimits,
  type WidgetArchiveResult,
  type WidgetArchiveWarning,
  type WidgetArchiveWarningCode,
} from './archive.js';
export { packWidget, type PackOptions, type PackResult } from './pack.js';
export { createZip, type ZipInputFile } from './zip.js';
