# Feature 03: Rep Counter and Weight Tools

## Objective
Make the app quick to use on a phone by allowing tap-based repetition counting and fast weight selection.

## Requirements
- Tap on the screen to count reps automatically.
- Counter should support incrementing and correcting the last rep value.
- Weight options are limited to 1, 3, 5, 8, and 10 kg.
- User can convert between lb and kg easily.
- Converted values should remain consistent with the stored metric value.

## UX behavior
- User taps the count area to increment reps.
- A quick undo or remove-last action is available.
- Weight selector shows common values and allows custom conversion.

## Conversion logic
- Store canonical value in kilograms internally.
- Display and convert to pounds when needed.
- Example: 5 kg = 11.02 lb.

## Acceptance criteria
- Tap counting is intuitive and works on touch devices.
- Selecting a weight uses a predefined set plus conversion tool.
- Conversion is visible and consistent before saving.

## Milestone mapping
- M3: Counter and measurement tools
- M4: polishing and conversion validation
