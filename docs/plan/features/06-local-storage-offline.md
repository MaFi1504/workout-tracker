# Feature 06: Local Storage and Offline Support

## Objective
Keep all critical app data locally on the device and minimize reliance on a live backend connection.

## Requirements
- Save parent workouts locally on the device, including their nested exercises and round entries.
- Cache exercise catalog and recent data for offline access.
- Keep app usable while internet access is unavailable.
- Prefer local-first state and sync later when online.

## Storage strategy
- IndexedDB or localStorage for workout records, nested round entries, and configuration
- JSON exercise catalog stored locally after server fetch
- Cache last-used exercises and recent workout history
- Queue deferred sync or background update actions if server connectivity returns

## Acceptance criteria
- App remains usable after refresh without network access.
- Recent graphs, exercise history, and previous workouts remain available offline.
- Exercise catalog still shows data when network is unavailable.

## Milestone mapping
- M1: Local-first architecture
- M4: Offline resilience and cache validation
