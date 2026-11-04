import { describe, expect, it } from 'vitest';
import {
  EXCLUDED_PATH_SEGMENTS,
  EXCLUDED_TAGS,
  FALLBACK_FILE,
  GATEWAY_BASE_PATH,
  KNOWN_ROOT_SERVICES,
  PRIVATE_HOST_SUFFIX,
  SCHEMAS_FILE,
  SKILL_FILES,
  STANDARD_REFERENCE_PREFIXES,
  TRACKER_KEY_MIN_DIGITS,
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

  it('expects only tags that its own prefix claims and no other file maps', () => {
    const explicit = SKILL_FILES.flatMap((definition) => definition.tags ?? []);
    for (const definition of SKILL_FILES.filter((candidate) => candidate.expectedTags)) {
      expect(definition.tagPrefix).toBeDefined();
      for (const tag of definition.expectedTags) {
        expect(tag.startsWith(definition.tagPrefix), tag).toBe(true);
        expect(explicit, tag).not.toContain(tag);
      }
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

  it('only redacts tracker keys of several digits', () => {
    expect(TRACKER_KEY_MIN_DIGITS).toBeGreaterThanOrEqual(3);
  });

  it('lists the gateway services a route may start with, as single path segments', () => {
    expect(KNOWN_ROOT_SERVICES).toEqual(['desk', 'fleetadmin', 'geoloc']);
    for (const service of KNOWN_ROOT_SERVICES) expect(service).toMatch(/^[a-z]+$/);
  });
});
