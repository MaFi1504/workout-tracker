import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { DEFAULT_ACTIVE_WORKOUT_TITLE, normalizeActiveWorkout, useWorkoutStorage } from '../composables/useWorkoutStorage'
import { localDateIso } from '../domain/workout-domain'

const states = new Map<string, Ref>()
const today = () => localDateIso()
const exercise = { id: 'e1', exerciseId: 'squat', order: 0, side: 'synchronized' as const, notes: '', rounds: [{ id: 'r1', round: 1, weightKg: 10, reps: 8 }] }

beforeEach(() => {
  states.clear()
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useState', <T>(key: string, init: () => T): Ref<T> => {
    if (!states.has(key)) states.set(key, ref(init()))
    return states.get(key)!
  })
})

describe('active workout', () => {
  it('restores a stored in-progress workout including its original date', () => {
    const restored = normalizeActiveWorkout({ date: '2026-11-01', title: 'Legs', notes: 'Felt good', exercises: [exercise] })
    expect(restored).toEqual({ date: '2026-11-01', title: 'Legs', notes: 'Felt good', exercises: [exercise] })
  })

  it('falls back to a fresh workout for missing or invalid data', () => {
    expect(normalizeActiveWorkout(null)).toEqual({ date: today(), title: DEFAULT_ACTIVE_WORKOUT_TITLE, notes: '', exercises: [] })
    expect(normalizeActiveWorkout({ title: 5, exercises: [{ foo: 1 }, exercise] }).exercises).toEqual([exercise])
  })

  it('starts an empty draft from an earlier day on today', () => {
    expect(normalizeActiveWorkout({ date: '2026-11-01', title: 'Legs', exercises: [] }).date).toBe(today())
  })

  it('shares the active workout across consumers and resets it', () => {
    const storage = useWorkoutStorage()
    storage.activeWorkout.value.exercises.push(exercise)
    storage.activeWorkout.value.title = 'Legs'
    expect(useWorkoutStorage().activeWorkout.value.exercises).toHaveLength(1)
    storage.resetActiveWorkout()
    expect(useWorkoutStorage().activeWorkout.value).toEqual({ date: today(), title: DEFAULT_ACTIVE_WORKOUT_TITLE, notes: '', exercises: [] })
  })
})
