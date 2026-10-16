# Huffle — Project Documentation

**One-liner:** A mobile app where a virtual creature (a "Huffling") grows as you build a consistent movement habit — built for beginners and inconsistent exercisers, not serious lifters, with zero recurring infrastructure cost.

**Status (2026-10-16):** Published on Google Play and in review (owner-reported). Current build **1.0.2 (versionCode 7)**; unit tests 89/89 pass, the on-device suite passed 76/76 on 1.0.1 (5) and 73 checks pass on 1.0.2 (7) on an emulator (Drive checks verified separately with real sign-in). iOS and CloudKit sync are built but not yet verified on a device. See §9 for the release checklist and open items, and `RELEASING.md` for how to ship.

**Platform:** Android first, iOS next. React Native via Expo (SDK 57). Package / bundle id: `app.nexusdigitallabs.huffle`.

**Repos:** the app is its own repo, `dilanfdo/huffle` (like Odova and PDFly). The product page and privacy policy are hosted by the studio website repo `NexusDigitalLabs/nexusdigitallabs.github.io` at `/huffle/` and `/huffle/privacy-policy/`.

**Related docs:** `README.md` (run/test), `RELEASING.md` (build, sign, verify, ship), `PLAY_STORE.md` (listing copy and declarations), `privacy-policy.md` (mirror of the hosted policy), `../store/README.md` (store graphics).

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
- No Huffle-run backend or accounts. Cross-device sync is per platform and uses the user's own cloud: Google Drive `appDataFolder` on Android (§8b), CloudKit on iOS (§4.4). Android Auto Backup also restores local data with the Google account
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

5 stages representing the winded → energized progression: **Winded → Catching Breath → Steady → Strong → Thriving**, at **0 / 20 / 70 / 160 / 320 XP** (`src/domain/evolution.ts`). Achieved through posture, ear/arm position and color/vibrancy shifts of one character drawn in code with `react-native-svg` (`src/components/huffling/`), rather than new art per stage. Mood (winded / neutral / energized, from how recently the Huffling was fed) changes the face and extras but never the stage.

### 3.4 Engagement mechanics

- **XP:** 10 per session plus a small capped streak bonus (+1 per streak day, max +5). Within one day XP diminishes — full, half, a quarter, then none (`SESSION_XP_MULTIPLIERS`) — so tiny entries cannot be farmed; every session is still logged and celebrated.
- **Streaks:** consecutive days with at least one session.
- **Streak-freeze tokens:** earned periodically; let a user skip a day without breaking their streak. Apps with a freeze mechanic show meaningfully longer average streaks than apps without one.
- **First-session win:** onboarding guarantees the user logs one session and gains XP before ever reaching the home screen. This is the single highest-leverage retention lever identified in research — users who hit an achievement on day one show roughly double the day-30 retention of those who don't.
- **Notification policy (implemented in `src/notifications/`):** local only, max 2 a day. A daily reminder at the user's chosen time, plus one evening "streak-save" nudge (20:30) only when a 2+ day streak is at stake and it lands 90+ minutes after the daily one. Nothing fires on a day already logged. Copy is in the Huffling's voice and escalates warmly as days are missed (streak-alive → missed one → missed a few → "no pressure"), then stops after 7 days away. The whole plan is rebuilt on app open/resume, after each log, and when settings change. The tone dial is `notifications/copy.ts`.
- **Duolingo-style pull, Huffle tone:** the engagement loop borrows Duolingo's mechanics (daily reminder, streak flame, week row, milestones, celebration moments, a character that talks) but not its guilt: copy is playful and never shaming, a lapsed streak is framed as "a nap", and freeze tokens soften misses. Motion is purposeful and respects the system reduce-motion setting.

---

## 4. Technical Architecture

### 4.1 Guiding constraint

**Zero recurring infrastructure cost.** No servers. The unavoidable fees are Google Play's one-time $25 registration and, for iOS later, Apple's $99/year Developer Program. This shapes every architecture decision below.

### 4.2 Tech stack

| Layer | Choice | Status |
|---|---|---|
| Framework | Expo SDK 57 (React Native 0.86, TypeScript, dev-client / prebuild) | In use |
| Local database | `expo-sqlite`, schema v3 (users, hufflings, habit_types, session_logs, streaks, weekly_goals, sync tables, `app_settings`) | In use |
| State | Zustand stores + pure domain logic in `src/domain/` (unit-tested) | In use |
| Android backup/sync | Google Sign-In + Drive `appDataFolder` (`src/sync/drive/`) | In use (see §8b) |
| iOS sync | `expo-cloudkit`, private database, outbox (`src/sync/engine.ts`, loaded only on iOS) | Built, unverified on device |
| Notifications | `expo-notifications`, local only, planned by a pure planner (`src/notifications/plan.ts`) | In use |
| Animation | React Native `Animated` (no Reanimated/Lottie), honouring the reduce-motion setting | In use |
| Art / icons | Huffling and all icons are SVG drawn in code (`react-native-svg`); stroke icon set in `src/components/icons/` | In use |
| Auth | None. Optional Google sign-in is only used for Drive backup | In use |
| Payments | RevenueCat over Play Billing (Supporter pack) | Planned (§8c) |
| Analytics | None. No analytics or crash SDKs | Deliberate |

### 4.3 Data model

Deliberately designed to be **sync-ready from day one** and **future-proof for non-fitness habit categories** (see §6).

```
User (local only, no account required)
 └─ id, createdAt, streakFreezeTokens, onboardingComplete, weeklyGoal,
    reminderHour, reminderMinute, lastOpenedAt

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

app_settings (device-local key/value, never synced)
 └─ selected cosmetic, date the daily gift was opened, supporter flag
```

**Design rules:**
- Every table has a stable **UUID** primary key (not autoincrement) and an **`updatedAt`** timestamp — required for clean CloudKit sync without future migration pain.
- `HabitType` uses a generic name + `category` field (not `WorkoutType`) — this single decision is what lets v2+ add non-fitness habit categories (water, sleep, reading) as new seed data rather than a schema rewrite.
- No sets/reps/weight/exercise-library tables — that complexity belongs to Hevy/Strong, not this app. The simplicity of the log is the differentiation, not a limitation.

### 4.4 CloudKit sync (iOS; built, unverified on device)

- **Private database only** — each user's data lives in their own iCloud; no cross-user data ever touches infrastructure we manage. No privacy/compliance burden.
- Local SQLite (`expo-sqlite`) remains the source of truth for instant UI reads/writes; the app must work fully offline.
- Every local write also queues a CloudKit push; `CKSyncEngine` (iOS 17+) handles batching, retry, and rate limiting.
- **Conflict resolution:** append-only tables (`SessionLog`) never conflict — merge by ID. Mutable single-row tables (`Huffling`, `Streak`) use last-write-wins by timestamp; CloudKit surfaces true conflicts via `changeTag` mismatches.
- **Must handle explicitly:** user not signed into iCloud (app still works fully, local-only, no blocking); first launch on a second device (CloudKit pull populates local DB with a loading state before showing the Huffling).

### 4.5 Build sequencing note

Although CloudKit is a v1/day-one architectural feature, it's built as a **separate, focused implementation pass** after the core loop is verified working on-device — not bundled into the same AI-assisted coding session as the UI and data layer. This reduces the risk of an agent making unrecoverable mistakes across too many moving parts at once. The original two-phase prompts are kept in `cursor-prompt-phase1.md` (historical; the code has since moved well beyond them).

---

## 5. Build Phases

| Phase | Scope | Status |
|---|---|---|
| **1a** | Core loop: logging, SQLite storage, Huffling states, local notifications, onboarding with guaranteed first win | **Done** |
| **1b** | CloudKit sync layer (iOS) | **Built, not device-verified** |
| **2** | Engagement: XP, evolution, streak-freeze, SVG Huffling, evolution celebration, journey screen, daily glow, daily gift, wardrobe | **Done** |
| **3** | Retention polish | **Partly done:** adaptive nudges, haptics, welcome-back, milestones, in-app privacy link. **Open:** weekly recap, post-Thriving content, Sign in with Apple (iOS) |
| **Android release** | Drive backup, signed AAB, Play listing | **Published, in review**; see §9 and `RELEASING.md` |
| **4** | Monetization + iOS ship: RevenueCat Supporter pack, TestFlight, App Store | Not started |

**What's deliberately excluded from v1:** social/leaderboard features (server cost + moderation burden), AI features (keeps cost at zero). Android now ships first; CloudKit is Apple-only, so Android uses Google Drive for backup (§8b).

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
| Android backup via the user's Google Drive `appDataFolder`, not a backend | Free, no server, data stays in the user's own account, and it reuses the UUID/`updatedAt` sync design; Huffle cannot see any other Drive file |
| Huffle is its own repo (`dilanfdo/huffle`); its page and policy live in the studio website repo | Matches Odova and PDFly; keeps app code out of the website repo while the legal pages share the studio domain |
| Positive moments use green, nudges use soft amber, never coral | Coral/red read as a warning next to words like "fully glowing"; the anti-guilt tone is the product |
| Test-reminder button is development-only | Verifies notification delivery without shipping a "test" control; loaded behind `__DEV__` so release bundles contain none of it |
| Icons are one SVG line-icon set, not emoji | Emoji rendered inconsistently and dated across Android vendors |
| Original creature ("Huffling") instead of a real animal | Avoids likeness/trademark risk; allows the breathing/energy metaphor to be built specifically for this app's mechanic |

---

## 8a. Daily rhythm, gifts and cosmetics

Goal: a Duolingo-like reason to come back tomorrow, without ever blocking the real-world action. Logging, streaks, evolution and reminders are never gated.

- **Daily glow (XP fairness):** each session is always logged and celebrated, but XP diminishes within a day — full, half, a quarter, then none (`SESSION_XP_MULTIPLIERS` in `domain/xp.ts`). Home shows three orbs; when full the Huffling is "fully glowing today". No penalty for rest days.
- **Welcome back:** a lapsed streak that restarts is celebrated like a milestone (confetti, "Welcome back!"), never framed as failure.
- **Daily gift = cosmetic of the day:** after the first session of a day, a gift appears; opening it lets the free user wear one item they don't own yet until midnight. Picks are stable per date and exclude owned items.
- **Earned cosmetics (permanent):** derived from history, so nothing extra to store — sweatband (5 sessions), scarf (7-day streak), leaf crown (Steady), glasses (25 sessions), cape (Thriving). Gift-only items: bow, star pin, sunhat.
- **Supporter (one-time purchase):** owns every cosmetic permanently, no daily wait. The ownership check is wired (`useWardrobeStore.supporter`); the real purchase is not connected yet — it needs Play Billing (e.g. RevenueCat) and a product in Play Console. A `__DEV__`-only toggle in the Wardrobe lets you preview the Supporter state.
- **Storage:** device-local `app_settings` key/value table (schema v3): selected item, gift-opened date, supporter flag. Not included in Drive sync.

## 8b. Android backup & sync (Google Drive)

Android has no CloudKit, so cross-device backup uses the user's own Google Drive hidden app folder (`drive.appdata` scope — Huffle cannot see any other Drive file). It stays hidden until a Google client id is supplied, so builds without one behave exactly as before.

- **How it works:** one JSON snapshot (`huffle-sync.json`) is merged with the local database — union by id, newest `updatedAt` wins, weekly goals keyed by week start, sessions never deleted — so devices converge. The snapshot also carries device preferences (selected wardrobe item, last gift-opened date, supporter flag): newest edit wins for the selection, the gift date only moves forward, supporter is sticky. Older backups without them still load. A backup written by a newer snapshot version is never overwritten. Triggered on launch/resume, shortly after local writes, and from Settings ("Sync now"). A fresh install can restore from the Welcome screen. If two different Hufflings exist (a device onboarded before connecting), the user picks which to keep.
- **Code:** `src/sync/drive/` (pure merge in `snapshot.ts`, REST client in `driveApi.ts`, orchestration in `engine.ts`, Google sign-in in `auth.ts`); platform dispatch in `src/sync/provider*.ts`; UI in `src/components/backup/`.
- **Google Cloud setup** (project `huffle`; full table of client ids and SHA-1s in `RELEASING.md` §3):
  1. Enable the **Google Drive API**.
  2. Consent screen: External, scope `.../auth/drive.appdata` (non-sensitive), authorized domain `nexusdigitallabs.dev`, privacy policy link; **publish to In production**.
  3. One **Web** client (its id is the `webClientId` the app embeds).
  4. One **Android** client **per signing key**, package `app.nexusdigitallabs.huffle`: the **Play app signing key** (`EB:5A:37:…:BE:BC`, required for Play installs), the **upload key** (`82:5F:75:…:77:EE`, sideloaded builds) and optionally the debug key. A client with a retired SHA-1 matches nothing.
  5. Put `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>` in `.env.local` (git-ignored) and rebuild. If the Gradle bundle task reports UP-TO-DATE, run `./gradlew :app:createBundleReleaseJsAndAssets --rerun` so the value is inlined.
- **Gotcha:** until an Android client exists for the key that actually signed the installed app, Google rejects sign-in (`DEVELOPER_ERROR`) and the app shows "Could not connect". Android clients are matched server-side by package + SHA-1, so fixing them needs **no new build**.
- **Verified:** merge, conflict, and REST behaviour are unit-tested. The live round trip was exercised on a device with a signed build: connect → background sync → uninstall → reinstall → "Restore from Google Drive" brought back the same profile, XP, stage, streak, and session history. A silent restore at boot does not fire after a reinstall (Google sign-in state is lost), so the Welcome-screen button is the restore path. **Still to confirm:** sign-in from a Play-delivered install with a non-test account (the Play app signing client was added 2026-10-16).
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

## 9. Release status & open items (2026-10-16)

**Shipped / verified**
- [x] Signed release builds, version 1.0.2 (versionCode 7), R8-minified, orientation unlocked: signature, hygiene and contents verified (`RELEASING.md` §6).
- [x] 89 unit tests pass, and 76 on-device checks passed (on 1.0.1 code 5; rerun `scripts/device_test.py` on the Samsung before uploading code 7) on a Samsung SM-A166P (Android 16), including soft keyboard, large font, rotation, performance and a 400-event monkey run.
- [x] Notification delivery verified on a locked phone (2026-10-14); channel, permission and 6 scheduled alarms verified.
- [x] Privacy policy hosted at `/huffle/privacy-policy/`, linked from Settings and registered in Play Console and on the Google consent screen.
- [x] Play declarations answered (ads No, advertising ID No, data safety, content rating, target audience, health, account creation); see `PLAY_STORE.md`.
- [x] Drive backup/restore round trip verified on a device.
- [x] Dedicated repo pushed (`dilanfdo/huffle`); website pages and widget fix pushed and deployed.

**Open, needs a person**
- [ ] Confirm the Google consent screen reads **In production** and test Drive sign-in from a **Play install** with a non-test account (Play app signing client added 2026-10-16; allow time to propagate).
- [ ] Refresh the Play screenshots: current ones show the old emoji icons and coral card (`store/README.md`).
- [ ] Confirm in Play Console which version codes were actually uploaded; tag the released commit.
- [ ] Observe the 19:00 reminder over several days and after a reboot (Doze / battery optimisation).
- [ ] Move `~/Desktop/Huffle-Keystore-Backup/` into a password manager plus an offline copy.

**Roadmap candidates (rough effort)**
| Item | Effort | Notes |
|---|---|---|
| Gentle mode (hides streak banner and evening streak nudge, neutral reminder copy) | Small, ~½ day | One device-local setting; planner + Home + voice changes |
| Log a forgotten session (Today / Yesterday) | Medium, ~1–2 days | UI is easy; streak, freeze-token, XP-cap and weekly-goal maths must be replayed from dates, so add property tests |
| Weekly recap | Medium | Sessions by day, goal, kind note |
| Life after Thriving | Larger | Milestone gifts (10 / 50 / 100 sessions), idle moods |
| Supporter pack purchase | Medium + Play products | RevenueCat; update the privacy policy and Data safety form first (§8c) |
| iOS build + CloudKit verification | Large | Needs an Apple Developer account; register the `iCloud.app.nexusdigitallabs.huffle` container; test on two devices |
| Brand | Small | Reserve the name in App Store Connect, register `huffle.app`, trademark search, fallback handles |
