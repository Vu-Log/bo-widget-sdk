#!/usr/bin/env node
/**
 * Regenerates the `aima-api` skill from the AIMA swagger.
 *
 * Usage: node scripts/aima-api/generate.mjs [--input <url|file>] [--out <dir>] [--template <file>]
 *                                           [--summary <file>]
 *
 * - `--input`    swagger URL or local file (default: the public AIMA swagger)
 * - `--out`      skill directory to (re)write (default: plugins/bo-widget/skills/aima-api);
 *                refused when it already holds files but is not a generated skill directory
 * - `--template` SKILL.md template (default: scripts/aima-api/SKILL.template.md)
 * - `--summary`  writes `{stats, warnings, removed, kept}` as JSON, used by the sync workflow
 */
import { realpathSync } from 'node:fs';
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_SPEC_URL, SCHEMAS_FILE } from './config.mjs';
import { GENERATED_MARKER, buildSkill, parseSpec } from './lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');

/** Default output directory of the generated skill. */
export const DEFAULT_OUT_DIR = join(REPO_ROOT, 'plugins/bo-widget/skills/aima-api');

/** Default SKILL.md template. */
export const DEFAULT_TEMPLATE = join(SCRIPT_DIR, 'SKILL.template.md');

/** Download timeout of the swagger, so a hanging host cannot block the scheduled job. */
export const FETCH_TIMEOUT_MS = 60_000;

/**
 * Parses the CLI arguments.
 *
 * @param {string[]} argv - arguments after `node generate.mjs`
 * @returns {{input: string, out: string, template: string, summary: string | null}} options
 * @throws {Error} on an unknown option or a missing value
 */
export function parseArgs(argv) {
  const options = {
    input: DEFAULT_SPEC_URL,
    out: DEFAULT_OUT_DIR,
    template: DEFAULT_TEMPLATE,
    summary: null,
  };
  for (let index = 0; index < argv.length; index += 2) {
    const argument = argv[index];
    const key = argument.startsWith('--') ? argument.slice(2) : null;
    const value = argv[index + 1];
    if (!key || !Object.hasOwn(options, key)) throw new Error(`Unknown option: ${argument}`);
    if (value === undefined || value.startsWith('--'))
      throw new Error(`Missing value for --${key}`);
    options[key] = value;
  }
  return options;
}

/**
 * Reads the swagger from a URL or a local file.
 *
 * @param {string} input - `http(s)://` URL or file path
 * @param {typeof fetch} fetchImpl - fetch implementation (injectable for tests)
 * @returns {Promise<string>} raw spec text
 * @throws {Error} when the download fails (network error, timeout, non-2xx) or the file cannot be read
 */
export async function readSpecText(input, fetchImpl = fetch) {
  if (!/^https?:\/\//.test(input)) return readFile(input, 'utf8');
  let response;
  try {
    response = await fetchImpl(input, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    throw new Error(`Download failed: ${input} → ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`Download failed: ${input} → HTTP ${response.status}`);
  try {
    return await response.text();
  } catch (error) {
    throw new Error(`Download failed: ${input} → ${error.message}`, { cause: error });
  }
}

/**
 * Tells whether a file was produced by this generator (it carries {@link GENERATED_MARKER}).
 *
 * @param {string} path - file path
 * @returns {Promise<boolean>} true for a generated file
 */
async function isGenerated(path) {
  return (await readFile(path, 'utf8')).includes(GENERATED_MARKER);
}

/**
 * Writes the generated files, then removes the stale generated Markdown files of the output
 * directory so an endpoint file dropped from the config does not linger. Hand-written files are
 * never deleted: they are reported in `kept`.
 *
 * @param {string} outDir - skill directory
 * @param {Map<string, string>} files - file name → content
 * @returns {Promise<{removed: string[], kept: string[]}>} deleted stale files, and unknown files left in place
 * @throws {Error} when `outDir` holds files but no generated `schemas.md` (wrong `--out`)
 */
export async function writeSkill(outDir, files) {
  await mkdir(outDir, { recursive: true });
  const existing = (await readdir(outDir)).sort();
  const schemasPath = join(outDir, SCHEMAS_FILE);
  if (
    existing.length > 0 &&
    !(existing.includes(SCHEMAS_FILE) && (await isGenerated(schemasPath)))
  ) {
    throw new Error(
      `Refusing to write into ${outDir}: not empty and not a generated aima-api skill directory`,
    );
  }
  for (const [name, content] of files) await writeFile(join(outDir, name), content);
  const removed = [];
  const kept = [];
  for (const name of existing.filter((candidate) => !files.has(candidate))) {
    const path = join(outDir, name);
    if (name.endsWith('.md') && (await isGenerated(path))) {
      await rm(path);
      removed.push(name);
    } else {
      kept.push(name);
    }
  }
  return { removed, kept };
}

/**
 * Runs the generator end to end.
 *
 * @param {string[]} argv - CLI arguments
 * @param {typeof fetch} fetchImpl - fetch implementation
 * @returns {Promise<{stats: import('./lib.mjs').SkillStats, warnings: string[], removed: string[],
 *   kept: string[]}>} generation report
 * @throws {Error} when an option, the download, the spec or the output directory is invalid
 */
export async function main(argv, fetchImpl = fetch) {
  const options = parseArgs(argv);
  const [specText, template] = await Promise.all([
    readSpecText(options.input, fetchImpl),
    readFile(options.template, 'utf8'),
  ]);
  const { files, warnings, stats } = buildSkill(parseSpec(specText), template);
  const { removed, kept } = await writeSkill(options.out, files);
  kept.forEach((name) => warnings.push(`Unknown file left in the skill directory: ${name}`));
  if (options.summary) {
    await writeFile(
      options.summary,
      `${JSON.stringify({ stats, warnings, removed, kept }, null, 2)}\n`,
    );
  }
  return { stats, warnings, removed, kept };
}

// realpath: Node resolves symlinks in import.meta.url but not in process.argv[1].
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2))
    .then(({ stats, warnings, removed }) => {
      process.stdout.write(
        `aima-api: release ${stats.release}, ${stats.endpointCount} endpoints (${stats.excludedCount} left out), ${stats.schemaCount} schemas\n`,
      );
      removed.forEach((name) => process.stdout.write(`removed stale file: ${name}\n`));
      warnings.forEach((warning) => process.stderr.write(`warning: ${warning}\n`));
    })
    .catch((error) => {
      process.stderr.write(`aima-api generation failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
