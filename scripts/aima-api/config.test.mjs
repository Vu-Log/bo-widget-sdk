import { describe, expect, it } from 'vitest';
import {
  EXCLUDED_PATH_SEGMENTS,
  EXCLUDED_TAGS,
  FALLBACK_FILE,
  GATEWAY_BASE_PATH,
  PRIVATE_HOST_SUFFIX,
  SCHEMAS_FILE,
  SKILL_FILES,
  STANDARD_REFERENCE_PREFIXES,
} from './config.mjs';

describe('SKILL_FILES', () => {
  it('has unique file names, none clashing with the generated extras', () => {
    const names = SKILL_FILES.map((definition) => definition.file);
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain(SCHEMAS_FILE);
    expect(names).not.toContain('SKILL.md');
    expect(names).not.toContain('internal.md');
  });

  it('claims each tag in a single file, and never an excluded tag', () => {
    const tags = SKILL_FILES.flatMap((definition) => definition.tags ?? []);
    expect(tags.filter((tag, index) => tags.indexOf(tag) !== index)).toEqual([]);
    expect(tags.filter((tag) => EXCLUDED_TAGS.includes(tag))).toEqual([]);
  });

  it('gives every file a title, a summary and a way to claim tags', () => {
    for (const definition of SKILL_FILES) {
      expect(definition.file).toMatch(/^[a-z-]+\.md$/);
      expect(definition.title).not.toBe('');
      expect(definition.summary).not.toBe('');
      expect(Boolean(definition.tags?.length) || definition.tagPrefix !== undefined).toBe(true);
      // An empty prefix would claim every tag.
      if (definition.tagPrefix !== undefined) expect(definition.tagPrefix).not.toBe('');
    }
  });

  it('declares the fallback file', () => {
    expect(SKILL_FILES.map((definition) => definition.file)).toContain(FALLBACK_FILE);
  });

  it('keeps the admin-* prefix after every explicit admin file', () => {
    const prefixIndex = SKILL_FILES.findIndex((definition) => definition.tagPrefix === 'admin-');
    const lastExplicitAdmin = SKILL_FILES.findLastIndex((definition) =>
      definition.tags?.some((tag) => tag.startsWith('admin-')),
    );
    expect(prefixIndex).toBeGreaterThan(lastExplicitAdmin);
  });
});

describe('scope', () => {
  it('targets the admin gateway of authFetch, without leading or trailing slash', () => {
    expect(GATEWAY_BASE_PATH).toBe('boapi/proxy');
  });

  it('treats any host ending with .local as private', () => {
    expect(PRIVATE_HOST_SUFFIX).toBe('.local');
  });

  it('excludes the tags and route segments that are not meant for widgets', () => {
    expect(EXCLUDED_TAGS).toEqual(['internal', 'deprecated', 'todo', 'need-migration']);
    expect(EXCLUDED_PATH_SEGMENTS).toEqual(['internal']);
  });

  it('lists standard reference prefixes in upper case', () => {
    for (const prefix of STANDARD_REFERENCE_PREFIXES) expect(prefix).toMatch(/^[A-Z]+$/);
  });
});
