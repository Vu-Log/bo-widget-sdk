#!/usr/bin/env node
/**
 * Simulates the `next` publication after `changeset version --snapshot next`: only the packages
 * that the snapshot bumped to a `-next` version go through `npm publish --dry-run`. The others
 * keep a version already published on npm, which npm refuses to publish again, even in dry-run:
 * they are only packed, so that a broken package still fails.
 *
 * @packageDocumentation
 */
import { execFileSync } from 'node:child_process';
import { isMainModule, workspaceVersions } from './template-floors.mjs';

/**
 * Splits the packages of the repository between the snapshot ones and the others.
 *
 * @param {Record<string, string>} versions - Version of each package, by name.
 * @returns {{ snapshot: string[], unchanged: string[] }} Package names, sorted.
 * @throws {Error} When no package has a `-next` version: the snapshot did not run, or bumped
 *   nothing, and a dry-run would then test nothing.
 */
export const splitSnapshotPackages = (versions) => {
  const names = Object.keys(versions).sort();
  const snapshot = names.filter((name) => versions[name].includes('-next'));
  if (snapshot.length === 0) {
    throw new Error(
      'No package has a -next version: run `changeset version --snapshot next` first',
    );
  }
  return { snapshot, unchanged: names.filter((name) => !snapshot.includes(name)) };
};

/**
 * npm commands of the dry-run: publish the snapshot packages, pack the others.
 *
 * @param {{ snapshot: string[], unchanged: string[] }} packages - From {@link splitSnapshotPackages}.
 * @returns {string[][]} Arguments of each `npm` call, in order.
 */
export const dryRunCommands = ({ snapshot, unchanged }) => {
  const workspaceArgs = (names) => names.flatMap((name) => ['--workspace', name]);
  const commands = [['publish', ...workspaceArgs(snapshot), '--tag', 'next', '--dry-run']];
  if (unchanged.length > 0) commands.push(['pack', ...workspaceArgs(unchanged), '--dry-run']);
  return commands;
};

if (isMainModule(process.argv[1], import.meta.url)) {
  for (const args of dryRunCommands(splitSnapshotPackages(workspaceVersions()))) {
    console.log(`npm ${args.join(' ')}`);
    execFileSync('npm', args, { stdio: 'inherit' });
  }
}
