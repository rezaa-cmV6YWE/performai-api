# Performai API

![kaleidxscope](./assets/kaleidx-scope.jpeg)

art by: [@Resetovo](https://x.com/Resetovo/status/1946531307456249995?s=20)

---

Scraper and rating calculation API for SEGA arcade rhythm games (maimai, CHUNITHM, O.N.G.E.K.I). Standalone Bun backend built with **Elysia + Zod + Cheerio**.

Currently supports **maimai International (`intl`)** (full authentication, profile, score parsing, Best 50 / DX Rating) and **CHUNITHM International (`intl`)** (login, profile, Best 30 / New 20 Rating). JP and CN servers and other rhythm games are planned.

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
| `intl` | `chunithm` | Supported | Login, profile, and rating / Best 30 & New 20     |
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
│   ├── chunithm/                      # CHUNITHM module controller, schemas, service
│   └── maimai/                        # Maimai module controller, schemas, service
├── plugins/
│   ├── error-handler.ts               # Global onError handler (GameError & validation errors)
│   └── openapi.ts                     # @elysiajs/openapi plugin (Scalar UI at /docs, spec at /docs/json)
└── lib/
    ├── errors.ts                      # Error classes (GameError, AuthError, FetchError, ParseError)
    ├── shared/                        # Shared HTTP, cookie, and SEGA ID auth utilities
    └── games/
        ├── chunithm/
        │   ├── parser/                # Profile, rating, and collection HTML parsers
        │   ├── rating/                # Rating calculation (Best 30 / New 20)
        │   └── songs/                 # OtogeDB data fetching and matching
        └── maimai/
            ├── parser/                # Name normalization, profile, and score parsers
            ├── rating/                # Rating formulas, AP bonus, Best 50 ranking
            └── songs/                 # OtogeDB data fetching and matching
```

---

## Operational Notes

- **Stateless Design:** No persistent database is used; all operations are performed on-the-fly directly against upstream game services and OtogeDB.
- **Session Lifetime & Refresh:** `retention=1` is sent during authentication to maximize session lifetime on maimai NET. The response cookie preserves the `clal` token, allowing sessions to be renewed via `refreshSession` if the IP-bound session cookies (`_t`, `userId`) expire.
- **Maintenance Window:** maimai NET undergoes daily scheduled maintenance between **01:00 and 02:00 JST**; requests during this window will fail upstream.
- **Maintenance Window:** chunithm NET undergoes daily scheduled maintenance between **04:00 and 07:00 JST**; requests during this window will fail upstream.

---

## References & Acknowledgments

- [OtogeDB](https://github.com/zvuc/otoge-db)
- [Tomomai](https://github.com/shedaniel/tomomai)
- [Chuni Penguin](https://github.com/beer-psi/chuni-penguin)
