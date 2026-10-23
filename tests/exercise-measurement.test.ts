import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { playlistExercises } from '../data/exerciseCatalog'
import { useWorkoutStorage } from '../composables/useWorkoutStorage'
import { findMatchingExercise } from '../utils/exerciseMatching'

const states = new Map<string, Ref>()

beforeEach(() => {
  states.clear()
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useState', <T>(key: string, init: () => T): Ref<T> => {
    if (!states.has(key)) states.set(key, ref(init()))
    return states.get(key)!
  })
})

describe('exercise measurement configuration', () => {
  it('keeps the expanded catalog unique and resolves common new aliases', () => {
    const ids = playlistExercises.map((exercise) => exercise.id)
    const names = playlistExercises.map((exercise) => exercise.name.toLowerCase())
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    expect(findMatchingExercise(playlistExercises, 'Pullups')?.id).toBe('pull-ups')
    expect(findMatchingExercise(playlistExercises, 'Close Grip Push Ups')?.id).toBe('diamond-push-ups')
    expect(findMatchingExercise(playlistExercises, 'Glute Bridge')?.id).toBe('glute-bridges')
  })

  it('defaults static holds to seconds and dynamic movements to reps', () => {
    expect(playlistExercises.filter((exercise) => exercise.measurementUnit === 'seconds').map((exercise) => exercise.id))
      .toEqual(['db-v-crunch-holds', 'plank', 'side-plank', 'wall-sit', 'hollow-body-hold'])
    const storage = useWorkoutStorage()
    expect(storage.isTimedExercise('plank')).toBe(true)
    expect(storage.isTimedExercise('side-plank')).toBe(true)
    expect(storage.isTimedExercise('db-v-crunch-holds')).toBe(true)
    expect(storage.isTimedExercise('hip-taps')).toBe(false)
    expect(storage.measurementLabel('squat')).toBe('Reps')
    expect(storage.measurementLabel('plank')).toBe('Seconds')
  })

  it('shares catalog overrides across consumers and supports switching back', () => {
    const storage = useWorkoutStorage()
    storage.setExerciseMeasurementUnit('plank', 'reps')
    const other = useWorkoutStorage()
    expect(other.isTimedExercise('plank')).toBe(false)
    expect(other.exerciseUnits.value).toEqual({ plank: 'reps' })
    storage.setExerciseMeasurementUnit('squat', 'seconds')
    expect(other.isTimedExercise('squat')).toBe(true)
    expect(other.seedExercises.value.find((exercise) => exercise.id === 'squat')?.measurementUnit).toBe('seconds')
    other.replaceSeedExercises([...other.seedExercises.value])
    expect(other.seedExercises.value.find((exercise) => exercise.id === 'squat')?.measurementUnit).toBe('seconds')
    expect(() => storage.setExerciseMeasurementUnit('missing', 'seconds')).toThrow('Exercise not found')
  })

  it('creates and updates custom timed exercises and preserves the unit on other edits', () => {
    const storage = useWorkoutStorage()
    const input = { name: 'Custom Wall Sit', tags: ['Legs'], description: 'Hold the position.', defaultWeightUnit: 'kg' as const }
    const exercise = storage.addExercise({ ...input, measurementUnit: 'seconds' })!
    expect(storage.isTimedExercise(exercise.id)).toBe(true)
    expect(storage.updateExercise(exercise.id, { ...input, description: 'Keep holding.' })?.measurementUnit).toBe('seconds')
    storage.setExerciseMeasurementUnit(exercise.id, 'reps')
    expect(storage.isTimedExercise(exercise.id)).toBe(false)
    storage.updateExercise(exercise.id, { ...input, measurementUnit: 'seconds' })
    expect(storage.isTimedExercise(exercise.id)).toBe(true)
    expect(storage.addExercise({ ...input, name: 'Custom Squat' })?.measurementUnit).toBe('reps')
  })

  it('labels both units in German and treats legacy exercises as reps', () => {
    const storage = useWorkoutStorage()
    storage.customExercises.value.push({ id: 'legacy', name: 'Legacy', tags: ['General'], defaultWeightUnit: 'kg', isCustom: true, description: '' })
    storage.setLanguage('de')
    expect(storage.measurementLabel('plank')).toBe('Sekunden')
    expect(storage.measurementLabel('legacy')).toBe('Wiederholungen')
    expect(storage.measurementLabel('unknown')).toBe('Wiederholungen')
  })
})
