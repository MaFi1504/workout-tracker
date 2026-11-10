
# Workout Tracker

A local-first Nuxt app for recording workouts, managing exercises, and tracking training volume. Workout entries, custom exercises, and language preferences are stored in the browser.

The app is configured as a Progressive Web App (PWA). It provides Android-sized app icons and a service worker that caches the application shell for offline startup. The development server also enables the PWA for testing. Browsers require HTTPS for installation and service workers, except on `localhost`; use an HTTPS deployment to install it on another device.

## Exercise measurements

Exercise searches in the library, active workout, and workout editor match names, aliases (such as **RDL** for **Romanian Deadlift**), and tags, ignoring case.

Select an exercise in the exercise library to change its measurement unit between reps and time (seconds). Custom exercises also offer this option when creating or editing them. Plank, Side Plank, and DB V Crunch Holds default to seconds. Preferences are saved locally and included in JSON exports.

Workout inputs, summaries, and exercise analytics use the configured unit. Timed holds are excluded from rep totals and lifting-volume calculations. Selecting a timed exercise in analytics shows its duration trends instead. Existing round values are preserved when changing a unit; they are interpreted in the newly selected unit, not converted.

## Exercise notes

Each exercise within a workout has its own notes, separate from the workout's overall notes. Expand **Notes** beneath an exercise to add text; empty note sections start collapsed and existing notes open automatically. Notes are preserved in active drafts, saved workouts, loaded workout copies, and JSON exports. Older workouts and drafts receive an empty note without removing any workout data.

Exercise cards in the active workout can be collapsed individually. Choose **Finish exercise** to mark a card finished and collapse it; finished cards can be expanded again or marked unfinished.

If an exercise search has no matches, choose **Create and add** to save the typed name as a local custom exercise and immediately use it in the workout. This also works in the workout editor. New exercises default to the General tag, kilograms, and reps; further details can be changed later in the exercise library.

## Moving your history to openGym

On the browser/device where you recorded your workouts, open **Tools → Move to openGym → Download openGym CSV**. In [openGym](https://github.com/DuarteSantos8/openGym), go to **Settings → Data & backup → Import from another app**, select the CSV, review the preview, and confirm.

The export uses openGym's native CSV format, with one row per saved round, explicit kilogram units, workout dates/times, exercise names, reps or seconds, and workout/exercise notes. Exercise names are matched to openGym's library; unmatched names become custom exercises. Active drafts are not exported: save them first.

- Two weights (for example, `2 × 8 kg`) become the combined load (`16 kg`) to preserve lifting volume; the original weight configuration is retained in workout notes.
- Left/right rep sets use openGym's side field. Timed sets retain seconds, with their side recorded in workout notes because openGym does not support timed per-side sets.
- Workouts sharing a date, start minute, and title receive their original ID in the exported title so openGym does not merge them. Date-only legacy workouts use midnight. Workout end times are unknown and left blank.
- Exercise notes longer than openGym's 280-character limit are also copied into workout notes. Source and workout type, when present, are retained there too.
- openGym combines repeated entries for the same exercise within a workout and skips sets with zero weight and zero reps/seconds (and consequently workouts containing only those sets). Its importer also rejects invalid dates and out-of-range measurements; check its preview before confirming.

**Also download the existing JSON export as an archival backup** before switching. It preserves the exact original records, custom exercise catalog, and measurement preferences. The CSV transfers history, not routines, unused exercises, or app settings. Exporting does not modify or delete your data.

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

## Continuous integration

GitHub Actions ([ci.yml](.github/workflows/ci.yml)) runs on every push: it installs dependencies, runs the tests, builds the app, builds the Docker image, and smoke-tests the container. The image is then published to the GitHub Container Registry as `ghcr.io/mafi1504/workout-tracker` with these tags:

- `latest` – the newest build of `main`
- `<branch>` – the newest build of a branch
- `sha-<commit>` – an immutable build of a specific commit
- `<version>` / `<major>.<minor>` – for pushed `v*` tags

Dependabot branches are built and tested but not published. Patch and minor Dependabot updates are merged automatically once all required checks pass ([dependabot-auto-merge.yml](.github/workflows/dependabot-auto-merge.yml)).

## Production container

Pull and start the prebuilt image on the host:

```bash
docker compose pull
docker compose up -d
```

Set `WORKOUT_TRACKER_TAG` to run a specific tag, for example `WORKOUT_TRACKER_TAG=sha-<commit>`.

Alternatively, build and start the production container locally:

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
