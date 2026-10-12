# Feature 05: Progress Analytics and Charts

## Objective
Visualize exercise performance over time so the user can understand trends and progression across all workout sessions.

## Requirements
- Show progress by day, week, month, and custom range.
- Support filtering by exercise, workout title/type, and date range.
- Aggregate round entries by exercise across different parent workouts.
- Chart working weight, reps per round, total reps, and volume across time.
- Highlight latest performance, previous performance, best performance, and recent trend changes.
- Make the most recent weight and reps available while starting that exercise in a new workout.

## Chart ideas
- Weight progression over time for a selected exercise
- Repetition count per round and total reps per session
- Volume by week and month for a selected exercise
- Latest versus previous versus best performance comparison
- Comparison of single-sided vs synchronized sessions

## Acceptance criteria
- Graphs update when filters change.
- Data is grouped correctly by selected time window and exercise, regardless of parent workout.
- Each plotted point can be traced back to its workout date and round.
- A user can compare the last recorded weight and reps with earlier performance to choose a progression target.
- Trends remain readable on mobile devices.

## Milestone mapping
- M4: Analytics and data interpretation
