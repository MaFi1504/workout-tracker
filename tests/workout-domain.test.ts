import { describe, expect, it } from 'vitest'
import { COMMON_WEIGHTS_KG, addRep, exerciseHistory, exerciseVolume, filterWorkouts, kgToLb, lbToKg, removeRep, validateWorkout, workoutVolume } from './domain/workout-domain'
import type { Workout } from './composables/useWorkoutStorage'

const workout = (overrides: Partial<Workout> = {}): Workout => ({ id: 'workout-1', date: '2026-01-15', title: 'Upper body', notes: '', exercises: [{ id: 'workout-1-exercise', exerciseId: 'front-raise', order: 0, side: 'synchronized', rounds: [{ id: 'round-1', round: 1, weightKg: 5, reps: 10, side: 'both' }, { id: 'round-2', round: 2, weightKg: 6, reps: 8, side: 'both' }] }], ...overrides })

describe('measurement tools', () => {
  it('offers quick-select weights', () => expect(COMMON_WEIGHTS_KG).toEqual([1, 3, 5, 8, 10]))
  it('converts kg to lb and back using kg as canonical value', () => { expect(kgToLb(5)).toBeCloseTo(11.0231, 3); expect(lbToKg(kgToLb(5))).toBeCloseTo(5, 10) })
  it('increments reps and corrects the last count', () => { expect(addRep(9)).toBe(10); expect(removeRep(10)).toBe(9); expect(removeRep(0)).toBe(0) })
})

describe('workout records', () => {
  it('preserves round measurements and calculates nested volume', () => { const entry = workout(); expect(entry.exercises[0]?.rounds.map(({ weightKg, reps }) => ({ weightKg, reps }))).toEqual([{ weightKg: 5, reps: 10 }, { weightKg: 6, reps: 8 }]); expect(exerciseVolume(entry.exercises[0]!)).toBe(98); expect(workoutVolume(entry)).toBe(98) })
  it('counts paired weights for synchronized rounds', () => { const entry = workout(); entry.exercises[0]!.rounds = [{ id: 'paired', round: 1, weightKg: 5, weightCount: 2, reps: 10, side: 'both' }]; expect(exerciseVolume(entry.exercises[0]!)).toBe(100) })
  it('validates mixed synchronized and single-sided rounds', () => { const entry = workout(); expect(validateWorkout(entry)).toBe(true); entry.exercises[0]!.rounds[1]!.weightKg = -1; expect(validateWorkout(entry)).toBe(false); expect(validateWorkout(workout({ exercises: [{ ...workout().exercises[0]!, side: 'single', rounds: [{ id: 'both', round: 1, weightKg: 5, reps: 10, side: 'both' }, { id: 'left', round: 2, weightKg: 5, reps: 10, side: 'left' }] }] }))).toBe(true) })
})

describe('history and filters', () => {
  it('aggregates an exercise across parent workouts in date order', () => { const older = workout({ id: 'older', date: '2026-01-01' }); const newer = workout({ id: 'newer', date: '2026-02-01' }); expect(exerciseHistory([newer, older], 'front-raise').map((point) => point.workoutId)).toEqual(['older', 'older', 'newer', 'newer']) })
  it('filters by exercise, title, and inclusive date range', () => { const matching = workout({ id: 'matching', date: '2026-02-01', title: 'Leg day' }); const other = workout({ id: 'other', date: '2026-03-01', title: 'Upper body' }); expect(filterWorkouts([matching, other], { exerciseId: 'front-raise', title: 'leg', from: '2026-02-01', to: '2026-02-28' }).map((item) => item.id)).toEqual(['matching']) })
})
