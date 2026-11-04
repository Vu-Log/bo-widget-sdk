import { createRequire } from 'node:module';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createWidgetProject, validateWidgetName } from './create.js';
import { CreateBoWidgetError } from './errors.js';
import { DEFAULT_TEMPLATE, isTemplateName, TEMPLATES, type TemplateName } from './templates.js';

/** What the command reads from and writes to: the real process in `bin.ts`, fakes in tests. */
export interface CliIo {
  /** Folder the project folder is relative to. */
  readonly cwd: string;
  /** Writes a line of output. */
  readonly out: (line: string) => void;
  /** Writes a line of error. */
  readonly err: (line: string) => void;
  /**
   * Asks a question and resolves with the answer, without its line break; rejects with an
   * `AbortError` when the user cancels (Ctrl+D or Ctrl+C). `undefined` when the command cannot ask
   * (no terminal): a missing template then takes its default, and a missing folder is a usage error.
   */
  readonly ask: ((question: string) => Promise<string>) | undefined;
}

/** Exit code of a wrong command line. */
const USAGE_ERROR = 2;

/** Exit code of a question cancelled by the user, as for an interrupted command (128 + SIGINT). */
const CANCELLED = 130;

/** Folder proposed when the name is asked. */
const DEFAULT_NAME = 'my-widget';

const TEMPLATE_NAMES = Object.keys(TEMPLATES) as TemplateName[];

const HELP = `Usage: npm create @vulog/bo-widget@next [dir] -- [--template <name>]
       create-bo-widget [dir] [--template <name>]

Creates the project of a Vulog back office widget in dir, a new or empty folder whose name is
the widget id (lowercase letters and digits joined by hyphens). Without dir, asks for it in a
terminal, and for the template too unless --template is given. Otherwise the template is
${DEFAULT_TEMPLATE}.

Options:
  -t, --template <name>  Template of the project:
${TEMPLATE_NAMES.map((name) => `                           ${name.padEnd(10)} ${TEMPLATES[name]}`).join('\n')}
  -h, --help             Shows this help.
  -v, --version          Shows the version.`;

class UsageError extends Error {}

/** Runs `parseArgs`, turning its errors (unknown option, missing value…) into usage errors. */
const parseOrUsage = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    throw new UsageError((error as Error).message, { cause: error });
  }
};

const version = (): string =>
  (createRequire(import.meta.url)('../package.json') as { version: string }).version;

/** Asks for the folder until its name is a valid widget id; empty answer = the default. */
const askDir = async (ask: (question: string) => Promise<string>, io: CliIo): Promise<string> => {
  for (;;) {
    const answer = (
      await ask(`Widget id, also the folder of the project (${DEFAULT_NAME}): `)
    ).trim();
    const dir = answer === '' ? DEFAULT_NAME : answer;
    const problem = validateWidgetName(basename(resolve(io.cwd, dir)));
    if (problem === undefined) return dir;
    io.err(problem);
  }
};

/** Asks for the template by number or name until it is one; empty answer = the default. */
const askTemplate = async (
  ask: (question: string) => Promise<string>,
  io: CliIo,
): Promise<TemplateName> => {
  io.out('Templates:');
  TEMPLATE_NAMES.forEach((name, index) =>
    io.out(`  ${index + 1}. ${name.padEnd(10)} ${TEMPLATES[name]}`),
  );
  for (;;) {
    const answer = (await ask(`Template (1, ${DEFAULT_TEMPLATE}): `)).trim();
    if (answer === '') return DEFAULT_TEMPLATE;
    const byNumber = /^\d+$/.test(answer) ? TEMPLATE_NAMES[Number(answer) - 1] : undefined;
    if (byNumber !== undefined) return byNumber;
    if (isTemplateName(answer)) return answer;
    io.err(
      `unknown template "${answer}": answer a number from 1 to ${TEMPLATE_NAMES.length} or a name`,
    );
  }
};

/** Tells whether an error is a question the user cancelled (Ctrl+D or Ctrl+C). */
const isCancel = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError';

/**
 * Error lines of a failed run. An expected failure (wrong command line, folder not empty, a
 * Node.js file system error, a cancelled question) prints its message; anything else is a bug,
 * printed with its stack and causes so that it can be reported.
 */
const describeError = (error: unknown): string => {
  if (!(error instanceof Error)) return `create-bo-widget: ${String(error)}`;
  if (isCancel(error)) return 'create-bo-widget: cancelled, nothing created';
  const expected =
    error instanceof UsageError ||
    error instanceof CreateBoWidgetError ||
    // A system error (permission denied…), not an internal ERR_* of Node.js.
    typeof (error as NodeJS.ErrnoException).syscall === 'string';
  if (expected) return `create-bo-widget: ${error.message}`;
  const causes: string[] = [];
  const seen = new Set<unknown>([error]);
  // `seen` stops on a cycle of causes, which some libraries create.
  for (let cause = error.cause; cause !== undefined && !seen.has(cause);) {
    seen.add(cause);
    causes.push(
      `Caused by: ${cause instanceof Error ? (cause.stack ?? cause.message) : String(cause)}`,
    );
    cause = cause instanceof Error ? cause.cause : undefined;
  }
  return [
    'create-bo-widget: unexpected error, please report it',
    error.stack ?? error.message,
    ...causes,
  ].join('\n');
};

/** The template given on the command line, checked. */
const parseTemplate = (value: string | undefined): TemplateName | undefined => {
  if (value === undefined || isTemplateName(value)) return value;
  throw new UsageError(`unknown template "${value}": choose one of ${TEMPLATE_NAMES.join(', ')}`);
};

const run = async (argv: readonly string[], io: CliIo): Promise<number> => {
  const { positionals, values } = parseOrUsage(() =>
    parseArgs({
      args: [...argv],
      options: {
        template: { type: 'string', short: 't' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
      allowPositionals: true,
      strict: true,
    }),
  );
  if (values.help) {
    io.out(HELP);
    return 0;
  }
  if (values.version) {
    io.out(version());
    return 0;
  }
  if (positionals.length > 1) throw new UsageError('give one folder');
  let template = parseTemplate(values.template);

  let dir = positionals[0];
  if (dir === undefined) {
    if (io.ask === undefined) throw new UsageError('give the folder of the project (see --help)');
    dir = await askDir(io.ask, io);
  } else {
    const problem = validateWidgetName(basename(resolve(io.cwd, dir)));
    if (problem !== undefined) throw new UsageError(problem);
  }
  if (template === undefined) {
    // Asked only with the folder: `create-bo-widget fleet-report` takes the default template.
    template =
      positionals[0] === undefined && io.ask ? await askTemplate(io.ask, io) : DEFAULT_TEMPLATE;
  }

  const result = await createWidgetProject({ dir: resolve(io.cwd, dir), template });
  // Relative to the current folder when inside it, absolute otherwise.
  const inside = relative(io.cwd, result.dir);
  const where = inside.startsWith('..') || isAbsolute(inside) ? result.dir : inside;
  io.out(
    `Created ${result.name} from the ${template} template${where === '' ? '' : ` in ${where}`}.`,
  );
  io.out('');
  io.out('Next:');
  if (where !== '') io.out(`  cd ${where.includes(' ') ? JSON.stringify(where) : where}`);
  io.out('  npm install');
  io.out('  npm run dev      # the widget in a fake back office');
  io.out('  npm run build    # the zip to publish in the back office');
  return 0;
};

/**
 * Runs the `create-bo-widget` command line (`npm create @vulog/bo-widget`).
 *
 * @param argv - The arguments, without the node executable and the script.
 * @param io - Where it reads and writes.
 * @returns The exit code: 0 on success, 1 when the project cannot be created (folder not empty,
 * file system error…), 2 for a wrong command line, 130 when the user cancels a question.
 */
export const runCli = async (argv: readonly string[], io: CliIo): Promise<number> => {
  try {
    return await run(argv, io);
  } catch (error) {
    io.err(describeError(error));
    if (error instanceof UsageError) return USAGE_ERROR;
    return isCancel(error) ? CANCELLED : 1;
  }
};
