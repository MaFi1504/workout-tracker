import { describe, expect, it } from 'vitest'
import { parseWorkoutNotes } from '../utils/workoutImport'

describe('workout note import', () => {
  it('groups repeated measurement lines into exercise rounds and ignores trailing notes', () => {
    const result = parseWorkoutNotes(`Lat Raises
5kg 10 reps
8kg 7 reps
8kg 8 reps

OverheadTrice Extensions
5kg 6 reps pro
5kg 6 reps pro`)

    expect(result).toEqual([
      {
        name: 'Lat Raises',
        rounds: [
          { weightKg: 5, reps: 10 },
          { weightKg: 8, reps: 7 },
          { weightKg: 8, reps: 8 }
        ]
      },
      {
        name: 'OverheadTrice Extensions',
        rounds: [
          { weightKg: 5, reps: 6 },
          { weightKg: 5, reps: 6 }
        ]
      }
    ])
  })

  it('parses reps-only bodyweight exercise lines', () => {
    expect(parseWorkoutNotes('10 pushups')).toEqual([
      {
        name: 'pushups',
        rounds: [{ weightKg: 0, reps: 10 }]
      }
    ])
  })
})
