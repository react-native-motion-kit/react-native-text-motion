# Changesets

Run `pnpm changeset` when a change affects the published
`@react-native-motion-kit/text-motion` package. Choose patch for compatible fixes,
minor for new features, and major for breaking changes. Documentation-only and
example-only changes do not need a package release.

After the change is merged, the Release workflow maintains a version PR. Merging
that PR publishes the new version through npm trusted publishing.

See [the release guide](../RELEASING.md) for the OIDC connection and release procedure.
