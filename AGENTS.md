# AGENTS.md

Compact orientation for OpenCode sessions on `performai-api`.

## Stack & runtime

- Cloudflare Worker built with **Hono + Zod + Cheerio**; also uses `@scalar/hono-api-reference` for docs and `set-cookie-parser` for cookie handling.
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

- Worker entry: `src/index.ts` → mounts `/v1` router from `@/routes/v1`, exposes `GET /ok` health check, serves OpenAPI specification at `/openapi.yaml` (redirects at `/openapi.json` and `/doc`), and renders interactive Scalar API reference at `/scalar`, `/docs`, and `/reference`.
- Wrangler `main`: `src/index.ts`, `compatibility_date: "2026-08-07"`.
- v1 routes: `src/routes/v1/[server]/maimai/login.ts`, `profile.ts`, and `rating.ts`.

## API shape & Implemented features

- Base path: `/v1/:server/:game`.
- Valid params: `server ∈ {intl, jp, cn}`, `game ∈ {maimai, chunithm, ongeki}`.
- Currently, **`intl/maimai`** is fully implemented. All other combos return `501` with error code `NOT_IMPLEMENTED`.
- Response envelope:
  - Success: `{ "data": ... }`
  - Error: `{ "error": { "code": "...", "message": "..." } }`
- Add new routes using `validator()` from `@/lib/validator` and `success()`/`error()` from `@/lib/response` to keep the envelope consistent.

### Implemented Endpoints

1. `GET /ok`: Health check returning `{ data: { ok: true } }`.
2. `POST /v1/intl/maimai/login`: Authenticates with SEGA ID credentials and returns `{ data: { cookie: "..." } }`.
3. `GET /v1/intl/maimai/profile`: Requires `x-maimai-cookie` header. Fetches player name, rating value and badge color, player icon, title + rarity tier (rainbow/gold/silver/bronze/normal), star count, version and total play counts, course rank badge, class rank badge, active nameplate, and active frame.
4. `GET /v1/intl/maimai/rating`: Requires `x-maimai-cookie` header. Concurrently scrapes score records across all 5 difficulties (Basic, Advanced, Expert, Master, Re:Master), fetches OtogeDB chart constants, calculates Best 50 breakdown (top 15 new songs + top 35 old songs), AP bonuses, and total player rating.

## Architecture & Subsystems

- **Auth flow (`src/lib/games/maimai/auth.ts`):** Performs a 3-step SEGA ID redirect dance through `lng-tgk-aime-gw.am-all.net/common_auth`; detects failures via redirect to `/common_auth/login` or `alof=` query param; sets `retention=1` for session longevity.
- **Profile parser (`src/lib/games/maimai/parser/profile.ts`):** Scrapes player details and active cosmetics from `/playerData/`, `/collection/nameplate/`, and `/collection/frame/`.
- **Score parser (`src/lib/games/maimai/parser/scores.ts`):** Scrapes score cards from `/record/musicGenre/search/?genre=99&diff=0..4` for achievement rate (×10000), DX score, chart type (`std` vs `dx`), FC status (`fc`, `fc+`, `ap`, `ap+`), FS status (`fs`, `fs+`, `fdx`, `fdx+`, `sync`), and jacket image basename.
- **Name normalizer (`src/lib/games/maimai/parser/name.ts`):** Converts full-width Japanese characters to ASCII, lowercases, trims whitespace, and extracts image basenames.
- **Rating calculation (`src/lib/games/maimai/rating/calculator.ts`):**
  - Accuracy factor table (`0.224` for >=100.5%, down to `0.05` for <50%).
  - Rating formula: `Math.floor(factor * Math.min(accuracy, 100.5) * internalLevel + apBonus)`.
  - AP Bonus (+1) applied on version >= 25 (CiRCLE) for `ap` / `ap+`.
  - Version window: for version >= 25, new songs include `addedVersion >= currentVersion - 1`.
  - Best 50 selection: top 15 new songs + top 35 old songs, ordered by rating descending and achievement descending.
- **OtogeDB Integration (`src/lib/games/maimai/songs/otoge-db.ts`):** Fetches and caches song/chart metadata from OtogeDB; matches charts primarily by jacket image basename, falling back to normalized title + type + difficulty.
- **Asset resolution (`src/lib/games/maimai/assets.ts`):** Resolves absolute URLs for jackets, FC/FS badges, rating plates, and Kiwami plates (for rating >= 16000 on version >= 26).
- **HTTP client (`src/lib/games/maimai/http.ts`):** Fetch wrapper with custom redirect chasing and cookie preservation.

## Editing guidance

- **Profile parser:** Uses Cheerio CSS selectors (`.see_through_block`, `.name_block`, `.rating_block`, `.trophy_block`, etc.). If maimai updates its DOM structure, adjust the selectors in `src/lib/games/maimai/parser/profile.ts`.
- **Score parser:** Inspect `src/lib/games/maimai/parser/scores.ts` if score card class names change.
- **Generated types:** `worker-configuration.d.ts` is committed but ignored by Biome. Regenerate with `bun run cf-typegen` after any Wrangler binding or env change.
- **No bindings configured:** The app is fully stateless; any new binding requires updating `wrangler.jsonc` and running `bun run cf-typegen`.
- **User-Agent & Constants:** Centralized in `src/lib/games/maimai/consts.ts`.

## Lint / format

- Biome ^2.0.6. Single quotes, 2-space indent, `lineWidth: 100`, `trailingCommas: "es5"`, `organizeImports` enabled.
- `noExplicitAny` is **off** in Biome.
- Biome ignores `node_modules`, `dist`, `.wrangler`, and `worker-configuration.d.ts`.

## Operational notes

- maimai has a daily maintenance window **04:00–07:00 JST**; requests will fail during that window.

## References

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)

