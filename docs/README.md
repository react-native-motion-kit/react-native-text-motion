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
- Inline demos run the actual library using an isolated React Native Web bundle.
  Press Run example to load one, use its replay/controls, and close it to unload.
  Reduced-motion preferences remain respected. Browser playback illustrates the
  API; it is not native performance evidence.
- Open **View code** below an example to inspect and copy that demo's
  recipe, including its shared defaults and text. The second view contains the
  complete shared player source for playback handlers and styles. These views
  are extracted from the same Expo source files during development, checks,
  typechecking, and production builds, rather than maintained as separate samples.
- The preview follows the document's light/dark appearance without restarting
  playback. The wrapper and embedded app share appearance data only. See the
  repository's `DESIGN.md` for the documentation demo's visual constraints.
- `pnpm docs:dev` and `pnpm docs:build` first export the demo app from `example/`
  into ignored `docs/public/demos/`. After changing preview recipes during a dev
  session, run `pnpm -C docs demos:build` again and reopen the preview.
- The native `overlayText()` / `lineReveal()` demo uses an iOS simulator recording
  in `docs/public/media/`, because React Native Web does not provide the native
  `onTextLayout` event required for rendered-line measurement.
- Native recordings use English text with matching light/dark palettes. The
  video and poster follow the document theme, just like the live preview shell.
