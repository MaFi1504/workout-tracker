import { describe, expect, it } from 'vitest'
import { playlistExercises } from '../data/exerciseCatalog'
import { matchesExerciseSearch } from '../utils/exerciseMatching'

describe('exercise search', () => {
  it('finds both exercise names and aliases for RDL', () => {
    const ids = playlistExercises.filter((exercise) => matchesExerciseSearch(exercise, ' rDl ')).map((exercise) => exercise.id)
    expect(ids).toContain('bench-rdl')
    expect(ids).toContain('romanian-deadlift')
  })

  it('preserves partial-name, tag, empty, and unmatched searches', () => {
    const exercise = { name: 'Romanian Deadlift', aliases: ['RDL'], tags: ['Legs', 'Back'] }
    expect(matchesExerciseSearch(exercise, 'roman')).toBe(true)
    expect(matchesExerciseSearch(exercise, 'legs')).toBe(true)
    expect(matchesExerciseSearch(exercise, '  ')).toBe(true)
    expect(matchesExerciseSearch(exercise, 'chest')).toBe(false)
    expect(matchesExerciseSearch({ name: 'Squat', tags: ['Legs'] }, 'squ')).toBe(true)
  })
})
