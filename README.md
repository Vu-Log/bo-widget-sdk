# bo-widget-sdk

SDK, tooling and templates to build Vulog back office (BO) widgets.

A BO widget is a page added to the Vulog back office menu, delivered either as a Web Component or in an iframe. This monorepo holds the npm packages, published under the `@vulog` scope, that help you build, test and package one.

## Packages

| Package                                               | Description                                                                  | Status      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| [`@vulog/bo-widget-sdk`](packages/bo-widget-sdk/)     | Framework-agnostic client of the widget protocol                             | Pre-release |
| [`@vulog/bo-widget-vite`](packages/bo-widget-vite/)   | Vite plugin: `widget.json`, bundle layout, fake back office in dev           | Pre-release |
| [`@vulog/bo-widget-react`](packages/bo-widget-react/) | React bindings: Web Component wrapper (Shadow DOM, MUI), iframe entry, hooks | Pre-release |

More packages (CLI, project generator) will be added here.

## Requirements

- Node.js 22 (≥ 22.13), 24 or 26+ (`engines`, required by the dev tooling). CI and [`.nvmrc`](.nvmrc) use Node 24. The published packages run in the browser and have no Node.js requirement.
- npm (workspaces). Do not use another package manager: `package-lock.json` is the lockfile.

## Getting started

```bash
npm install
npm run build
npm test
```

## Scripts

| Script                     | What it does                                                                                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`            | Builds every package (`tsc`, ESM output in `packages/*/dist`)                                                                                                                                                                                                                          |
| `npm run typecheck`        | Type-checks sources, tests and Vitest configs without emitting                                                                                                                                                                                                                         |
| `npm test`                 | Runs the Vitest suites of every package                                                                                                                                                                                                                                                |
| `npm run test:coverage`    | Same, with a v8 coverage report in `coverage/`; fails under 80 %                                                                                                                                                                                                                       |
| `npm run check:package`    | Checks each built package as published: `publint`, `attw` (types), import of `dist`                                                                                                                                                                                                    |
| `npm run lint`             | ESLint (typescript-eslint, strict)                                                                                                                                                                                                                                                     |
| `npm run format`           | Formats the repository with Prettier (`format:check` only checks it)                                                                                                                                                                                                                   |
| `npm run changeset`        | Describes a change for the next release (see below)                                                                                                                                                                                                                                    |
| `npm run release:next:dry` | Simulates a `next` publication: snapshot version, build, `npm publish --dry-run`. It bumps `package.json` versions, writes `CHANGELOG.md` and deletes the pending changesets: run it on a throwaway copy or in CI only. It fails when no changeset is pending, or in pre-release mode. |

## Adding a package

1. Create `packages/<name>/` with a `package.json` named `@vulog/<name>`, `"type": "module"`, an `exports` map, `"files": ["dist", "src", "!src/**/*.test.ts"]` and `publishConfig.access: public`. Use [`packages/bo-widget-sdk`](packages/bo-widget-sdk/) as the reference.
2. Add `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `README.md` and `LICENSE`, copied from that package (npm only packs the files of the package directory).
3. Define the `build` and `check:package` scripts: the root scripts run them in every package and fail if one is missing. They run in the order of `workspaces` in the root `package.json`, then alphabetically: a package that others build against (such as `bo-widget-sdk`) is listed first, so that its `dist` exists when they are built.
4. Colocate tests with the code: `feature.ts` → `feature.test.ts`.

## Contributing a change

Every change that affects a published package needs a changeset:

```bash
npm run changeset
```

Pick the packages and the semver bump, then write a one-line summary for the users of the package. Commit the generated `.changeset/*.md` file with your change. The `CHANGELOG.md` of each package is generated from these files by the Version Packages pull request (see below): do not edit it by hand.

The CI (`.github/workflows/ci.yml`) runs on every pull request and push to `main`: format check, lint, typecheck, tests with coverage, build, package check, then a publication dry-run on the `next` tag. Without a pending changeset, or in pre-release mode, the dry-run only packs the current versions.

## Releasing

Releases are automated by [changesets](https://changesets.dev) in `.github/workflows/release.yml`, on every push to `main`:

1. While changesets are pending, after format check, lint, typecheck and tests with coverage pass, the workflow opens or updates a **Version Packages** pull request (version bumps and changelogs).
2. Merging that pull request builds and checks the packages (`check:package`), then publishes the new versions to npm under the `latest` tag (or `next`, see below), with provenance, and creates the GitHub releases.

The workflow is skipped while the repository is private.

Publication uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers): npm authenticates the workflow through OpenID Connect, so no npm token is stored in the repository.

### Repository setup

- On npmjs, for every published package: Settings > Trusted Publisher > GitHub Actions, with `Vu-Log` / `bo-widget-sdk`, the `release.yml` workflow and `npm publish` allowed.
- `RELEASE_GITHUB_TOKEN` secret: a fine-grained personal access token (contents and pull requests: write). Pull requests opened with the default token do not trigger CI, so without it the Version Packages pull request is not checked (the workflow then logs a warning).
- Settings > Actions > General: allow GitHub Actions to create and approve pull requests (needed when `RELEASE_GITHUB_TOKEN` is not set).
- Protect `main`: pull request required, with the `Lint, test and build` and `Publish dry-run (next)` checks.

### Pre-releases on `next`

```bash
npx changeset pre enter next   # following versions are x.y.z-next.N, published under the `next` tag
# merge pull requests with their changesets as usual
npx changeset pre exit         # back to stable releases
```

Commit `.changeset/pre.json` (and later `.changeset/pre/`). `pre exit` marks the pre-release mode as ending: the next Version Packages pull request removes these files and releases stable versions.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for issues and pull requests, and [SECURITY.md](SECURITY.md) to report a vulnerability.

## License

[MIT](LICENSE) © Vulog
