import time
from playwright.sync_api import sync_playwright
OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
URL = "http://localhost:8787/"
errs=[]
def shot(p,n): p.screenshot(path=f"{OUT}\\ck_{n}.png"); print("shot",n)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=SHELL)
    # gate (loading) + ready, on a normal desktop
    d = b.new_page(viewport={"width":1440,"height":820})
    d.on("pageerror", lambda e: errs.append(str(e)))
    d.goto(URL, wait_until="domcontentloaded")
    time.sleep(0.18); shot(d,"gate_loading")
    try: d.wait_for_selector(".gate--ready", timeout=10000)
    except Exception as e: print("ready",e)
    time.sleep(0.3); shot(d,"gate_ready")
    d.click(".gate__enter"); time.sleep(3.0); shot(d,"hero_desktop")
    d.close()
    # short/wide desktop (overlap test)
    s = b.new_page(viewport={"width":1440,"height":660})
    s.goto(URL, wait_until="domcontentloaded")
    try: s.wait_for_selector(".gate--ready", timeout=10000); s.click(".gate__enter")
    except Exception as e: print("g",e)
    time.sleep(3.0); shot(s,"hero_short")
    s.close()
    # mobile
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.goto(URL, wait_until="domcontentloaded")
    try: m.wait_for_selector(".gate--ready", timeout=10000); m.click(".gate__enter")
    except Exception as e: print("g",e)
    time.sleep(3.0); shot(m,"hero_mobile")
    m.close(); b.close()
print("ERRORS:", "none" if not errs else errs)
