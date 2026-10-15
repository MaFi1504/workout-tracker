import type { Exercise } from '~/composables/useWorkoutStorage'

export const normalizeExerciseName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\bpushups\b/g, 'push up')
    .replace(/\brdls?\b/g, 'romanian deadlift')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)
    .join(' ')

const exerciseNames = (exercise: Exercise) => [exercise.name, ...(exercise.aliases || [])]

const tokenSimilarity = (left: string, right: string) => {
  const leftTokens = new Set(normalizeExerciseName(left).split(' '))
  const rightTokens = new Set(normalizeExerciseName(right).split(' '))
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return overlap / Math.max(leftTokens.size, rightTokens.size)
}

export const findMatchingExercise = (exercises: Exercise[], input: string) => {
  const normalizedInput = normalizeExerciseName(input)
  if (!normalizedInput) return undefined

  const exactMatch = exercises.find((exercise) =>
    exerciseNames(exercise).some((name) => normalizeExerciseName(name) === normalizedInput)
  )
  if (exactMatch) return exactMatch

  const candidates = exercises
    .map((exercise) => ({
      exercise,
      score: Math.max(...exerciseNames(exercise).map((name) => tokenSimilarity(name, input)))
    }))
    .filter(({ score }) => score >= 0.75)
    .sort((left, right) => right.score - left.score)

  return candidates.length === 1 || (candidates[0] && candidates[0].score > (candidates[1]?.score || 0))
    ? candidates[0]?.exercise
    : undefined
}
