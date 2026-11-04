/**
 * An expected failure the user can fix (a missing build folder, Vite not installed…): the CLI
 * prints its message alone, without a stack trace. Any other error is reported as a bug.
 */
export class BoWidgetCliError extends Error {
  override name = 'BoWidgetCliError';
}
