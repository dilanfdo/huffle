# Google Play listing and declarations

Source of truth for what is entered in Play Console, so it can be re-entered, audited or changed without
guessing. Graphics are in `store/` (see `store/README.md`). Status of the listing: published and in review
(owner-reported, October 2026).

## Identity

| Field | Value |
|---|---|
| App name (30 max) | `Huffle: Gentle Movement` |
| Package name | `app.nexusdigitallabs.huffle` (permanent once uploaded) |
| Default language | English (United States) |
| App or game | **App** |
| Free or paid | **Free** (a free app can never become paid; in-app purchases remain possible) |
| Category | Health & Fitness |
| Tags (max 5) | Activity tracker, Health & fitness, Workout, Self-help, Lifestyle |
| Contact email | hello@nexusdigitallabs.dev |
| Website | https://nexusdigitallabs.dev/huffle/ (or the studio home page https://nexusdigitallabs.dev/) |
| Privacy policy URL | https://nexusdigitallabs.dev/huffle/privacy-policy/ |

## Short description (80 characters)

```
A gentle movement habit game: log a walk, grow your Huffling, never feel guilty.
```

## Full description

```
Huffle is a gentle movement habit game for people who want to move a little more without the pressure.

Log any movement — a walk, a stretch, a game of football, a gym session — in a single tap. Your Huffling, a small creature, grows with you: from winded and wobbly to steady, strong and thriving.

WHY YOU'LL LIKE IT
• One tap to log. Duration and notes are optional.
• Watch your Huffling evolve through five stages.
• Kind streaks with freeze tokens that protect a rough day.
• A daily gift and a wardrobe of items to unlock by showing up.
• Gentle reminders, never more than two a day, that fade out if you're away.
• Welcome-back moments that celebrate your return, not guilt you for leaving.

PRIVATE BY DESIGN
• No account, no ads, no tracking.
• Everything stays on your device.
• Optional backup to your own Google Drive, so a new phone never costs you your progress.

Huffle isn't a workout planner. It has one job: to make it easy and kind to show up again tomorrow.
```

Avoid health claims (no "lose weight", "improve fitness", medical language).

## Graphics

| Asset | File | Spec |
|---|---|---|
| App icon | `store/icon-512.png` (master `assets/icon.png`) | 512×512 PNG |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024×500 |
| Phone screenshots | `store/screenshots/phone/01…07` | 1080×1920 |
| 7-inch tablet | `store/screenshots/tablet-7in/01…07` | 1200×1920 |
| 10-inch tablet | `store/screenshots/tablet-10in/01…07` | 1600×2560 |

**The screenshots predate the SVG icon set and the calmer colours** (they show emoji tab icons and a coral
card). Regenerate them from a current build before the next listing refresh (`store/README.md`).

## App content declarations (answers given)

| Item | Answer | Why / evidence |
|---|---|---|
| Sign-in details (restricted access) | **No** | Nothing is behind a login; Google sign-in is optional and only for backup |
| Ads | **No** | No ad SDKs |
| **Advertising ID** | **No** | `AD_ID` permission absent from the shipped manifest; no ad/analytics/attribution SDKs (checked) |
| Content rating | Category **All Other App Types**; every questionnaire answer **No**; expected Everyone / PEGI 3 | No violence, sexual content, profanity, drugs, gambling, user-to-user interaction, location sharing, or digital purchases |
| Target audience | **16–17 and 18+** only | Keeps the app out of the Families policy; policy states it is not directed at under-13s. "Appeals to children": No |
| Government apps | No | |
| Financial features | None | |
| Health features | **Activity and fitness** only | Not a medical device; no medical claims. Do not tick Medical, Sleep or Stress options |
| Account creation | "My app does not allow users to create an account" | Login with outside accounts: **Yes** → **Other**: "Users may optionally sign in with their existing Google account only to back up and restore data to their own Google Drive. Huffle does not create or manage accounts." |
| Data deletion request | **Yes**, URL = the privacy policy | Uninstall/clear storage removes device data; Drive backup is removable from the user's Google account |

### Data safety form

- Collects or shares required data types: **Yes** (only because of the optional Drive backup).
- All collected data encrypted in transit: **Yes**.
- Data types: **Health and fitness → Fitness info**, and **App activity → Other user-generated content**
  (session notes). Nothing else (not Personal info: the connected email is shown on the device but never sent to the developer).
- For each: **collected, not shared**; **not processed ephemerally**; **users can choose whether it is collected**
  (optional); purpose **App functionality** only.
- Security practices: deletion can be requested (policy URL); not a Families-policy app; no independent security review.

## Release notes template (en-US, 500 max)

```
<en-US>
A fresh look for your daily check-in.

• New, modern icons throughout the app
• Calmer, friendlier colours on Home
• Cleaner Home, History and Settings screens
• Easier to tap on smaller screens
• Privacy policy link in Settings
</en-US>
```

The notes for each release are saved next to its files in `~/Desktop/Huffle-Releases/<version>-code<N>/release-notes.txt`.

## Issues met and how they were resolved

| Issue | Resolution |
|---|---|
| Review blocked: "Privacy policy page returns a page not found error" while the page was live | Stale crawl from before the page was deployed. Ticked "I have fixed issues with my privacy policy page" and saved |
| Review blocked: "Incomplete advertising ID declaration" | Answered **No** (verified) |
| Policy-page rule "accessible from within your app" | Added a Privacy policy link in Settings (About, and beside Connect Google Drive) from versionCode 5 |
| Drive sign-in would fail for Play installs | Google Cloud had only an Android client for a retired SHA-1. Added clients for the Play app signing key and the current upload key (see `docs/RELEASING.md` §3) |
