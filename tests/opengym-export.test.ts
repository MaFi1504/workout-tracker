import { describe, expect, it } from 'vitest'
import type { Exercise, Workout } from '../composables/useWorkoutStorage'
import { exportOpenGymCsv } from '../utils/openGymExport'

const catalog: Exercise[] = [
  { id: 'squat', name: 'Squat', tags: ['Legs'], defaultWeightUnit: 'kg', isCustom: false, description: '' },
  { id: 'hold', name: 'My hold', tags: ['General'], defaultWeightUnit: 'kg', measurementUnit: 'seconds', isCustom: true, description: '' }
]

const workout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'session-1',
  date: '2025-03-04',
  createdAt: new Date(2025, 2, 4, 18, 30, 45).toISOString(),
  title: 'Leg day',
  notes: 'Workout notes',
  exercises: [{
    id: 'entry-1', exerciseId: 'squat', order: 0, side: 'synchronized', notes: 'Exercise notes',
    rounds: [{ id: 'round-1', round: 1, weightKg: 8.5, weightCount: 2, reps: 12, side: 'both' }]
  }],
  ...overrides
})

describe('openGym CSV export', () => {
  it('writes the native header, UTF-8 BOM, CRLF and a header-only empty export', () => {
    expect(exportOpenGymCsv([], catalog)).toBe('\uFEFFdate,start_time,end_time,workout,workout_note,exercise,exercise_id,set,set_type,side,weight,unit,reps,distance_km,seconds,note\r\n')
  })

  it('exports combined kilogram load, workout date/time and both kinds of notes without changing the source', () => {
    const source = workout()
    const before = JSON.stringify(source)
    const csv = exportOpenGymCsv([source], catalog)
    expect(csv).toContain('2025-03-04,2025-03-04 18:30:45,,Leg day,')
    expect(csv).toContain('Workout notes\n\nSquat, round 1: 2 x 8.5 kg (combined load exported)')
    expect(csv).toContain(',Squat,,1,normal,,17,kg,12,,,Exercise notes\r\n')
    expect(JSON.stringify(source)).toBe(before)
  })

  it('exports seconds rather than reps, leaving distance blank to identify a timed hold', () => {
    const source = workout()
    source.exercises[0]!.exerciseId = 'hold'
    source.exercises[0]!.rounds = [{ id: 'r', round: 1, weightKg: 0, reps: 45, side: 'left' }]
    const csv = exportOpenGymCsv([source], catalog)
    expect(csv).toContain(',My hold,,1,normal,,0,kg,,,45,Exercise notes\r\n')
    expect(csv).toContain('My hold, round 1: left side')
  })

  it('exports individual left/right rep rounds and preserves zero/bodyweight sets in the CSV', () => {
    const source = workout()
    source.exercises[0]!.rounds = [
      { id: 'l', round: 1, weightKg: 5, reps: 8, side: 'left' },
      { id: 'r', round: 2, weightKg: 6, reps: 7, side: 'right' },
      { id: 'b', round: 3, weightKg: 0, reps: 10 },
      { id: 'z', round: 4, weightKg: 0, reps: 0 }
    ]
    const csv = exportOpenGymCsv([source], catalog)
    expect(csv).toContain(',1,normal,L,5,kg,8,,,Exercise notes\r\n')
    expect(csv).toContain(',2,normal,R,6,kg,7,,,Exercise notes\r\n')
    expect(csv).toContain(',3,normal,,0,kg,10,,,Exercise notes\r\n')
    expect(csv).toContain(',4,normal,,0,kg,0,,,Exercise notes\r\n')
  })

  it('exports alternating reps as total reps and records the per-side entry in notes', () => {
    const source = workout()
    source.exercises[0]!.rounds = [{ id: 'alternate', round: 1, weightKg: 5, reps: 5, side: 'alternating' }]
    const csv = exportOpenGymCsv([source], catalog)
    expect(csv).toContain('Squat, round 1: 5 reps per side (alternating)')
    expect(csv).toContain(',Squat,,1,normal,,5,kg,10,,,Exercise notes\r\n')
  })

  it('quotes commas, quotes, newlines and Unicode, and neutralizes spreadsheet formulas', () => {
    const source = workout({ title: '=Formula', notes: 'Good, "great"\nWeiter üben' })
    source.exercises[0]!.notes = '@note'
    const csv = exportOpenGymCsv([source], [{ ...catalog[0]!, name: 'Squat, "wide"' }])
    expect(csv).toContain(",'=Formula,")
    expect(csv).toContain('"Good, ""great""\nWeiter üben')
    expect(csv).toContain('"Squat, ""wide""",,1,normal,,17,kg,12,,,\'@note\r\n')
  })

  it('keeps same-minute same-name sessions apart without changing unrelated titles or inventing times', () => {
    const csv = exportOpenGymCsv([
      workout({ id: 'first' }), workout({ id: 'second' }),
      workout({ id: 'legacy', createdAt: undefined }),
      workout({ id: 'other', title: 'Other day' })
    ], catalog)
    expect(csv).toContain(',,Leg day [first],')
    expect(csv).toContain(',,Leg day [second],')
    expect(csv).toContain('2025-03-04 00:00:00,,Leg day,')
    expect(csv).toContain(',,Other day,')
  })

  it('uses the logged date even when the creation timestamp is from a later day', () => {
    const csv = exportOpenGymCsv([workout({ date: '2024-01-02' })], catalog)
    expect(csv).toContain('2024-01-02,2024-01-02 18:30:45,')
  })

  it('preserves long notes and metadata at workout level and falls back to missing exercise IDs', () => {
    const source = workout({ source: 'Video', workoutType: 'Strength' })
    source.exercises[0]!.notes = 'x'.repeat(300)
    source.exercises[0]!.exerciseId = 'deleted-exercise'
    const csv = exportOpenGymCsv([source], catalog)
    expect(csv).toContain('Source: Video\n\nWorkout type: Strength\n\ndeleted-exercise: ' + 'x'.repeat(300))
    expect(csv).toContain(',deleted-exercise,,1,normal,,17,kg,12,,,')
  })

  it('uses configured measurement units and exercise ordering without reordering input', () => {
    const source = workout()
    source.exercises.push({
      ...source.exercises[0]!, id: 'entry-2', exerciseId: 'hold', order: -1,
      rounds: [{ id: 'hold-round', round: 1, weightKg: 2, reps: 60 }]
    })
    const csv = exportOpenGymCsv([source], catalog.map((exercise) => ({ ...exercise, measurementUnit: 'reps' })))
    expect(csv.indexOf(',My hold,,')).toBeLessThan(csv.indexOf(',Squat,,'))
    expect(csv).toContain(',My hold,,1,normal,,2,kg,60,,,Exercise notes')
    expect(source.exercises[0]!.exerciseId).toBe('squat')
  })
})
