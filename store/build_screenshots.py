#!/usr/bin/env python3
"""
Builds Google Play listing screenshots (1080x1920 PNG) from raw emulator captures.

  store/source/<name>.png   raw 1080x2424 captures of the real app
  store/screenshots/phone/NN-*.png        1080x1920  phone
  store/screenshots/tablet-7in/NN-*.png   1200x1920  7-inch tablet
  store/screenshots/tablet-10in/NN-*.png  1600x2560  10-inch tablet

Run:  python3 store/build_screenshots.py
Needs Google Chrome (headless) for rendering.
"""
import base64
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
OUT = ROOT / "screenshots"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# (folder, design width, design height, device scale factor -> output pixels)
TARGETS = [
    ("phone", 1080, 1920, 1.0),
    ("tablet-7in", 1200, 1920, 1.0),
    ("tablet-10in", 1200, 1920, 4 / 3),
]
BASE_W = 1080  # float x-positions below were authored for this width

# Brand palette (src/theme/colors.ts)
CORAL, ORANGE, SAGE, SAGE_DK, INK = "#E07A5F", "#F4A261", "#81B29A", "#5E8F78", "#3D405B"

PANELS = [
    dict(file="01-home", src="home", title="Move a little.<br>Meet your Huffling.",
         sub="One tap to log. They grow with you.",
         bg=(CORAL, ORANGE), tilt=-4, phone_x=0, phone_y=560,
         floats=[("🔥", 70, 905, 560, -12), ("✨", 56, 925, 1250, 10)]),
    dict(file="02-log", src="log", title="Any movement<br>counts.",
         sub="A walk, a stretch, a game of football.",
         bg=(SAGE, SAGE_DK), tilt=4, phone_x=0, phone_y=560,
         floats=[("🚶", 76, 10, 700, -10), ("🏃", 70, 925, 1060, 12)]),
    dict(file="03-evolve", src="evolve", title="Watch them<br>evolve.",
         sub="Celebrate every milestone together.",
         bg=(ORANGE, CORAL), tilt=-3, phone_x=0, phone_y=560,
         floats=[("🎉", 80, 10, 700, -14), ("⭐", 64, 925, 880, 12)], confetti=True),
    dict(file="04-gift", src="gift", title="A little surprise<br>every day.",
         sub="Log a session and open today's gift.",
         bg=(SAGE_DK, SAGE), tilt=3, phone_x=0, phone_y=560,
         floats=[("🎁", 84, 905, 600, 12), ("✨", 56, 10, 1150, -10)], confetti=True),
    dict(file="05-wardrobe", src="wardrobe", title="Make them<br>yours.",
         sub="Unlock hats, scarves and more.",
         bg=(CORAL, ORANGE), tilt=-4, phone_x=0, phone_y=560,
         floats=[("🧣", 76, 10, 760, -12), ("🎩", 70, 925, 1000, 10)]),
    dict(file="06-journey", src="journey", title="See how far<br>you've come.",
         sub="Streaks, XP and every stage of the journey.",
         bg=(ORANGE, CORAL), tilt=4, phone_x=0, phone_y=560,
         floats=[("🔥", 70, 905, 620, 12), ("💪", 64, 10, 1100, -10)]),
    dict(file="07-backup", src="backup", title="Never lose<br>your progress.",
         sub="Back up to your own Google Drive.",
         bg=(SAGE, SAGE_DK), tilt=-3, phone_x=0, phone_y=560,
         floats=[("☁️", 84, 905, 640, 10), ("🔒", 60, 10, 1100, -10)]),
]


def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def confetti_html(W: int) -> str:
    colors = ["#FFFFFF", "#FFE9B5", "#FFD1B8", "#CDE7DA", "#3D405B", "#F4A261"]
    pieces = []
    seed = 7
    for i in range(34):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        x = seed % W
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        y = 430 + seed % 1100
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        rot = seed % 360
        w = 12 + seed % 12
        h = 22 + seed % 14
        c = colors[i % len(colors)]
        pieces.append(
            f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
            f'background:{c};border-radius:4px;opacity:.85;transform:rotate({rot}deg)"></div>'
        )
    return "".join(pieces)


def html_for(p: dict, W: int, H: int) -> str:
    src = SOURCE / f"{p['src']}.png"
    shot = data_uri(src)
    c1, c2 = p["bg"]
    phone_w = 780
    phone_h = int(phone_w * 2424 / 1080)
    shift = W - BASE_W
    floats = "".join(
        f'<div class="tile" style="left:{x + (shift if x > BASE_W / 2 else 0)}px;top:{y}px;'
        f'font-size:{s}px;transform:rotate({r}deg)">{e}</div>'
        for e, s, x, y, r in p["floats"]
    )
    confetti = confetti_html(W) if p.get("confetti") else ""
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap');
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:#000}}
.panel{{position:relative;width:{W}px;height:{H}px;overflow:hidden;
  background:linear-gradient(160deg,{c1} 0%,{c2} 100%);font-family:'Nunito','Helvetica Neue',Arial,sans-serif}}
.blob{{position:absolute;border-radius:50%;background:rgba(255,255,255,.10)}}
.b1{{width:760px;height:760px;left:-260px;top:300px}}
.b2{{width:620px;height:620px;right:-220px;top:-120px;background:rgba(255,255,255,.08)}}
.b3{{width:520px;height:520px;right:-160px;bottom:-140px}}
h1{{position:absolute;left:0;right:0;top:96px;text-align:center;color:#fff;
  font-weight:900;font-size:96px;line-height:1.06;letter-spacing:-1.5px;
  text-shadow:0 4px 18px rgba(0,0,0,.12)}}
.sub{{position:absolute;left:60px;right:60px;top:352px;text-align:center;color:rgba(255,255,255,.92);
  font-weight:700;font-size:44px;line-height:1.25}}
.phone{{position:absolute;left:{(W-phone_w)//2 + p['phone_x']}px;top:{p['phone_y']}px;
  width:{phone_w}px;height:{phone_h}px;border-radius:104px;background:#0e0e12;padding:20px;
  box-shadow:0 40px 90px rgba(0,0,0,.35),0 0 0 3px rgba(255,255,255,.08) inset;
  transform:rotate({p['tilt']}deg);transform-origin:50% 0%}}
.screen{{width:100%;height:100%;border-radius:86px;overflow:hidden;position:relative;background:#fff}}
.screen img{{width:100%;height:100%;display:block}}
.cam{{position:absolute;left:50%;top:34px;width:34px;height:34px;margin-left:-17px;border-radius:50%;background:#0b0b0f}}
.tile{{position:absolute;width:150px;height:150px;border-radius:38px;background:#fff;
  display:flex;align-items:center;justify-content:center;box-shadow:0 20px 44px rgba(0,0,0,.22)}}
</style></head><body>
<div class="panel">
  <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
  {confetti}
  <h1>{p['title']}</h1>
  <div class="sub">{p['sub']}</div>
  <div class="phone"><div class="screen"><img src="{shot}"><div class="cam"></div></div></div>
  {floats}
</div></body></html>"""


def feature_graphic(tmp: Path) -> None:
    icon = data_uri(ROOT.parent / "assets" / "icon.png")
    page = tmp / "feature.html"
    page.write_text(f"""<!doctype html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap');
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1024px;height:500px;overflow:hidden}}
.f{{position:relative;width:1024px;height:500px;overflow:hidden;
 background:linear-gradient(120deg,{CORAL} 0%,{ORANGE} 100%);font-family:'Nunito','Helvetica Neue',Arial,sans-serif}}
.c{{position:absolute;border-radius:50%;background:rgba(255,255,255,.10)}}
h1{{position:absolute;left:64px;top:118px;color:#fff;font-weight:900;font-size:96px;line-height:1.02;letter-spacing:-1px}}
p{{position:absolute;left:66px;top:262px;color:rgba(255,255,255,.95);font-weight:800;font-size:40px;line-height:1.25}}
.i{{position:absolute;right:70px;top:70px;width:360px;height:360px;border-radius:84px;overflow:hidden;
 transform:rotate(6deg);box-shadow:0 30px 60px rgba(0,0,0,.28)}}
.i img{{width:100%;height:100%;display:block}}
</style></head><body><div class="f">
<div class="c" style="width:520px;height:520px;left:-160px;top:200px"></div>
<div class="c" style="width:420px;height:420px;right:-120px;top:-150px"></div>
<h1>Huffle</h1><p>Move a little.<br>Meet your Huffling.</p>
<div class="i"><img src="{icon}"></div></div></body></html>""", encoding="utf-8")
    out = ROOT / "feature-graphic-1024x500.png"
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         "--force-device-scale-factor=1", "--window-size=1024,500",
         "--virtual-time-budget=6000", f"--screenshot={out}", page.as_uri()],
        check=True, capture_output=True,
    )
    print("wrote", out.name)


def render(page: Path, out: Path, w: int, h: int, scale: float) -> None:
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         f"--force-device-scale-factor={scale}", f"--window-size={w},{h}",
         "--virtual-time-budget=6000", f"--screenshot={out}", page.as_uri()],
        check=True, capture_output=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        for folder, w, h, scale in TARGETS:
            target = OUT / folder
            target.mkdir(parents=True, exist_ok=True)
            for p in PANELS:
                if not (SOURCE / f"{p['src']}.png").exists():
                    print("skip (no source):", p["file"])
                    continue
                page = Path(tmp) / f"{folder}-{p['file']}.html"
                page.write_text(html_for(p, w, h), encoding="utf-8")
                render(page, target / f"{p['file']}.png", w, h, scale)
                print("wrote", f"{folder}/{p['file']}.png")
        feature_graphic(Path(tmp))


if __name__ == "__main__":
    main()
