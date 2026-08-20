# Board Games

Multiplayer board-game platform built with React, Express, Socket.IO, and
PostgreSQL.

## Development

```bash
cp .env.example .env
docker compose up -d
pnpm dev:all
```

The web app runs at `http://localhost:5173`, and the API runs at
`http://localhost:3001`.

## Database

```bash
pnpm db:generate
pnpm db:migrate
```

## API architecture

API code is grouped by feature. A request flows from a feature router through
runtime validation, a controller, and an application service. The same game
service is used by HTTP controllers and Socket.IO event handlers.

`@board-games/contracts` contains Zod schemas and inferred TypeScript types
shared by API and client code. Do not use TypeScript interfaces alone to trust
HTTP or Socket.IO input.

Deck definitions are managed by administrators at `/admin/deck-types`. A deck
owns its future cards and can recursively include other independent decks,
without copying their cards. Circular inclusions are rejected, and a deck
cannot be deleted while another deck includes it.

On a new database, the web app presents a setup form for the first
administrator. Setup is available only while no users exist. Access tokens last
one minute; rotating refresh tokens last 30 days and use a 30-second grace
window for concurrent browser requests.

Set `ACCESS_TOKEN_SECRET` to a random value of at least 32 characters before
starting the API. For example: `openssl rand -base64 48`.
