# Changesets

Run `pnpm changeset` when a change affects the published
`@react-native-motion-kit/text-motion` package. Choose patch for compatible fixes,
minor for new features, and major for breaking changes. Documentation-only and
example-only changes do not need a package release.

After the change is merged, the Release workflow maintains a version PR. Merging
that PR publishes the new version through npm trusted publishing.

The first version is already `0.1.0`; follow [the initial CI release procedure](../RELEASING.md)
before adding a version bump for a subsequent release.
