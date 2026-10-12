# Cursor Prompt — Phase 1a: Core Loop (Huffle)

Copy everything below into Cursor's Agent/Composer chat in a fresh Expo project. This is scoped to the core loop only — no CloudKit yet. Get this working end-to-end on your device first, then come back for the Phase 1b prompt (CloudKit sync) as an immediate next step, not a someday-later one. Splitting it this way isn't a change of plan — the build doc still treats CloudKit as a v1, day-one feature — it's just safer to hand an agent a smaller, verifiable slice at a time than to ask for the data layer, sync, and UI all in one shot.

---

## Setup command (run first, before prompting)

```bash
npx create-expo-app@latest huffle --template blank-typescript
cd huffle
npx expo install expo-sqlite expo-notifications expo-haptics
npm install zustand
npx expo install expo-dev-client
```

---

## Prompt to paste into Cursor

```
You are building "Huffle" — an iOS app (Expo/React Native + TypeScript) where a
virtual creature called a "Huffling" grows based on the user logging real-world
movement. Read this entire spec before writing any code, and ask me clarifying
questions only if something below is genuinely ambiguous — otherwise make a
reasonable choice and note the assumption in a comment.

## Product concept
- This is NOT a lifting/exercise-log app (no sets/reps/weight, no exercise library).
  It's for beginners and inconsistent exercisers who bounce off data-heavy fitness apps.
- Core loop: user taps "I moved today," picks a type (Walk / Home workout / Gym / Run /
  Sport / Other), optionally adds a rough duration and note. That's it — one tap plus
  one selection should be enough to log a session.
- Logging a session feeds the Huffling: awards XP, may trigger evolution, and visibly
  improves its mood/animation state.
- Missing days causes the Huffling to look winded/tired again, but NEVER regresses its
  evolution stage or deletes any progress. No punishing mechanics — the tone should be
  encouraging, not guilt-inducing.
- Streaks count consecutive days with at least one session. Streak-freeze tokens
  (earned periodically) let the user skip a day without breaking the streak.

## The Huffling's core visual metaphor (important — this is the app's differentiator)
The Huffling's physical state should visibly mirror the user's own fitness consistency:
- Early/low-XP stages: visibly winded — panting, hunched posture, slower movement.
  This should read as relatable, not embarrassing.
- As XP grows through evolution stages: breathing steadies, posture straightens,
  movement gets lighter and more energetic, color/vibrancy increases.
- Missed-day decay: temporarily looks tired/out of breath again — reversible instantly
  once the user logs a session, never a stage regression.
For this phase, implement this as simple state-driven placeholder visuals (colored
shapes, simple SVG, or emoji), not final art — the animation/art system comes in
Phase 2. What matters now is that the state machine (winded/neutral/energized per
evolution stage) is correctly wired to XP and lastFedAt.

## Tech requirements for this phase
- Expo (managed workflow), TypeScript, React Navigation for screens.
- Local storage: expo-sqlite, wrapped in a clean data-access layer (not raw SQL calls
  scattered through components) — structure it so a CloudKit sync layer can hook in
  in the next phase without a rewrite.
- State management: Zustand stores for Huffling state, session logs, and streak state.
- Local notifications: expo-notifications, max 1 reminder per day (configurable time),
  plus logic to fire a "come back" notification if the user hasn't opened the app in 24h.
- Design for offline-first: every feature must work with no network connection at all.

## Data model — implement exactly these tables/entities
- User: id, createdAt, streakFreezeTokens, onboardingComplete, weeklyGoal
- Huffling: id, name, evolutionStage, xp, mood, lastFedAt
- HabitType: id, label, icon, category (seed with category="fitness" and labels
  Walk/Home workout/Gym/Run/Sport/Other; allow user-added custom types later —
  just leave the schema open for it). Using "HabitType" with a category field
  (not "WorkoutType") is deliberate — it's what lets future versions add non-fitness
  habit categories under the same app without a schema change.
- SessionLog: id, habitTypeId, completedAt, durationMinutes (nullable), xpAwarded, note (nullable)
- Streak: currentStreak, longestStreak, lastCompletedDate, freezeUsedDates (array)
- WeeklyGoal: targetSessions, weekStartDate, sessionsCompletedThisWeek

IMPORTANT: give every record a stable UUID (not an autoincrement int) and an
`updatedAt` timestamp on every table — this is required so the CloudKit sync layer
(next phase) can be added without a schema migration. Don't build CloudKit sync
itself yet, just make sure the schema is sync-ready.

## Screens to build (React Navigation, stack or tabs — your call)
1. Onboarding (2-3 screens max): welcome, name the Huffling, and log the FIRST
   session during onboarding itself so the user has already fed their Huffling and
   gained XP before landing on the home screen. This first-session win is the single
   most important retention mechanic in the app — don't skip it or make it skippable.
2. Home screen: Huffling display (state reflects mood/evolution), current streak,
   big obvious "Log a session" button, this week's progress toward weeklyGoal.
3. Log session screen/modal: habit type picker, optional duration, optional note,
   single confirm action, then return to home with a visible Huffling reaction.
4. History screen: simple list of past SessionLogs, grouped by date.
5. Settings screen: notification time picker, weekly goal editor, Huffling rename.

## XP / evolution logic
- Base XP per session: flat amount (pick a reasonable number, e.g. 10).
- Small streak bonus multiplier, capped so it can't be gamed into huge jumps.
- 5 evolution stages representing the winded-to-energized progression described
  above (e.g. Winded, Catching Breath, Steady, Strong, Thriving — or name them
  however reads best) with XP thresholds you define — front-load the first
  evolution to happen fast (within 2-3 sessions) since early visible progress
  drives retention.
- Write this as a pure, testable function (xp in -> stage out), not embedded in a
  component, so the thresholds can be tuned later without touching UI code.

## Explicitly do NOT build in this phase
- No CloudKit/iCloud sync yet (schema should be ready for it — implementation is
  the very next prompt, not deferred indefinitely)
- No StoreKit/paywall/monetization
- No social or sharing features
- No HealthKit integration
- No final Huffling art/animation system — use simple placeholder shapes/emoji per
  state, real art direction comes in Phase 2

## Code quality expectations
- TypeScript strict mode, no `any` unless truly unavoidable
- Data access layer fully separated from UI components
- Comment any non-obvious business logic (XP formula, streak calculation, decay logic)
- Structure the project so Phase 1b (CloudKit sync), Phase 2 (evolution animations,
  streak freeze UI) can be added without major refactors

Start by proposing the file/folder structure, then build it out feature by feature,
starting with the data layer, then Zustand stores, then screens. Check in with me
after the data layer and after onboarding before continuing.
```

---

## After this prompt works

Come back immediately (not "someday") for:
- **Phase 1b**: the actual CloudKit sync layer (`expo-cloudkit` wiring, private database, conflict resolution) — the schema above is designed to make this a clean add-on rather than a rewrite, and it's still a v1 feature per the build plan, just sequenced as its own focused pass
- **Phase 2**: evolution animations (Lottie), streak-freeze UI, real Huffling art direction
- **Phase 4**: StoreKit paywall + RevenueCat
