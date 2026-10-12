# Workout Progress Tracking App Plan

This project plan is split into feature documents and milestone documents.

## Feature order
- [docs/plan/features/01-exercise-catalog.md](docs/plan/features/01-exercise-catalog.md)
- [docs/plan/features/02-workout-recording.md](docs/plan/features/02-workout-recording.md)
- [docs/plan/features/03-rep-counter-and-weight-tools.md](docs/plan/features/03-rep-counter-and-weight-tools.md)
- [docs/plan/features/04-single-sided-vs-synchronized.md](docs/plan/features/04-single-sided-vs-synchronized.md)
- [docs/plan/features/05-progress-analytics.md](docs/plan/features/05-progress-analytics.md)
- [docs/plan/features/06-local-storage-offline.md](docs/plan/features/06-local-storage-offline.md)
- [docs/plan/features/07-i18n-header.md](docs/plan/features/07-i18n-header.md)

## Milestone order
- [docs/plan/milestones/M1-foundation.md](docs/plan/milestones/M1-foundation.md)
- [docs/plan/milestones/M2-workout-entry.md](docs/plan/milestones/M2-workout-entry.md)
- [docs/plan/milestones/M3-counter-and-measurement-tools.md](docs/plan/milestones/M3-counter-and-measurement-tools.md)
- [docs/plan/milestones/M4-analytics-offline-i18n.md](docs/plan/milestones/M4-analytics-offline-i18n.md)

## Overview
The app is planned as a Nuxt-based, local-first workout tracker for recording a complete workout session while following a video or routine. Each persisted `Workout` contains multiple exercises, and each exercise contains the rounds recorded during that session. Exercise history is aggregated across all workouts so progress can be compared even when the same exercise appears in different routines.

The app will support English and German, allow custom exercises, stay usable offline, and visualize weight, reps, and volume trends over time.
