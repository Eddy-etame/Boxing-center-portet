import time
from playwright.sync_api import sync_playwright
OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
errors = []
def shot(p, n): p.screenshot(path=f"{OUT}\\mb_{n}.png"); print("shot", n)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=SHELL)
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
    m.on("console", lambda x: errors.append(f"[{x.type}] {x.text}") if x.type=="error" else None)
    m.goto("http://localhost:8787/", wait_until="domcontentloaded")
    try: m.wait_for_selector(".gate--ready", timeout=10000); m.click(".gate__enter")
    except Exception as e: print("gate", e)
    time.sleep(2.0); shot(m, "hero")
    # open burger menu
    try: m.click("#burger"); time.sleep(0.7); shot(m, "menu")
    except Exception as e: print("menu", e)
    # galerie wall (seeded)
    m.goto("http://localhost:8787/galerie/", wait_until="networkidle"); time.sleep(1.5)
    m.eval_on_selector("#community", "el=>el.scrollIntoView({block:'center'})"); time.sleep(1.2); shot(m, "galerie")
    m.close(); b.close()
print("ERRORS:", "none" if not errors else "\n".join(errors))
