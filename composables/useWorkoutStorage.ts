import { playlistExercises } from '../data/exerciseCatalog'
import type { ExerciseMeasurementUnit } from '../data/exerciseCatalog'

export type WorkoutLanguage = 'en' | 'de'

export interface Exercise {
  id: string
  name: string
  tags: string[]
  aliases?: string[]
  defaultWeightUnit: 'kg' | 'lb'
  measurementUnit?: ExerciseMeasurementUnit
  isCustom: boolean
  description: string
  videoUrl?: string
}

export const EXERCISE_TAGS = [
  'Shoulders',
  'Chest',
  'Legs',
  'Back',
  'Arms',
  'Abs',
  'Glutes',
  'Cardio',
  'General'
] as const

export type ExerciseTag = typeof EXERCISE_TAGS[number]

export type WorkoutSide = 'single' | 'synchronized'

export interface RoundEntry {
  id: string
  round: number
  weightKg: number
  weightCount?: 1 | 2
  // Repetitions or seconds, according to the exercise's measurement unit.
  reps: number
  side?: 'left' | 'right' | 'both'
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  order: number
  side: WorkoutSide
  rounds: RoundEntry[]
}

export interface Workout {
  id: string
  date: string
  createdAt?: string
  title: string
  source?: string
  workoutType?: string
  exercises: WorkoutExercise[]
  notes: string
}

export interface WorkoutSettings {
  language: WorkoutLanguage
}

const STORAGE_KEYS = {
  customExercises: 'workout:custom-exercises',
  workouts: 'workout:sessions',
  legacyWorkouts: 'workout:entries',
  settings: 'workout:settings',
  exerciseUnits: 'workout:exercise-units'
} as const

const baseExercises: Exercise[] = [
  {
    id: 'push-up',
    name: 'Push Up',
    tags: ['Chest'],
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Start in a high plank with hands under your shoulders. Lower your chest with a straight body, then press the floor away to return to the top.'
  },
  {
    id: 'bench-press',
    name: 'Bench Press',
    tags: ['Chest'],
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Lie on the bench with feet grounded and the bar over your chest. Lower it to mid-chest with control, then press it up while keeping your wrists stacked.'
  },
  {
    id: 'squat',
    name: 'Squat',
    tags: ['Legs'],
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Set your feet about shoulder-width apart. Sit your hips down and back with a braced torso, then drive through your feet to stand tall.'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    tags: ['Back'],
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Stand with the bar over your mid-foot. Hinge at the hips with a neutral back, grip the bar, and stand by driving your feet into the floor.'
  },
  ...playlistExercises.map((exercise) => ({
    ...exercise,
    defaultWeightUnit: 'kg' as const,
    isCustom: false
  }))
]

const readStorage = <T>(key: string, fallback: T): T => {
  if (!import.meta.client) {
    return fallback
  }

  try {
    const raw = localStorage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = <T>(key: string, value: T) => {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(key, JSON.stringify(value))
}

const normalizeWorkouts = (value: unknown): Workout[] => {
  if (!Array.isArray(value)) {
    return []
  }

  if (value.every((item) => item && Array.isArray((item as Workout).exercises))) {
    return value as Workout[]
  }

  return value.flatMap((item, index) => {
    const legacy = item as {
      id?: string
      exerciseId?: string
      date?: string
      sets?: number
      reps?: number
      weight?: number
      notes?: string
    }

    if (!legacy.exerciseId) {
      return []
    }

    const sets = Math.max(legacy.sets || 1, 1)
    const workoutId = legacy.id || `migrated-workout-${index}`

    return [{
      id: workoutId,
      date: legacy.date || new Date().toISOString().slice(0, 10),
      title: 'Imported workout',
      exercises: [{
        id: `${workoutId}-exercise`,
        exerciseId: legacy.exerciseId,
        order: 0,
        side: 'synchronized',
        rounds: Array.from({ length: sets }, (_, roundIndex) => ({
          id: `${workoutId}-round-${roundIndex}`,
          round: roundIndex + 1,
          weightKg: legacy.weight || 0,
          reps: legacy.reps || 0,
          side: 'both'
        }))
      }],
      notes: legacy.notes || ''
    }]
  })
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom-exercise'

const normalizeTags = (value: unknown, legacyCategory?: unknown): string[] => {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : typeof legacyCategory === 'string' ? [legacyCategory] : []
  const tags = values
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index)

  return tags.length ? tags : ['General']
}

const normalizeExercise = (value: unknown): Exercise | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<Exercise> & { category?: string }
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null

  return {
    id: item.id,
    name: item.name,
    tags: normalizeTags(item.tags, item.category),
    ...(Array.isArray(item.aliases) ? { aliases: item.aliases.filter((alias): alias is string => typeof alias === 'string') } : {}),
    defaultWeightUnit: item.defaultWeightUnit === 'lb' ? 'lb' : 'kg',
    measurementUnit: item.measurementUnit === 'seconds' ? 'seconds' : 'reps',
    isCustom: item.isCustom === true,
    description: typeof item.description === 'string' ? item.description : '',
    ...(typeof item.videoUrl === 'string' ? { videoUrl: item.videoUrl } : {})
  }
}

// Tracks whether the client has already re-read localStorage after SSR hydration.
let hasHydratedFromStorage = false

export const useWorkoutStorage = () => {
  const seedExercises = useState<Exercise[]>('seed-exercises', () => baseExercises)
  const customExercises = useState<Exercise[]>(
    'custom-exercises',
    () => (Array.isArray(readStorage<unknown>(STORAGE_KEYS.customExercises, [])) ? readStorage<unknown>(STORAGE_KEYS.customExercises, []) : []).flatMap((item) => {
      const exercise = normalizeExercise(item)
      return exercise ? [exercise] : []
    })
  )
  const storedWorkouts = readStorage<unknown>(STORAGE_KEYS.workouts, null)
  const workouts = useState<Workout[]>(
    'workout-entries',
    () => normalizeWorkouts(
      storedWorkouts ?? readStorage(STORAGE_KEYS.legacyWorkouts, [])
    )
  )
  const settings = useState<WorkoutSettings>('workout-settings', () => ({
    language: readStorage<WorkoutSettings>(STORAGE_KEYS.settings, { language: 'en' }).language || 'en'
  }))
  const exerciseUnits = useState<Record<string, ExerciseMeasurementUnit>>(
    'exercise-units',
    () => readStorage(STORAGE_KEYS.exerciseUnits, {})
  )

  if (import.meta.client) {
    // useState's initializer only runs on the server, so the client must
    // re-read localStorage itself once hydration has handed over the SSR payload.
    if (!hasHydratedFromStorage) {
      hasHydratedFromStorage = true
      const storedCustomExercises = readStorage<unknown>(STORAGE_KEYS.customExercises, customExercises.value)
      customExercises.value = (Array.isArray(storedCustomExercises) ? storedCustomExercises : []).flatMap((item) => {
        const exercise = normalizeExercise(item)
        return exercise ? [exercise] : []
      })
      workouts.value = normalizeWorkouts(
        readStorage<unknown>(STORAGE_KEYS.workouts, null) ?? readStorage(STORAGE_KEYS.legacyWorkouts, workouts.value)
      )
      settings.value = {
        language: readStorage<WorkoutSettings>(STORAGE_KEYS.settings, settings.value).language || 'en'
      }
      exerciseUnits.value = readStorage(STORAGE_KEYS.exerciseUnits, {})
    }

    watch(
      customExercises,
      (value) => writeStorage(STORAGE_KEYS.customExercises, value),
      { deep: true }
    )

    watch(
      workouts,
      (value) => writeStorage(STORAGE_KEYS.workouts, value),
      { deep: true }
    )

    watch(
      settings,
      (value) => writeStorage(STORAGE_KEYS.settings, value),
      { deep: true }
    )
    watch(exerciseUnits, (value) => writeStorage(STORAGE_KEYS.exerciseUnits, value), { deep: true })
  }

  const setLanguage = (language: WorkoutLanguage) => {
    settings.value = { ...settings.value, language }
  }

  const addExercise = (input: { name: string; tags: string[]; description: string; defaultWeightUnit: 'kg' | 'lb'; measurementUnit?: ExerciseMeasurementUnit }) => {
    const name = input.name.trim()

    if (!name) {
      return null
    }

    const exercise: Exercise = {
      id: `${slugify(name)}-${Date.now()}`,
      name,
      tags: normalizeTags(input.tags),
      defaultWeightUnit: input.defaultWeightUnit || 'kg',
      measurementUnit: input.measurementUnit || 'reps',
      isCustom: true,
      description: input.description.trim() || 'Custom exercise added by the user.'
    }

    const existing = [...customExercises.value, ...seedExercises.value].find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    )

    if (existing) {
      return existing
    }

    customExercises.value = [exercise, ...customExercises.value]
    return exercise
  }

  const updateExercise = (id: string, input: { name: string; tags: string[]; description: string; defaultWeightUnit: 'kg' | 'lb'; measurementUnit?: ExerciseMeasurementUnit }) => {
    const name = input.name.trim()
    const index = customExercises.value.findIndex((exercise) => exercise.id === id)

    if (!name || index < 0) {
      return null
    }

    const duplicate = [...customExercises.value, ...seedExercises.value].find(
      (exercise) => exercise.id !== id && exercise.name.toLowerCase() === name.toLowerCase()
    )

    if (duplicate) {
      return null
    }

    const existingExercise = customExercises.value[index]

    if (!existingExercise) {
      return null
    }

    const updatedExercise: Exercise = {
      ...existingExercise,
      name,
      tags: normalizeTags(input.tags),
      description: input.description.trim() || 'Custom exercise added by the user.',
      defaultWeightUnit: input.defaultWeightUnit || 'kg',
      measurementUnit: input.measurementUnit || existingExercise.measurementUnit || 'reps'
    }

    customExercises.value[index] = updatedExercise
    return updatedExercise
  }

  const addWorkout = (workout: Omit<Workout, 'id'>) => {
    const nextWorkout: Workout = {
      ...workout,
      id: `workout-${Date.now()}`,
      createdAt: workout.createdAt || new Date().toISOString()
    }

    workouts.value = [nextWorkout, ...workouts.value]
    return nextWorkout
  }

  const updateWorkout = (id: string, workout: Partial<Omit<Workout, 'id'>>) => {
    const index = workouts.value.findIndex((item) => item.id === id)
    if (index < 0) return null

    const existing = workouts.value[index]
    if (!existing) return null

    const updatedWorkout: Workout = {
      ...existing,
      ...workout,
      id: existing.id,
      createdAt: existing.createdAt
    }
    workouts.value[index] = updatedWorkout
    return updatedWorkout
  }

  const deleteWorkout = (id: string) => {
    const existing = workouts.value.some((item) => item.id === id)
    if (!existing) return false

    workouts.value = workouts.value.filter((item) => item.id !== id)
    return true
  }

  const configuredSeedExercises = computed(() => seedExercises.value.map((exercise) => ({
    ...exercise,
    measurementUnit: exerciseUnits.value[exercise.id] || exercise.measurementUnit || 'reps'
  })))
  const isTimedExercise = (id: string) =>
    [...configuredSeedExercises.value, ...customExercises.value].find((exercise) => exercise.id === id)?.measurementUnit === 'seconds'
  const measurementLabel = (id: string) => isTimedExercise(id)
    ? (settings.value.language === 'de' ? 'Sekunden' : 'Seconds')
    : (settings.value.language === 'de' ? 'Wiederholungen' : 'Reps')
  const setExerciseMeasurementUnit = (id: string, unit: ExerciseMeasurementUnit) => {
    const customExercise = customExercises.value.find((exercise) => exercise.id === id)
    if (customExercise) {
      customExercise.measurementUnit = unit
    } else if (seedExercises.value.some((exercise) => exercise.id === id)) {
      exerciseUnits.value = { ...exerciseUnits.value, [id]: unit }
    } else {
      throw new Error(`Exercise not found: ${id}`)
    }
  }
  const replaceSeedExercises = (exercises: Exercise[]) => {
    seedExercises.value = exercises.map((exercise) => ({
      ...exercise,
      measurementUnit: exerciseUnits.value[exercise.id] || exercise.measurementUnit || 'reps'
    }))
  }

  return {
    seedExercises: configuredSeedExercises,
    replaceSeedExercises,
    customExercises,
    workouts,
    settings,
    setLanguage,
    addExercise,
    updateExercise,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    isTimedExercise,
    measurementLabel,
    setExerciseMeasurementUnit,
    exerciseUnits
  }
}
