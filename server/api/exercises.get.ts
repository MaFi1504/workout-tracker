const exerciseSeed = [
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

export default defineEventHandler(() => exerciseSeed)
