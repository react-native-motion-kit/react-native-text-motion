# React Native Text Motion documentation

This pnpm workspace uses Rspress 2, following the structure of the Gesture Image
Viewer documentation. It documents the current public API in English and
Korean, with one set of routes and no historical version selector.

Production documentation: <https://react-native-text-motion.pages.dev/>
([한국어](https://react-native-text-motion.pages.dev/ko/)).

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
output directory, with the repository root as the working directory. The production
Cloudflare Pages deployment uses `https://react-native-text-motion.pages.dev`.
Hosting and deployment configuration live outside the Rspress build command.

## Search metadata

`siteOrigin` points to the production domain, and `route.cleanUrls` matches
Cloudflare Pages URLs such as `/api/renderers` and `/ko/api/renderers`.
Existing `.html` links continue to resolve on Cloudflare Pages.

Each English and Korean page has its own localized `description` frontmatter.
Rspress generates page titles, descriptions, and Open Graph title/description tags.
The theme's `Layout` uses the public `useHead` hook for canonical URLs, matching
language alternatives during navigation, and social previews using the existing logo.
The 404 page carries `noindex`.

Following the Swipe Deck documentation's SEO setup, `plugins/seo.ts` generates
`sitemap.xml` from document routes and passes translated route URLs to the theme.
Rspress 2.0.21 already generates static hreflang links; its head renderer merges
matching links. Its built-in sitemap option is only available from 2.1.0, so the
local plugin supports the currently pinned version without extra dependencies.
`docs/public/robots.txt` advertises the sitemap and excludes the standalone demo app.

`pnpm docs:build` checks the actual static output for localized descriptions,
canonical/hreflang links, social metadata, sitemap coverage, robots, and AI files.
Keep these checks passing when adding pages or changing the production domain.
The official Rspress
[best-practices](https://github.com/rstackjs/agent-skills/blob/main/skills/rspress-best-practices/SKILL.md)
and [description-generator](https://github.com/rstackjs/agent-skills/blob/main/skills/rspress-description-generator/SKILL.md)
skills describe the content conventions used here.

## Maintain

- Keep matching pages under `docs/docs/en/` and `docs/docs/ko/` in sync. `docs:check` checks
  page parity, local links, and navigation metadata.
- Edit `_nav.json` for top navigation and `_meta.json` for sidebar ordering.
- Keep code samples aligned with the public exports and the Expo example app.
- Use `docs/docs/public/` for shared static files and `theme/` for theme extensions.
- Rspress generates `llms.txt` and `llms-full.txt` for AI tools at the site root
  and under `/ko/`. Keep both language versions of
  `guide/getting-started/ai.mdx` aligned with these generated endpoints and the
  current public API. Verify the generated AI files in `docs/doc_build/` after
  a production build; do not maintain a second hand-written API dump.
- Keep repository and package READMEs focused on installation, a concise
  quickstart, and links to the production documentation, examples, and AI guide.
- Preserve library priorities and design boundaries in `ROADMAP.md` and
  `ROADMAP.ko.md` at the repository root. Keep README and AI-guide links to that
  context when simplifying documentation entry points.
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
  into ignored `docs/docs/public/demos/`. After changing preview recipes during a dev
  session, run `pnpm -C docs demos:build` again and reopen the preview.
- The native `overlayText()` / `lineReveal()` demo uses an iOS simulator recording
  in `docs/docs/public/media/`, because React Native Web does not provide the native
  `onTextLayout` event required for rendered-line measurement.
- Native recordings use English text with matching light/dark palettes. The
  video and poster follow the document theme, just like the live preview shell.
