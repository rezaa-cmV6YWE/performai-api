# AGENTS.md

Compact orientation for coding sessions on `performai-api`.

## Stack & runtime

- Standalone **Bun** backend built with **Elysia + Zod + Cheerio**; uses `@elysiajs/openapi` for docs (Scalar UI) and custom cookie handling.
- **Bun** is the package manager, runtime, and test runner. Use `bun install`; do not add `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`.
- TypeScript, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`.
- Import alias `@/*` maps to `./src/*`. Prefer `@/` imports over relative `../` paths.

## Daily commands

| Command            | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `bun start`        | `bun run src/index.ts` — start server in production.       |
| `bun dev`          | `bun run --watch src/index.ts` on `http://localhost:3000`. |
| `bun lint`         | `oxlint .` — lint check.                                   |
| `bun lint:fix`     | `oxlint --fix .` — lint with auto-fix.                     |
| `bun format`       | `oxfmt .` — format files.                                  |
| `bun format:check` | `oxfmt --check .` — check formatting.                      |
| `bun check`        | `oxlint . && oxfmt --check .` — lint and format check.     |
| `bun check:fix`    | `oxlint --fix . && oxfmt .` — auto-fix lint and format.    |
| `bun test`         | Run unit tests with Bun test runner.                       |

## Entrypoints

- App entry: `src/index.ts` → Elysia app mounts maimai module at `/v1/:server/maimai`, redirects `GET /` to `/docs`, and serves OpenAPI spec and Scalar docs via `@elysiajs/openapi`. Runs on port 3000 locally (configurable via `PORT` env var).
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

1. `GET /`: Redirects to `/docs` (interactive API documentation).
2. `GET /docs`: Interactive API documentation powered by Scalar.
3. `GET /docs/json`: OpenAPI specification in JSON format.
4. `POST /v1/intl/maimai/login`: Authenticates with SEGA ID credentials and returns `{ data: { cookie: "..." } }`.
5. `GET /v1/intl/maimai/profile`: Requires `x-maimai-cookie` header. Fetches player profile data.
6. `GET /v1/intl/maimai/rating`: Requires `x-maimai-cookie` header. Calculates Best 50 rating breakdown.

## Architecture & Subsystems

- **Elysia MVC Pattern**: Controller (Elysia instance = `src/modules/maimai/index.ts`), Service (`MaimaiService` object in `src/modules/maimai/service.ts`), Model (Zod schemas = `src/modules/maimai/model.ts`).
- **Global Error Handler (`src/plugins/error-handler.ts`):** Catches `VALIDATION` errors (status 422), `GameError` instances (and subclasses `AuthError`, `FetchError`, `ParseError`), and general unhandled errors (status 500), returning structured `{ error: { code, message } }` JSON responses.
- **OpenAPI Plugin (`src/plugins/openapi.ts`):** `@elysiajs/openapi` configured with Scalar provider at `/docs` and OpenAPI JSON at `/docs/json`. Tagged for Maimai endpoints.
- **Auth flow (`src/lib/games/maimai/auth.ts`):** Performs a 3-step SEGA ID redirect dance; preserves session cookies including `clal` token; provides `refreshSession` to exchange `clal` for fresh IP-bound session cookies (`_t`, `userId`).
- **Cookie handling (`src/lib/games/maimai/cookies.ts`):** Custom Set-Cookie parser, cookie bag formatter, and cookie merger avoiding library bugs with comma-containing cookie values (e.g. `Expires`).
- **Profile parser (`src/lib/games/maimai/parser/profile.ts`):** Scrapes player details (rating, title, stars, counts) and collection items (nameplate and frame) from HTML using Cheerio selectors.
- **Score parser (`src/lib/games/maimai/parser/scores.ts`):** Scrapes score cards across all 5 difficulties (`basic`, `advanced`, `expert`, `master`, `remaster`).
- **Name normalizer (`src/lib/games/maimai/parser/name.ts`):** Converts full-width Japanese characters to ASCII (NFKC), normalizes whitespace, and extracts URL basenames.
- **Rating calculation (`src/lib/games/maimai/rating/calculator.ts`):** Accuracy factor table, AP bonus (+1 on version >= 25), Best 50 selection (15 new + 35 old songs).
- **OtogeDB Integration (`src/lib/games/maimai/songs/otoge-db.ts`):** Fetches and matches chart metadata from OtogeDB (`music-ex-intl.json`), maps version codes to internal numbers, and detects current version based on release dates.
- **Asset resolution (`src/lib/games/maimai/assets.ts`):** Resolves absolute URLs for jackets, FC/FS combo badges, and rating tier plates.
- **HTTP client (`src/lib/games/maimai/http.ts`):** Fetch wrapper (`followRedirects`, `maimaiFetch`) with redirect chasing, cookie jar preservation, custom headers (`User-Agent`, `Referer`), and auth error detection.

## Editing guidance

- **Elysia key concepts**: Method chaining required for types, plugins isolated by default (use `as: 'global'` to export), named plugins for deduplication, order matters.
- **Profile/Score parsers**: Uses Cheerio CSS selectors. Adjust selectors in parser files if maimai updates its DOM.
- **User-Agent & Constants**: Centralized in `src/lib/games/maimai/consts.ts`.

## Lint / format

- **Oxlint** ^1.82.0 for linting. Config in `.oxlintrc.json`.
  - Import lint rules enabled: `sort-imports` (member sorting), `import/first`, `import/newline-after-import`, `import/no-duplicates`.
- **Oxfmt** ^0.67.0 for formatting. Config in `.oxfmtrc.json`: single quotes, 2-space indent, `printWidth: 100`, `trailingComma: "es5"`.
  - Built-in `sortImports` enabled with grouping (`builtin` -> `external` -> `internal (@/)` -> `parent/sibling/index`).
- **Husky** ^9.1.7 + **lint-staged** ^17.5.1: pre-commit hook runs `oxlint --fix` and `oxfmt` on staged files. Config in `.lintstagedrc.json`.
- Oxlint and oxfmt ignore `node_modules` and `dist`.

## Operational notes

- maimai has a daily maintenance window **04:00–07:00 JST**; requests will fail during that window.

## References

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)
- [ElysiaJS](https://elysiajs.com)
