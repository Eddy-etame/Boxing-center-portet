import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
errors = []

def shot(pg, n): pg.screenshot(path=f"{OUT}\\v_{n}.png"); print("shot", n)

def member(pg, sel, frac):
    pg.evaluate(f"""(f) => {{ const el=document.querySelector('{sel}');
      const y = el.offsetTop + f*(el.offsetHeight - innerHeight); window.scrollTo(0,y); }}""", frac)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=SHELL)
    pg = b.new_page(viewport={"width":1440,"height":820})
    pg.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type=="error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))

    # HOME — champions forge (boxers, full body)
    pg.goto("http://localhost:4173/", wait_until="networkidle")
    pg.wait_for_selector(".gate__enter", timeout=8000); pg.click(".gate__enter"); time.sleep(1.5)
    member(pg, "#forge-champions", 0.167); time.sleep(3.4); shot(pg, "forge_b0")  # member centres
    member(pg, "#forge-champions", 0.5);   time.sleep(1.8); shot(pg, "forge_b1")
    member(pg, "#forge-champions", 0.833); time.sleep(1.8); shot(pg, "forge_b2")
    # colour toggle -> photographic
    try: pg.click("#forge-champions .forge__toggle"); time.sleep(1.2); shot(pg, "forge_b_photo")
    except Exception as e: print("toggle skip", e)

    # COACHS page — coaches forge (faces)
    pg.goto("http://localhost:4173/coachs/", wait_until="networkidle"); time.sleep(0.6)
    try:
        if pg.query_selector(".gate__enter"): pg.click(".gate__enter")
    except Exception: pass
    time.sleep(1.0)
    member(pg, "#forge-coachs", 0.125); time.sleep(3.4); shot(pg, "forge_c0")
    member(pg, "#forge-coachs", 0.625); time.sleep(1.8); shot(pg, "forge_c1")

    # GALERIE page
    pg.goto("http://localhost:4173/galerie/", wait_until="networkidle"); time.sleep(0.6)
    try:
        if pg.query_selector(".gate__enter"): pg.click(".gate__enter")
    except Exception: pass
    time.sleep(1.0)
    pg.eval_on_selector("#gallery", "el => el.scrollIntoView({block:'start'})"); time.sleep(1.0); shot(pg, "galerie")
    pg.eval_on_selector("#community", "el => el.scrollIntoView({block:'center'})"); time.sleep(0.8); shot(pg, "galerie_community")
    pg.close()

    # MOBILE
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errors.append(f"[mobile pageerror] {e}"))
    m.goto("http://localhost:4173/", wait_until="networkidle")
    try: m.click(".gate__enter")
    except Exception: pass
    time.sleep(1.2)
    member(m, "#forge-champions", 0.35); time.sleep(3.0); shot(m, "m_forge")
    m.close(); b.close()

print("\n=== CONSOLE ERRORS ===")
print("none" if not errors else "\n".join(errors))
