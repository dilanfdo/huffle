# Huffle — Project Documentation

**One-liner:** An iOS app where a virtual creature (a "Huffling") grows as you build a consistent movement habit — built for beginners and inconsistent exercisers, not serious lifters, with zero recurring infrastructure cost.

**Status:** Android v1 feature-complete and release-built (core loop, evolution, streak-freeze, journey screen, SVG Huffling). iOS and CloudKit sync are built but not yet verified on a device. See §9 for the Android release checklist and open items.

**Platform:** Android first, iOS next. React Native via Expo (SDK 57). Package / bundle id: `app.nexusdigitallabs.huffle`.

---

## 1. Product Overview

### 1.1 The problem

Most fitness apps are built for people who already know how to train — sets, reps, progressive overload, muscle-group balance (Hevy, Strong, Fitbod). That's a deep, well-served, highly competitive niche. It is not where beginners succeed.

In hands-on testing of beginner-focused fitness apps, most were found to feel like "a noisy casino of streaks, notifications, and random workouts" — technically gamified, but not genuinely motivating. Very few apps are built with the singular goal of getting an inconsistent person to show up again tomorrow.

### 1.2 The solution

Huffle is not a workout log. It has one job: make it easy and low-pressure to log that you moved today, and reward that consistency visibly through a virtual companion (a "Huffling") whose own physical state — literally its breathing and energy — mirrors the user's fitness journey.

### 1.3 Target user

Beginners and inconsistent exercisers who:
- Have tried lifting-log apps and found them intimidating or overly detailed
- Want *some* form of movement tracked (walks, home workouts, casual gym sessions), not structured programming
- Respond better to encouragement than to guilt, streak-shaming, or competitive leaderboards

### 1.4 Explicit non-goals for v1

- Not a lifting/programming tool (no sets, reps, weight, exercise library)
- Not a social/competitive fitness app
- No cross-device sync on Android at launch. CloudKit is Apple-only, so Android data is local (Android Auto Backup restores it with the Google account); sync is an iOS feature (see §4)
- Not AI-powered (keeps recurring cost at zero)

---

## 2. Market Context (why this angle, evidence-based)

- The fitness app market is roughly **$13.5–13.9B in 2026**, growing at **13–17% CAGR**. Gamification specifically has been shown to lift daily active users by close to 30% in this category.
- The general "habit + virtual pet" genre is already **crowded**: Finch, Mochi, Habico, Habit Rabbit, Habbie, and HabitYou are all live App Store apps using variations of "pet grows as you complete habits." None of them tie the pet's physical state directly to the specific behavior being tracked — this is Huffle's differentiation (see §3).
- Lifting/logging apps (Hevy: 9M+ users, Strong, Fitbod) dominate the "serious exerciser" niche and are not worth competing against directly.
- Sobriety-companion and study/Pomodoro-pet niches were considered and deprioritized: study/Pomodoro is oversaturated by an entrenched leader (Forest) with an unbeatable brand story; sobriety apps carry higher emotional/ethical stakes better suited to a later, more resourced iteration than a first solo build.

---

## 3. The Huffling — Core Product Mechanic

### 3.1 Concept

An original creature (not a real animal — avoids trademark/likeness risk, same approach as Duolingo's owl). Its defining trait: **its physical state visibly mirrors the user's own fitness consistency.**

- **Early / low-XP stages:** visibly winded — panting, hunched posture, slower movement. Designed to feel relatable to a beginner, not embarrassing.
- **As XP grows / evolution progresses:** breathing steadies, posture straightens, movement becomes lighter and more energetic, color/vibrancy increases.
- **Missed-day decay:** the Huffling temporarily looks tired/out of breath again — reversible instantly on the next logged session. **Never** a stage regression, **never** data loss. No punishing mechanics.

### 3.2 Why this differentiates Huffle

Competing habit-pet apps use generic mood states (happy/sad blob, costumed creature, rabbit). Tying the mascot's literal breathing/energy to the *specific tracked behavior* is a sharper, more specific hook — and it's currently unused in this space.

### 3.3 Evolution stages (v1)

5 stages representing the winded → energized progression (exact names TBD during build, e.g. *Winded → Catching Breath → Steady → Strong → Thriving*). Achieved through posture and color/vibrancy shifts rather than entirely new character art per stage, to control art production cost.

### 3.4 Engagement mechanics

- **XP:** flat amount per logged session + a small, capped streak bonus (prevents runaway grinding).
- **Streaks:** consecutive days with at least one session.
- **Streak-freeze tokens:** earned periodically; let a user skip a day without breaking their streak. Apps with a freeze mechanic show meaningfully longer average streaks than apps without one.
- **First-session win:** onboarding guarantees the user logs one session and gains XP before ever reaching the home screen. This is the single highest-leverage retention lever identified in research — users who hit an achievement on day one show roughly double the day-30 retention of those who don't.
- **Notification policy (implemented in `src/notifications/`):** local only, max 2 a day. A daily reminder at the user's chosen time, plus one evening "streak-save" nudge (20:30) only when a 2+ day streak is at stake and it lands 90+ minutes after the daily one. Nothing fires on a day already logged. Copy is in the Huffling's voice and escalates warmly as days are missed (streak-alive → missed one → missed a few → "no pressure"), then stops after 7 days away. The whole plan is rebuilt on app open/resume, after each log, and when settings change. The tone dial is `notifications/copy.ts`.
- **Duolingo-style pull, Huffle tone:** the engagement loop borrows Duolingo's mechanics (daily reminder, streak flame, week row, milestones, celebration moments, a character that talks) but not its guilt: copy is playful and never shaming, a lapsed streak is framed as "a nap", and freeze tokens soften misses. Motion is purposeful and respects the system reduce-motion setting.

---

## 4. Technical Architecture

### 4.1 Guiding constraint

**Zero recurring infrastructure cost.** The only unavoidable expense is Apple's $99/year Developer Program fee. This shapes every architecture decision below.

### 4.2 Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo (React Native, managed workflow) | Fastest path to a real iOS build; OTA updates via EAS free tier |
| Local database | expo-sqlite / WatermelonDB | Fast, offline-first, relational |
| Cross-device sync | `expo-cloudkit` (or `react-native-icloud-kit`) | Wraps Apple CloudKit — free, billed against the *user's* iCloud storage, not ours |
| State management | Zustand | Lightweight, minimal boilerplate |
| Notifications | `expo-notifications` (local only, not push) | Fully on-device scheduling, no server |
| Animations | `react-native-reanimated` + `lottie-react-native` | Handles evolution/breathing animations without a game engine |
| Auth | None required (optionally Sign in with Apple) | No backend auth server needed |
| Payments | StoreKit 2 via `react-native-purchases` (RevenueCat) | Free until ~$2.5K/month tracked revenue |
| Analytics | PostHog free tier / expo-insights | Retention visibility without a paid tool |

### 4.3 Data model

Deliberately designed to be **sync-ready from day one** and **future-proof for non-fitness habit categories** (see §6).

```
User (local only, no account required)
 └─ id, createdAt, streakFreezeTokens, onboardingComplete, weeklyGoal

Huffling
 └─ id, name, evolutionStage, xp, mood, lastFedAt

HabitType (seeded; user can add custom)
 └─ id, label, icon, category
    — v1 ships only category="fitness" (Walk, Home workout, Gym, Run, Sport, Other)

SessionLog
 └─ id, habitTypeId, completedAt, durationMinutes (nullable), xpAwarded, note (nullable)

Streak
 └─ currentStreak, longestStreak, lastCompletedDate, freezeUsedDates[]

WeeklyGoal
 └─ targetSessions, weekStartDate, sessionsCompletedThisWeek
```

**Design rules:**
- Every table has a stable **UUID** primary key (not autoincrement) and an **`updatedAt`** timestamp — required for clean CloudKit sync without future migration pain.
- `HabitType` uses a generic name + `category` field (not `WorkoutType`) — this single decision is what lets v2+ add non-fitness habit categories (water, sleep, reading) as new seed data rather than a schema rewrite.
- No sets/reps/weight/exercise-library tables — that complexity belongs to Hevy/Strong, not this app. The simplicity of the log is the differentiation, not a limitation.

### 4.4 CloudKit sync (iOS; built, unverified on device)

- **Private database only** — each user's data lives in their own iCloud; no cross-user data ever touches infrastructure we manage. No privacy/compliance burden.
- Local SQLite/WatermelonDB remains the source of truth for instant UI reads/writes; the app must work fully offline.
- Every local write also queues a CloudKit push; `CKSyncEngine` (iOS 17+) handles batching, retry, and rate limiting.
- **Conflict resolution:** append-only tables (`SessionLog`) never conflict — merge by ID. Mutable single-row tables (`Huffling`, `Streak`) use last-write-wins by timestamp; CloudKit surfaces true conflicts via `changeTag` mismatches.
- **Must handle explicitly:** user not signed into iCloud (app still works fully, local-only, no blocking); first launch on a second device (CloudKit pull populates local DB with a loading state before showing the Huffling).

### 4.5 Build sequencing note

Although CloudKit is a v1/day-one architectural feature, it's built as a **separate, focused implementation pass** after the core loop is verified working on-device — not bundled into the same AI-assisted coding session as the UI and data layer. This reduces the risk of an agent making unrecoverable mistakes across too many moving parts at once. See the Cursor prompts in `/docs` (or wherever they're stored) for the exact two-phase split.

---

## 5. Build Phases

| Phase | Scope | Est. time |
|---|---|---|
| **1a** | Core loop: Habit CRUD, local SQLite storage, basic Huffling states, local notifications, onboarding with guaranteed first win | **Done** |
| **1b** | CloudKit sync layer: entitlements, private database wiring, conflict resolution | **Built, not device-verified** (iOS only) |
| **2** | Engagement layer: XP, evolution stages, streak-freeze, Huffling art/animation | **Done** — SVG character (drawn in code, `react-native-svg`), evolution celebration, freeze feedback, journey screen. Lottie not used. |
| **3** | Retention polish: adaptive nudges, weekly summary, haptics, Sign in with Apple, App Store assets | 1–2 weeks |
| **4** | Monetization + ship: StoreKit paywall, RevenueCat, TestFlight beta, App Store submission | — |

**What's deliberately excluded from v1:** social/leaderboard features (server cost + moderation burden), AI features (keeps cost at zero), Android (CloudKit is Apple-only; cross-platform requires swapping the whole sync layer).

---

## 6. Product Vision & Roadmap (post-v1)

Huffle's actual product is the **habit-logging + Huffling-growth engine** — fitness is the first habit category it ships with, not a permanent ceiling. This works because of the `HabitType.category` field decision in §4.3.

| Stage | What's added | Why it works |
|---|---|---|
| **v1** | Fitness only, beginner-focused | Prove the core loop: log → Huffling grows → user returns tomorrow |
| **v2** | New `HabitType` categories under the same Huffling — water, sleep, reading, mindfulness | Same schema, same engine — new seed data only |
| **v3** | Multiple Hufflings / a "collection," tied to different habit categories | Deepens engagement past full evolution of the first Huffling |
| **v4** | Optional social layer — friends' Hufflings, gentle co-accountability (not competitive leaderboards) | Expands acquisition via word-of-mouth without changing the core audience |
| **v5** | Family/kids mode, or a lightweight workplace-wellness variant | New audience segments, same core mechanic |

The brand does not need to change as this expands — Finch launched narrower than it is today and never rebranded as it broadened into journaling, mood tracking, and breathing exercises. The "huff and puff → steady breathing" metaphor has some natural room to generalize into broader wellness later, though that's a v4/v5 consideration, not a v1 decision.

**Later technical additions (post-launch, once there's revenue):**
- Apple Health / HealthKit integration to auto-detect movement
- Optional social layer sharing Huffling milestones (not raw workout data, to avoid Strava-style comparison anxiety)
- Seasonal Huffling cosmetics as a soft monetization/retention lever

---

## 7. Branding & App Store Positioning

- **App name:** Huffle
- **Category:** Health & Fitness
- **Tagline direction:** something like *"Your Huffling forgives a bad week"* or *"The workout buddy that's rooting for you"* — leans directly into the anti-guilt positioning and the mascot.
- **Target keywords:** beginner workout app, exercise habit tracker, workout motivation, fitness streak, gentle fitness app. Deliberately **avoid** competing on "strength training," "progressive overload," "workout log" — that's Hevy/Strong/Fitbod territory.
- **Screenshots:** lead with the Huffling's evolution states (winded → energized) and the "any movement counts" logging screen — not a data dashboard.
- **First marketing channels:** r/loseit, r/xxfitness, r/GetMotivated, TikTok fitness-for-beginners creators — audiences already frustrated with intimidating lifting apps.

### Brand availability status (checked, not final)

| Asset | Status |
|---|---|
| App Store app name "Huffle" | No conflicting app found (best-effort search, not a formal reservation) |
| huffle.com | Taken — unrelated fintech/lending company |
| huffle.ai | Taken — unrelated analytics SaaS |
| huffle.app | No conflict found — **recommended domain to register** |
| Instagram @huffle | Taken — unrelated active account |
| TikTok @huffle | No exact conflict found, but "huffle" is heavily associated with Harry Potter's Hufflepuff online, which will dilute organic hashtag discovery |

**Action items before public launch:**
- [ ] Reserve app name in App Store Connect (only official confirmation of availability)
- [ ] Trademark clearance search (USPTO TESS or local equivalent) before spending on final branding/logo
- [ ] Register `huffle.app`
- [ ] Decide on fallback social handles (`@huffleapp`, `@gethuffle`) since bare `@huffle` is unavailable

---

## 8. Key Decisions Log

| Decision | Reasoning |
|---|---|
| Fitness-for-beginners over sobriety or study/Pomodoro niches | Largest market + fastest growth + genuine mechanic differentiation still available; sobriety carries higher ethical stakes for a first build, study/Pomodoro is dominated by an entrenched leader (Forest) |
| No sets/reps/weight tracking | Avoids competing with Hevy/Strong/Fitbod on their turf; keeps the build simple and the positioning distinct |
| CloudKit over Firebase/Supabase | Zero cost regardless of scale (billed to user's iCloud); no server to manage; strong privacy story requires no extra work |
| CloudKit built as v1 feature, but as a separate build phase (1b) | Cross-device sync matters from day one for a habit app, but bundling it into the same AI-assisted build pass as the core UI increases the risk of unrecoverable mistakes |
| `HabitType` with `category` field, not `WorkoutType` | Single schema decision that enables the entire v2+ roadmap (non-fitness habits) without a rewrite |
| Duolingo-style reminders and gamified motion, kept warm | Streak pressure and celebration drive return visits, but the anti-guilt promise is the differentiator: nudges are capped at two a day, fade out after a week away, and never shame |
| Decay-not-punishment pet logic (no stage regression, ever) | Directly addresses the "broken streak → user quits" failure mode common in habit apps |
| Original creature ("Huffling") instead of a real animal | Avoids likeness/trademark risk; allows the breathing/energy metaphor to be built specifically for this app's mechanic |

---

## 8b. Android backup & sync (Google Drive)

Android has no CloudKit, so cross-device backup uses the user's own Google Drive hidden app folder (`drive.appdata` scope — Huffle cannot see any other Drive file). It stays hidden until a Google client id is supplied, so builds without one behave exactly as before.

- **How it works:** one JSON snapshot (`huffle-sync.json`) is merged with the local database — union by id, newest `updatedAt` wins, weekly goals keyed by week start, sessions never deleted — so devices converge. Triggered on launch/resume, shortly after local writes, and from Settings ("Sync now"). A fresh install can restore from the Welcome screen. If two different Hufflings exist (a device onboarded before connecting), the user picks which to keep.
- **Code:** `src/sync/drive/` (pure merge in `snapshot.ts`, REST client in `driveApi.ts`, orchestration in `engine.ts`, Google sign-in in `auth.ts`); platform dispatch in `src/sync/provider*.ts`; UI in `src/components/backup/`.
- **To enable (Google Cloud Console):**
  1. Create a project, enable the **Google Drive API**.
  2. OAuth consent screen: External; add scope `.../auth/drive.appdata`; add test users while in Testing.
  3. Create an OAuth client of type **Web application** — its id is the `webClientId`.
  4. Create OAuth clients of type **Android** for package `app.nexusdigitallabs.huffle`, one per signing key: the debug keystore, the upload key, and the **Play App Signing** key (shown in Play Console → App integrity).
  5. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>` in `.env.local` (git-ignored; the id is public but this keeps config out of history), then rebuild. If the Gradle JS bundle task reports UP-TO-DATE, run `./gradlew :app:createBundleReleaseJsAndAssets --rerun` so the value is inlined.
- **Verified:** merge, conflict, and REST behaviour are unit-tested. The live round trip was exercised on an Android emulator with the upload-key build: connect → background sync → uninstall → reinstall → "Restore from Google Drive" brought back the same profile, XP, stage, streak, and session history. A silent restore at boot does not fire after a reinstall (Google sign-in state is lost), so the Welcome-screen button is the restore path.
- **iOS later:** the Drive provider could also serve iOS if cross-platform moves matter; the library then needs its URL-scheme config plugin.

## 8c. Monetization

Principle: the free app is the complete habit loop; money comes from delight and depth, never from gating streaks, reminders, or backup.

| Lever | Fit | Notes |
|---|---|---|
| **Huffle Plus — annual + lifetime** | Best | More Hufflings / a collection (roadmap v3), cosmetics and seasonal skins, extra habit categories (water, sleep, reading — v2), weekly insights, themes/widgets, extra freeze slots. Annual ~$19.99, lifetime ~$39.99 to start; test price points. |
| **Cosmetic packs (one-time)** | Good | Low-pressure fit for "seasonal cosmetics". Can sit beside Plus. |
| **Tip jar** | Minor | Goodwill, tiny revenue. |
| **Ads** | Avoid | Clashes with the calm, no-guilt brand, needs consent flows and data collection, and erodes trust. |
| **B2B / workplace wellness** | Later | Roadmap v5; needs accounts and a backend. |

- **When to ask:** a soft, dismissible paywall at moments of delight (first evolution, a 7-day streak), not on launch.
- **Tech:** RevenueCat (`react-native-purchases`) over Play Billing; entitlement cached locally so it works offline. Needs Play Console products, license testers, and a native rebuild.
- **Heads-up — privacy:** purchases introduce an anonymous purchase id shared with RevenueCat. The privacy policy and Play Data safety form must change from "collects nothing" before this ships.
- **Fees and costs:** Play's one-time $25 account fee; Google currently takes 15% of subscriptions and of the first $1M a year of other digital sales (verify current terms); RevenueCat's free tier is sized for small apps (re-check current pricing).
- **Realistic expectations:** revenue is a function of installs × retention × conversion, and habit apps retain poorly at day 30. Plan on low single-digit paid conversion and treat early revenue as validation, not income, until retention and distribution are proven.

## 9. Android Release Checklist & Open Items

**Built and verified on an Android emulator:** onboarding with guaranteed first session, logging, streak/freeze logic, evolution celebration, journey screen, reminders (channel + permission), keyboard behaviour, release build with upload-key signing.

**Release build**
- `npx expo prebuild --platform android --clean`, then `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.
- Signing: upload key lives outside the repo at `~/.huffle-signing/` (`huffle-upload.jks` + `keystore.properties`), wired in by `plugins/withReleaseSigning.js`. **Back this folder up** — enrol in Play App Signing so a lost upload key can be reset, but keep a copy regardless.
- Bump `expo.android.versionCode` (and `version`) for every Play upload.

**Play Console tasks (need the developer account)**
- [ ] Create the app (`app.nexusdigitallabs.huffle`), enrol in Play App Signing, upload the AAB to Internal testing.
- [ ] Store listing: title, short/full description, 512px icon (`assets/icon.png`), feature graphic (1024x500), 2–8 phone screenshots.
- [ ] Privacy policy URL (required). The app collects nothing and has no network calls; data stays on the device.
- [ ] Data safety form: no data collected or shared.
- [ ] Content rating questionnaire, target audience (not directed at children), health-app declarations (this is a wellness tracker, not a medical app).
- [ ] Closed testing with the required tester count/period before requesting production (applies to new personal accounts).

**Product open items**
- [ ] Run the notification schedule on a physical device over several days (Doze / reboot behaviour).
- [ ] Verify on a physical device: soft keyboard, large font sizes, small screens.
- [ ] Brand: reserve the name in App Store Connect / Play, register `huffle.app`, trademark search, fallback social handles.
- [ ] iOS: dev build, register the `iCloud.app.nexusdigitallabs.huffle` container, verify CloudKit push/pull/restore on two devices.
- [ ] Phase 3: weekly summary, adaptive nudges, Sign in with Apple (iOS), store assets.
- [ ] Phase 4: RevenueCat paywall, analytics, TestFlight.
