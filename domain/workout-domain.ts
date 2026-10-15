import type { RoundEntry, Workout, WorkoutExercise } from './composables/useWorkoutStorage'

export const COMMON_WEIGHTS_KG = [1, 3, 5, 8, 10] as const
export const KG_PER_LB = 0.45359237
export const kgToLb = (weightKg: number) => weightKg / KG_PER_LB
export const lbToKg = (weightLb: number) => weightLb * KG_PER_LB
export const addRep = (reps: number) => Math.max(0, reps) + 1
export const removeRep = (reps: number) => Math.max(0, reps - 1)
export const roundVolume = (round: RoundEntry) => round.weightKg * (round.weightCount || 1) * round.reps
export const exerciseVolume = (exercise: WorkoutExercise) => exercise.rounds.reduce((total, round) => total + roundVolume(round), 0)
export const workoutVolume = (workout: Workout) => workout.exercises.reduce((total, exercise) => total + exerciseVolume(exercise), 0)

export const validateWorkout = (workout: Omit<Workout, 'id'> | Workout) => {
  if (!workout.date || !workout.title.trim() || !workout.exercises.length) return false
  return workout.exercises.every((exercise, exerciseIndex) => exercise.order === exerciseIndex && exercise.rounds.length > 0 && exercise.rounds.every((round, roundIndex) => round.round === roundIndex + 1 && Number.isFinite(round.weightKg) && round.weightKg >= 0 && (round.weightCount === undefined || round.weightCount === 1 || round.weightCount === 2) && Number.isInteger(round.reps) && round.reps >= 0 && (round.side === 'left' || round.side === 'right' || round.side === 'both')))
}

export interface ExerciseHistoryPoint { workoutId: string; date: string; round: number; weightKg: number; reps: number; volume: number; side?: RoundEntry['side'] }
export const exerciseHistory = (workouts: Workout[], exerciseId: string): ExerciseHistoryPoint[] => workouts.flatMap((workout) => {
  const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
  return exercise ? exercise.rounds.map((round) => ({ workoutId: workout.id, date: workout.date, round: round.round, weightKg: round.weightKg, reps: round.reps, volume: roundVolume(round), side: round.side })) : []
}).sort((left, right) => left.date.localeCompare(right.date) || left.round - right.round)

export const filterWorkouts = (workouts: Workout[], filters: { exerciseId?: string; title?: string; from?: string; to?: string }) => {
  const title = filters.title?.trim().toLowerCase()
  return workouts.filter((workout) => (!filters.exerciseId || workout.exercises.some((exercise) => exercise.exerciseId === filters.exerciseId)) && (!title || workout.title.toLowerCase().includes(title)) && (!filters.from || workout.date >= filters.from) && (!filters.to || workout.date <= filters.to))
}
