import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
errors = []
def shot(pg, n): pg.screenshot(path=f"{OUT}\\s_{n}.png"); print("shot", n)

routes = ["", "activites/", "salles/", "coachs/", "galerie/", "plannings/", "tarifs/", "contact/"]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=SHELL)
    pg = b.new_page(viewport={"width":1440,"height":820})
    pg.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type=="error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))

    pg.goto("http://localhost:4173/", wait_until="domcontentloaded")
    time.sleep(0.25); shot(pg, "gate_loading")
    pg.wait_for_selector(".gate--ready", timeout=10000); time.sleep(0.2); shot(pg, "gate_ready")
    pg.click(".gate__enter"); time.sleep(2.0); shot(pg, "home")

    for r in routes[1:]:
        pg.goto("http://localhost:4173/" + r, wait_until="networkidle"); time.sleep(1.2)
        shot(pg, r.strip("/") or "home")
    pg.close()

    # mobile: menu (verify external links) + home
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errors.append(f"[mobile pageerror] {e}"))
    m.goto("http://localhost:4173/", wait_until="domcontentloaded")
    try:
        m.wait_for_selector(".gate--ready", timeout=10000); m.click(".gate__enter")
    except Exception: pass
    time.sleep(1.5); shot(m, "m_home")
    try: m.click("#burger"); time.sleep(0.6); shot(m, "m_menu")
    except Exception as e: print("menu skip", e)
    m.close(); b.close()

print("\n=== CONSOLE ERRORS ===")
print("none" if not errors else "\n".join(errors))
