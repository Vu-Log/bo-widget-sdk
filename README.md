# bo-widget-sdk

SDK, tooling and templates to build Vulog BO widgets.

A BO widget is a page added to the Vulog back office menu, delivered either as a Web Component or in an iframe. This monorepo holds the npm packages, published under the `@vulog` scope, that help you build, test and package one.

## Packages

| Package                                           | Description                                                     | Status      |
| ------------------------------------------------- | --------------------------------------------------------------- | ----------- |
| [`@vulog/bo-widget-sdk`](packages/bo-widget-sdk/) | Framework-agnostic client of the widget protocol (`authFetch`…) | Placeholder |

More packages (React bindings, Vite plugin, CLI, project generator) will be added here.

## Requirements

- Node.js `>= 22.12` (see [`.nvmrc`](.nvmrc))
- npm (workspaces). Do not use another package manager: `package-lock.json` is the lockfile.

## Getting started

```bash
npm install
npm run build
npm test
```

## Scripts

| Script                     | What it does                                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`            | Builds every package (`tsc`, ESM output in `packages/*/dist`)                                                                                                               |
| `npm run typecheck`        | Type-checks sources, tests and configs without emitting                                                                                                                     |
| `npm test`                 | Runs the Vitest suites of every package                                                                                                                                     |
| `npm run test:coverage`    | Same, with a v8 coverage report in `coverage/`                                                                                                                              |
| `npm run lint`             | ESLint (typescript-eslint, strict)                                                                                                                                          |
| `npm run format`           | Formats the repository with Prettier (`format:check` only checks it)                                                                                                        |
| `npm run changeset`        | Describes a change for the next release (see below)                                                                                                                         |
| `npm run release:next:dry` | Simulates a `next` publication: snapshot version, build, `npm publish --dry-run`. It rewrites `package.json` and changeset files: run it on a throwaway copy or in CI only. |

## Adding a package

1. Create `packages/<name>/` with a `package.json` named `@vulog/<name>`, `"type": "module"`, an `exports` map, `"files": ["dist", "src", "!src/**/*.test.ts"]` and `publishConfig.access: public`. Use [`packages/bo-widget-sdk`](packages/bo-widget-sdk/) as the reference.
2. Add `tsconfig.json`, `tsconfig.build.json` and `vitest.config.ts`, copied from that package.
3. Colocate tests with the code: `feature.ts` → `feature.test.ts`.

## Contributing a change

Every change that affects a published package needs a changeset:

```bash
npm run changeset
```

Pick the packages and the semver bump, then write a one-line summary for the users of the package. Commit the generated `.changeset/*.md` file with your change. The `CHANGELOG.md` of each package is generated from these files at release time: do not edit it by hand.

The CI (`.github/workflows/ci.yml`) runs on every pull request: format check, lint, typecheck, tests with coverage, build, then a publication dry-run on the `next` tag.

## Releasing

Releases are automated by [changesets](https://changesets.dev) in `.github/workflows/release.yml`, on every push to `main`:

1. While changesets are pending, the workflow opens or updates a **Version Packages** pull request (version bumps and changelogs).
2. Merging that pull request publishes the new versions to npm under the `latest` tag, with provenance, and creates the GitHub releases.

The workflow needs an `NPM_TOKEN` secret allowed to publish to the `@vulog` scope. It does nothing while the repository is private.

### Pre-releases on `next`

```bash
npx changeset pre enter next   # following versions are x.y.z-next.N, published under the `next` tag
# merge pull requests with their changesets as usual
npx changeset pre exit         # back to stable releases
```

Commit the `.changeset/pre.json` file that `pre enter` creates, and remove it with `pre exit`.

## License

[MIT](LICENSE) © Vulog
