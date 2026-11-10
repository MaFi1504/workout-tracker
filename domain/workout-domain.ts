import type { Exercise, RoundEntry, Workout, WorkoutExercise } from '../composables/useWorkoutStorage'
import type { ExerciseMeasurementUnit } from '../data/exerciseCatalog'

export const COMMON_WEIGHTS_KG = [1, 3, 5, 8, 10] as const
export const KG_PER_LB = 0.45359237
export const kgToLb = (weightKg: number) => weightKg / KG_PER_LB
export const lbToKg = (weightLb: number) => weightLb * KG_PER_LB
export const addRep = (reps: number) => Math.max(0, reps) + 1
export const removeRep = (reps: number) => Math.max(0, reps - 1)
export const nextRoundSide = (side: RoundEntry['side'] = 'both'): NonNullable<RoundEntry['side']> =>
  side === 'both' ? 'left' : side === 'left' ? 'right' : side === 'right' ? 'alternating' : 'both'
export const roundVolume = (round: RoundEntry, unit: ExerciseMeasurementUnit = 'reps') =>
  unit === 'seconds' ? 0 : round.weightKg * (round.weightCount || 1) * round.reps * (round.side === 'alternating' ? 2 : 1)
export const exerciseVolume = (exercise: WorkoutExercise, unit: ExerciseMeasurementUnit = 'reps') =>
  unit === 'seconds' ? 0 : exercise.rounds.reduce((total, round) => total + roundVolume(round), 0)
export const workoutVolume = (workout: Workout, catalog: Pick<Exercise, 'id' | 'measurementUnit'>[] = []) =>
  workout.exercises.reduce((total, exercise) => total + exerciseVolume(exercise, catalog.find((item) => item.id === exercise.exerciseId)?.measurementUnit), 0)
export const updateRoundWeight = (rounds: RoundEntry[], roundIndex: number, weightKg: number, weightCount?: 1 | 2) =>
  rounds.map((round, index) => index === roundIndex || (roundIndex === 0 && index > roundIndex)
    ? { ...round, weightKg, ...(weightCount === undefined ? {} : { weightCount }) }
    : round)

const pad = (value: number) => String(value).padStart(2, '0')
export const localDateIso = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const localTimeIso = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
// Local time of day the workout took place; date-only legacy workouts start at midnight.
export const workoutTime = (workout: Pick<Workout, 'createdAt'>) => {
  const timestamp = workout.createdAt ? new Date(workout.createdAt) : null
  return timestamp && !Number.isNaN(timestamp.getTime()) ? localTimeIso(timestamp) : '00:00:00'
}
// Date strings without a zone are parsed as local time, matching the date/time inputs.
export const combineDateAndTime = (date: string, time: string) => {
  const [hours = '00', minutes = '00', seconds = '00'] = (time || '').split(':')
  return new Date(`${date}T${pad(Number(hours) || 0)}:${pad(Number(minutes) || 0)}:${pad(Number(seconds) || 0)}`).toISOString()
}

export const validateWorkout = (workout: Omit<Workout, 'id'> | Workout) => {
  if (!workout.date || !workout.title.trim() || !workout.exercises.length) return false
  return workout.exercises.every((exercise, exerciseIndex) => exercise.order === exerciseIndex && exercise.rounds.length > 0 && exercise.rounds.every((round, roundIndex) => round.round === roundIndex + 1 && Number.isFinite(round.weightKg) && round.weightKg >= 0 && (round.weightCount === undefined || round.weightCount === 1 || round.weightCount === 2) && Number.isInteger(round.reps) && round.reps >= 0 && (round.side === 'left' || round.side === 'right' || round.side === 'both' || round.side === 'alternating')))
}

export interface ExerciseHistoryPoint { workoutId: string; date: string; round: number; weightKg: number; reps: number; volume: number; side?: RoundEntry['side'] }
export const exerciseHistory = (workouts: Workout[], exerciseId: string, unit: ExerciseMeasurementUnit = 'reps'): ExerciseHistoryPoint[] => workouts.flatMap((workout) => {
  const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
  return exercise ? exercise.rounds.map((round) => ({ workoutId: workout.id, date: workout.date, round: round.round, weightKg: round.weightKg, reps: round.reps, volume: roundVolume(round, unit), side: round.side })) : []
}).sort((left, right) => left.date.localeCompare(right.date) || left.round - right.round)

export const filterWorkouts = (workouts: Workout[], filters: { exerciseId?: string; title?: string; from?: string; to?: string }) => {
  const title = filters.title?.trim().toLowerCase()
  return workouts.filter((workout) => (!filters.exerciseId || workout.exercises.some((exercise) => exercise.exerciseId === filters.exerciseId)) && (!title || workout.title.toLowerCase().includes(title)) && (!filters.from || workout.date >= filters.from) && (!filters.to || workout.date <= filters.to))
}
