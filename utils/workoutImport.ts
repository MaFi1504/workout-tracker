export interface ImportedRound {
  weightKg: number
  reps: number
}

export interface ImportedExercise {
  name: string
  rounds: ImportedRound[]
}

const measurementPattern = /^([0-9]+(?:[.,][0-9]+)?)\s*(kg|lb)?\s*(?:x|×|,)?\s*([0-9]+)\s*(?:reps?|wiederholungen?)?(?:\s+.*)?$/i
const repsOnlyPattern = /^([0-9]+)\s+(.+)$/i
const kgPerLb = 0.45359237

const cleanExerciseName = (value: string) => value
  .replace(/^[-*•]\s*/, '')
  .replace(/\s*:\s*$/, '')
  .trim()

export const parseWorkoutNotes = (input: string): ImportedExercise[] => {
  const exercises: ImportedExercise[] = []
  let currentExercise: ImportedExercise | undefined

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line) {
      continue
    }

    const measurement = line.match(measurementPattern)

    if (measurement && currentExercise) {
      const value = Number(measurement[1]?.replace(',', '.'))
      const unit = measurement[2]?.toLowerCase() || 'kg'
      const reps = Number.parseInt(measurement[3] || '0', 10)
      const weightKg = unit === 'lb' ? value * kgPerLb : value

      if (Number.isFinite(weightKg) && reps >= 0) {
        currentExercise.rounds.push({ weightKg, reps })
      }

      continue
    }

    const repsOnly = line.match(repsOnlyPattern)

    if (repsOnly) {
      const reps = Number.parseInt(repsOnly[1] || '0', 10)
      const name = cleanExerciseName(repsOnly[2] || '')

      if (name && reps >= 0) {
        currentExercise = {
          name,
          rounds: [{ weightKg: 0, reps }]
        }
        exercises.push(currentExercise)
      }

      continue
    }

    const name = cleanExerciseName(line)

    if (name) {
      currentExercise = { name, rounds: [] }
      exercises.push(currentExercise)
    }
  }

  return exercises.filter((exercise) => exercise.rounds.length > 0)
}
