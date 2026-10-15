# Feature 01: Exercise Catalog and Search

## Objective
Create a reusable exercise library that supports user-created exercises while loading a base catalog from the server.

## Requirements
- Base exercise list is returned by the server and saved in a local JSON file.
- Example exercises include: Front Raises, Push Ups, Lat Raises, and similar training movements.
- Exercises can be added manually by the user.
- Search input supports filtering exercises when adding a new workout record.
- Playlist exercises include detailed form instructions and link back to their source video.
- Exercises may use multiple tags, such as `Chest` and `Arms`.
- Canonical exercises may define aliases (for example, `Lateral Raises` / `Lat Raises` and `Romanian Deadlift` / `RDL`).
- Workout imports use normalized names, explicit aliases, and conservative unambiguous token matching instead of unrestricted fuzzy matching.
- Each exercise has fields such as name, tags, type, default unit, notes, and an optional source video.

## Data model
```json
{
  "id": "front-raise",
  "name": "Front Raise",
  "tags": ["shoulders", "arms"],
  "defaultWeightUnit": "kg",
  "isCustom": false,
  "description": "Standing front shoulder raise",
  "videoUrl": "https://www.youtube.com/watch?v=bTH8I20UZ-c"
}
```

## UX flow
1. User opens a workout entry form.
2. User searches by exercise name.
3. Matching exercises are shown as cards or dropdown entries.
4. User selects one or creates a new exercise if not present.
5. Selected exercise is attached to the new workout record.

## Acceptance criteria
- Search works with partial matches.
- New exercise entries persist in local storage.
- JSON source can be expanded without changing core UI logic.
- Catalog can be refreshed when the server version changes.

## Milestone mapping
- M1: Foundation and exercise schema
- M2: Search and creation flow
