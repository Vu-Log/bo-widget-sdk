import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli, type CliIo } from './cli.js';
import { BoWidgetCliError } from './errors.js';
import { createZip } from './zip.js';

const MANIFEST = {
  manifestVersion: 1,
  id: 'fleet-report',
  name: 'Fleet report',
  version: '1.2.0',
  runtime: { type: 'webcomponent', entry: 'index.js' },
  protocol: { version: 2 },
};

const file = (path: string, content: string) => ({ path, data: Buffer.from(content) });
const VALID_FILES = [
  file('widget.json', JSON.stringify(MANIFEST)),
  file('index.js', 'export default class extends HTMLElement {}'),
];

let root: string;
let out: string[];
let err: string[];
/** The tests replace some functions of the IO. */
let io: { -readonly [Key in keyof CliIo]: CliIo[Key] };

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'bo-widget-cli-run-'));
  out = [];
  err = [];
  io = {
    cwd: root,
    env: { PATH: '/bin' },
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    readStdinLine: vi.fn(async () => ''),
    runVite: vi.fn(async () => 0),
  };
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('runCli', () => {
  describe('help and version', () => {
    it('prints the help on --help', async () => {
      expect(await runCli(['--help'], io)).toBe(0);
      expect(out.join('\n')).toContain('Usage: bo-widget <command>');
    });

    it('prints the help on stderr and fails without command', async () => {
      expect(await runCli([], io)).toBe(2);
      expect(err.join('\n')).toContain('Usage: bo-widget <command>');
    });

    it('prints the version of the package', async () => {
      const { version } = JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8'),
      ) as { version: string };

      expect(await runCli(['--version'], io)).toBe(0);
      expect(out).toEqual([version]);
    });

    it.each(['publish', 'toString', '__proto__'])(
      'refuses the unknown command %s',
      async (name) => {
        expect(await runCli([name], io)).toBe(2);
        expect(err[0]).toContain(`unknown command "${name}"`);
      },
    );
  });

  describe('validate', () => {
    it('accepts a valid zip', async () => {
      await writeFile(join(root, 'w.zip'), createZip(VALID_FILES));

      expect(await runCli(['validate', 'w.zip'], io)).toBe(0);
      expect(out).toEqual(['w.zip: fleet-report 1.2.0 is valid']);
      expect(err).toEqual([]);
    });

    it('accepts a zip with warnings, and prints them', async () => {
      await writeFile(
        join(root, 'w.zip'),
        createZip([
          file('widget.json', JSON.stringify(MANIFEST)),
          file('index.js', 'customElements.define("a-b", X)'),
        ]),
      );

      expect(await runCli(['validate', 'w.zip'], io)).toBe(0);
      expect(err).toEqual([expect.stringMatching(/^warning custom-element-define: "index\.js"/)]);
    });

    it('refuses an invalid zip and prints every error', async () => {
      await writeFile(
        join(root, 'w.zip'),
        createZip([file('index.js', 'x'), file('readme.txt', 'x')]),
      );

      expect(await runCli(['validate', 'w.zip'], io)).toBe(1);
      expect(err).toEqual([
        expect.stringMatching(/^error forbidden-extension: "readme\.txt"/),
        expect.stringMatching(/^error manifest-missing: /),
        'w.zip: refused (2 error(s))',
      ]);
    });

    it('refuses a file that is not a zip', async () => {
      await writeFile(join(root, 'w.zip'), 'hello');

      expect(await runCli(['validate', 'w.zip'], io)).toBe(1);
      expect(err[0]).toBe('error invalid-archive: The file is not a zip archive');
    });

    it('validates the only zip of the current folder when none is given', async () => {
      await writeFile(join(root, 'fleet-report-1.2.0.zip'), createZip(VALID_FILES));

      expect(await runCli(['validate'], io)).toBe(0);
      expect(out[0]).toContain('fleet-report-1.2.0.zip');
    });

    it.each([
      [[], 'no .zip in the current folder'],
      [['a.zip', 'b.zip'], 'several .zip in the current folder (a.zip, b.zip)'],
    ])('asks for the zip when the folder holds %j', async (zips, message) => {
      for (const zip of zips) await writeFile(join(root, zip), createZip(VALID_FILES));

      expect(await runCli(['validate'], io)).toBe(2);
      expect(err[0]).toContain(message);
    });

    it('fails when the zip does not exist', async () => {
      expect(await runCli(['validate', 'missing.zip'], io)).toBe(1);
      expect(err[0]).toMatch(/^bo-widget validate: ENOENT/);
    });

    it('refuses several zips and unknown options', async () => {
      expect(await runCli(['validate', 'a.zip', 'b.zip'], io)).toBe(2);
      expect(await runCli(['validate', '--force'], io)).toBe(2);
      expect(err[1]).toContain("Unknown option '--force'");
    });
  });

  describe('pack', () => {
    const writeDist = async (dir = 'dist') => {
      await mkdir(join(root, dir));
      for (const { path, data } of VALID_FILES) await writeFile(join(root, dir, path), data);
    };

    it('packs dist into the current folder by default', async () => {
      await writeDist();

      expect(await runCli(['pack'], io)).toBe(0);
      expect(out).toEqual(['Wrote fleet-report-1.2.0.zip: publish it in the back office.']);
      expect(await runCli(['validate', 'fleet-report-1.2.0.zip'], io)).toBe(0);
    });

    it('packs the folder given into --out-dir', async () => {
      await writeDist('build');

      expect(await runCli(['pack', 'build', '--out-dir', 'release'], io)).toBe(0);
      expect(out[0]).toBe(
        `Wrote ${join('release', 'fleet-report-1.2.0.zip')}: publish it in the back office.`,
      );
    });

    it('packs a bundle with warnings, and prints them', async () => {
      await writeDist();
      await writeFile(join(root, 'dist', 'index.js'), 'customElements.define("a-b", X)');

      expect(await runCli(['pack'], io)).toBe(0);
      expect(err).toEqual([expect.stringMatching(/^warning custom-element-define: "index\.js"/)]);
    });

    it('packs twice into the build folder itself, leaving out the earlier zip', async () => {
      await writeDist();

      expect(await runCli(['pack', '--out-dir', 'dist'], io)).toBe(0);
      expect(await runCli(['pack', '--out-dir', 'dist'], io)).toBe(0);
      expect(err).toEqual([]);
    });

    it('prints the errors and fails when the bundle would be refused', async () => {
      await mkdir(join(root, 'dist'));
      await writeFile(join(root, 'dist', 'index.js'), 'x');

      expect(await runCli(['pack'], io)).toBe(1);
      expect(err).toEqual([
        expect.stringMatching(/^error manifest-missing: /),
        'dist: not packed (1 error(s))',
      ]);
    });

    it('fails when the folder does not exist', async () => {
      expect(await runCli(['pack'], io)).toBe(1);
      expect(err).toEqual([
        `bo-widget pack: ${join(root, 'dist')} does not exist or is not a folder: build the widget first`,
      ]);
    });

    it('refuses --out-dir without value', async () => {
      expect(await runCli(['pack', '--out-dir'], io)).toBe(2);
    });
  });

  describe('dev', () => {
    it('runs vite with the token, URL and key of the command line', async () => {
      io.runVite = vi.fn(async () => 130);

      const code = await runCli(
        [
          'dev',
          '--token',
          ' jwt ',
          '--api-url',
          'https://api.example.com/boapi/proxy/',
          '--api-key',
          'key',
          '--',
          '--port',
          '4000',
        ],
        io,
      );

      expect(code).toBe(130);
      expect(io.runVite).toHaveBeenCalledWith(root, ['--port', '4000'], {
        PATH: '/bin',
        BO_WIDGET_TOKEN: 'jwt',
        BO_WIDGET_API_URL: 'https://api.example.com/boapi/proxy/',
        BO_WIDGET_API_KEY: 'key',
      });
    });

    it('reads the token from the standard input with --token -', async () => {
      io.readStdinLine = vi.fn(async () => 'Bearer jwt\r');

      expect(await runCli(['dev', '--token', '-'], io)).toBe(0);
      expect(io.runVite).toHaveBeenCalledWith(root, [], {
        PATH: '/bin',
        BO_WIDGET_TOKEN: 'Bearer jwt',
      });
    });

    it('runs vite in mock mode without token', async () => {
      expect(await runCli(['dev'], io)).toBe(0);
      expect(io.runVite).toHaveBeenCalledWith(root, [], { PATH: '/bin' });
    });

    it.each([
      [['dev', '--token', '  '], async () => ''],
      [['dev', '--token', '-'], async () => ''],
    ])('refuses an empty token (%j)', async (argv, readStdinLine) => {
      io.readStdinLine = readStdinLine;

      expect(await runCli(argv, io)).toBe(2);
      expect(err[0]).toBe('bo-widget dev: --token is empty');
      expect(io.runVite).not.toHaveBeenCalled();
    });

    it('prints the stack and causes of an unexpected error, as a bug to report', async () => {
      io.runVite = vi.fn(async () => {
        throw new TypeError('boom', { cause: new Error('root cause') });
      });

      expect(await runCli(['dev'], io)).toBe(1);
      expect(err[0]).toMatch(
        /^bo-widget dev: unexpected error, please report it\nTypeError: boom\n {4}at /,
      );
      expect(err[0]).toContain('Caused by: Error: root cause');
    });

    it('reports an internal error of Node.js as a bug, not as a user error', async () => {
      io.runVite = vi.fn(async () => {
        throw Object.assign(new TypeError('bad argument'), { code: 'ERR_INVALID_ARG_TYPE' });
      });

      expect(await runCli(['dev'], io)).toBe(1);
      expect(err[0]).toMatch(/^bo-widget dev: unexpected error, please report it\n/);
    });

    it('stops on a cycle of causes', async () => {
      const first = new Error('first');
      const second = new Error('second', { cause: first });
      Object.assign(first, { cause: second });
      io.runVite = vi.fn(async () => {
        throw first;
      });

      expect(await runCli(['dev'], io)).toBe(1);
      expect(err[0]?.match(/Caused by:/g)).toHaveLength(1);
    });

    it('prints a value thrown that is not an error', async () => {
      io.runVite = vi.fn(async () => {
        throw 'nope';
      });

      expect(await runCli(['dev'], io)).toBe(1);
      expect(err).toEqual(['bo-widget dev: nope']);
    });

    it('fails with the error of vite when it cannot run', async () => {
      io.runVite = vi.fn(async () => {
        throw new BoWidgetCliError(`vite is not installed in ${root}: run npm install first`);
      });

      expect(await runCli(['dev'], io)).toBe(1);
      expect(err[0]).toBe(`bo-widget dev: vite is not installed in ${root}: run npm install first`);
    });
  });
});
