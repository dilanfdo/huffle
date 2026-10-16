# Store graphics

Everything uploaded to the Play listing (copy and declarations are in `docs/PLAY_STORE.md`).

```
store/
  source/                         raw 1080×2424 captures of the real app (home, log, evolve, gift, wardrobe, journey, backup)
  screenshots/phone/              1080×1920 panels, 01-home … 07-backup
  screenshots/tablet-7in/         1200×1920
  screenshots/tablet-10in/        1600×2560
  feature-graphic-1024x500.png    Play feature graphic
  icon-512.png                    Play icon (master: assets/icon.png)
  build_screenshots.py            renders the panels and the feature graphic from source/
```

## Regenerate

```bash
python3 store/build_screenshots.py     # needs Google Chrome (headless) at /Applications/Google Chrome.app
```

The panels (headline, gradient, tilted device frame, floating tiles) are defined in the `PANELS` list at the top of
`build_screenshots.py`; edit a headline there and re-run. All three sizes render from the same captures.

## Refreshing the captures

The current `source/*.png` were taken on an emulator before the SVG line-icon set and the calmer colours, so
**they no longer match the app**. To refresh:

1. Install the current build with a demo profile: a few weeks of history, a 6–7 day streak, a wearable item selected,
   and today's gift unopened. Tidy the status bar with the Android demo mode
   (`adb shell settings put global sysui_demo_allowed 1`, then `am broadcast -a com.android.systemui.demo -e command …`).
2. Capture these screens into `store/source/` with the same names: `home`, `log` (duration and a note filled in),
   `evolve` (after an evolution), `gift` (opened), `wardrobe`, `journey`, `backup` (Settings, signed out).
3. Run the script and review every PNG before uploading.

Captures from a physical phone (1080×2340) work too; the frame is sized for a 1080×2424 source, so a slightly
different aspect ratio will stretch a little. Crop or adjust `phone_h` in `html_for` if needed.
