# Milestone 2: Exercise Management and Workout Entry

## Goals
- Add searchable exercise catalog and user creation flow.
- Build a workout session flow that can be recorded exercise by exercise while following a video or routine.
- Record multiple rounds for each exercise, including a different weight or rep count per round when needed.
- Support single-side and synchronized logging modes.

## Deliverables
- Searchable exercise picker
- Add custom exercise flow
- Workout session with title/date/notes and multiple ordered exercise entries
- Per-exercise round recorder for weight and reps
- Previous-performance context for each selected exercise
- Side mode selection for each movement

## Scope
- Exercise lookup and selection
- Save one parent workout record containing its exercise records and round entries
- Keep exercise identity linked to the catalog while storing session-specific measurements in the workout
- Distinguish between single-sided and synchronized exercises

## Exit criteria
- A user can create a workout with multiple exercises.
- Exercises can be searched and selected quickly.
- Different movement modes are stored correctly.
- Each exercise can store a separate weight and rep value for every round.
- A new session can show the previous recorded weight and reps for each selected exercise, regardless of which workout contained them.
