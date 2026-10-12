const exerciseSeed = [
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
    description: 'Bodyweight pressing movement'
  },
  {
    id: 'lat-raise',
    name: 'Lat Raise',
    category: 'Shoulders',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Lateral deltoid raise'
  },
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Compound horizontal press'
  },
  {
    id: 'squat',
    name: 'Squat',
    category: 'Legs',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Lower body strength movement'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    defaultWeightUnit: 'kg',
    isCustom: false,
    description: 'Posterior chain strength lift'
  }
]

export default defineEventHandler(() => exerciseSeed)
