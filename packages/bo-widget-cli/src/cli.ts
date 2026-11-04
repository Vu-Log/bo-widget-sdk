import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { validateWidgetArchive, type WidgetArchiveIssue } from './archive.js';
import { devEnv, type runVite } from './dev.js';
import { BoWidgetCliError } from './errors.js';
import { packWidget } from './pack.js';

/** What the CLI reads from and writes to: the real process in `bin.ts`, fakes in tests. */
export interface CliIo {
  /** Folder the paths of the command line are relative to. */
  readonly cwd: string;
  /** Environment passed on to `vite`. */
  readonly env: NodeJS.ProcessEnv;
  /** Writes a line of output. */
  readonly out: (line: string) => void;
  /** Writes a line of error. */
  readonly err: (line: string) => void;
  /** Reads the first line of the standard input (`--token -`). */
  readonly readStdinLine: () => Promise<string>;
  /** Runs `vite` in a folder and resolves with its exit code. */
  readonly runVite: typeof runVite;
}

/** Exit code of a wrong command line. */
const USAGE_ERROR = 2;

const HELP = `Usage: bo-widget <command> [options]
       bo-widget --help | --version

Commands:
  validate [zip]       Checks a widget zip with the rules applied on publication.
                       Without argument, the only .zip of the current folder.
  pack [dir]           Zips the content of dir (default: dist) into {id}-{version}.zip,
                       after checking it with the same rules.
      --out-dir <dir>  Folder of the zip (default: the current folder).
  dev [-- vite args]   Runs the vite dev server with the fake back office.
      --token <jwt>    Token pasted from the back office of a Vulog environment ("-" reads
                       it from the standard input), to call its API (token mode).
      --api-url <url>  Base URL of its API (.../boapi/proxy/).
      --api-key <key>  Its API key.

Instead of a command:
  -h, --help           Shows this help.
  -v, --version        Shows the version.

The zip is published in the back office: Configuration > Widgets.`;

class UsageError extends Error {}

const version = (): string =>
  (createRequire(import.meta.url)('../package.json') as { version: string }).version;

const formatIssue = (kind: 'error' | 'warning', issue: WidgetArchiveIssue): string =>
  `${kind} ${issue.code}: ${issue.message}`;

/** Runs `parseArgs`, turning its errors (unknown option, missing value…) into usage errors. */
const parseOrUsage = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    throw new UsageError((error as Error).message, { cause: error });
  }
};

/** The zip to validate: the one given, or the only `.zip` of the current folder. */
const findZip = async (cwd: string, given: string | undefined): Promise<string> => {
  if (given !== undefined) return resolve(cwd, given);
  const zips = (await readdir(cwd)).filter((name) => name.endsWith('.zip'));
  if (zips.length !== 1) {
    throw new UsageError(
      zips.length === 0
        ? 'no .zip in the current folder: give the path of the zip'
        : `several .zip in the current folder (${zips.join(', ')}): give the path of the zip`,
    );
  }
  return resolve(cwd, zips[0] as string);
};

const validateCommand = async (args: string[], io: CliIo): Promise<number> => {
  const { positionals } = parseOrUsage(() =>
    parseArgs({ args, allowPositionals: true, strict: true }),
  );
  if (positionals.length > 1) throw new UsageError('validate takes one zip');
  const file = await findZip(io.cwd, positionals[0]);
  const result = validateWidgetArchive(await readFile(file));
  const name = relative(io.cwd, file) || file;
  for (const warning of result.warnings) io.err(formatIssue('warning', warning));
  if (!result.ok) {
    for (const error of result.errors) io.err(formatIssue('error', error));
    io.err(`${name}: refused (${result.errors.length} error(s))`);
    return 1;
  }
  io.out(`${name}: ${result.manifest.id} ${result.manifest.version} is valid`);
  return 0;
};

const packCommand = async (args: string[], io: CliIo): Promise<number> => {
  const { positionals, values } = parseOrUsage(() =>
    parseArgs({
      args,
      options: { 'out-dir': { type: 'string' } },
      allowPositionals: true,
      strict: true,
    }),
  );
  if (positionals.length > 1) throw new UsageError('pack takes one folder');
  const dir = resolve(io.cwd, positionals[0] ?? 'dist');
  const outDir = resolve(io.cwd, values['out-dir'] ?? '.');
  const result = await packWidget({ dir, outDir });
  for (const warning of result.warnings) io.err(formatIssue('warning', warning));
  if (!result.ok) {
    for (const error of result.errors) io.err(formatIssue('error', error));
    io.err(`${relative(io.cwd, dir) || dir}: not packed (${result.errors.length} error(s))`);
    return 1;
  }
  io.out(`Wrote ${relative(io.cwd, result.file)}: publish it in the back office.`);
  return 0;
};

const devCommand = async (args: string[], io: CliIo): Promise<number> => {
  const { positionals, values } = parseOrUsage(() =>
    parseArgs({
      args,
      options: {
        token: { type: 'string' },
        'api-url': { type: 'string' },
        'api-key': { type: 'string' },
      },
      allowPositionals: true,
      strict: true,
    }),
  );
  let token = values.token;
  if (token === '-') token = await io.readStdinLine();
  if (token !== undefined) {
    token = token.trim();
    if (token === '') throw new UsageError('--token is empty');
  }
  const env = devEnv(io.env, { token, apiUrl: values['api-url'], apiKey: values['api-key'] });
  return io.runVite(io.cwd, positionals, env);
};

/**
 * Error lines of a failed command. An expected failure (wrong command line, a file the user can
 * fix, a Node.js file system error) prints its message; anything else is a bug, printed with its
 * stack and causes so that it can be reported.
 */
const describeError = (command: string, error: unknown): string => {
  if (!(error instanceof Error)) return `bo-widget ${command}: ${String(error)}`;
  const expected =
    error instanceof UsageError ||
    error instanceof BoWidgetCliError ||
    // A system error (file not found, permission denied…), not an internal ERR_* of Node.js.
    typeof (error as NodeJS.ErrnoException).syscall === 'string';
  if (expected) return `bo-widget ${command}: ${error.message}`;
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
    `bo-widget ${command}: unexpected error, please report it`,
    error.stack ?? error.message,
    ...causes,
  ].join('\n');
};

const COMMANDS: Record<string, (args: string[], io: CliIo) => Promise<number>> = {
  validate: validateCommand,
  pack: packCommand,
  dev: devCommand,
};

/**
 * Runs the `bo-widget` command line.
 *
 * @param argv - The arguments, without the node executable and the script.
 * @param io - Where it reads and writes.
 * @returns The exit code: 0 on success, 1 when the command fails (archive refused, file not
 * found…), 2 for a wrong command line; for `dev`, the exit code of `vite`.
 */
export const runCli = async (argv: readonly string[], io: CliIo): Promise<number> => {
  const [command, ...args] = argv;
  if (command === undefined || command === '-h' || command === '--help') {
    (command === undefined ? io.err : io.out)(HELP);
    return command === undefined ? USAGE_ERROR : 0;
  }
  if (command === '-v' || command === '--version') {
    io.out(version());
    return 0;
  }
  const run = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined;
  if (!run) {
    io.err(`bo-widget: unknown command "${command}"\n\n${HELP}`);
    return USAGE_ERROR;
  }
  try {
    return await run(args, io);
  } catch (error) {
    io.err(describeError(command, error));
    return error instanceof UsageError ? USAGE_ERROR : 1;
  }
};
