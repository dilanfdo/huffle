# Huffle

A gentle movement-habit game for Android (iOS built, not yet verified). You log a walk, a stretch or a
workout in one tap, and a small creature called a **Huffling** grows with you — with streaks that forgive,
a daily gift, and no guilt. No account, no ads, no tracking; data stays on the device, with an optional
backup to the user's own Google Drive.

- **Package / bundle id:** `app.nexusdigitallabs.huffle`
- **Stack:** Expo SDK 57 (React Native 0.86, TypeScript), expo-sqlite, Zustand, react-native-svg,
  expo-notifications, Google Sign-In + Drive `appDataFolder` (Android), CloudKit (iOS)
- **Repo:** `dilanfdo/huffle` (app code only; the product page and privacy policy live in the website repo)

## Run it

```bash
npm install
cp .env.example .env.local   # or create it: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>
npx expo run:android         # dev build (needs the Android SDK)
npx expo start --dev-client --port 8082
```

`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is the Google OAuth **web** client id. Without it the Drive backup UI
stays hidden and everything else works. See `docs/PROJECT.md` §8b.

## Test it

```bash
npx tsc --noEmit    # typecheck
npm test            # unit tests (vitest)
python3 scripts/device_test.py <adb-serial> android/app/build/outputs/apk/release/app-release.apk /tmp/huffle-run
```

The device suite installs the release APK on a connected phone and runs the full functional, UI and
performance checks. Prerequisites and gotchas: `docs/RELEASING.md`.

## Documentation

| Doc | What it covers |
|---|---|
| `docs/PROJECT.md` | Product, architecture, decisions, current status and roadmap |
| `docs/RELEASING.md` | How to build, sign, verify and ship a release; keys, accounts and testing gates |
| `docs/PLAY_STORE.md` | Play Console listing copy, declarations and the answers given |
| `docs/privacy-policy.md` | Mirror of the hosted privacy policy |
| `store/README.md` | Play Store graphics and how to regenerate them |

## Secrets

Never commit: the upload keystore, `keystore.properties`, `.env*`. The upload key lives in
`~/.huffle-signing/` (outside the repo) and is wired in by `plugins/withReleaseSigning.js`.
