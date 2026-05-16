# Sizzle 🍳

A personal, offline-first cookbook and recipe organiser for Android (built with Expo / React Native).

## What it does
- Store and organise recipes with ingredients, steps, tags, and groupings
- Browse and search recipes locally — no backend, no accounts
- Share recipes by formatting them as plain text and sending via Messenger, WhatsApp, etc.
- Planned: favourites, ratings, meal-type groupings (breakfast/lunch/dinner), and a "roulette" feature to randomly pick a recipe based on filters

## Tech stack
- **Framework:** Expo (~54) with Expo Router for navigation
- **Language:** TypeScript (strict)
- **Database:** expo-sqlite — raw SQL, repository pattern (no ORM)
- **Styling:** StyleSheet.create (React Native built-in)
- **Target platform:** Android (iOS/web may follow later)

## Project structure conventions
- Navigation lives in the `app/` directory (Expo Router file-based routing)
- Database logic is in repository files — one repository per entity (e.g. `RecipeRepository`, `IngredientRepository`)
- Keep UI components, repositories, and types clearly separated into their own directories

## Database
Core tables include `recipes` and `recipe_ingredients`. Follow the existing repository pattern when adding new tables or queries — no ORM, raw SQL only.

When writing migrations or schema changes, keep them explicit and reversible where possible.

## TypeScript
- Strict mode — always provide explicit types, avoid `any`
- Prefer `interface` for object shapes, `type` for unions/aliases
- All database row types should be explicitly typed

## Styling
- Using `StyleSheet.create` throughout
- Keep styles co-located with their component
- No third-party UI libraries currently in use

## Coding conventions
- Functional components only
- Prefer named exports
- Keep components small and focused — extract logic into hooks or repositories where it makes sense
- Follow existing naming patterns in the codebase

## Current TODOs (in rough priority order)
1. CRUD for recipes
2. Export recipe data (backup)
3. Share recipe as formatted plain text (WhatsApp, Messenger, etc.)
4. Rethink list view — add meal-type groupings (breakfast, lunch, dinner)
5. Favourites
6. Ratings
7. Roulette — pick a random recipe based on tags/groupings/filters

## Notes for Claude
- This is an offline app — do not suggest backend services, APIs, or authentication
- Sharing is done via the device's native share sheet (e.g. `expo-sharing` or React Native's `Share` API), formatting the recipe as a human-readable string
- When suggesting UI changes, keep Android as the primary target
- Prefer solutions that fit the existing repository pattern over introducing new abstractions
- StyleSheet.create is the current styling approach — flag if a specific problem would be better solved another way, but don't suggest migrating wholesale