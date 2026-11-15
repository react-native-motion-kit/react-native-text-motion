# Releasing Text Motion

Releases use npm trusted publishing (OIDC). GitHub Actions runs setup, build and
the Changesets action on `main`. The npm publisher trusts this exact repository,
workflow and environment; no stored npm publishing token is required.

The existing CI workflow owns lint, formatting, type checks, tests and
documentation builds. Only `@react-native-motion-kit/text-motion` is public;
the workspace root, example and docs packages remain private.

## Release flow

1. Run `pnpm changeset` for changes to the public package and commit the generated
   markdown file. Documentation and CI-only changes do not need a changeset.
2. Merge the change into `main`. Changesets creates or updates
   `chore(release): version packages` with the version and generated changelog.
3. Merge that version PR. Release publishes through OIDC and creates the package
   tag and GitHub release.

For a retry, run **Actions → Release → Run workflow** on **main**. A run with no
unpublished versions does not perform a registry publication.

## npm trusted publisher

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `react-native-motion-kit` |
| Repository | `react-native-text-motion` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

The workflow uses direct publication after the version PR is merged. The
stage-only permission requires a separate npm approval flow and does not authorize
this workflow's `pnpm changeset publish` command.

Keep package publishing access set to require 2FA and disallow bypass-2FA tokens;
OIDC works with that policy. Do not restore the former publishing-token Secret or
workflow environment variable.

npm validates a new trust connection on its first real OIDC publication. Check
and follow any validation deadline shown in the npm package settings. Until that
publication succeeds, the saved configuration alone is not end-to-end evidence.

## GitHub and tooling

The workflow requests `id-token: write`; the `npm` environment allows only `main`.
Actions can create version PRs, and the organization allows the pinned Changesets
v2 SHA `ae32849d5ba541f9ae29e40e22a623bc13562f51`.

Pinned pnpm 11.26.0 handles publication and OIDC natively. It also converts
`catalog:` dependencies into version ranges before publishing. A separate npm CLI
upgrade or token-based registry setup step is unnecessary.

References: [Changesets automation](https://changesets.dev/guide/automating),
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
