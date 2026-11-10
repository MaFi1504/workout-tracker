import type { Exercise, Workout } from '../composables/useWorkoutStorage'
import { workoutTime } from '../domain/workout-domain'

const columns = [
  'date', 'start_time', 'end_time', 'workout', 'workout_note', 'exercise', 'exercise_id',
  'set', 'set_type', 'side', 'weight', 'unit', 'reps', 'distance_km', 'seconds', 'note'
]

const csvField = (value: string | number) => {
  let text = String(value)
  // openGym removes this prefix again when reading its native CSV format.
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text)) text = `'${text}`
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** openGym's native CSV dialect: blank exercise IDs enable its name matcher. */
export const exportOpenGymCsv = (workouts: Workout[], catalog: Exercise[]): string => {
  const exercises = new Map(catalog.map((exercise) => [exercise.id, exercise]))
  const sessionKey = (workout: Workout) => `${workout.date}|${workoutTime(workout).slice(0, 5)}|${workout.title}`
  const sessionCounts = new Map<string, number>()
  for (const workout of workouts) {
    const key = sessionKey(workout)
    sessionCounts.set(key, (sessionCounts.get(key) || 0) + 1)
  }

  const rows: (string | number)[][] = [columns]
  for (const workout of workouts) {
    const extraNotes: string[] = []
    if (workout.source) extraNotes.push(`Source: ${workout.source}`)
    if (workout.workoutType) extraNotes.push(`Workout type: ${workout.workoutType}`)
    for (const entry of workout.exercises) {
      const exercise = exercises.get(entry.exerciseId)
      const name = exercise?.name || entry.exerciseId
      // openGym limits exercise notes to 280 characters; retain longer text at workout level.
      if (entry.notes?.length > 280) extraNotes.push(`${name}: ${entry.notes}`)
      for (const round of entry.rounds) {
        const details: string[] = []
        if (round.weightCount === 2) details.push(`2 x ${round.weightKg} kg (combined load exported)`)
        const timed = exercise?.measurementUnit === 'seconds'
        if (round.side === 'alternating') {
          details.push(timed ? 'alternating sides' : `${round.reps} reps per side (alternating)`)
        } else if (timed && round.side && round.side !== 'both') {
          // openGym's per-side sets only support reps, not timed holds.
          details.push(`${round.side} side`)
        }
        if (details.length) extraNotes.push(`${name}, round ${round.round}: ${details.join('; ')}`)
      }
    }

    const title = (sessionCounts.get(sessionKey(workout)) || 0) > 1
      ? `${workout.title} [${workout.id}]`
      : workout.title
    const notes = [workout.notes, ...extraNotes].filter(Boolean).join('\n\n')
    const start = `${workout.date} ${workoutTime(workout)}`

    for (const entry of [...workout.exercises].sort((a, b) => a.order - b.order)) {
      const exercise = exercises.get(entry.exerciseId)
      const timed = exercise?.measurementUnit === 'seconds'
      for (const round of entry.rounds) {
        const reps = round.reps * (round.side === 'alternating' ? 2 : 1)
        rows.push([
          workout.date, start, '', title, notes, exercise?.name || entry.exerciseId, '',
          round.round, 'normal', !timed && round.side === 'left' ? 'L' : !timed && round.side === 'right' ? 'R' : '',
          round.weightKg * (round.weightCount || 1), 'kg', timed ? '' : reps, '',
          timed ? round.reps : '', entry.notes || ''
        ])
      }
    }
  }
  return '\uFEFF' + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n'
}
