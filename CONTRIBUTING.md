# Contributing

Contributions are always welcome, no matter how large or small.

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development Workflow

This project is a monorepo managed using [pnpm workspaces](https://pnpm.io/workspaces). It contains:

- The library package in `packages/text-motion/`.
- An example app in `example/`.

Make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See [`.nvmrc`](./.nvmrc) for the version used in this project.

Install dependencies from the repository root:

```sh
pnpm install
```

The [example app](/example/) demonstrates usage of the library. It depends on the local workspace package, so source changes in `packages/text-motion/src` can be exercised from the example app.

Start the packager:

```sh
pnpm example start
```

Run the example app on Android:

```sh
pnpm example android
```

Run the example app on iOS:

```sh
pnpm example ios
```

Check TypeScript:

```sh
pnpm run typecheck
```

Run tests:

```sh
pnpm run test
```

Build the package:

```sh
pnpm run build
```

## Commit Message Convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: documentation changes, e.g. add usage examples.
- `test`: adding or updating tests.
- `chore`: tooling changes, e.g. change CI config.

Pre-commit hooks verify that commit messages match this format.

## Scripts

- `pnpm install`: install dependencies for the workspace.
- `pnpm run typecheck`: type-check workspace packages.
- `pnpm run test`: run unit tests with [Jest](https://jestjs.io/).
- `pnpm run build`: build the library package.
- `pnpm example start`: start the Metro server for the example app.
- `pnpm example android`: run the example app on Android.
- `pnpm example ios`: run the example app on iOS.

## Sending a Pull Request

> **Working on your first pull request?** You can learn how from this free series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that typechecks and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
