import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WIDGET_ID_MAX_LENGTH, WIDGET_ID_PATTERN } from '@vulog/bo-widget-sdk/manifest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWidgetProject,
  titleFromName,
  validateWidgetName,
  WIDGET_NAME_MAX_LENGTH,
  WIDGET_NAME_PATTERN,
} from './create.js';
import { CreateBoWidgetError } from './errors.js';
import { TEMPLATES, type TemplateName } from './templates.js';

// The file system, with failures that the tests can inject in writeFile and rm.
const failures = vi.hoisted(() => ({ writeAfter: Infinity, rm: false, writes: 0 }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...fs,
    writeFile: (async (...args: Parameters<typeof fs.writeFile>) => {
      if (++failures.writes > failures.writeAfter) {
        throw Object.assign(new Error('ENOSPC: no space left on device'), {
          code: 'ENOSPC',
          syscall: 'write',
        });
      }
      return fs.writeFile(...args);
    }) as typeof fs.writeFile,
    rm: (async (...args: Parameters<typeof fs.rm>) => {
      if (failures.rm) throw Object.assign(new Error('EBUSY: resource busy'), { code: 'EBUSY' });
      return fs.rm(...args);
    }) as typeof fs.rm,
  };
});

const roots: string[] = [];

const tempDir = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'create-bo-widget-'));
  roots.push(root);
  return root;
};

afterEach(async () => {
  failures.writeAfter = Infinity;
  failures.rm = false;
  failures.writes = 0;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('validateWidgetName', () => {
  it('follows the widget id rule of the manifest', () => {
    expect(WIDGET_NAME_PATTERN.source).toBe(WIDGET_ID_PATTERN.source);
    expect(WIDGET_NAME_MAX_LENGTH).toBe(WIDGET_ID_MAX_LENGTH);
  });

  it.each(['fleet-report', 'a', 'report2', 'x'.repeat(63)])('accepts %s', (name) => {
    expect(validateWidgetName(name)).toBeUndefined();
  });

  it.each([
    ['', /empty/],
    ['Fleet-report', /not a valid widget id/],
    ['fleet--report', /not a valid widget id/],
    ['-fleet', /not a valid widget id/],
    ['fleet_report', /not a valid widget id/],
    ['@acme/fleet', /not a valid widget id/],
    ['x'.repeat(64), /longer than 63/],
  ])('refuses "%s"', (name, problem) => {
    expect(validateWidgetName(name)).toMatch(problem);
  });
});

describe('titleFromName', () => {
  it('turns the id into words, the first one capitalized', () => {
    expect(titleFromName('fleet-report')).toBe('Fleet report');
    expect(titleFromName('a')).toBe('A');
    expect(titleFromName('2-wheels')).toBe('2 wheels');
  });
});

describe('createWidgetProject', () => {
  it.each(Object.keys(TEMPLATES) as TemplateName[])(
    'creates a project from the %s template',
    async (template) => {
      const dir = join(await tempDir(), 'fleet-report');

      const result = await createWidgetProject({ dir, template });

      expect(result).toMatchObject({ dir, name: 'fleet-report', title: 'Fleet report' });
      expect(result.files).toEqual(
        expect.arrayContaining([
          '.gitignore',
          '.github/workflows/build.yml',
          '.github/dependabot.yml',
          '.gitlab-ci.yml',
          'AGENTS.md',
          'CLAUDE.md',
          'README.md',
          'package.json',
          'vite.config.ts',
          'widget.config.ts',
        ]),
      );
      expect(result.files.some((file) => file.startsWith('_'))).toBe(false);
      const packageJson = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('fleet-report');
      expect(await readFile(join(dir, 'widget.config.ts'), 'utf8')).toContain(
        "name: 'Fleet report'",
      );
      expect(await readFile(join(dir, 'README.md'), 'utf8')).toMatch(/^# Fleet report\n/);
      expect(await readFile(join(dir, 'AGENTS.md'), 'utf8')).toContain('**Fleet report**');
      expect(await readFile(join(dir, 'AGENTS.md'), 'utf8')).toContain(
        '`fleet-report-<version>.zip`',
      );
      for (const file of result.files) {
        const content = await readFile(join(dir, file), 'utf8');
        expect(content, file).not.toMatch(/\{\{(name|title)\}\}/);
      }
    },
  );

  it('accepts an existing empty folder, or one with only .git and .DS_Store', async () => {
    const root = await tempDir();
    await mkdir(join(root, 'empty'));
    await mkdir(join(root, 'cloned', '.git'), { recursive: true });
    await writeFile(join(root, 'cloned', '.DS_Store'), '');

    await expect(
      createWidgetProject({ dir: join(root, 'empty'), template: 'vanilla' }),
    ).resolves.toMatchObject({
      name: 'empty',
    });
    await expect(
      createWidgetProject({ dir: join(root, 'cloned'), template: 'vanilla' }),
    ).resolves.toMatchObject({ name: 'cloned' });
  });

  it('refuses a folder that is not empty, and writes nothing', async () => {
    const dir = join(await tempDir(), 'fleet-report');
    await mkdir(dir);
    await writeFile(join(dir, 'notes.txt'), 'keep me');

    await expect(createWidgetProject({ dir, template: 'vanilla' })).rejects.toThrow(
      new CreateBoWidgetError(`${dir} is not empty: choose a new or an empty folder`),
    );
    expect(await readFile(join(dir, 'notes.txt'), 'utf8')).toBe('keep me');
  });

  it('refuses a path that is a file', async () => {
    const dir = join(await tempDir(), 'fleet-report');
    await writeFile(dir, '');

    await expect(createWidgetProject({ dir, template: 'vanilla' })).rejects.toThrow(
      /exists and is not a folder/,
    );
  });

  it('refuses a folder whose name is not a widget id', async () => {
    const dir = join(await tempDir(), 'Fleet Report');

    await expect(createWidgetProject({ dir, template: 'vanilla' })).rejects.toBeInstanceOf(
      CreateBoWidgetError,
    );
  });

  it('refuses an unknown template', async () => {
    const dir = join(await tempDir(), 'fleet-report');

    await expect(createWidgetProject({ dir, template: 'angular' as TemplateName })).rejects.toThrow(
      /unknown template "angular": choose one of react-mui, svelte, vue, lit, vanilla/,
    );
  });

  it('removes the folders it created when the copy fails', async () => {
    const root = await tempDir();
    failures.writes = 0;
    failures.writeAfter = 3;

    await expect(
      createWidgetProject({ dir: join(root, 'widgets', 'fleet-report'), template: 'vue' }),
    ).rejects.toMatchObject({ code: 'ENOSPC' });
    expect(failures.writes).toBe(4); // 3 files written, then the failure
    expect(await readdir(root)).toEqual([]);
  });

  it('empties an existing folder again when the copy fails, keeping .git', async () => {
    const dir = join(await tempDir(), 'fleet-report');
    await mkdir(join(dir, '.git'), { recursive: true });
    failures.writes = 0;
    failures.writeAfter = 3;

    await expect(createWidgetProject({ dir, template: 'vue' })).rejects.toMatchObject({
      code: 'ENOSPC',
    });
    expect(failures.writes).toBe(4); // 3 files written, then the failure
    expect(await readdir(dir)).toEqual(['.git']);
  });

  it('says what to clean up when the files written cannot be removed', async () => {
    const dir = join(await tempDir(), 'fleet-report');
    failures.writes = 0;
    failures.writeAfter = 3;
    failures.rm = true;

    const error = await createWidgetProject({ dir, template: 'vue' }).catch((caught) => caught);

    expect(error).toBeInstanceOf(CreateBoWidgetError);
    expect(error.message).toBe(
      `could not create the project (ENOSPC: no space left on device), nor remove the files already written (EBUSY: resource busy): empty ${dir} before retrying`,
    );
    expect(error.cause).toMatchObject({ code: 'ENOSPC' });
  });

  it('passes on the file system errors', async () => {
    const root = await tempDir();
    // A parent that is a file: the folder cannot be read nor created.
    await writeFile(join(root, 'file'), '');

    await expect(
      createWidgetProject({ dir: join(root, 'file', 'fleet-report'), template: 'vanilla' }),
    ).rejects.toMatchObject({ code: 'ENOTDIR' });
  });
});
