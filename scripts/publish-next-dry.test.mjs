import { describe, expect, it } from 'vitest';
import { dryRunCommands, splitSnapshotPackages } from './publish-next-dry.mjs';

describe('splitSnapshotPackages', () => {
  it('separates the -next packages from the already published ones', () => {
    const result = splitSnapshotPackages({
      '@vulog/bo-widget-vite': '0.2.0-next-20261118120000',
      '@vulog/bo-widget-sdk': '0.1.0',
      '@vulog/create-bo-widget': '0.1.1-next-20261118120000',
      '@vulog/bo-widget-cli': '0.1.0',
    });

    expect(result).toEqual({
      snapshot: ['@vulog/bo-widget-vite', '@vulog/create-bo-widget'],
      unchanged: ['@vulog/bo-widget-cli', '@vulog/bo-widget-sdk'],
    });
  });

  it('keeps every package in the snapshot when all of them were bumped', () => {
    const result = splitSnapshotPackages({ a: '1.0.0-next-1', b: '0.0.0-next-1' });

    expect(result).toEqual({ snapshot: ['a', 'b'], unchanged: [] });
  });

  it('fails when no package has a -next version', () => {
    expect(() => splitSnapshotPackages({ a: '0.1.0', b: '0.1.0' })).toThrow(
      /No package has a -next version/,
    );
  });

  it('fails on an empty repository', () => {
    expect(() => splitSnapshotPackages({})).toThrow(/No package has a -next version/);
  });
});

describe('dryRunCommands', () => {
  it('publishes the snapshot packages with the next tag and packs the others', () => {
    expect(dryRunCommands({ snapshot: ['a', 'b'], unchanged: ['c'] })).toEqual([
      ['publish', '--workspace', 'a', '--workspace', 'b', '--tag', 'next', '--dry-run'],
      ['pack', '--workspace', 'c', '--dry-run'],
    ]);
  });

  it('skips the pack when every package is in the snapshot', () => {
    expect(dryRunCommands({ snapshot: ['a'], unchanged: [] })).toEqual([
      ['publish', '--workspace', 'a', '--tag', 'next', '--dry-run'],
    ]);
  });
});
