# Copilot Guidance

## Project Snapshot

- SvelteKit 2 project targeting static hosting via `@sveltejs/adapter-static`; UI built with Svelte 5 runes, TypeScript, and Vite.
- This project composes multiple internal submodules (e.g. shared UI, three.js core); treat them as external libraries and do not modify them directly unless explicitly requested.
- Runtime configuration is injected through `PUBLIC_*` environment variables and JSON assets served from `static/`.
- Deployment is **fully static only**; no SvelteKit server routes or Node server runtime are allowed.
- The app may be deployed under a sub-path; **all routes and asset URLs must respect `PUBLIC_BASE_PATH`**.

## Coding Preferences

- Write TypeScript-first Svelte components; avoid `any`, prefer explicit interfaces in `src/lib/type.ts` or nearby.
- Co-locate new route handlers or components inside `src/routes`; reuse shared logic via `src/lib` or existing submodules when possible.
- Respect existing global theme tokens and CSS utilities; add new globals sparingly and prefer local styles.
- Follow Svelte 5 rune patterns (`$derived`, `$state`, etc.) instead of legacy `onMount`/stores when updating modernized code.
- In Svelte components, always declare styles as `<style lang="postcss">` and prefer nested PostCSS syntax for structuring selectors.
- Reusable helper logic should be implemented as pure functions and organized by domain under `src/lib/utils` instead of being duplicated across components.
- Public or shared Svelte components should include clear JSDoc-style prop comments in `<script>` and a `@component` block comment describing purpose and usage (including example markup) so that documentation appears on hover.

## Tooling Expectations

- Always run `pnpm check` before considering a change complete; fix reported issues instead of suppressing them.
- Always run `pnpm format` before considering a change complete so the codebase stays consistently formatted.
- Unit testing framework `Vitest` is installed and available via `pnpm test:unit` when you need it.
- **Package manager**: strictly use `pnpm` for all dependency and script operations; **do not use** `npm` or `yarn` commands in docs, scripts, or suggestions.

## Implementation Notes

- Treat internal submodules as read-only (e.g. shared component libraries, three.js core, utility packages); prefer extending them via composition rather than editing their source.
- New runtime config should be plumbed via JSON in `static/` plus matching `PUBLIC_*` keys, preserving the runtime-loaded pattern.
- Do not create `+page.server.ts`, `+layout.server.ts` or `+server.ts` endpoints; all logic must be browser-side or via external HTTP APIs compatible with static hosting.
- When constructing internal links or static asset URLs, always account for `PUBLIC_BASE_PATH` (or SvelteKit `$app/paths.base`) instead of hard-coding root-based paths like `/foo`.
- When you notice similar helper logic in multiple places, refactor it into existing modules under `src/lib/utils` or create a new well-named utility there, and keep consolidating to avoid drift.

## Review Checklist

- [ ] No edits to generated `build/` or compressed `.br` files.
- [ ] Formatting, linting, and `pnpm check` succeed.
- [ ] All docs, scripts, and instructions only reference `pnpm` (no `npm`/`yarn`).
- [ ] Relevant Vitest/Playwright coverage updated or validated.
- [ ] Environment variable usage documented and defaults handled.
- [ ] Shared utilities/components reused or extracted to avoid duplication.
