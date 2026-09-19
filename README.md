# Sizzle 🍳

A personal, offline-first cookbook and recipe organiser for Android, built with Expo and React Native.

## What it does

- Create, edit, and browse your own recipes — ingredients, steps, effort, prep/cook time, servings, rating, and a photo
- Organise recipes with tags and meal-type categories, and filter/search across both
- Mark favourites and sort by date, title, or rating
- Share any recipe as plain, formatted text via the device's native share sheet (WhatsApp, Messenger, etc.)
- Back up all your recipes to a JSON file and restore from one later
- No backend and no accounts — everything lives in a local SQLite database on your device

## Tech stack

- Expo (SDK 57) / React Native, TypeScript (strict mode)
- `expo-sqlite` — raw SQL, no ORM, repository pattern
- `StyleSheet`-based theming with light/dark support, no third-party UI library

## Development

- `npm start` — start the Expo dev server
- `npm test` — run the Jest test suite (everything lives under `__tests__/`, fully mocked at the database/filesystem boundary, so a test run never touches real data)
- A pre-commit hook (via Husky) runs the typecheck and test suite before every commit

## Status

Sizzle is a personal project, currently in beta (`v0.1.0`). It's used and tested informally by friends and family rather than published to the Play Store.

## Future development

- **Soft-deleted recipes** — deleting a recipe archives it instead of removing it immediately, with an "Archived" view to unarchive it or permanently delete it.
- **Single-recipe export** — export just one recipe (title, description, ingredients, and steps) as a shareable file or encoded string, for sending to another Sizzle user. Everything else on a recipe (tags, categories, rating, favourite, photo) is user-specific and wouldn't carry over meaningfully, so it's deliberately left out.
- **List/grid view toggle** — a compact list view as an alternative to the current photo-grid view on the recipe list screen.
- **Shopping lists** — select several recipes, generate a combined shopping list from their ingredients, and check items off as you shop, with a "Finish" action once you're done.
- **Roulette** — pick filters (tags, categories) and how many recipes you want, get a randomised shortlist, and re-roll individual picks you don't want before turning the final list into a shopping list.
