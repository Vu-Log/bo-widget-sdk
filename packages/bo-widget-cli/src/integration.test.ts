import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { boWidget } from '@vulog/bo-widget-vite';
import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli, type CliIo } from './cli.js';

let root: string | undefined;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

const io = (cwd: string, out: string[], err: string[]): CliIo => ({
  cwd,
  env: {},
  out: (line) => out.push(line),
  err: (line) => err.push(line),
  readStdinLine: async () => '',
  runVite: async () => 0,
});

describe('vite build, then bo-widget pack and validate', () => {
  it('packs the build of the Vite plugin into a zip that validates', async () => {
    root = await mkdtemp(join(tmpdir(), 'bo-widget-cli-e2e-'));
    const files = {
      'package.json': JSON.stringify({ name: '@acme/fleet-report', version: '2.0.1' }),
      'src/main.ts': 'export default class FleetReport extends HTMLElement {}',
      'public/icon.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
    };
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [boWidget({ name: 'Fleet report', icon: 'icon.svg', permissions: ['apiInfo'] })],
    });
    const out: string[] = [];
    const err: string[] = [];

    expect(await runCli(['pack'], io(root, out, err))).toBe(0);
    expect(await runCli(['validate', 'fleet-report-2.0.1.zip'], io(root, out, err))).toBe(0);

    expect(err).toEqual([]);
    expect(out).toEqual([
      'Wrote fleet-report-2.0.1.zip: publish it in the back office.',
      'fleet-report-2.0.1.zip: fleet-report 2.0.1 is valid',
    ]);
    const zip = await readFile(join(root, 'fleet-report-2.0.1.zip'));
    expect(zip.includes(Buffer.from('widget.json'))).toBe(true);
  });
});
