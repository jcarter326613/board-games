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

Authentication has intentionally not been implemented yet. Select the player
identity model first: guest players, local accounts with PostgreSQL-backed
sessions, or an external OpenID Connect provider.
