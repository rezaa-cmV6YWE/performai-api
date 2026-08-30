# performai-api

Scraper API for SEGA arcade rhythm games (maimai, CHUNITHM, O.N.G.E.K.I). Built for Cloudflare Workers with Hono.

Currently supports **maimai International** only. JP and CN servers are stubbed for future implementation.

## Setup

```bash
bun install
```

## Development

```bash
bun run dev
```

## Lint / format

```bash
bun run check   # biome check --write
bun run lint    # biome check
```

## Deploy

```bash
bun run deploy
```

## API Documentation

- **Interactive API Reference (Scalar):** `http://localhost:8787/scalar` or `http://localhost:8787/docs`
- **OpenAPI 3.1.0 JSON Spec:** `http://localhost:8787/openapi.json` or `http://localhost:8787/doc`

## API

Base URL: `/v1/:server/:game`

| Server | Game      | Status              |
| ------ | --------- | ------------------- |
| `intl` | `maimai`  | Supported           |
| `jp`   | `maimai`  | Not implemented     |
| `cn`   | `maimai`  | Not implemented     |
| `intl` | `chunithm`| Not implemented     |
| `intl` | `ongeki`  | Not implemented     |

### Response schema

Success:

```json
{
  "data": { ... }
}
```

Error:

```json
{
  "error": {
    "code": "AUTH_ERROR",
    "message": "..."
  }
}
```

### Endpoints

#### `POST /v1/:server/:game/login`

Log in with SEGA ID credentials and get a session cookie.

Request body:

```json
{
  "segaId": "your_sega_id",
  "password": "your_password"
}
```

Response:

```json
{
  "data": {
    "cookie": "clal=...; other_cookie=..."
  }
}
```

#### `GET /v1/:server/:game/profile`

Fetch player profile. Requires the session cookie in the `x-maimai-cookie` header.

```bash
curl http://localhost:8787/v1/intl/maimai/profile \
  -H "x-maimai-cookie: YOUR_COPIED_COOKIE_STRING"
```

Response:

```json
{
  "data": {
    "name": "PlayerName",
    "rating": 15000
  }
}
```

> The profile parser currently uses guessed CSS selectors. If `name` or `rating` return `null`, inspect the maimai HTML and update `src/lib/games/maimai/parser.ts`.


## Project structure

```
src/
├── index.ts                      # Hono app entry
├── lib/
│   ├── errors.ts                 # GameError / AuthError
│   ├── response.ts               # success/error response helpers
│   ├── validator.ts              # Zod validator wrapper
│   └── games/
│       ├── base.ts               # Shared game types
│       └── maimai/
│           ├── auth.ts           # SEGA ID login flow
│           ├── consts.ts         # URLs per server
│           ├── cookies.ts        # Set-Cookie parsing helpers
│           ├── http.ts           # Fetch wrapper with redirect handling
│           ├── index.ts          # getProfile
│           └── parser.ts         # HTML parsers
└── routes/
    └── v1/
        ├── index.ts              # v1 router
        └── [server]/
            └── [game]/
                ├── login.ts
                └── profile.ts
```

## Notes

- Sessions are stateless. No database is used.
- `retention=1` is sent during login so sessions last longer.
- maimai maintenance window (04:00–07:00 JST) may block requests.