# Feature 02: Workout Recording

## Objective
Allow the user to save workouts as separate entities that contain multiple exercises and multiple rounds.

## Requirements
- Each workout is a standalone log entry.
- One workout may contain 7 exercises or more.
- Each exercise may be repeated across 3 rounds or any user-defined round count.
- Metadata includes date, notes, and workout title.
- User can add exercises, adjust reps, sets, and round count within a record.

## Data model
```ts
interface WorkoutRecord {
  id: string
  date: string
  title: string
  exercises: ExerciseEntry[]
  notes?: string
}

interface ExerciseEntry {
  exerciseId: string
  rounds: number
  side: 'single' | 'synchronized'
  entries: RepEntry[]
}

interface RepEntry {
  weightKg: number
  reps: number
  side?: 'left' | 'right'
}
```

## UX flow
1. User creates a workout.
2. User selects exercises and adds them to the workout.
3. User chooses round count and movement side type.
4. User enters weight and reps as needed.
5. Workout is saved to local storage.

## Acceptance criteria
- A workout can include multiple exercises and rounds.
- Logged values remain editable after creation.
- Records can be filtered by date and exercise.
- Workouts are stored independently for later analytics.

## Milestone mapping
- M2: Workout creation flow
- M3: Weight and rep entry refinement
