import { describe, expect, it } from 'vitest'
import { COMMON_WEIGHTS_KG, addRep, combineDateAndTime, exerciseHistory, exerciseVolume, filterWorkouts, formatWorkoutDuration, kgToLb, lbToKg, localDateIso, localTimeIso, nextRoundSide, removeRep, updateRoundWeight, validateWorkout, workoutTime, workoutVolume } from '../domain/workout-domain'
import type { Workout } from '../composables/useWorkoutStorage'

const workout = (overrides: Partial<Workout> = {}): Workout => ({ id: 'workout-1', date: '2026-01-15', title: 'Upper body', notes: '', exercises: [{ id: 'workout-1-exercise', exerciseId: 'front-raise', order: 0, side: 'synchronized', notes: '', rounds: [{ id: 'round-1', round: 1, weightKg: 5, reps: 10, side: 'both' }, { id: 'round-2', round: 2, weightKg: 6, reps: 8, side: 'both' }] }], ...overrides })

describe('workout date and time', () => {
  it('formats workout durations as minutes and zero-padded seconds', () => {
    expect(formatWorkoutDuration(754)).toBe('12:34')
    expect(formatWorkoutDuration(5)).toBe('0:05')
  })

  it('combines a local date and time into a timestamp that round-trips', () => {
    const createdAt = combineDateAndTime('2026-03-29', '01:30:15')
    const timestamp = new Date(createdAt)
    expect(localDateIso(timestamp)).toBe('2026-03-29')
    expect(localTimeIso(timestamp)).toBe('01:30:15')
    expect(workoutTime({ createdAt })).toBe('01:30:15')
  })

  it('accepts times without seconds and defaults missing times to midnight', () => {
    expect(workoutTime({ createdAt: combineDateAndTime('2026-11-04', '18:05') })).toBe('18:05:00')
    expect(workoutTime({ createdAt: combineDateAndTime('2026-11-04', '') })).toBe('00:00:00')
    expect(workoutTime({})).toBe('00:00:00')
    expect(workoutTime({ createdAt: 'not a date' })).toBe('00:00:00')
  })

  it('formats local dates with zero padding', () => expect(localDateIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05'))
})

describe('measurement tools', () => {
  it('offers quick-select weights', () => expect(COMMON_WEIGHTS_KG).toEqual([1, 3, 5, 8, 10]))
  it('converts kg to lb and back using kg as canonical value', () => { expect(kgToLb(5)).toBeCloseTo(11.0231, 3); expect(lbToKg(kgToLb(5))).toBeCloseTo(5, 10) })
  it('increments reps and corrects the last count', () => { expect(addRep(9)).toBe(10); expect(removeRep(10)).toBe(9); expect(removeRep(0)).toBe(0) })
  it('cycles round side selection from both to left to right to alternating and back', () => {
    expect(nextRoundSide()).toBe('left')
    expect(nextRoundSide('left')).toBe('right')
    expect(nextRoundSide('right')).toBe('alternating')
    expect(nextRoundSide('alternating')).toBe('both')
  })
})

describe('workout records', () => {
  it('excludes timed holds from lifting volume without changing stored measurements', () => {
    const entry = workout()
    const hold = { ...entry.exercises[0]!, id: 'hold', exerciseId: 'plank', order: 1 }
    entry.exercises.push(hold)
    expect(exerciseVolume(hold, 'seconds')).toBe(0)
    expect(workoutVolume(entry, [{ id: 'plank', measurementUnit: 'seconds' }])).toBe(98)
    expect(workoutVolume(entry, [{ id: 'plank', measurementUnit: 'reps' }])).toBe(196)
    expect(exerciseHistory([entry], 'plank', 'seconds').map((point) => point.volume)).toEqual([0, 0])
    expect(hold.rounds.map((round) => round.reps)).toEqual([10, 8])
    expect(validateWorkout(entry)).toBe(true)
  })
  it('preserves round measurements and calculates nested volume', () => { const entry = workout(); expect(entry.exercises[0]?.rounds.map(({ weightKg, reps }) => ({ weightKg, reps }))).toEqual([{ weightKg: 5, reps: 10 }, { weightKg: 6, reps: 8 }]); expect(exerciseVolume(entry.exercises[0]!)).toBe(98); expect(workoutVolume(entry)).toBe(98) })
  it('counts paired weights for synchronized rounds', () => { const entry = workout(); entry.exercises[0]!.rounds = [{ id: 'paired', round: 1, weightKg: 5, weightCount: 2, reps: 10, side: 'both' }]; expect(exerciseVolume(entry.exercises[0]!)).toBe(100) })
  it('counts alternating reps for both sides in volume while keeping entered reps per side', () => {
    const entry = workout()
    entry.exercises[0]!.rounds = [{ id: 'alternating', round: 1, weightKg: 5, reps: 5, side: 'alternating' }]
    expect(exerciseVolume(entry.exercises[0]!)).toBe(50)
    expect(workoutVolume(entry)).toBe(50)
    expect(exerciseHistory([entry], 'front-raise').map((point) => point.volume)).toEqual([50])
    expect(entry.exercises[0]!.rounds[0]!.reps).toBe(5)
    expect(validateWorkout(entry)).toBe(true)
    expect(exerciseVolume(entry.exercises[0]!, 'seconds')).toBe(0)
  })
  it('updates following round weights and weight counts from round one', () => {
    const rounds = workout().exercises[0]!.rounds
    expect(updateRoundWeight(rounds, 0, 8, 2).map(({ weightKg, weightCount }) => ({ weightKg, weightCount }))).toEqual([{ weightKg: 8, weightCount: 2 }, { weightKg: 8, weightCount: 2 }])
  })
  it('validates mixed synchronized and single-sided rounds', () => { const entry = workout(); expect(validateWorkout(entry)).toBe(true); entry.exercises[0]!.rounds[1]!.weightKg = -1; expect(validateWorkout(entry)).toBe(false); expect(validateWorkout(workout({ exercises: [{ ...workout().exercises[0]!, side: 'single', rounds: [{ id: 'both', round: 1, weightKg: 5, reps: 10, side: 'both' }, { id: 'left', round: 2, weightKg: 5, reps: 10, side: 'left' }] }] }))).toBe(true) })
})

describe('history and filters', () => {
  it('aggregates an exercise across parent workouts in date order', () => { const older = workout({ id: 'older', date: '2026-01-01' }); const newer = workout({ id: 'newer', date: '2026-02-01' }); expect(exerciseHistory([newer, older], 'front-raise').map((point) => point.workoutId)).toEqual(['older', 'older', 'newer', 'newer']) })
  it('filters by exercise, title, and inclusive date range', () => { const matching = workout({ id: 'matching', date: '2026-02-01', title: 'Leg day' }); const other = workout({ id: 'other', date: '2026-03-01', title: 'Upper body' }); expect(filterWorkouts([matching, other], { exerciseId: 'front-raise', title: 'leg', from: '2026-02-01', to: '2026-02-28' }).map((item) => item.id)).toEqual(['matching']) })
})
