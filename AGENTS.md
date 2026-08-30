# AGENTS.md

Compact orientation for OpenCode sessions on `performai-api`.

## Stack & runtime

- Cloudflare Worker built with **Hono + Zod + Cheerio**; also uses `set-cookie-parser` for cookie handling.
- **Bun** is the package manager, runtime, and test runner. Use `bun install`; do not add `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`.
- TypeScript, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`.
- Import alias `@/*` maps to `./src/*`. Prefer `@/` imports over relative `../` paths.
- JSX is configured in `tsconfig.json` (`jsx: react-jsx`, `jsxImportSource: hono/jsx`) for Hono JSX if needed.

## Daily commands

| Command | What it does |
| --- | --- |
| `bun dev` | `wrangler dev` on `http://localhost:8787`. |
| `bun deploy` | `wrangler deploy --minify` to production. |
| `bun check` | `biome check --write .` — lint and format with auto-fix. |
| `bun lint` | `biome check .` — read-only lint/format check. |
| `bun test` | Run unit tests with Bun test runner. |
| `bun cf-typegen` | Regenerate `worker-configuration.d.ts` after Wrangler binding/env changes. |

## Entrypoints

- Worker entry: `src/index.ts` → mounts `/v1` router from `@/routes/v1`, exposes `GET /ok` health check, serves OpenAPI specification at `/openapi.json` and `/doc`, and renders interactive Scalar API reference at `/scalar` and `/docs`.
- Wrangler `main`: `src/index.ts`, `compatibility_date: "2026-08-07"`.
- v1 routes: `src/routes/v1/[server]/maimai/login.ts`, `profile.ts`, and `rating.ts`.

## API shape

- Base path: `/v1/:server/:game`.
- Valid params: `server ∈ {intl, jp, cn}`, `game ∈ {maimai, chunithm, ongeki}`.
- Only **`intl/maimai`** is implemented. All other combos return `501` with error code `NOT_IMPLEMENTED`.
- Response envelope:
  - Success: `{ "data": ... }`
  - Error: `{ "error": { "code": "...", "message": "..." } }`
- Add new routes using `validator()` from `@/lib/validator` and `success()`/`error()` from `@/lib/response` to keep the envelope consistent.

## Auth & scraping flow

- `POST /v1/intl/maimai/login` returns `{ data: { cookie: "..." } }`.
- `GET /v1/intl/maimai/profile` requires the full cookie string in the `x-maimai-cookie` header, echoed verbatim.
- `GET /v1/intl/maimai/rating` calculates the Best 50 breakdown using score data and OtogeDB chart constants.
- The maimai adapter does a manual 3-step SEGA ID redirect dance; auth failure is detected by a redirect to `/common_auth/login` or an `alof=` query param.
- `retention=1` is appended to the login POST to extend session lifetime.

## Editing guidance

- **Profile parser:** `src/lib/games/maimai/parser/profile.ts` uses Cheerio CSS selectors (`.name_block`, `.rating_block`). If parsing fails because `name` or `rating` elements are missing, inspect the live maimai HTML and update the selectors.
- **Generated types:** `worker-configuration.d.ts` is committed but ignored by Biome. Regenerate with `bun run cf-typegen` after any Wrangler binding or env change.
- **No bindings are configured** in `wrangler.jsonc` (all commented out). The app is fully stateless today; any new binding needs both `wrangler.jsonc` and `cf-typegen`.
- **User-Agent and Headers:** Centralized in `src/lib/games/maimai/consts.ts`.

## Lint / format

- Biome ^2.0.6. Single quotes, 2-space indent, `lineWidth: 100`, `trailingCommas: "es5"`, `organizeImports` enabled.
- `noExplicitAny` is **off** in Biome.
- Biome ignores `node_modules`, `dist`, `.wrangler`, and `worker-configuration.d.ts`.

## Operational notes

- maimai has a maintenance window **04:00–07:00 JST**; requests will fail during that window with no in-code handling.

## References
- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)
