
# Workout Tracker

A local-first Nuxt app for recording workouts, managing exercises, and tracking training volume. Workout entries, custom exercises, and language preferences are stored in the browser.

## Development

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

The app is available at `http://localhost:3000`.

## Production build

```bash
pnpm build
pnpm preview
```

## Production container

Build and start the production container with Docker Compose:

```bash
docker compose up --build -d
```

The app is available at `http://localhost:3000`. Set `WORKOUT_TRACKER_PORT` to use a different host port:

```bash
WORKOUT_TRACKER_PORT=8080 docker compose up --build -d
```

Check the service status or stop it with:

```bash
docker compose ps
docker compose down
```

The product roadmap lives in [PLAN.md](PLAN.md), with detailed feature and milestone documents under [docs/plan](docs/plan).
