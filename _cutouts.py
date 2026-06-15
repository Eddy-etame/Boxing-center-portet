import os
from rembg import remove, new_session
from PIL import Image

src = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\site\public\img\coaches"
out = os.path.join(src, "cutouts")
os.makedirs(out, exist_ok=True)
session = new_session("u2net_human_seg")  # specialised for people → cleaner edges

for f in sorted(os.listdir(src)):
    if not f.lower().endswith((".webp", ".jpg", ".jpeg", ".png")):
        continue
    try:
        img = Image.open(os.path.join(src, f)).convert("RGBA")
        res = remove(img, session=session, alpha_matting=True,
                     alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15,
                     alpha_matting_erode_size=11)
        # trim fully-transparent margins so the subject is centred/tight
        bbox = res.getbbox()
        if bbox:
            res = res.crop(bbox)
        dst = os.path.join(out, os.path.splitext(f)[0] + ".png")
        res.save(dst)
        print("ok", f, "->", os.path.basename(dst), res.size)
    except Exception as e:
        print("FAIL", f, e)
