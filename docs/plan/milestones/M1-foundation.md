# Milestone 1: Foundation and Local-First Setup

## Goals
- Initialize Nuxt app structure.
- Define the parent-child data model for workouts, workout exercises, and round entries.
- Add local storage foundation and app shell.
- Set default English language and header structure.

## Deliverables
- Nuxt app shell and base navigation
- Exercise JSON seed file loaded from server or static source
- Local persistence layer for workouts and settings
- Header with language switch control

## Scope
- Base app scaffold
- Exercise catalog model
- `Workout` session model containing ordered `WorkoutExercise` records
- `WorkoutExercise` model containing one `RoundEntry` per recorded round
- Local caching patterns
- Data validation hooks

## Exit criteria
- App boots and renders without errors.
- App stores data locally on the device.
- Basic exercise seed file is available.
- A workout can be represented without duplicating the exercise catalog definition.
- Round entries preserve the weight and reps recorded for each exercise in a session.
