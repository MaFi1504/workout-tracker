export type WorkoutLanguage = 'en' | 'de'

export interface Exercise {
  id: string
  name: string
  category: string
  defaultWeightUnit: 'kg' | 'lb'
  isCustom: boolean
  description: string
}

export const EXERCISE_CATEGORIES = [
  'Shoulders',
  'Chest',
  'Legs',
  'Back',
  'Arms',
  'Cardio',
  'General'
] as const

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number]

export type WorkoutSide = 'single' | 'synchronized'

export interface RoundEntry {
  id: string
  round: number
  weightKg: number
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
  settings: 'workout:settings'
} as const

const baseExercises: Exercise[] = [
  {
    id: 'front-raise',
    name: 'Front Raise',
    category: 'Shoulders',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Stand tall with light weights at your sides. Raise both arms forward to shoulder height, then lower them slowly without swinging.'
  },
  {
    id: 'push-up',
    name: 'Push Up',
    category: 'Chest',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Start in a high plank with hands under your shoulders. Lower your chest with a straight body, then press the floor away to return to the top.'
  },
  {
    id: 'lat-raise',
    name: 'Lat Raise',
    category: 'Shoulders',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Stand with weights by your sides. Lift your arms out to shoulder height with soft elbows, pause briefly, and lower them under control.'
  },
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Lie on the bench with feet grounded and the bar over your chest. Lower it to mid-chest with control, then press it up while keeping your wrists stacked.'
  },
  {
    id: 'squat',
    name: 'Squat',
    category: 'Legs',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Set your feet about shoulder-width apart. Sit your hips down and back with a braced torso, then drive through your feet to stand tall.'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Stand with the bar over your mid-foot. Hinge at the hips with a neutral back, grip the bar, and stand by driving your feet into the floor.'
  }
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

const normalizeCategory = (value: string): ExerciseCategory =>
  EXERCISE_CATEGORIES.includes(value.trim() as ExerciseCategory)
    ? value.trim() as ExerciseCategory
    : 'General'

// Tracks whether the client has already re-read localStorage after SSR hydration.
let hasHydratedFromStorage = false

export const useWorkoutStorage = () => {
  const seedExercises = useState<Exercise[]>('seed-exercises', () => baseExercises)
  const customExercises = useState<Exercise[]>(
    'custom-exercises',
    () => readStorage(STORAGE_KEYS.customExercises, [])
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

  if (import.meta.client) {
    // useState's initializer only runs on the server, so the client must
    // re-read localStorage itself once hydration has handed over the SSR payload.
    if (!hasHydratedFromStorage) {
      hasHydratedFromStorage = true
      customExercises.value = readStorage(STORAGE_KEYS.customExercises, customExercises.value)
      workouts.value = normalizeWorkouts(
        readStorage<unknown>(STORAGE_KEYS.workouts, null) ?? readStorage(STORAGE_KEYS.legacyWorkouts, workouts.value)
      )
      settings.value = {
        language: readStorage<WorkoutSettings>(STORAGE_KEYS.settings, settings.value).language || 'en'
      }
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
  }

  const setLanguage = (language: WorkoutLanguage) => {
    settings.value = { ...settings.value, language }
  }

  const addExercise = (input: { name: string; category: string; description: string; defaultWeightUnit: 'kg' | 'lb' }) => {
    const name = input.name.trim()

    if (!name) {
      return null
    }

    const exercise: Exercise = {
      id: `${slugify(name)}-${Date.now()}`,
      name,
      category: normalizeCategory(input.category),
      defaultWeightUnit: input.defaultWeightUnit || 'kg',
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

  const updateExercise = (id: string, input: { name: string; category: string; description: string; defaultWeightUnit: 'kg' | 'lb' }) => {
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
      category: normalizeCategory(input.category),
      description: input.description.trim() || 'Custom exercise added by the user.',
      defaultWeightUnit: input.defaultWeightUnit || 'kg'
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

  return {
    seedExercises,
    customExercises,
    workouts,
    settings,
    setLanguage,
    addExercise,
    updateExercise,
    addWorkout
  }
}
