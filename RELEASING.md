# Releasing Text Motion

The release flow follows `react-native-gesture-image-viewer`: main runs setup,
build and the Changesets action. Changesets maintains a version PR and publishes
the merged version with package tags and a GitHub release. The existing CI
workflow runs lint, formatting, types, tests and documentation builds.

Only `@react-native-motion-kit/text-motion` is public. The workspace root, example
and documentation packages are private. Changesets invokes pinned pnpm 11.26.0,
which converts `catalog:` dependencies to version ranges before publishing.

## First release

The unpublished package uses `0.0.0` as its starting point. The initial minor
changeset generates a version PR for **0.1.0**, including `CHANGELOG.md`.
Do not write the changelog or run `publish` locally.

1. Merge the release setup into `main`. Changesets opens
   `chore(release): version packages` with version `0.1.0` and its changelog.
2. Before merging that version PR, add a short-lived npm granular token as the
   `NPM_TOKEN` secret on the GitHub `npm` environment. The token owner needs
   package-creation permission in the `react-native-motion-kit` organization.
   Grant Packages and scopes **Read and write** for `@react-native-motion-kit`
   and enable **Bypass two-factor authentication** for this initial CI publish.
   Organization-management access is not needed. Enter the value directly in
   GitHub Secrets, never in a commit or chat.
3. Merge the version PR. The same Release workflow publishes `0.1.0` from CI and
   creates its tag and GitHub release.
4. Configure the npm trusted publisher below, then remove the GitHub secret and
   revoke the temporary token.

The registry authentication step maps `NODE_AUTH_TOKEN` to the npm registry.
On pnpm 11.26.0, a successful OIDC exchange takes precedence; when trust is not
configured yet, the publisher falls back to that temporary registry token.

npm currently documents removal of direct granular-token publishing in January
2027. Use this token only for the initial publication and move to OIDC immediately.

## Trusted publishing

In the npm package's **Settings → Trusted Publisher**, configure:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `react-native-motion-kit` |
| Repository | `react-native-text-motion` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

Use the filename without `.github/workflows/`. Explicitly allow direct publishing
if npm defaults to staging, and follow any activation deadline shown by npm.
Subsequent releases use OIDC without a stored publishing token.

## Subsequent releases

Run `pnpm changeset` for changes to the public package and commit the generated
markdown file. After merging the change into `main`, Changesets creates or updates
the version PR. Merging that PR publishes the new version and generated changelog.
Documentation-only changes do not need a changeset.

For a retry, run **Actions → Release → Run workflow** on **main**. There are no
separate bootstrap modes or custom package-check scripts.

## GitHub configuration

Actions must be allowed to create version PRs. The `npm` environment allows only
`main`. The organization's action allow list includes the pinned Changesets v2
SHA `ae32849d5ba541f9ae29e40e22a623bc13562f51`; the pnpm setup action retains its
approved v4 pin and reads the pnpm version from the root `packageManager` field.

References: [Changesets automation](https://changesets.dev/guide/automating),
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[npm token settings](https://docs.npmjs.com/creating-and-viewing-access-tokens/),
[npm token publishing policy](https://docs.npmjs.com/about-access-tokens/).
