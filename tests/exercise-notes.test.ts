import { describe, expect, it } from 'vitest'
import { normalizeActiveWorkout, normalizeWorkouts } from '../composables/useWorkoutStorage'

const exercise = {
  id: 'exercise-1',
  exerciseId: 'squat',
  order: 0,
  side: 'synchronized',
  rounds: [{ id: 'round-1', round: 1, weightKg: 10, reps: 8, side: 'both' }]
}
const workout = {
  id: 'workout-1',
  date: '2026-11-01',
  createdAt: '2026-11-01T10:00:00Z',
  title: 'Legs',
  notes: 'Workout notes',
  exercises: [exercise]
}

describe('exercise note migration', () => {
  it('adds empty exercise notes without losing or mutating older workout data', () => {
    const restored = normalizeWorkouts([workout, { ...workout, id: 'workout-2' }])
    expect(restored).toEqual([
      { ...workout, exercises: [{ ...exercise, notes: '' }] },
      { ...workout, id: 'workout-2', exercises: [{ ...exercise, notes: '' }] }
    ])
    expect(exercise).not.toHaveProperty('notes')
    expect(normalizeWorkouts(restored)).toEqual(restored)
  })

  it('preserves existing exercise notes including multiline text', () => {
    const entry = { ...workout, exercises: [{ ...exercise, notes: 'Slow descent\nKeep steady' }] }
    expect(normalizeWorkouts([entry])).toEqual([entry])
    expect(normalizeActiveWorkout(entry)).toEqual({
      date: entry.date, durationMinutes: null, durationSeconds: null, title: entry.title, notes: entry.notes, exercises: entry.exercises
    })
  })

  it('preserves valid workout durations and discards invalid ones', () => {
    expect(normalizeWorkouts([{ ...workout, durationSeconds: 754 }])[0]?.durationSeconds).toBe(754)
    expect(normalizeWorkouts([{ ...workout, durationSeconds: -1 }])[0]).not.toHaveProperty('durationSeconds')
  })

  it('defaults notes on active drafts and legacy entries without discarding mixed-format workouts', () => {
    expect(normalizeActiveWorkout(workout).exercises).toEqual([{ ...exercise, notes: '' }])
    const legacy = { id: 'legacy', exerciseId: 'squat', sets: 2, reps: 8, weight: 10, notes: 'Legacy notes' }
    const restored = normalizeWorkouts([workout, legacy])
    expect(restored).toHaveLength(2)
    expect(restored[0]?.id).toBe(workout.id)
    expect(restored[1]?.notes).toBe('Legacy notes')
    expect(restored[1]?.exercises[0]?.notes).toBe('')
    expect(restored[1]?.exercises[0]?.rounds).toHaveLength(2)
  })
})
