# Feature 02: Workout Recording

## Objective
Allow the user to record one complete workout session as a parent entity containing multiple exercises, with each exercise storing the rounds completed during that session.

## Requirements
- Each workout is a standalone session and parent log entry.
- One workout may contain 7 exercises or more in a defined order.
- Each exercise may contain 3 rounds or any user-defined number of round entries.
- Every round stores the weight and reps actually completed; values may differ between rounds.
- Metadata includes date, notes, title, and optional source or workout type.
- User can add exercises, reorder them, and record or correct rounds while the session is in progress.

## Data model
```ts
interface Workout {
  id: string
  date: string
  title: string
  exercises: WorkoutExercise[]
  source?: string
  workoutType?: string
  notes?: string
}

interface WorkoutExercise {
  id: string
  exerciseId: string
  order: number
  side: 'single' | 'synchronized'
  rounds: RoundEntry[]
}

interface RoundEntry {
  round: number
  weightKg: number
  reps: number
  side?: 'left' | 'right' | 'both'
}
```

## UX flow
1. User starts a workout and optionally gives it a title or links it to a video or routine.
2. User selects exercises and adds them to the workout in the order they will be performed.
3. User chooses the round count and movement side type for each exercise.
4. While following the workout, user records the weight and reps for each completed round.
5. User can view the previous performance for the selected exercise without leaving the active workout.
6. Changing the first-round weight copies it, including its 2× factor, to all following rounds for that exercise.
7. The parent workout, its exercises, and all round entries are saved to local storage.

## Acceptance criteria
- A workout can include multiple exercises and rounds.
- The stored shape has one parent workout with nested workout exercises and round entries.
- A round preserves its own weight and reps instead of only storing an exercise total.
- Logged values remain editable after creation.
- Saved workouts can be deleted after confirmation.
- Workouts can be filtered by date, title/type, and exercise.
- Exercise analytics can aggregate round entries across all parent workouts.

## Milestone mapping
- M2: Workout creation flow
- M3: Weight and rep entry refinement
