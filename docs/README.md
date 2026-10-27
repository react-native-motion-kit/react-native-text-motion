# React Native Text Motion documentation

This pnpm workspace uses Rspress 2, following the structure of the Gesture Image
Viewer documentation. It documents the current public `0.1.0` API in English and
Korean, with one set of routes and no historical version selector.

## Develop

Run commands from the repository root:

```sh
pnpm install
pnpm docs:dev
```

English is served at `/`; Korean is served at `/ko/`. Use the language menu to
switch to the corresponding page. The home page extends the default theme with
package-manager installation tabs.

## Verify and build

```sh
pnpm docs:check
pnpm docs:typecheck
pnpm docs:build
pnpm docs:preview
```

The static build is written to `docs/doc_build/`. A static host such as Cloudflare
Pages can use `pnpm docs:build` as its build command and `docs/doc_build` as its
output directory, with the repository root as the working directory. Deployment
and a production domain must be configured separately.

## Maintain

- Keep matching pages under `docs/en/` and `docs/ko/` in sync. `docs:check` checks
  page parity, local links, and navigation metadata.
- Edit `_nav.json` for top navigation and `_meta.json` for sidebar ordering.
- Keep code samples aligned with the public exports and the Expo example app.
- Use `docs/public/` for shared static files and `theme/` for theme extensions.
- Rspress generates `llms.txt` and full documentation text for AI tools.
- Link to official setup instructions for Reanimated and Worklets; the package's
  peer minimums are not a complete native dependency compatibility matrix.
- Hosted demos are not configured. The examples page provides working recipes
  and instructions for running the local Expo app.
