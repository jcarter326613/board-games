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

On a new database, the web app presents a one-time setup form for the first
administrator. The account can log in only while no regular administrator
exists. Access tokens last one minute; rotating refresh tokens last 30 days and
use a 30-second grace window for concurrent browser requests.

Set `ACCESS_TOKEN_SECRET` to a random value of at least 32 characters before
starting the API. For example: `openssl rand -base64 48`.
