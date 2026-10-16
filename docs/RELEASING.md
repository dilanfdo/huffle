# Releasing Huffle

Runbook for building, verifying and shipping an Android release. Last verified end to end on
**2026-10-16** with version **1.0.2 (versionCode 6)**.

## 1. Where things live

| Thing | Location |
|---|---|
| App code | `git@github.com-personal:dilanfdo/huffle.git`, branch `main` (SSH alias `github.com-personal`, same as Odova and PDFly) |
| Product page + privacy policy | `NexusDigitalLabs/nexusdigitallabs.github.io` (Vercel): `src/app/huffle/page.tsx`, `src/app/huffle/privacy-policy/page.tsx`, `public/huffle/`, plus entries in `src/lib/og-cards.ts` and `src/lib/sitemap.ts` |
| Hosted URLs | https://nexusdigitallabs.dev/huffle/ and https://nexusdigitallabs.dev/huffle/privacy-policy/ |
| Site promos | The site-wide "Add to Home Screen" banner and "Buy me a coffee" button are hidden on `/huffle/*` by `src/lib/promo-paths.ts` in the website repo |
| Release files (local) | `~/Desktop/Huffle-Releases/<version>-code<N>/` (AAB, APK, `SHA256SUMS.txt`, `release-notes.txt`). Older folders are renamed `SUPERSEDED-…` |
| Upload keystore | `~/.huffle-signing/huffle-upload-key.jks` + `keystore.properties` (outside the repo) |
| Keystore backup | `~/Desktop/Huffle-Keystore-Backup/` (the `.jks` and a details file with the passwords). **Move it to a password manager and an offline copy.** |

## 2. Signing keys and fingerprints

Play App Signing is on ("Releases signed by Play"). Three keys matter:

| Key | SHA-1 | Used for |
|---|---|---|
| **Upload key** (alias `huffle-upload`, PKCS12, RSA 2048, valid 2026-10-14 → 9999-12-31) | `82:5F:75:79:0F:39:6C:13:7B:42:89:C6:F0:05:C5:AC:F2:3C:77:EE` | Signs the AAB you upload; signs sideloaded APKs |
| **Play app signing key** | `EB:5A:37:1A:E0:E4:97:CE:CF:F0:E6:93:83:D0:90:1B:B4:5F:BE:BC` | What users actually receive from Google Play |
| Debug keystore (`android/app/debug.keystore`) | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` | Development builds |

Upload key SHA-256: `EE:9A:42:7E:66:48:5C:49:B9:18:C9:57:EA:6C:C1:84:5F:B9:C0:66:F0:B6:6B:53:B6:EB:75:FC:FC:78:69:08`.

**Retired key:** an earlier upload keystore (SHA-1 `F1:F6:5A:C0:19:9F:9E:11:34:93:5D:20:D7:73:B6:05:B4:5E:1C:E6`)
is archived in `~/.huffle-signing/previous/`. It was never uploaded to Play. A Google Cloud Android client
that still carries this SHA-1 matches nothing real.

If the upload key is ever lost, request an upload-key reset in Play Console (possible because Play App
Signing is enabled). Never commit the keystore, `keystore.properties` or `.env*`.

## 3. Google Cloud (Drive backup sign-in)

Project **`huffle`** (project number `445305086813`). Drive API enabled; scope
`https://www.googleapis.com/auth/drive.appdata` (non-sensitive). Consent screen: External, authorized
domain `nexusdigitallabs.dev`, privacy policy link `https://nexusdigitallabs.dev/huffle/privacy-policy/`.

| OAuth client | Type | Client ID | SHA-1 / purpose |
|---|---|---|---|
| Huffle Web | Web | `445305086813-1kvcjna532pbl6o1fk97kopin5i4flta.apps.googleusercontent.com` | The **only** id the app embeds (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) |
| Huffle Android (play) | Android | `445305086813-gntf3ebpaa2l54uvdhlo3946n0aitcp6.apps.googleusercontent.com` | `EB:5A:37:…:BE:BC`, Play-delivered installs |
| Huffle Android (upload) | Android | `445305086813-igd662m1klihoj46763air6uhrhap25l.apps.googleusercontent.com` | `82:5F:75:…:77:EE`, sideloaded release APKs |
| Huffle Android (old) | Android | `445305086813-h3i6svcqur9jc8klkjkr0jhhpucdgv31.apps.googleusercontent.com` | `F1:F6:5A:…:1C:E6`, retired key; safe to delete |

Android clients are matched by Google on package name + signing SHA-1, so **adding or changing them needs
no new build or Play upload**. Each Android client holds one SHA-1, so each key needs its own client.
Changes can take minutes to hours to apply.

Symptoms when it is wrong:

| Symptom | Cause |
|---|---|
| Sign-in fails instantly (error 10, `DEVELOPER_ERROR`); app shows "Could not connect" | The installed build's signing SHA-1 or the package name has no matching Android client |
| "Access blocked" / "only for test users" | Consent screen still in **Testing**; publish it (Audience → In production) |
| Signs in, then "Google Drive did not accept the request" | Drive API not enabled in the project |
| Works sideloaded, fails from Play | Only the upload key is registered, not the Play app signing key |

**Status to re-verify after any change:** the Play app signing client was created on 2026-10-16. Confirm
the consent screen reads **In production** and test a Play install with an account that is not a test user.

### 3a. Drive backup: what is verified

Verified on 2026-10-16 with the signed 1.0.2 (6) release APK (upload key) on an Android emulator with Google
Play services and a real Google account: account picker opens (no `DEVELOPER_ERROR`), sign-in succeeds,
"Restore from Google Drive" on a fresh install brings back the profile, XP, stage, streak, week, wardrobe
choice and gift state; Settings reports "Last synced just now". Run it again after any change to the
clients: uninstall, install the release APK, Welcome screen -> Restore from Google Drive.

**Not verifiable from this repo:** a Play-delivered install (Play app signing client), and a non-test
Google account (consent screen must read In production). Check both after the release is live.

## 4. Version rules

- `app.json` → `expo.version` (user-visible) and `expo.android.versionCode` (integer).
- **`versionCode` must increase for every upload**, even for a rebuild of the same version. It never needs
  to be consecutive.
- A new binary with an unchanged versionCode that you have already handed out is confusing. Bump it.

## 5. Build

```bash
# from the repo root
npx tsc --noEmit && npm test

pkill -f GradleDaemon 2>/dev/null          # a stale daemon can make the clean prebuild fail (ENOTEMPTY)
rm -rf android
npx expo prebuild --platform android --no-install
(cd android && ./gradlew bundleRelease assembleRelease)
```

Outputs: `android/app/build/outputs/bundle/release/app-release.aab` (upload this) and
`android/app/build/outputs/apk/release/app-release.apk` (sideload/test). `android/` is generated and
git-ignored. `plugins/withReleaseSigning.js` reads the upload key from `~/.huffle-signing/` (or
`$HUFFLE_SIGNING_FILE`); without it the release falls back to the debug key and is **not** uploadable.

**Gotcha, env values are only inlined when the JS bundle task re-runs.** If you change
`.env.local` (for example the Google web client id) and Gradle reports the bundle task `UP-TO-DATE`:

```bash
(cd android && ./gradlew :app:createBundleReleaseJsAndAssets --rerun)
```

## 6. Verify the artifact (before touching Play Console)

```bash
BT=$ANDROID_HOME/build-tools/37.0.0
APK=android/app/build/outputs/apk/release/app-release.apk
AAB=android/app/build/outputs/bundle/release/app-release.aab
$BT/aapt2 dump badging $APK | grep -E "^package|application-debuggable"   # versionCode/Name; no debuggable line
keytool -printcert -jarfile $AAB | grep SHA1                                # must be the upload key SHA-1 above
$BT/apksigner verify $APK && echo ok
$BT/aapt2 dump permissions $APK | grep -iE "SYSTEM_ALERT_WINDOW|EXTERNAL_STORAGE|AD_ID"   # must print nothing
unzip -p $APK assets/index.android.bundle | grep -a -c "This is a test reminder"            # must be 0 (dev-only code)
unzip -p $APK assets/index.android.bundle | grep -a -c "445305086813-1kvcjna532pbl6o1fk97kopin5i4flta"  # must be 1
```

`AD_ID` must be absent: the Play advertising-ID declaration is answered **No** because the app has no
ad/analytics/attribution SDKs.

## 7. Test gates

1. **Typecheck and unit tests:** `npx tsc --noEmit` and `npm test` (89 tests: streak/XP/evolution/mood maths,
   notification planner, Drive merge + preferences + REST client, cosmetics, links).
2. **On-device suite:** `scripts/device_test.py`, 76 checks in sections T0–T14 (clean install, version from
   `app.json`, cold start, onboarding, persistence across kill, logging/glow cap/evolution, gift,
   wardrobe, journey, history, settings, privacy link opens the browser and returns, notification
   channel/permission/alarms, soft keyboard, 48dp touch targets, large font, rotation, performance,
   a 400-event monkey run, crash scan).

```bash
D=<adb serial>                       # adb devices
for k in window_animation_scale transition_animation_scale animator_duration_scale; do adb -s $D shell settings put global $k 0; done
python3 scripts/device_test.py $D android/app/build/outputs/apk/release/app-release.apk /tmp/huffle-run
for k in window_animation_scale transition_animation_scale animator_duration_scale; do adb -s $D shell settings put global $k 1.0; done
adb -s $D shell settings put system font_scale 1.0
```

Last result: **76 / 76** on a Samsung SM-A166P, Android 16. Read the screenshots in the output folder, not
just the pass count: several real bugs (cramped footer, off-screen confirmations, touch targets) were found
by looking at captures.

Harness gotchas:
- uiautomator never goes idle while looping animations run, so set the animation scales to 0 first and
  **restore them to 1.0 afterwards** (the harness restores the font scale itself).
- Samsung reports `mCurrentFocus=null`; use `topResumedActivity` to know whether the app is in front.
- An `adb` key event takes the display out of touch mode, so the first focusable view shows a focus ring
  until the next touch. That is not an app bug.
- The Vercel bot checkpoint can block automated requests to the website after heavy polling; it does not
  affect real visitors.

## 8. Notifications

Reminders are local only (see `docs/PROJECT.md` §3.4). Delivery was verified on a physical phone on
2026-10-14 with the screen locked: notification arrived in about 10 seconds on channel `huffle-reminders`
with the Huffle icon and tapping it opened the app.

A **"Send a test reminder"** button exists **only in development builds** (`src/screens/settings/DevTestReminder.tsx`
and `src/notifications/testReminder.ts`, required behind `__DEV__`), so release bundles contain none of it.
Not yet verified over time: delivery after a reboot, and the daily 19:00 nudge across several days
(Doze / battery optimisation). The planner skips a day's reminders once a session is logged, so test on a day
you have not logged yet.

## 9. Play Console

Copy, declarations and the answers given are in `docs/PLAY_STORE.md`. Release steps:

1. Upload the verified `.aab` (Test and release → Production, or Internal testing first).
2. Paste the "What's new" text from the release folder's `release-notes.txt`.
3. If a **privacy policy URL "page not found"** issue appears while the page is live, it is a stale crawl:
   tick "I have fixed issues with my privacy policy page" and save, or re-save the URL in
   App content → Privacy policy.
4. The **advertising ID** declaration is **No**.
5. Send for review.

## 10. After release

- Install from Play (not sideloaded) and test Settings → Connect Google Drive with a non-test account.
- Confirm Android vitals and pre-launch reports in Play Console.
- Tag the commit and push: `git tag v1.0.2-code6 && git push origin main --tags`.

## 11. Release history

| Version (code) | State | Notes |
|---|---|---|
| 1.0.2 (**6**) | **Current candidate** | Drive backup now includes wardrobe choice, gift state and supporter flag; restore reschedules reminders; an older app can no longer overwrite a newer-format backup. Verified on an emulator with real Google sign-in (see §3a). Files in `~/Desktop/Huffle-Releases/1.0.2-code6/` |
| 1.0.1 (5) | Previous candidate | In-app privacy policy link (Settings + next to Connect Google Drive); calmer green/amber colours replace coral on positive moments; modern SVG line icons; dev-only test reminder |
| 1.0.1 (4) | Superseded | Test reminder made dev-only |
| 1.0.1 (3) | Superseded | Had a user-visible "Send a test reminder" button |
| 1.0.1 (2) | Superseded | Icon set and UI polish |
| 1.0.0 (1) | Superseded | First signed release build |

Confirm in Play Console which version codes were actually uploaded; codes 1–4 were local builds.
