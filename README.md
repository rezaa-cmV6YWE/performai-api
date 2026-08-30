# performai-api

Scraper and rating calculation API for SEGA arcade rhythm games (maimai, CHUNITHM, O.N.G.E.K.I). Built for Cloudflare Workers with Hono.

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

Start the local Cloudflare Worker development server:

```bash
bun run dev
```

The API will be available at `http://localhost:8787`.

### Testing

Run unit tests with the Bun test runner:

```bash
bun test
```

### Lint & Format

```bash
bun run check   # biome check --write (lint and format with auto-fix)
bun run lint    # biome check (read-only check)
```

### Deployment

Deploy to Cloudflare Workers:

```bash
bun run deploy
```

---

## API Documentation

- **Interactive API Reference (Scalar):** `http://localhost:8787/scalar`, `http://localhost:8787/docs`, or `http://localhost:8787/reference`
- **OpenAPI 3.1.0 Spec:** `http://localhost:8787/openapi.yaml` (redirects at `/openapi.json` and `/doc`)

---

## Supported Games & Servers

Base path: `/v1/:server/:game`

| Server | Game | Status | Notes |
| :--- | :--- | :--- | :--- |
| `intl` | `maimai` | Supported | Full login, profile, and rating / Best 50 support |
| `jp` | `maimai` | Planned | Returns `501 NOT_IMPLEMENTED` |
| `cn` | `maimai` | Planned | Returns `501 NOT_IMPLEMENTED` |
| `intl` | `chunithm` | Planned | Returns `501 NOT_IMPLEMENTED` |
| `intl` | `ongeki` | Planned | Returns `501 NOT_IMPLEMENTED` |

---

## Project Structure

```
src/
├── index.ts                           # Cloudflare Worker entry, docs & health routes
├── openapi.yaml                       # OpenAPI 3.1.0 specification
├── env.d.ts                           # Worker environment definitions
├── lib/
│   ├── errors.ts                      # GameError, AuthError, FetchError, ParseError
│   ├── response.ts                    # success / error JSON envelope helpers
│   ├── validator.ts                   # Zod request validator middleware
│   └── games/
│       └── maimai/
│           ├── index.ts               # getMaimaiProfile, getMaimaiRating entrypoints
│           ├── assets.ts              # Jacket, FC/FS icon, rating plate URL helpers
│           ├── auth.ts                # SEGA ID redirect dance & authentication
│           ├── consts.ts              # URLs, difficulty constants, version tables
│           ├── cookies.ts             # Cookie extraction and formatting helpers
│           ├── http.ts                # Custom fetch wrapper handling redirects & cookies
│           ├── schemas.ts             # Zod schemas & TypeScript types
│           ├── parser/
│           │   ├── name.ts            # Unicode normalization & URL basename utilities
│           │   ├── profile.ts         # Profile & collection (nameplate/frame) HTML parsers
│           │   └── scores.ts          # Score card scraping across all difficulties
│           ├── rating/
│           │   └── calculator.ts      # Rating formulas, bracket factors & B50 ranking
│           └── songs/
│               └── otoge-db.ts        # OtogeDB data fetching, versions & chart lookup
└── routes/
    └── v1/
        ├── index.ts                   # v1 router root
        └── [server]/
            └── maimai/
                ├── login.ts           # POST /v1/:server/maimai/login
                ├── profile.ts         # GET /v1/:server/maimai/profile
                └── rating.ts          # GET /v1/:server/maimai/rating
```

---

## Operational Notes

- **Stateless Design:** No persistent database is used; all operations are performed on-the-fly and edge-cached where applicable.
- **Session Lifetime:** `retention=1` is sent during authentication to maximize session lifetime on maimai NET.
- **Maintenance Window:** maimai NET undergoes daily scheduled maintenance between **04:00 and 07:00 JST**; requests during this window will fail upstream.

---

## References & Acknowledgments

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)