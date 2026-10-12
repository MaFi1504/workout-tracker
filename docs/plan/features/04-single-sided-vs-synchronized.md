# Feature 04: Single-Sided vs Synchronized Training

## Objective
Support exercises that are logged separately per limb and exercises that are trained together in a synchronized manner.

## Requirements
- Data must distinguish between single-sided and synchronized sets.
- Single-sided entries can store left/right values separately.
- Synchronized entries store combined weight and total reps.
- Exercise view should clearly label whether the movement is unilateral or bilateral.

## Example usage
- Single-sided: one-arm row, alternating dumbbell curls
- Synchronized: barbell press, push ups, lat raises with both arms together

## Data representation
```ts
type SideType = 'single' | 'synchronized'

type RepMode = 'left' | 'right' | 'both'

interface RoundEntry {
	round: number
	weightKg: number
	reps: number
	side?: RepMode
}
```

For synchronized exercises, one round entry represents the combined movement. For single-sided exercises, the workout exercise can store separate left and right round entries for the same round number so each side remains reportable.

## Acceptance criteria
- Users can choose the correct mode during record creation.
- Reports can summarize left/right volume separately when needed.
- Single-sided and synchronized data are never mixed in a confusing way.

## Milestone mapping
- M2: Entry model
- M3: Validation and reporting
