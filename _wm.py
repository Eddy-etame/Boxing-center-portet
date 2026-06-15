import time
from playwright.sync_api import sync_playwright
OUT = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site"
SHELL = r"C:\Users\Mommy Jayce\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe"
URL = "http://localhost:8787/"
errs=[]
def shot(p,n): p.screenshot(path=f"{OUT}\\wm_{n}.png"); print("shot",n)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=SHELL)
    # mobile
    m = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m.on("pageerror", lambda e: errs.append(str(e)))
    m.goto(URL, wait_until="domcontentloaded")
    try: m.wait_for_selector(".gate--ready", timeout=10000); m.click(".gate__enter")
    except Exception as e: print("gate",e)
    time.sleep(3.0); shot(m,"mobile")
    m.close()
    # desktop
    d = b.new_page(viewport={"width":1440,"height":820})
    d.goto(URL, wait_until="domcontentloaded")
    try: d.wait_for_selector(".gate--ready", timeout=10000); d.click(".gate__enter")
    except Exception as e: print("gate",e)
    time.sleep(3.0); shot(d,"desktop")
    d.close(); b.close()
print("ERRORS:", "none" if not errs else errs)
