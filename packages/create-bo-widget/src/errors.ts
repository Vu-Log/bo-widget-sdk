/**
 * An expected failure the user can fix (invalid name, unknown template, folder not empty…): the
 * command prints its message alone, without a stack trace, as it does for a wrong command line and
 * Node.js system errors. Any other error is reported as a bug.
 */
export class CreateBoWidgetError extends Error {
  override name = 'CreateBoWidgetError';
}
