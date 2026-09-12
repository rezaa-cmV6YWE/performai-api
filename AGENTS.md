# AGENTS.md

Compact orientation for coding sessions on `performai-api`.

## Stack & runtime

- Cloudflare Worker built with **Elysia + Zod + Cheerio**; uses `@elysiajs/openapi` for docs (Scalar UI) and `set-cookie-parser` for cookie handling.
- **Bun** is the package manager, runtime, and test runner. Use `bun install`; do not add `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`.
- TypeScript, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`.
- Import alias `@/*` maps to `./src/*`. Prefer `@/` imports over relative `../` paths.
- Elysia on CF Workers requires `CloudflareAdapter` and `.compile()` at the end of the chain.

## Daily commands

| Command            | What it does                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `bun dev`          | `wrangler dev` on `http://localhost:8787`.                                 |
| `bun deploy`       | `wrangler deploy --minify` to production.                                  |
| `bun lint`         | `oxlint .` — lint check.                                                   |
| `bun lint:fix`     | `oxlint --fix .` — lint with auto-fix.                                     |
| `bun format`       | `oxfmt .` — format files.                                                  |
| `bun format:check` | `oxfmt --check .` — check formatting.                                      |
| `bun check`        | `oxlint . && oxfmt --check .` — lint and format check.                     |
| `bun check:fix`    | `oxlint --fix . && oxfmt .` — auto-fix lint and format.                    |
| `bun test`         | Run unit tests with Bun test runner.                                       |
| `bun cf-typegen`   | Regenerate `worker-configuration.d.ts` after Wrangler binding/env changes. |

## Entrypoints

- Worker entry: `src/index.ts` → Elysia app with `CloudflareAdapter`, mounts maimai module at `/v1/:server/maimai`, exposes `GET /ok` health check, serves OpenAPI spec and Scalar docs.
- Wrangler `main`: `src/index.ts`, `compatibility_date: "2026-08-07"`.
- Maimai module: `src/modules/maimai/index.ts` (controller), `src/modules/maimai/service.ts` (service), `src/modules/maimai/model.ts` (validation schemas).

## API shape & Implemented features

- Base path: `/v1/:server/:game`.
- Valid params: `server ∈ {intl, jp, cn}`, `game ∈ {maimai, chunithm, ongeki}`.
- Currently, **`intl/maimai`** is fully implemented. All other combos return `501` with error code `NOT_IMPLEMENTED`.
- Response envelope:
  - Success: `{ "data": ... }`
  - Error: `{ "error": { "code": "...", "message": "..." } }`
- Validation errors return HTTP 422 (Elysia default).

### Implemented Endpoints

1. `GET /ok`: Health check returning `{ data: { ok: true } }`.
2. `POST /v1/intl/maimai/login`: Authenticates with SEGA ID credentials and returns `{ data: { cookie: "..." } }`.
3. `GET /v1/intl/maimai/profile`: Requires `x-maimai-cookie` header. Fetches player profile data.
4. `GET /v1/intl/maimai/rating`: Requires `x-maimai-cookie` header. Calculates Best 50 rating breakdown.

## Architecture & Subsystems

- **Elysia MVC Pattern**: Controller (Elysia instance = `src/modules/maimai/index.ts`), Service (abstract class with static methods = `service.ts`), Model (Zod schemas = `model.ts`).
- **Global Error Handler (`src/plugins/error-handler.ts`):** Catches `GameError` instances and returns structured JSON error responses with appropriate status codes.
- **OpenAPI Plugin (`src/plugins/openapi.ts`):** `@elysiajs/openapi` with Scalar UI at `/scalar`, docs redirects at `/docs` and `/reference`, static YAML spec at `/openapi.yaml`.
- **Auth flow (`src/lib/games/maimai/auth.ts`):** Performs a 3-step SEGA ID redirect dance; detects failures via redirect patterns.
- **Profile parser (`src/lib/games/maimai/parser/profile.ts`):** Scrapes player details from HTML using Cheerio selectors.
- **Score parser (`src/lib/games/maimai/parser/scores.ts`):** Scrapes score cards across all 5 difficulties.
- **Name normalizer (`src/lib/games/maimai/parser/name.ts`):** Converts full-width Japanese characters to ASCII, normalizes whitespace.
- **Rating calculation (`src/lib/games/maimai/rating/calculator.ts`):** Accuracy factor table, AP bonus, Best 50 selection.
- **OtogeDB Integration (`src/lib/games/maimai/songs/otoge-db.ts`):** Fetches and matches chart metadata from OtogeDB.
- **Asset resolution (`src/lib/games/maimai/assets.ts`):** Resolves absolute URLs for jackets, badges, and rating plates.
- **HTTP client (`src/lib/games/maimai/http.ts`):** Fetch wrapper with redirect chasing and cookie preservation.

## Editing guidance

- **Elysia key concepts**: Method chaining required for types, plugins isolated by default (use `as: 'global'` to export), named plugins for deduplication, order matters.
- **CF Worker limitations**: Cannot use inline values (`.get('/', 'hello')`), no `Elysia.file`, no OpenAPI Type Gen (`fromTypes`).
- **Profile/Score parsers**: Uses Cheerio CSS selectors. Adjust selectors in parser files if maimai updates its DOM.
- **Generated types**: `worker-configuration.d.ts` is committed but ignored by oxlint. Regenerate with `bun run cf-typegen`.
- **User-Agent & Constants**: Centralized in `src/lib/games/maimai/consts.ts`.

## Lint / format

- **Oxlint** ^1.82.0 for linting. Config in `.oxlintrc.json`.
  - Import lint rules enabled: `sort-imports` (member sorting), `import/first`, `import/newline-after-import`, `import/no-duplicates`.
- **Oxfmt** ^0.67.0 for formatting. Config in `.oxfmtrc.json`: single quotes, 2-space indent, `printWidth: 100`, `trailingComma: "es5"`.
  - Built-in `sortImports` enabled with grouping (`builtin` -> `external` -> `internal (@/)` -> `parent/sibling/index`).
- **Husky** ^9.1.7 + **lint-staged** ^17.5.1: pre-commit hook runs `oxlint --fix` and `oxfmt` on staged files. Config in `.lintstagedrc.json`.
- Oxlint and oxfmt ignore `node_modules`, `dist`, `.wrangler`, and `worker-configuration.d.ts`.

## Operational notes

- maimai has a daily maintenance window **04:00–07:00 JST**; requests will fail during that window.

## References

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)
- [ElysiaJS](https://elysiajs.com)
