import { playlistExercises } from '~/data/exerciseCatalog'

const exerciseSeed = [
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

export default defineEventHandler(() => exerciseSeed)
