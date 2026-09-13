# Performai API

![kaleidxscope](./assets/kaleidx-scope.jpeg)

---

Scraper and rating calculation API for SEGA arcade rhythm games (maimai, CHUNITHM, O.N.G.E.K.I). Standalone Bun backend built with **Elysia + Zod + Cheerio**.

Currently supports **maimai International (`intl`)** with full authentication, profile scraping, score parsing, and Best 50 / DX Rating calculation. JP and CN servers and other rhythm games are planned.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1+)

### Installation

```bash
bun install
```

### Development

Start the local development server with auto-reload:

```bash
bun dev
```

The API will be available at `http://localhost:3000`.

### Production

Start the production server:

```bash
bun start
```

### Testing

Run unit tests with the Bun test runner:

```bash
bun test
```

### Lint & Format

Configured with **Oxlint** and **Oxfmt** (with Husky + lint-staged on pre-commit):

```bash
bun run check        # oxlint . && oxfmt --check . (lint and format check)
bun run check:fix    # oxlint --fix . && oxfmt . (auto-fix lint and format)
bun run lint         # oxlint .
bun run lint:fix     # oxlint --fix .
bun run format       # oxfmt .
bun run format:check # oxfmt --check .
```

---

## API Documentation

### OpenAPI Specification

- **Scalar UI:** [https://performai.pastelrail.com/docs](https://performai.pastelrail.com/docs)
- **OpenAPI JSON:** [https://performai.pastelrail.com/docs/json](https://performai.pastelrail.com/docs/json)

### Local Development

- **Root Redirect:** Visiting `http://localhost:3000/` redirects automatically to `/docs`.
- **Interactive API Reference (Scalar):** `http://localhost:3000/docs`
- **OpenAPI Specification (JSON):** `http://localhost:3000/docs/json`

---

## Supported Games & Servers

Base path: `/v1/:server/:game`

| Server | Game       | Status    | Notes                                             |
| :----- | :--------- | :-------- | :------------------------------------------------ |
| `intl` | `maimai`   | Supported | Full login, profile, and rating / Best 50 support |
| `jp`   | `maimai`   | Planned   | Returns `501 NOT_IMPLEMENTED`                     |
| `cn`   | `maimai`   | Planned   | Returns `501 NOT_IMPLEMENTED`                     |
| `intl` | `chunithm` | Planned   | Returns `501 NOT_IMPLEMENTED`                     |
| `jp`   | `chunithm` | Planned   | Returns `501 NOT_IMPLEMENTED`                     |
| `jp`   | `ongeki`   | Planned   | Returns `501 NOT_IMPLEMENTED`                     |

---

## Project Structure

```
src/
├── index.ts                           # Bun server entrypoint, Elysia app & root redirect
├── index.test.ts                      # Route & OpenAPI integration tests
├── env.d.ts                           # YAML/YML module import declarations
├── modules/
│   └── maimai/
│       ├── index.ts                   # Maimai module controller (/v1/:server/maimai)
│       ├── model.ts                   # Validation schemas (params, body, headers)
│       └── service.ts                 # Service layer for login, profile, rating
├── plugins/
│   ├── error-handler.ts               # Global onError handler (GameError & validation errors)
│   └── openapi.ts                     # @elysiajs/openapi plugin (Scalar UI at /docs, spec at /docs/json)
└── lib/
    ├── errors.ts                      # Error classes (GameError, AuthError, FetchError, ParseError)
    └── games/
        └── maimai/
            ├── index.ts               # getMaimaiProfile & getMaimaiRating entrypoints
            ├── assets.ts              # Jacket, FC/FS icon, rating plate URL helpers
            ├── auth.ts                # SEGA ID redirect dance & session refresh logic
            ├── consts.ts              # URLs, difficulty constants, version tables, thresholds
            ├── cookies.ts             # Custom cookie parsing, extraction, and merging helpers
            ├── http.ts                # Custom fetch wrapper handling redirects & cookies
            ├── schemas.ts             # Zod schemas & TypeScript types
            ├── parser/
            │   ├── name.ts            # Unicode normalization (NFKC) & URL basename utilities
            │   ├── profile.ts         # Profile & collection (nameplate/frame) HTML parsers
            │   └── scores.ts          # Score card scraping across all 5 difficulties
            ├── rating/
            │   └── calculator.ts      # Rating formulas, bracket factors & Best 50 ranking
            └── songs/
                └── otoge-db.ts        # OtogeDB data fetching, version mapping & chart lookup
```

---

## Operational Notes

- **Stateless Design:** No persistent database is used; all operations are performed on-the-fly directly against upstream game services and OtogeDB.
- **Session Lifetime & Refresh:** `retention=1` is sent during authentication to maximize session lifetime on maimai NET. The response cookie preserves the `clal` token, allowing sessions to be renewed via `refreshSession` if the IP-bound session cookies (`_t`, `userId`) expire.
- **Maintenance Window:** maimai NET undergoes daily scheduled maintenance between **01:00 and 02:00 JST**; requests during this window will fail upstream.

---

## References & Acknowledgments

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)
