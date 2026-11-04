import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };
import { runCli, type CliIo } from './cli.js';
import * as create from './create.js';

const roots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

/** A fake terminal: `answers` are given in order to the questions, `ask: false` for no terminal. */
const fakeIo = async (answers: string[] | false = false) => {
  const cwd = await mkdtemp(join(tmpdir(), 'create-bo-widget-cli-'));
  roots.push(cwd);
  const out: string[] = [];
  const err: string[] = [];
  const questions: string[] = [];
  const io: CliIo = {
    cwd,
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    ask:
      answers === false
        ? undefined
        : async (question) => {
            questions.push(question);
            const answer = answers.shift();
            if (answer === undefined) throw new Error(`unexpected question: ${question}`);
            return answer;
          },
  };
  return { io, cwd, out, err, questions };
};

/** The template a project was created from, told by its framework dependency. */
const templateOf = async (dir: string): Promise<string> => {
  const { dependencies, devDependencies } = JSON.parse(
    await readFile(join(dir, 'package.json'), 'utf8'),
  ) as Record<string, Record<string, string>>;
  const all = { ...dependencies, ...devDependencies };
  if ('react' in all) return 'react-mui';
  return ['svelte', 'vue', 'lit'].find((framework) => framework in all) ?? 'vanilla';
};

describe('runCli', () => {
  it('prints the help', async () => {
    const { io, out } = await fakeIo();

    expect(await runCli(['--help'], io)).toBe(0);
    expect(out.join('\n')).toMatch(/Usage: npm create @vulog\/bo-widget@next/);
    expect(out.join('\n')).toMatch(/react-mui +React and MUI/);
  });

  it('prints the version', async () => {
    const { io, out } = await fakeIo();

    expect(await runCli(['-v'], io)).toBe(0);
    expect(out).toEqual([packageJson.version]);
  });

  it('creates the project from the default template, with the next steps', async () => {
    const { io, cwd, out } = await fakeIo();

    expect(await runCli(['fleet-report'], io)).toBe(0);

    expect(await templateOf(join(cwd, 'fleet-report'))).toBe('react-mui');
    expect(out).toEqual([
      'Created fleet-report from the react-mui template in fleet-report.',
      '',
      'Next:',
      '  cd fleet-report',
      '  npm install',
      '  npm run dev      # the widget in a fake back office',
      '  npm run build    # the zip to publish in the back office',
    ]);
  });

  it.each([
    ['--template', 'vue'],
    ['-t', 'svelte'],
  ])('creates the project from the template of %s', async (flag, template) => {
    const { io, cwd } = await fakeIo(['unused']);

    expect(await runCli(['fleet-report', flag, template], io)).toBe(0);

    expect(await templateOf(join(cwd, 'fleet-report'))).toBe(template);
  });

  it('creates the project in the current folder with "."', async () => {
    const { io, cwd, out } = await fakeIo();
    const dir = join(cwd, 'fleet-report');
    await mkdir(dir);

    expect(await runCli(['.', '-t', 'lit'], { ...io, cwd: dir })).toBe(0);

    expect(await templateOf(dir)).toBe('lit');
    expect(out[0]).toBe('Created fleet-report from the lit template.');
    expect(out).not.toContainEqual(expect.stringMatching(/^ {2}cd /));
  });

  it('quotes a folder with spaces in the next steps', async () => {
    const { io, cwd, out } = await fakeIo();
    await mkdir(join(cwd, 'my widgets'));

    expect(await runCli(['my widgets/fleet-report', '-t', 'vanilla'], io)).toBe(0);

    expect(out).toContainEqual('  cd "my widgets/fleet-report"');
  });

  it('shows the absolute folder when it is outside the current folder', async () => {
    const { io, cwd, out } = await fakeIo();
    const other = await fakeIo();

    expect(await runCli([join(other.cwd, 'fleet-report'), '-t', 'vanilla'], io)).toBe(0);

    expect(out).toContainEqual(`  cd ${join(other.cwd, 'fleet-report')}`);
    expect(existsSync(join(cwd, 'fleet-report'))).toBe(false);
  });

  it('asks for the name and the template in a terminal, with defaults', async () => {
    const { io, cwd, questions } = await fakeIo(['', '']);

    expect(await runCli([], io)).toBe(0);

    expect(questions).toEqual([
      'Widget id, also the folder of the project (my-widget): ',
      'Template (1, react-mui): ',
    ]);
    expect(await templateOf(join(cwd, 'my-widget'))).toBe('react-mui');
  });

  it('asks again for an invalid name or template', async () => {
    const { io, cwd, err } = await fakeIo([
      'Fleet Report',
      'fleet-report',
      '0',
      '9',
      'angular',
      '3',
    ]);

    expect(await runCli([], io)).toBe(0);

    expect(err).toEqual([
      expect.stringMatching(/"Fleet Report" is not a valid widget id/),
      'unknown template "0": answer a number from 1 to 5 or a name',
      'unknown template "9": answer a number from 1 to 5 or a name',
      'unknown template "angular": answer a number from 1 to 5 or a name',
    ]);
    expect(await templateOf(join(cwd, 'fleet-report'))).toBe('vue');
  });

  it('takes a template by name', async () => {
    const { io, cwd } = await fakeIo(['fleet-report', 'svelte']);

    expect(await runCli([], io)).toBe(0);

    expect(await templateOf(join(cwd, 'fleet-report'))).toBe('svelte');
  });

  it('asks nothing in a terminal when the folder is given: the default template', async () => {
    const { io, cwd, questions } = await fakeIo([]);

    expect(await runCli(['fleet-report'], io)).toBe(0);

    expect(questions).toEqual([]);
    expect(await templateOf(join(cwd, 'fleet-report'))).toBe('react-mui');
  });

  it('only asks for the name when the template is given', async () => {
    const { io, questions } = await fakeIo(['fleet-report']);

    expect(await runCli(['-t', 'lit'], io)).toBe(0);

    expect(questions).toHaveLength(1);
  });

  it.each([
    [['--nope'], /Unknown option '--nope'/],
    [['a', 'b'], /give one folder/],
    [
      ['fleet-report', '-t', 'angular'],
      /unknown template "angular": choose one of react-mui, svelte, vue, lit, vanilla/,
    ],
    [['Fleet-Report'], /"Fleet-Report" is not a valid widget id/],
    [[], /give the folder of the project/],
  ])('exits with 2 on a wrong command line: %j', async (argv, message) => {
    const { io, err } = await fakeIo();

    expect(await runCli(argv, io)).toBe(2);
    expect(err).toEqual([expect.stringMatching(message)]);
  });

  it('exits with 1 when the folder is not empty', async () => {
    const { io, cwd, err } = await fakeIo();
    await mkdir(join(cwd, 'fleet-report'));
    await writeFile(join(cwd, 'fleet-report', 'index.html'), '');

    expect(await runCli(['fleet-report'], io)).toBe(1);
    expect(err).toEqual([expect.stringMatching(/^create-bo-widget: .*fleet-report is not empty/)]);
  });

  it('exits with 1 on a file system error', async () => {
    const { io, cwd, err } = await fakeIo();
    await writeFile(join(cwd, 'file'), '');

    expect(await runCli(['file/fleet-report'], io)).toBe(1);
    expect(err).toEqual([expect.stringMatching(/^create-bo-widget: ENOTDIR/)]);
  });

  it('exits with 130 when a question is cancelled', async () => {
    const { io, err } = await fakeIo();
    const cancelled = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });

    expect(await runCli([], { ...io, ask: () => Promise.reject(cancelled) })).toBe(130);
    expect(err).toEqual(['create-bo-widget: cancelled, nothing created']);
  });

  it('reports an unexpected error with its stack', async () => {
    const { io, err } = await fakeIo();
    vi.spyOn(create, 'createWidgetProject').mockRejectedValue(new Error('bug'));

    expect(await runCli(['fleet-report'], io)).toBe(1);
    expect(err[0]).toMatch(
      /^create-bo-widget: unexpected error, please report it\nError: bug\n {4}at /,
    );
  });

  it('reports the causes of an unexpected error, stopping on a cycle', async () => {
    const { io, err } = await fakeIo();
    const root = new Error('root cause');
    const error = new Error('bug', { cause: new Error('middle', { cause: root }) });
    root.cause = error;
    vi.spyOn(create, 'createWidgetProject').mockRejectedValue(error);

    expect(await runCli(['fleet-report'], io)).toBe(1);
    expect(err[0]).toMatch(/\nCaused by: Error: middle\n[\s\S]*\nCaused by: Error: root cause\n/);
    expect(err[0]?.match(/Caused by/g)).toHaveLength(2);
  });

  it('reports a thrown value that is not an error', async () => {
    const { io, err } = await fakeIo();
    vi.spyOn(create, 'createWidgetProject').mockRejectedValue('oops');

    expect(await runCli(['fleet-report'], io)).toBe(1);
    expect(err).toEqual(['create-bo-widget: oops']);
  });
});
