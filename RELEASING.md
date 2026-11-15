# Releasing Text Motion

The release flow follows `react-native-gesture-image-viewer`: Changesets CLI 3
maintains a version PR on `main`, then GitHub Actions publishes the merged version
and creates its package tag and GitHub release. Only
`@react-native-motion-kit/text-motion` is public; the workspace root, example and
documentation packages stay private.

The workflow uses pinned Changesets action v2 and pnpm 11.26.0. Changesets invokes
pnpm to publish, so `catalog:` dependencies are converted into version ranges.
No npm CLI upgrade is needed for this publishing path.

## Repository setup

In GitHub repository settings:

1. Allow GitHub Actions to create pull requests under **Actions → General →
   Workflow permissions**. The workflow requests content and pull-request write
   access to maintain version PRs, package tags and GitHub releases.
2. Create an environment named `npm`. If you configure deployment-branch rules,
   allow `main`. Existing environment protection rules still apply.
3. The organization currently restricts third-party actions to pinned versions.
   Its Actions allow list must include
   `changesets/action@ae32849d5ba541f9ae29e40e22a623bc13562f51` (v2.1.2).
   The pnpm setup action retains the repository-approved v4 pin; it installs
   pnpm 11.26.0 from the root `packageManager` field. Repository settings cannot
   override the inherited organization policy.

## First publication from CI

The package is already versioned `0.1.0`. Its first publication does not need a
changeset or a local `publish` command. Before adding subsequent version bumps:

1. Use an npm account with permission to create packages in the
   `react-native-motion-kit` organization.
2. Create a short-lived **granular access token**. Under **Packages and scopes**,
   grant **Read and write** to the `@react-native-motion-kit` scope, including the
   new package. Enable **Bypass two-factor authentication** for this one-time
   unattended direct publication. Organization-management permission is not needed.
3. Add the credential as the `NPM_TOKEN` secret on the GitHub `npm` environment.
   Store its value in GitHub secrets, never in a commit, workflow input or chat.
4. Merge the release setup into `main`.
5. In **Actions → Release → Run workflow**, select branch **main**, mode
   **bootstrap**, and initial version **0.1.0**.

Bootstrap validates the version confirmation, runs lint, formatting, types,
package tests and build, and audits a real pnpm tarball. It requires no pending
changeset files so the existing `0.1.0` is published directly. The Changesets
action then creates the package tag and GitHub release.

Bootstrap has no OIDC permission and reads `NPM_TOKEN` only in its credential check
and publication step. Normal releases never receive that token. This avoids
depending on the CLI's OIDC-before-token fallback for a package that does not
exist yet.

**Bootstrap is temporary:** npm currently documents removal of direct granular
token publishing in January 2027. Complete the initial publication and configure
trusted publishing below; then delete the GitHub secret and revoke the npm token.
If setting up a first release after that policy changes, consult npm's current
bootstrap guidance instead of reusing the token procedure.

## Enable trusted publishing after the first release

In the npm package's **Settings → Trusted Publisher**, configure:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `react-native-motion-kit` |
| Repository | `react-native-text-motion` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

Use the filename, not `.github/workflows/release.yml`. Explicitly allow direct
publishing if the npm form defaults to staging. Follow any activation deadline
shown by npm when saving the publisher. Remove the bootstrap secret and revoke
its token after this setup.

## Subsequent releases

1. Include `pnpm changeset` in changes affecting the public package and commit the
   generated markdown file with the change. Docs-only changes need no changeset.
2. Merge the feature or fix PR into `main`.
3. Release opens or updates `chore(release): version packages` with the version
   and changelog changes.
4. Merge that version PR. Release reruns the package checks, publishes through
   OIDC, and creates the package tag and GitHub release.

Running Release in **normal** mode on `main` retries this same flow. Before the
first package exists, normal mode completes its checks and prints bootstrap
instructions instead of attempting unauthenticated publication. Registry failures
other than 404 fail the lookup rather than being treated as a missing package.

## Local verification

```sh
pnpm install --frozen-lockfile
pnpm run release:check
pnpm changeset status --since=HEAD
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test --runInBand
pnpm run build
```

The tarball audit checks the public name/version/registry, built JavaScript and
declarations, public export targets and documentation. It rejects unconverted
workspace/catalog protocols and accidentally bundled development directories.

References: [npm granular tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens/),
[npm token publishing policy](https://docs.npmjs.com/about-access-tokens/),
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[Changesets automation](https://changesets.dev/guide/automating),
[pnpm catalog publishing](https://pnpm.io/catalogs#publishing).
