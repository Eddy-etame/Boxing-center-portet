import time
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
errors = []

def shot(pg, name):
    pg.screenshot(path=f"{OUT}\\v_{name}.png"); print("shot", name)

def to(pg, sel, block="center"):
    pg.eval_on_selector(sel, f"el => el.scrollIntoView({{block:'{block}'}})")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=SHELL)
    pg = b.new_page(viewport={"width":1440,"height":820})
    pg.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_selector(".gate__enter", timeout=8000); pg.click(".gate__enter")
    time.sleep(2.2); shot(pg, "hero")

    # disciplines reel
    to(pg, ".reel"); time.sleep(1.4); shot(pg, "reel")
    # champions team (ember portrait) — wait for sampling
    to(pg, "#team-champions"); time.sleep(3.0); shot(pg, "team_champions")
    # showcase
    to(pg, ".showcase"); time.sleep(1.5); shot(pg, "showcase")
    # coachs team
    to(pg, "#team-coachs"); time.sleep(3.0); shot(pg, "team_coachs")
    # portal mid-dive (round 4)
    pg.evaluate("""() => { const ps=document.querySelectorAll('.portal'); const el=ps[1]||ps[0];
      window.scrollTo(0, el.offsetTop + 0.5*(el.offsetHeight - innerHeight)); }""")
    time.sleep(1.6); shot(pg, "portal")
    # community
    to(pg, "#community"); time.sleep(1.0); shot(pg, "community")
    pg.close()

    # mobile
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errors.append(f"[mobile pageerror] {e}"))
    m.goto(URL, wait_until="networkidle")
    try: m.wait_for_selector(".gate__enter", timeout=8000); m.click(".gate__enter")
    except Exception: pass
    time.sleep(2.0); shot(m, "m_hero")
    to(m, "#team-champions"); time.sleep(3.0); shot(m, "m_team")
    to(m, ".reel"); time.sleep(1.2); shot(m, "m_reel")
    to(m, "#community"); time.sleep(1.0); shot(m, "m_community")
    m.close(); b.close()

print("\n=== CONSOLE ERRORS ===")
print("none" if not errors else "\n".join(errors))
