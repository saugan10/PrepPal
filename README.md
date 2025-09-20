# PrepPal – Interview Prep Assistant

A full-stack TypeScript app for tracking job applications and practicing interviews with AI-assisted questions and feedback. Frontend is React + Vite + Tailwind; backend is Express on Node 20 with MongoDB persistence (with in-memory fallback for quick demos). Built as a single service: the server serves the API and the built client from a single port.

## Tech stack

- Node.js 20, TypeScript, Express
- React 18, Vite, TailwindCSS
- MongoDB via Mongoose (optional, in-memory fallback available)
- Google Gemini API via @google/genai

## Monorepo structure

```
.
├─ client/                # React app (Vite)
│  ├─ index.html
│  └─ src/
├─ server/                # Express server and Vite dev integration
│  ├─ index.ts
│  ├─ routes.ts
│  ├─ vite.ts
│  └─ services/
├─ shared/                # Shared types/schemas
├─ vite.config.ts         # Vite config (root=client, outDir=dist/public)
├─ tsconfig.json          # TS paths (e.g. @shared/*)
├─ package.json           # Scripts for dev/build/start
└─ Dockerfile             # Multi-stage production image
```

Build artifacts:
- Client build: dist/public (configured in vite.config.ts)
- Server bundle: dist/index.js (via esbuild during npm run build)

## Requirements

- Node.js 20+
- npm 10+
- Optional: MongoDB (Atlas or self-hosted)

## Environment variables

Copy the example and fill in values:

```
cp .env.example .env
```

Required at runtime:
- MONGODB_URI: MongoDB connection string. If omitted, the app runs using an in-memory store; /api/stats will respond 503 without a DB.
- GEMINI_API_KEY: Google Gemini API key used for AI questions/feedback. If not provided, the app returns sensible fallbacks.
- PORT: Port to listen on (default 5000).

The server loads .env from the project root at startup.

## Install dependencies

```
npm ci
```

## Development

Single command dev server with hot reload (Vite middlewares are attached to Express):

```
npm run dev
```

By default the app listens on http://localhost:5000 (honors PORT).

## Build and run (production)

Build client and bundle server:

```
npm run build
```

Start:

```
npm start
```

The server will serve:
- API under /api/*
- Static client from dist/public with SPA fallback

## Docker

Build the image:

```
docker build -t preppal .
```

Run the container (using your local .env):

```
docker run --rm -p 5000:5000 --env-file .env preppal
```

Customize port:

```
docker run --rm -e PORT=8080 -p 8080:8080 --env-file .env preppal
```

Notes:
- The image is production-only and runs node dist/index.js.
- Static assets are served from dist/public by the same server process.

## API overview

- GET /api/applications
- GET /api/applications/:id
- POST /api/applications
- PATCH /api/applications/:id
- DELETE /api/applications/:id
- GET /api/stats
- POST /api/ai/questions
- POST /api/ai/feedback
- POST /api/sessions
- GET /api/sessions/:applicationId

Responses are JSON. See source under server/routes.ts for details and expected bodies.

## Path aliases

TypeScript paths are configured (e.g. @shared/*). These are resolved by the bundlers during build.

## Troubleshooting

- Database not configured: If MONGODB_URI is missing or invalid, storage falls back to in-memory. Most features work, but /api/stats returns 503.
- AI key: Without GEMINI_API_KEY, the app returns fallback questions and feedback.
- Port conflicts: Set PORT and map it when running with Docker.

## License

MIT