import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SPEC_URL, SCHEMAS_FILE, SKILL_FILES } from './config.mjs';
import {
  DEFAULT_OUT_DIR,
  DEFAULT_TEMPLATE,
  describeError,
  FETCH_TIMEOUT_MS,
  formatFailure,
  main,
  parseArgs,
  readSpecText,
  writeSkill,
} from './generate.mjs';
import { GENERATED_MARKER } from './lib.mjs';

const FIXTURE = fileURLToPath(new URL('./__fixtures__/mini-spec.yaml', import.meta.url));
const SCRIPT = fileURLToPath(new URL('./generate.mjs', import.meta.url));
const GENERATED_FILE_COUNT = SKILL_FILES.length + 2; // + schemas.md + SKILL.md

let outDir;
beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'aima-api-'));
});
afterEach(async () => {
  await rm(outDir, { recursive: true, force: true });
});

describe('parseArgs', () => {
  it('uses the defaults', () => {
    expect(parseArgs([])).toEqual({
      input: DEFAULT_SPEC_URL,
      out: DEFAULT_OUT_DIR,
      template: DEFAULT_TEMPLATE,
      summary: null,
    });
  });

  it('writes into the skill of the bo-widget plugin by default', () => {
    expect(DEFAULT_OUT_DIR.split(sep).join('/')).toMatch(/\/plugins\/bo-widget\/skills\/aima-api$/);
  });

  it('reads every option', () => {
    expect(
      parseArgs(['--input', 'a.yaml', '--out', 'dir', '--template', 't.md', '--summary', 's.json']),
    ).toEqual({
      input: 'a.yaml',
      out: 'dir',
      template: 't.md',
      summary: 's.json',
    });
  });

  it.each([
    [['--nope', 'x'], 'Unknown option: --nope'],
    [['input', 'x.yaml'], 'Unknown option: input'],
    [['--toString', 'x'], 'Unknown option: --toString'],
    [['--input'], 'Missing value for --input'],
    [['--input', '--out', 'dir'], 'Missing value for --input'],
  ])('rejects %j', (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(message);
  });
});

describe('readSpecText', () => {
  it('reads a local file', async () => {
    expect(await readSpecText(FIXTURE)).toContain('openapi: 3.1.0');
  });

  it('rejects a missing file', async () => {
    await expect(readSpecText(join(outDir, 'missing.yaml'))).rejects.toThrow(/ENOENT/);
  });

  it('downloads a URL with a timeout signal of FETCH_TIMEOUT_MS', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    try {
      const fetchImpl = vi.fn().mockResolvedValue({ ok: true, text: async () => 'openapi: 3.0.3' });
      expect(await readSpecText('https://example.test/spec.yaml', fetchImpl)).toBe(
        'openapi: 3.0.3',
      );
      expect(timeout).toHaveBeenCalledExactlyOnceWith(FETCH_TIMEOUT_MS);
      const [url, init] = fetchImpl.mock.calls[0];
      expect(url).toBe('https://example.test/spec.yaml');
      expect(init.signal).toBe(timeout.mock.results[0].value);
      expect(FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    } finally {
      timeout.mockRestore();
    }
  });

  it('rejects a non-2xx download', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(readSpecText('https://example.test/spec.yaml', fetchImpl)).rejects.toThrow(
      'Download failed: https://example.test/spec.yaml → HTTP 503',
    );
  });

  it('rejects a body that cannot be read with the URL in the message', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: true, text: () => Promise.reject(new Error('aborted')) });
    await expect(readSpecText('https://example.test/spec.yaml', fetchImpl)).rejects.toThrow(
      'Download failed: https://example.test/spec.yaml → aborted',
    );
  });

  it('keeps the cause of a network error in the message', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(
      new TypeError('fetch failed', {
        cause: Object.assign(new Error('x'), { code: 'ENOTFOUND' }),
      }),
    );
    await expect(readSpecText('https://example.test/spec.yaml', fetchImpl)).rejects.toThrow(
      'Download failed: https://example.test/spec.yaml → fetch failed (ENOTFOUND)',
    );
  });

  it('rejects a network error or a timeout with the URL in the message', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError'),
      );
    await expect(readSpecText('https://example.test/spec.yaml', fetchImpl)).rejects.toThrow(
      'Download failed: https://example.test/spec.yaml → The operation was aborted due to timeout',
    );
  });
});

describe('describeError', () => {
  it.each([
    [new Error('boom'), 'boom'],
    [new Error('fetch failed', { cause: { code: 'ECONNRESET' } }), 'fetch failed (ECONNRESET)'],
    [
      new Error('fetch failed', { cause: new Error('socket hang up') }),
      'fetch failed (socket hang up)',
    ],
    [new Error('same', { cause: new Error('same') }), 'same'],
    [new Error('odd', { cause: 'text cause' }), 'odd (text cause)'],
    ['not an error', 'not an error'],
  ])('describes %s', (error, expected) => {
    expect(describeError(error)).toBe(expected);
  });
});

describe('formatFailure', () => {
  it('prints the stack of the error, then of each cause', () => {
    const root = new Error('root cause');
    const text = formatFailure(new Error('top', { cause: root }));
    expect(text).toMatch(/^Error: top\n\s+at /);
    expect(text).toContain('Caused by: Error: root cause');
  });

  it('prints a non-error cause and survives a cause cycle', () => {
    expect(formatFailure(new Error('top', { cause: 'plain' }))).toContain('Caused by: plain');
    const cyclic = new Error('loop');
    cyclic.cause = cyclic;
    expect(formatFailure(cyclic).match(/loop/g)).toHaveLength(1);
    expect(formatFailure('just text')).toBe('just text');
  });
});

describe('writeSkill', () => {
  const generated = (title) => `# ${title}\n\n> ${GENERATED_MARKER} — do not edit by hand.\n`;

  it('writes into an empty or missing directory', async () => {
    const nested = join(outDir, 'a/b');
    expect(await writeSkill(nested, new Map([['SKILL.md', 'x']]))).toEqual({
      removed: [],
      kept: [],
    });
    expect(await readFile(join(nested, 'SKILL.md'), 'utf8')).toBe('x');
  });

  it('removes stale generated files and keeps hand-written ones', async () => {
    await writeFile(join(outDir, SCHEMAS_FILE), generated('Schemas'));
    await writeFile(join(outDir, 'old-file.md'), generated('Old'));
    await writeFile(join(outDir, 'notes.md'), 'hand-written');
    await writeFile(join(outDir, 'notes.txt'), 'kept');
    const files = new Map([
      ['SKILL.md', 'new'],
      [SCHEMAS_FILE, generated('Schemas v2')],
    ]);

    expect(await writeSkill(outDir, files)).toEqual({
      removed: ['old-file.md'],
      kept: ['notes.md', 'notes.txt'],
    });
    expect((await readdir(outDir)).sort()).toEqual(
      ['SKILL.md', 'notes.md', 'notes.txt', SCHEMAS_FILE].sort(),
    );
    expect(await readFile(join(outDir, SCHEMAS_FILE), 'utf8')).toContain('Schemas v2');
  });

  it('refuses a non-empty directory that is not a generated skill (wrong --out)', async () => {
    await writeFile(join(outDir, 'README.md'), 'project readme');
    await expect(writeSkill(outDir, new Map([['SKILL.md', 'x']]))).rejects.toThrow(
      'Refusing to write into',
    );
    expect(await readdir(outDir)).toEqual(['README.md']);
  });

  it('refuses a directory whose schemas.md is hand-written', async () => {
    await writeFile(join(outDir, SCHEMAS_FILE), 'my own notes');
    await expect(writeSkill(outDir, new Map([['SKILL.md', 'x']]))).rejects.toThrow(
      'Refusing to write into',
    );
  });
});

describe('main', () => {
  it('generates the skill and the summary from a local spec, then regenerates in place', async () => {
    const summary = join(outDir, 'summary.json');
    const skillDir = join(outDir, 'skill');
    const report = await main(['--input', FIXTURE, '--out', skillDir, '--summary', summary]);

    expect(report.stats.endpointCount).toBe(14);
    expect(await readdir(skillDir)).toHaveLength(GENERATED_FILE_COUNT);
    expect(await readdir(skillDir)).not.toContain('internal.md');
    expect(await readFile(join(skillDir, 'SKILL.md'), 'utf8')).toContain('**Release 9.99**');
    expect(JSON.parse(await readFile(summary, 'utf8'))).toEqual({
      stats: report.stats,
      warnings: report.warnings,
      removed: [],
      kept: [],
    });

    await writeFile(join(skillDir, 'notes.md'), 'hand-written');
    const second = await main(['--input', FIXTURE, '--out', skillDir]);
    expect(second.kept).toEqual(['notes.md']);
    expect(second.removed).toEqual([]);
    expect(await readFile(join(skillDir, 'SKILL.md'), 'utf8')).toContain('**Release 9.99**');
    expect(second.warnings).toContain('Unknown file left in the skill directory: notes.md');
  });

  it('rejects an invalid spec without writing anything', async () => {
    const bad = join(outDir, 'bad.yaml');
    await writeFile(bad, 'title: nope');
    const skillDir = join(outDir, 'skill');
    await expect(main(['--input', bad, '--out', skillDir])).rejects.toThrow('missing `openapi`');
    await expect(readdir(skillDir)).rejects.toThrow(/ENOENT/);
  });

  it('refuses a wrong --out without touching its files', async () => {
    const project = join(outDir, 'project');
    await mkdir(project);
    await writeFile(join(project, 'CHANGELOG.md'), 'keep me');
    await expect(main(['--input', FIXTURE, '--out', project])).rejects.toThrow(
      'Refusing to write into',
    );
    expect(await readdir(project)).toEqual(['CHANGELOG.md']);
  });
});

describe('CLI', () => {
  const run = promisify(execFile);

  it('runs when invoked through a symlink', async () => {
    const link = join(outDir, 'linked-generate.mjs');
    await symlink(SCRIPT, link);
    const { stdout } = await run('node', [
      link,
      '--input',
      FIXTURE,
      '--out',
      join(outDir, 'skill'),
    ]);
    expect(stdout).toContain('aima-api: release 9.99');
  });

  it('prints a report and exits 0', async () => {
    const { stdout, stderr } = await run('node', [SCRIPT, '--input', FIXTURE, '--out', outDir]);
    expect(stdout).toContain('aima-api: release 9.99, 14 endpoints (11 left out), 4 schemas');
    expect(stdout).toContain(
      'left out: unknownBasePath 1, outsideGateway 1, deprecatedOrInternal 5, excludedTag 3, excludedPathSegment 1',
    );
    expect(stderr).toContain('warning: Tag not mapped');
  });

  it('exits 1 on failure', async () => {
    await expect(
      run('node', [
        SCRIPT,
        '--input',
        join(outDir, 'missing.yaml'),
        '--out',
        join(outDir, 'skill'),
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringMatching(/aima-api generation failed: .*ENOENT[\s\S]*\n\s+at /),
    });
  });
});
