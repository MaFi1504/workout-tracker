export type WorkoutLanguage = 'en' | 'de'

export interface Exercise {
  id: string
  name: string
  category: string
  defaultWeightUnit: 'kg' | 'lb'
  isCustom: boolean
  description: string
}

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
    description: 'Standing front shoulder raise'
  },
  {
    id: 'push-up',
    name: 'Push Up',
    category: 'Chest',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Bodyweight press for the upper body'
  },
  {
    id: 'lat-raise',
    name: 'Lat Raise',
    category: 'Shoulders',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Lateral raise with controlled tempo'
  },
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Barbell bench press for strength'
  },
  {
    id: 'squat',
    name: 'Squat',
    category: 'Legs',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Barbell squat for total leg strength'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Classic hip hinge strength movement'
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
      category: input.category.trim() || 'General',
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
    addWorkout
  }
}
