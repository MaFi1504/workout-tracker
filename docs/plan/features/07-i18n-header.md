# Feature 07: Language Switcher and Header UI

## Objective
Provide a compact localization option in the header so the app supports English and German.

## Requirements
- Header contains a language switch.
- Default language is English.
- German translation is available as an alternate option.
- Labels, buttons, and chart text should adapt when switching languages.

## Suggested structure
- Header: app title, language switch, maybe quick actions
- Language state is stored locally and reused across app sessions

## Acceptance criteria
- The app loads in English by default.
- Switching to German updates visible UI strings.
- Preference persists on the device.

## Milestone mapping
- M1: App shell and UI state
- M4: Final language validation
