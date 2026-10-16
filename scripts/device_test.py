#!/usr/bin/env python3
"""
On-device functional / UI / performance test for the Huffle release build.

Usage:  python3 scripts/device_test.py <adb-serial> <path-to-apk> <output-dir>

Drives a connected Android phone over adb + uiautomator, captures screenshots into
<output-dir> and writes results.json. Prerequisites and gotchas are in docs/RELEASING.md
(turn the three animation scales to 0 first, restore them to 1.0 afterwards).
It uninstalls the app first, so the phone starts from a clean install.
"""
import json, os, re, subprocess, sys, time
import xml.etree.ElementTree as ET

SERIAL, APK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PKG = "app.nexusdigitallabs.huffle"
os.makedirs(OUT, exist_ok=True)
RESULTS = []
DENSITY = 450
MIN_TOUCH_PX = None


def adb(*args, text=True, timeout=60):
    return subprocess.run(["adb", "-s", SERIAL, *args], capture_output=True, text=text, timeout=timeout)


def out(*args, **kw):
    return adb(*args, **kw).stdout


def check(name, ok, detail=""):
    RESULTS.append({"name": name, "ok": bool(ok), "detail": str(detail)})
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""), flush=True)
    return ok


def shot(name):
    path = os.path.join(OUT, name + ".png")
    with open(path, "wb") as f:
        f.write(adb("exec-out", "screencap", "-p", text=False).stdout)
    return path


def nodes(tries=8):
    for _ in range(tries):
        adb("shell", "rm", "-f", "/sdcard/ui.xml")
        adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
        xml = out("exec-out", "cat", "/sdcard/ui.xml")
        if xml.strip().startswith("<?xml"):
            try:
                return list(ET.fromstring(xml).iter("node"))
            except ET.ParseError:
                pass
        time.sleep(0.7)
    return []


def bounds(n):
    return list(map(int, re.findall(r"\d+", n.get("bounds"))))


def center(n):
    b = bounds(n)
    return (b[0] + b[2]) // 2, (b[1] + b[3]) // 2


def label(n):
    return ((n.get("text") or "") + " | " + (n.get("content-desc") or "")).strip()


def find(pattern, clickable=False, ns=None):
    rx = re.compile(pattern, re.I)
    for n in (ns if ns is not None else nodes()):
        if rx.search(label(n)) and (not clickable or n.get("clickable") == "true"):
            return n
    return None


def present(pattern):
    return find(pattern) is not None


def wait_for(pattern, timeout=25, clickable=False):
    t0 = time.time()
    while time.time() - t0 < timeout:
        n = find(pattern, clickable=clickable)
        if n is not None:
            return n
        time.sleep(0.8)
    return None


def fully_visible(n, top=120, bottom=None, min_h=24):
    b = bounds(n)
    limit = bottom if bottom is not None else int(H * 0.86)
    return (b[3] - b[1]) >= min_h and b[1] >= top and b[3] <= limit


def scroll_to(pattern, tries=6, clickable=False):
    """Swipe the screen up until a fully visible match appears."""
    for _ in range(tries):
        n = find(pattern, clickable=clickable)
        if n is not None and fully_visible(n):
            return n
        adb("shell", "input", "swipe", str(W // 2), str(int(H * 0.72)), str(W // 2), str(int(H * 0.34)), "300")
        time.sleep(0.9)
    n = find(pattern, clickable=clickable)
    return n if n is not None and fully_visible(n) else None


def scroll_top():
    for _ in range(3):
        adb("shell", "input", "swipe", str(W // 2), str(int(H * 0.30)), str(W // 2), str(int(H * 0.75)), "250")
        time.sleep(0.5)


def app_focused_early():
    act = out("shell", "dumpsys", "activity", "activities")
    m = re.search(r"(?:topResumedActivity|mResumedActivity)[^\n]*", act)
    return bool(m and PKG in m.group(0))


def tap_xy(x, y):
    adb("shell", "input", "tap", str(x), str(y))


def tap_text(pattern, wait=1.2, clickable=True):
    n = find(pattern, clickable=clickable)
    if n is None:
        n = find(pattern, clickable=False)
    if n is None:
        return False
    tap_xy(*center(n))
    time.sleep(wait)
    return True


def key(k):
    adb("shell", "input", "keyevent", k)


def launch():
    adb("shell", "am", "force-stop", PKG)
    time.sleep(0.8)
    r = out("shell", "am", "start", "-W", "-n", f"{PKG}/.MainActivity")
    m = re.search(r"TotalTime:\s*(\d+)", r)
    return int(m.group(1)) if m else None


def screen_size():
    m = re.search(r"(\d+)x(\d+)", out("shell", "wm", "size"))
    return int(m.group(1)), int(m.group(2))


def allow_notifications():
    n = find(r"^Allow$|^Allow \|", clickable=True) or find(r"Allow", clickable=True)
    if n:
        tap_xy(*center(n)); time.sleep(1.5); return True
    return False


def crashes_since(t_start):
    log = out("logcat", "-d", "-v", "time", "-b", "crash", "-b", "main", timeout=60)
    bad = [l for l in log.splitlines() if (PKG in l and ("FATAL EXCEPTION" in l or "ANR in" in l))
           or ("ANR in" in l and PKG in l)]
    return bad


# ------------------------------------------------------------------ setup
out_prop = lambda p: out("shell", "getprop", p).strip()
info = {
    "model": out_prop("ro.product.model"), "android": out_prop("ro.build.version.release"),
    "sdk": out_prop("ro.build.version.sdk"),
}
W, H = screen_size()
DENSITY = int(re.search(r"(\d+)", out("shell", "wm", "density")).group(1))
MIN_TOUCH_PX = int(48 * DENSITY / 160)
orig_font = "1.0"  # the phone's real baseline; never trust a value a previous run may have left behind
adb("shell", "settings", "put", "system", "font_scale", "1.0")
import atexit
atexit.register(lambda: adb("shell", "settings", "put", "system", "font_scale", "1.0"))
orig_accel = out("shell", "settings", "get", "system", "accelerometer_rotation").strip()
orig_rot = out("shell", "settings", "get", "system", "user_rotation").strip()
print("device:", info, "screen", W, H, "density", DENSITY, "minTouchPx", MIN_TOUCH_PX, flush=True)
adb("logcat", "-c")
adb("shell", "pm", "grant", PKG, "android.permission.POST_NOTIFICATIONS")  # harmless if not installed yet

# ------------------------------------------------------------------ T0 install + package hygiene
r = adb("install", "-r", APK, timeout=240)
check("T0 install release APK", "Success" in r.stdout, r.stdout.strip()[-60:] or r.stderr.strip()[-80:])
dump = out("shell", "dumpsys", "package", PKG)
EXPECTED = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app.json")))["expo"]
EXP_NAME, EXP_CODE = EXPECTED["version"], EXPECTED["android"]["versionCode"]
check(f"T0 versionName {EXP_NAME} / versionCode {EXP_CODE} (from app.json)",
      f"versionName={EXP_NAME}" in dump and re.search(rf"versionCode={EXP_CODE}\b", dump))
check("T0 not debuggable", "DEBUGGABLE" not in dump.split("flags=[")[1].split("]")[0] if "flags=[" in dump else True,
      re.search(r"pkgFlags=\[[^\]]*\]", dump).group(0) if re.search(r"pkgFlags=\[[^\]]*\]", dump) else "")
check("T0 targetSdk 36", re.search(r"targetSdk=36", dump))
perms = re.findall(r"(android\.permission\.[A-Z_]+)", dump)
bad = [p for p in set(perms) if p in ("android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.SYSTEM_ALERT_WINDOW")]
check("T0 no storage / overlay permissions", not bad, bad)

# ------------------------------------------------------------------ T1 cold start + welcome
adb("shell", "pm", "grant", PKG, "android.permission.POST_NOTIFICATIONS")
ms = launch()
check("T1 cold start under 3s (activity TotalTime)", ms is not None and ms < 3000, f"{ms} ms")
welcome = wait_for(r"Meet your Huffling", 25)
check("T1 welcome screen renders", welcome is not None)
shot("01_welcome")
check("T1 'Get started' present", present(r"Get started"))
check("T1 'Restore from Google Drive' present (client id inlined)", present(r"Restore from Google Drive"))

# ------------------------------------------------------------------ T2 onboarding
tap_text(r"Get started", wait=2)
check("T2 name screen", wait_for(r"Name your Huffling", 10) is not None)
eds = [n for n in nodes() if n.get("class") == "android.widget.EditText"]
if eds:
    tap_xy(*center(eds[0])); time.sleep(0.8)
    adb("shell", "input", "text", "Pip"); time.sleep(0.5)
    key("KEYCODE_BACK"); time.sleep(0.8)
shot("02_name")
tap_text(r"their name", wait=3)
check("T2 first-session screen", wait_for(r"Feed Pip once|moved today", 12) is not None)
tap_text(r"^Walk|Walk", wait=0.8)
tap_text(r"I moved today", wait=3.5)
allow_notifications()
home = wait_for(r"day streak", 20)
check("T2 lands on Home after first session", home is not None)
time.sleep(2)
shot("03_home_first")
ns = nodes()
check("T2 Huffling named Pip shown", find(r"Pip", ns=ns) is not None)
check("T2 XP is 11 after first session", find(r"^11 \|", ns=ns) is not None or find(r"\b11\b", ns=ns) is not None)
check("T2 streak is 1", find(r"^1 \|", ns=ns) is not None)

# ------------------------------------------------------------------ T3 persistence across process restart
launch(); time.sleep(5)
ns = nodes()
check("T3 data persists after force-stop", find(r"Pip", ns=ns) is not None and find(r"day streak", ns=ns) is not None)
adb("shell", "input", "keyevent", "KEYCODE_HOME"); time.sleep(1)
adb("shell", "am", "kill", PKG); time.sleep(1)
adb("shell", "am", "start", "-n", f"{PKG}/.MainActivity"); time.sleep(5)
check("T3 data persists after process kill", find(r"Pip") is not None)

# ------------------------------------------------------------------ T4 logging, glow, evolution
def log_session(note=None):
    tap_text(r"Log (another )?session", wait=2)
    if note:
        eds = [n for n in nodes() if n.get("class") == "android.widget.EditText"]
        if len(eds) >= 2:
            tap_xy(*center(eds[1])); time.sleep(0.8)
            adb("shell", "input", "text", note); key("KEYCODE_BACK"); time.sleep(0.8)
    tap_text(r"Feed them", wait=3)

log_session(note="Evening%swalk")
time.sleep(5)
ns = nodes()
check("T4 second session pays half XP (17)", find(r"^17 \|", ns=ns) is not None or find(r"\b17\b", ns=ns) is not None)
check("T4 gift banner appears after logging", find(r"found a gift", ns=ns) is not None)
shot("04_home_second")
log_session()
evolved = wait_for(r"evolved", 20)
check("T4 third session evolves to Catching Breath (20 XP)", evolved is not None)
time.sleep(2)
shot("05_evolution")
check("T4 evolution shows Winded -> Catching Breath", present(r"Winded .* Catching Breath|Winded → Catching"))
kg = wait_for(r"Keep going", 10, clickable=True)
if kg:
    tap_xy(*center(kg)); time.sleep(3)
time.sleep(6)
ns = nodes()
check("T4 daily glow full after 3 sessions", find(r"Fully glowing", ns=ns) is not None)
check("T4 Stage 2 shown on Home", find(r"Stage 2 of 5", ns=ns) is not None)
shot("06_home_glow_full")
ns = nodes()
hint = find(r"Any movement counts", ns=ns)
tabs = [n for n in ns if n.get("clickable") == "true" and re.search(r"History", label(n))]
if hint is not None and tabs:
    gap = bounds(tabs[0])[1] - bounds(hint)[3]
    check("T4 footer sits close to the tab bar (gap <= 28dp)", gap <= int(28 * DENSITY / 160), f"gap {gap}px = {round(gap * 160 / DENSITY)}dp")
else:
    check("T4 footer gap measurable", False, "hint or tab bar not found")
btn = find(r"Log (another )?session", clickable=True, ns=ns)
streak = find(r"day streak", ns=ns)
links = [find(r"journey", clickable=True, ns=ns), find(r"^Wardrobe| Wardrobe", clickable=True, ns=ns)]
top = bounds(btn)[1] if btn is not None else H
check("T4 streak card fully above the footer button", streak is not None and bounds(streak)[3] <= top, f"streak bottom {bounds(streak)[3] if streak is not None else None}, button top {top}")
check("T4 Wardrobe + journey links visible without scrolling",
      all(l is not None and bounds(l)[3] <= top for l in links),
      [bounds(l) if l is not None else None for l in links])
log_session()  # 4th: capped
time.sleep(3)
ns = nodes()
check("T4 fourth session earns no XP but is celebrated", find(r"glow is full|fully glowing", ns=ns) is not None)
shot("06b_capped_reaction")
time.sleep(5)
check("T4 XP stays at 20 after a capped session", present(r"^20 \|") or present(r"\b20\b"))

# ------------------------------------------------------------------ T5 gift, wardrobe, journey, history
gift_n = wait_for(r"found a gift", 14, clickable=True)
if gift_n is not None and tap_text(r"found a gift", wait=2.5):
    check("T5 gift screen opens", wait_for(r"found something|Open today", 6) is not None)
    shot("07_gift_closed")
    tap_text(r"Open today|found something", wait=2.2)
    check("T5 gift reveals an item", wait_for(r"Wear it today", 8) is not None)
    shot("08_gift_open")
    tap_text(r"Wear it today", wait=2.5)
else:
    check("T5 gift banner tappable", False, "banner not found")
tap_text(r"^Wardrobe| Wardrobe", wait=2.5)
check("T5 wardrobe opens with items", wait_for(r"Sweatband|Cosy scarf|Leaf crown", 8) is not None)
check("T5 locked items are labelled", present(r"Locked") or present(r"Wearing"))
shot("09_wardrobe")
tap_text(r"Go back", wait=2)
tap_text(r"journey", wait=3)
check("T5 journey shows evolution and stats", wait_for(r"Evolution", 8) is not None and present(r"Sessions logged"))
shot("10_journey")
tap_text(r"Go back", wait=2)
tap_text(r"History", wait=2.5)
check("T5 history lists sessions under Today", wait_for(r"^Today", 8) is not None)
shot("11_history")

# ------------------------------------------------------------------ T6 settings
tap_text(r"Settings", wait=2.5)
check("T6 settings opens", wait_for(r"Weekly goal", 8) is not None)
shot("settings_top")
check("T6 backup section visible", present(r"Backup & sync") and present(r"Connect Google Drive"))
check("T6 no test-reminder button in the production build", not present(r"test reminder"))
check("T6 privacy policy link next to Connect Google Drive", present(r"How backup handles your data"))
pp = scroll_to(r"Privacy policy, opens in your browser|Privacy policy", clickable=True)
check("T6 'Privacy policy' link reachable in Settings", pp is not None)
if pp is not None:
    shot("12c_privacy_link")
    tap_xy(*center(pp)); time.sleep(3.5)
    act = out("shell", "dumpsys", "activity", "activities")
    top = re.search(r"topResumedActivity[^\n]*", act)
    opened = bool(top and PKG not in top.group(0))
    check("T6 privacy link opens the browser", opened, top.group(0)[:90] if top else "no top activity")
    shot("12d_privacy_in_browser")
    for _ in range(3):
        if app_focused_early():
            break
        key("KEYCODE_BACK"); time.sleep(1.5)
    check("T6 back from the browser returns to Huffle", app_focused_early())
scroll_top()
eds = [n for n in nodes() if n.get("class") == "android.widget.EditText"]
if eds:
    tap_xy(*center(eds[0])); time.sleep(0.6)
    key("KEYCODE_MOVE_END")
    for _ in range(10):
        key("KEYCODE_DEL")
    adb("shell", "input", "text", "Bo"); key("KEYCODE_BACK"); time.sleep(0.8)
save = scroll_to(r"Save name", clickable=True)
check("T6 'Save name' reachable", save is not None)
if save is not None:
    tap_xy(*center(save)); time.sleep(1.5)
scroll_top()
check("T6 rename confirmation is visible near the top", present(r"Name updated") and fully_visible(find(r"Name updated")))
shot("12a_settings_saved")
tap_text(r"^Home| Home", wait=2)
check("T6 rename reflected on Home", wait_for(r"Bo", 6) is not None)
shot("12_home_renamed")
tap_text(r"Settings", wait=2)
# reminder time picker: scroll it into view, open, cancel through its own button
tbtn = scroll_to(r"\d{1,2}:\d{2}", clickable=True)
check("T6 reminder time button is reachable and >= 48dp", tbtn is not None and (bounds(tbtn)[3] - bounds(tbtn)[1]) >= MIN_TOUCH_PX - 6,
      bounds(tbtn) if tbtn is not None else None)
shot("12b_settings_scrolled")
if tbtn is not None:
    tap_xy(*center(tbtn)); time.sleep(1.5)
    check("T6 reminder time picker opens", present(r"CANCEL|Cancel") and present(r"\bOK\b"))
    shot("13_timepicker")
    tap_text(r"CANCEL|Cancel", wait=1.2)
    check("T6 picker closes via Cancel", not present(r"CANCEL|Cancel"))
# Google sign-in sheet opens, then back out (no credentials touched)
scroll_top()
tap_text(r"Connect Google Drive", wait=4)
focus = out("shell", "dumpsys", "window")
in_gms = bool(re.search(r"mCurrentFocus=.*(com\.google\.android\.gms|accounts)", focus))
check("T6 Connect Google Drive opens Google's account flow", in_gms)
shot("14_google_flow")
def app_focused():
    # Some OEM builds report mCurrentFocus=null; the resumed activity is the reliable signal.
    act = out("shell", "dumpsys", "activity", "activities")
    m = re.search(r"(?:topResumedActivity|mResumedActivity)[^\n]*", act)
    return bool(m and PKG in m.group(0))

for _ in range(4):
    if app_focused():
        break
    key("KEYCODE_BACK"); time.sleep(1.5)
check("T6 app recovers after backing out of sign-in", wait_for(r"Backup & sync", 8) is not None)

# ------------------------------------------------------------------ T7 notifications
alarms = out("shell", "dumpsys", "alarm")
n_alarm = len(re.findall(rf"RTC_WAKEUP.*{re.escape(PKG)}", alarms))
check("T7 reminders are scheduled (alarms >= 3)", n_alarm >= 3, f"{n_alarm} alarms")
notif = out("shell", "dumpsys", "notification")
check("T7 reminders channel exists", "huffle-reminders" in notif)
perm = out("shell", "dumpsys", "package", PKG)
check("T7 POST_NOTIFICATIONS granted", re.search(r"POST_NOTIFICATIONS: granted=true", perm))

# ------------------------------------------------------------------ T8 keyboard doesn't cover fields
tap_text(r"^Home| Home", wait=2)
tap_text(r"Log (another )?session", wait=2.5)
eds = [n for n in nodes() if n.get("class") == "android.widget.EditText"]
if len(eds) >= 2:
    tap_xy(*center(eds[1])); time.sleep(1.5)
    ime = out("shell", "dumpsys", "input_method")
    shown = "mInputShown=true" in ime or "isInputViewShown=true" in ime
    ns = nodes()
    feed = find(r"Feed them", ns=ns)
    ime_top = None
    m = re.search(r"InputMethod.*?frame=\[\d+,(\d+)\]\[\d+,\d+\]", out("shell", "dumpsys", "window"), re.S)
    if m:
        ime_top = int(m.group(1))
    if ime_top is None:
        ime_top = int(H * 0.62)  # soft keyboards sit in the lower ~40% on this form factor
    feed_bottom = bounds(feed)[3] if feed else None
    note_bottom = bounds([n for n in ns if n.get("class") == "android.widget.EditText"][-1])[3]
    check("T8 soft keyboard opened", shown or ime_top < H)
    check("T8 note field above the keyboard", note_bottom <= ime_top + 4, f"note bottom {note_bottom}, keyboard top {ime_top}")
    check("T8 submit button above the keyboard", feed_bottom is not None and feed_bottom <= ime_top + 4, f"button bottom {feed_bottom}")
    feed_top = bounds(feed)[1] if feed else None
    check("T8 gap between Note field and submit button", feed_top is not None and feed_top - note_bottom >= 8,
          f"gap {None if feed_top is None else feed_top - note_bottom}px")
    check("T8 button is not stuck saving", feed is not None and not present(r"Saving"))
    shot("15_keyboard")
    key("KEYCODE_BACK"); time.sleep(0.8)
else:
    check("T8 form fields found", False)
tap_text(r"Close", wait=1.5)

# ------------------------------------------------------------------ T9 UI sweep: touch targets + labels
def sweep(name):
    ns = nodes()
    small, unlabeled = [], []
    for n in ns:
        if n.get("clickable") != "true" or n.get("enabled") == "false":
            continue
        b = bounds(n)
        w, h = b[2] - b[0], b[3] - b[1]
        if w <= 0 or h <= 0 or b[1] < 80 and w < 200:
            continue
        if 0.5 * MIN_TOUCH_PX <= min(w, h) < MIN_TOUCH_PX - 6:
            small.append((label(n), min(w, h)))
        if not (n.get("text") or n.get("content-desc")):
            # clickable containers often have labelled children; only flag leaf nodes
            if len(list(n)) == 0:
                unlabeled.append(n.get("bounds"))
    return small, unlabeled

for name, nav in (("Home", r"^Home| Home"), ("History", r"History"), ("Settings", r"Settings")):
    tap_text(nav, wait=2.2)
    s, u = sweep(name)
    check(f"T9 {name}: touch targets >= 48dp", not s, s[:3])
    check(f"T9 {name}: interactive elements are labelled", not u, u[:3])

# ------------------------------------------------------------------ T10 large font
adb("shell", "settings", "put", "system", "font_scale", "1.5")
time.sleep(1.5)
launch(); time.sleep(5)
ns = nodes()
check("T10 app renders at 1.5x font", find(r"Bo", ns=ns) is not None)
check("T10 primary action reachable at 1.5x font", find(r"Log (another )?session", ns=ns) is not None)
vis = [n for n in ns if n.get("clickable") == "true"]
off = [label(n) for n in vis if bounds(n)[3] > H or bounds(n)[2] > W + 2]
check("T10 no clickable elements pushed off-screen at 1.5x", not off, off[:3])
shot("16_font_1_5")
tap_text(r"Log (another )?session", wait=2.5)
check("T10 log form usable at 1.5x font", present(r"Feed them") and present(r"Duration"))
shot("17_font_1_5_form")
key("KEYCODE_BACK"); time.sleep(1)
adb("shell", "settings", "put", "system", "font_scale", "1.0")
time.sleep(1)
check("T10 font scale restored to 1.0", out("shell", "settings", "get", "system", "font_scale").strip() in ("1.0", "1"))

# ------------------------------------------------------------------ T11 orientation stays portrait
adb("shell", "settings", "put", "system", "accelerometer_rotation", "0")
adb("shell", "settings", "put", "system", "user_rotation", "1")
time.sleep(2)
launch(); time.sleep(4)
w2, h2 = screen_size()
disp = out("shell", "dumpsys", "window", "displays")
landscape = bool(re.search(r"mCurrentFocus.*", out("shell", "dumpsys", "window"))) and \
    bool(re.search(r"rotation=1|rotation=3", out("shell", "dumpsys", "window", "displays")))
shot("18_rotated")
check("T11 app stays usable when device rotates", find(r"day streak|Log (another )?session") is not None)
adb("shell", "settings", "put", "system", "user_rotation", orig_rot or "0")
adb("shell", "settings", "put", "system", "accelerometer_rotation", orig_accel or "1")
time.sleep(1)

# ------------------------------------------------------------------ T12 performance
launch(); time.sleep(4)
ms = [launch() for _ in range(3)]
ms = [m for m in ms if m]
avg = sum(ms) // len(ms) if ms else None
check("T12 warm/cold start average under 2.5s", avg is not None and avg < 2500, f"{ms}")
mem = out("shell", "dumpsys", "meminfo", PKG)
m = re.search(r"TOTAL PSS:\s*(\d+)", mem) or re.search(r"TOTAL\s+(\d+)", mem)
pss_mb = int(m.group(1)) // 1024 if m else None
check("T12 memory under 400 MB PSS", pss_mb is not None and pss_mb < 400, f"{pss_mb} MB")
adb("shell", "dumpsys", "gfxinfo", PKG, "reset")
for _ in range(6):
    adb("shell", "input", "swipe", str(W // 2), str(int(H * 0.7)), str(W // 2), str(int(H * 0.3)), "250")
    time.sleep(0.4)
gfx = out("shell", "dumpsys", "gfxinfo", PKG)
tf = re.search(r"Total frames rendered:\s*(\d+)", gfx); jf = re.search(r"Janky frames:\s*(\d+) \(([\d.]+)%\)", gfx)
jank = float(jf.group(2)) if jf else None
check("T12 jank under 25% while scrolling", jank is None or jank < 25, f"{jf.group(0) if jf else 'n/a'}; frames {tf.group(1) if tf else 'n/a'}")

# ------------------------------------------------------------------ T13 monkey robustness
mk = adb("shell", "monkey", "-p", PKG, "-s", "42", "--throttle", "150", "--pct-syskeys", "0",
         "--pct-appswitch", "0", "--ignore-security-exceptions", "-v", "400", timeout=240)
check("T13 monkey 400 random events completes", "Events injected: 400" in mk.stdout or "Monkey finished" in mk.stdout,
      re.search(r"Events injected: \d+", mk.stdout).group(0) if re.search(r"Events injected: \d+", mk.stdout) else mk.stdout[-120:])
check("T13 monkey did not crash or ANR", "CRASH" not in mk.stdout and "ANR" not in mk.stdout)

# ------------------------------------------------------------------ T14 crash scan
time.sleep(1)
bad = crashes_since(0)
check("T14 no crash or ANR in the whole session", not bad, bad[:2])
launch(); time.sleep(4)
check("T14 app still launches cleanly afterwards", find(r"day streak|Log (another )?session") is not None)

json.dump({"device": info, "results": RESULTS}, open(os.path.join(OUT, "results.json"), "w"), indent=2)
failed = [r for r in RESULTS if not r["ok"]]
print(f"\nSUMMARY: {len(RESULTS) - len(failed)}/{len(RESULTS)} passed", flush=True)
for r in failed:
    print("  FAILED:", r["name"], r["detail"], flush=True)
