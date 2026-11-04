import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import {
  SCHEMAS_FILE,
  SKILL_FILES,
  STANDARD_REFERENCE_PREFIXES,
  TRACKER_KEY_MIN_DIGITS,
} from './aima-api/config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
const readText = (path) => readFileSync(join(ROOT, path), 'utf8');
const listDirs = (path) =>
  existsSync(join(ROOT, path))
    ? readdirSync(join(ROOT, path), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

const marketplace = readJson('.claude-plugin/marketplace.json');
const AIMA_API_DIR = 'plugins/bo-widget/skills/aima-api';

/**
 * Fewer endpoints than this means the generation went wrong (the swagger lists several hundred):
 * the guards below must not pass on an empty skill.
 */
const MIN_ENDPOINT_COUNT = 100;

/**
 * Line of the generated SKILL.md giving the endpoint count. The sync workflow reads it from the
 * main branch to compare the counts before and after a regeneration: keep both in step.
 */
const ENDPOINT_COUNT_LINE = /(\d+) endpoints a widget can call/;

/** Every skill of every plugin, as `{skill, dir}`. */
const skills = listDirs('plugins').flatMap((plugin) =>
  listDirs(`plugins/${plugin}/skills`).map((skill) => ({
    skill,
    dir: `plugins/${plugin}/skills/${skill}`,
  })),
);

/**
 * Parses the YAML frontmatter of a SKILL.md.
 *
 * @param {string} text - file content
 * @returns {Record<string, unknown> | null} frontmatter, or null when absent
 */
function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return match ? yaml.load(match[1]) : null;
}

/**
 * Strings that must never appear in the generated API reference of this public repository:
 * private host names, and references to private tools or issue trackers.
 */
const FORBIDDEN_PATTERNS = [
  { name: 'private host', pattern: /[\w-]\.local\b/i },
  { name: 'GitLab', pattern: /gitlab/i },
  { name: 'Jira', pattern: /\bjira\b/i },
  {
    name: 'issue-tracker key',
    pattern: new RegExp(
      `\\b(?!(?:${STANDARD_REFERENCE_PREFIXES.join('|')})-)[A-Z][A-Z0-9]+-\\d{${TRACKER_KEY_MIN_DIGITS},}\\b`,
    ),
  },
  { name: 'backend web-service name', pattern: /\b[A-Za-z]*[a-z][A-Za-z]*WS\b/ },
];

describe('marketplace', () => {
  it('is the bo-widget-sdk marketplace, owned by Vulog', () => {
    expect(marketplace.name).toBe('bo-widget-sdk');
    expect(marketplace.owner).toEqual({ name: 'Vulog' });
    expect(marketplace.plugins.length).toBeGreaterThan(0);
  });

  it.each(marketplace.plugins.map((plugin) => [plugin.name, plugin]))(
    'points plugin %s to a folder whose plugin.json has the same name',
    (name, plugin) => {
      const manifest = readJson(join(plugin.source, '.claude-plugin/plugin.json'));
      expect(manifest.name).toBe(name);
      expect(manifest.description).toBeTruthy();
      expect(manifest.license).toBe('MIT');
    },
  );

  it('lists every plugin folder', () => {
    const sources = marketplace.plugins.map((plugin) => plugin.source.replace(/^\.\//, ''));
    expect(sources.sort()).toEqual(
      listDirs('plugins')
        .map((plugin) => `plugins/${plugin}`)
        .sort(),
    );
  });
});

describe('skills', () => {
  it('finds the aima-api skill', () => {
    expect(skills.map((skill) => skill.dir)).toContain(AIMA_API_DIR);
  });

  it.each(skills.map((skill) => [skill.dir, skill]))(
    '%s has a frontmatter with its folder name and a description',
    (dir, { skill }) => {
      const meta = frontmatter(readText(`${dir}/SKILL.md`));
      expect(meta).not.toBeNull();
      expect(meta.name).toBe(skill);
      expect(typeof meta.description).toBe('string');
      expect(meta.description.trim()).not.toBe('');
    },
  );

  it.each(skills.map((skill) => [skill.dir]))(
    '%s only cites files of ${CLAUDE_SKILL_DIR} that exist',
    (dir) => {
      const cited = [
        ...readText(`${dir}/SKILL.md`).matchAll(/\$\{CLAUDE_SKILL_DIR\}\/([\w./-]+)/g),
      ];
      for (const [, file] of cited) expect(existsSync(join(ROOT, dir, file)), file).toBe(true);
    },
  );
});

describe('generated aima-api skill', () => {
  const files = readdirSync(join(ROOT, AIMA_API_DIR));

  it('holds exactly the configured files', () => {
    const expected = [
      ...SKILL_FILES.map((definition) => definition.file),
      SCHEMAS_FILE,
      'SKILL.md',
    ];
    expect(files.sort()).toEqual(expected.sort());
  });

  it.each(FORBIDDEN_PATTERNS.map(({ name, pattern }) => [name, pattern]))(
    'contains no %s',
    (name, pattern) => {
      for (const file of files) {
        const lines = readText(`${AIMA_API_DIR}/${file}`).split('\n');
        const hits = lines.flatMap((line, index) =>
          pattern.test(line) ? [`${file}:${index + 1}`] : [],
        );
        expect(hits, name).toEqual([]);
      }
    },
  );

  /** Endpoint headings (`### METHOD \`path\``) and base paths of each generated endpoint file. */
  const endpointFiles = SKILL_FILES.map((definition) => {
    const content = readText(`${AIMA_API_DIR}/${definition.file}`);
    return {
      file: definition.file,
      headings: content.match(/^### (GET|POST|PUT|PATCH|DELETE) `/gm) ?? [],
      basePaths: [...content.matchAll(/\(base path `\/([^`]+)`\)/g)].map((match) => match[1]),
    };
  });
  const endpointCount = endpointFiles.reduce((sum, { headings }) => sum + headings.length, 0);

  it.each(endpointFiles.map((entry) => [entry.file, entry]))(
    '%s lists at least one endpoint',
    (file, { headings }) => {
      expect(headings.length, file).toBeGreaterThan(0);
    },
  );

  it('only lists endpoints under the admin gateway', () => {
    const basePaths = endpointFiles.flatMap((entry) => entry.basePaths);
    expect(basePaths.length).toBeGreaterThanOrEqual(MIN_ENDPOINT_COUNT);
    expect(basePaths).toHaveLength(endpointCount);
    for (const basePath of basePaths) expect(basePath).toMatch(/^boapi\/proxy(\/|$)/);
  });

  it('gives in SKILL.md the endpoint count of its files, where the sync workflow reads it', () => {
    const match = ENDPOINT_COUNT_LINE.exec(readText(`${AIMA_API_DIR}/SKILL.md`));
    expect(match).not.toBeNull();
    expect(Number(match[1])).toBe(endpointCount);
  });

  it('detects what it forbids', () => {
    const samples = [
      'https://svc.example.local:1443/user',
      'GitLab',
      'see JIRA',
      'since ABC-123',
      'via fooWS',
    ];
    FORBIDDEN_PATTERNS.forEach(({ pattern }, index) => {
      expect(pattern.test(samples[index])).toBe(true);
    });
    expect(FORBIDDEN_PATTERNS[3].pattern.test('ISO-8601 and BG-23')).toBe(false);
    expect(FORBIDDEN_PATTERNS[3].pattern.test('SHA-256, RSA-2048, HTTP-2 and UTF-8')).toBe(false);
  });
});
