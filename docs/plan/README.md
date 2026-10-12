# Nuxt Workout Progress Tracking App Plan

This plan organizes the app by feature and milestone so it can be implemented incrementally in a Nuxt project.

## Product goal
Build a progressive workout tracker that helps the user record a complete workout while following a video or routine. A workout contains multiple exercises, and every exercise records its rounds with the weight and reps completed. The app compares each exercise across all workouts so the user can see the last performance and choose whether to increase weight or reps next time.

## Feature ordering
1. Exercise catalog and search
2. Workout creation and entry flow
3. Repetition counter and weight selection
4. Single-sided vs synchronized training support
5. Progress analytics and charts
6. Local persistence and offline caching
7. Language switcher and UI polish

## Milestone overview
- Milestone 1: foundation, app shell, data model, and local persistence
- Milestone 2: exercise management and workout entry flows
- Milestone 3: rep counter, weight tools, and workout round modeling
- Milestone 4: analytics, visual charts, offline readiness, and i18n

## Planned document structure
- [features/01-exercise-catalog.md](features/01-exercise-catalog.md)
- [features/02-workout-recording.md](features/02-workout-recording.md)
- [features/03-rep-counter-and-weight-tools.md](features/03-rep-counter-and-weight-tools.md)
- [features/04-single-sided-vs-synchronized.md](features/04-single-sided-vs-synchronized.md)
- [features/05-progress-analytics.md](features/05-progress-analytics.md)
- [features/06-local-storage-offline.md](features/06-local-storage-offline.md)
- [features/07-i18n-header.md](features/07-i18n-header.md)
- [milestones/M1-foundation.md](milestones/M1-foundation.md)
- [milestones/M2-workout-entry.md](milestones/M2-workout-entry.md)
- [milestones/M3-counter-and-measurement-tools.md](milestones/M3-counter-and-measurement-tools.md)
- [milestones/M4-analytics-offline-i18n.md](milestones/M4-analytics-offline-i18n.md)

## Key product requirements
- Save each workout session as one parent object containing multiple ordered exercises.
- Record each exercise's rounds, with the weight and reps completed for every round.
- Keep exercise history independent of the parent workout so the same movement can be compared across different routines.
- Show the latest weight and reps for an exercise before or during a new workout to support progressive overload decisions.
- Distinguish between single-sided and synchronized execution.
- Allow user-created exercises and searchable lookup when adding an entry.
- Load a base exercise list from the server, stored as JSON for easy extension.
- Provide a tap-to-count rep interaction for quick logging.
- Support weights in 1, 3, 5, 8, and 10 kg increments, including lb/kg conversion.
- Show weight, reps, and volume trends for each exercise across days, weeks, months, and custom ranges.
- Provide graphs and summary comparisons for the latest performance, previous performance, and best performance of each exercise.
- Default language is English, with German available in the header.
- Persist data locally on the device and minimize remote dependency for offline use.

## Technical direction
- Framework: Nuxt
- Data layer: local-first state with IndexedDB/localStorage fallback
- UI: responsive single-page app with card-based workout flow
- Offline strategy: cache exercise catalog and recent data locally, sync when connectivity returns
- Extensibility: exercise JSON file kept separate from app logic for easy updates
