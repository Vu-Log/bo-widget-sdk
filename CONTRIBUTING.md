# Contributing

Thanks for your interest in the BO widget SDK.

## Reporting a bug or requesting a feature

Open a [GitHub issue](https://github.com/Vu-Log/bo-widget-sdk/issues). Include the package and version, what you expected, what happened, and a minimal reproduction when possible.

For a security issue, do not open an issue: follow [SECURITY.md](SECURITY.md).

## Pull requests

This SDK is maintained by Vulog. Pull requests from forks are welcome but reviewed case by case, so **open an issue first** to agree on the change before you write code.

A pull request is merged only when:

- a maintainer (see [`.github/CODEOWNERS`](.github/CODEOWNERS)) approved it;
- the CI is green: format, lint, typecheck, tests with coverage, build and package checks. Maintainers approve the CI run of a first-time contributor before it starts;
- it contains a changeset when it changes a published package (`npm run changeset`);
- new or changed code is covered by tests, colocated with the code (`feature.ts` → `feature.test.ts`).

Pull requests are squash-merged: the pull request title becomes the commit message on `main`.

See the [README](README.md) for the development setup and the release process.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
