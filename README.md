
# Workout Tracker

A local-first Nuxt app for recording workouts, managing exercises, and tracking training volume. Workout entries, custom exercises, and language preferences are stored in the browser.

The app is configured as a Progressive Web App (PWA). It provides Android-sized app icons and a service worker that caches the application shell for offline startup. The development server also enables the PWA for testing. Browsers require HTTPS for installation and service workers, except on `localhost`; use an HTTPS deployment to install it on another device.

## Exercise measurements

Select an exercise in the exercise library to change its measurement unit between reps and time (seconds). Custom exercises also offer this option when creating or editing them. Plank, Side Plank, and DB V Crunch Holds default to seconds. Preferences are saved locally and included in JSON exports.

Workout inputs, summaries, and exercise analytics use the configured unit. Timed holds are excluded from rep totals and lifting-volume calculations. Selecting a timed exercise in analytics shows its duration trends instead. Existing round values are preserved when changing a unit; they are interpreted in the newly selected unit, not converted.

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
