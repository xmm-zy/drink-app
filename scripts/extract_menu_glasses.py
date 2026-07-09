"""Extract clean transparent cocktail glass PNGs from menu source images."""
from pathlib import Path
from PIL import Image
import colorsys

ROOT = Path(r"c:\Users\qinye\Desktop\drink")
OUT_DIR = ROOT / "public" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SRC1 = Path(
    r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets"
    r"\c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____13_-8eaf1dd3-8293-4083-b9bd-f49ae6d4e711.png"
)
SRC2 = Path(
    r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets"
    r"\c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Elegant_Modern_Digital_Cocktail_Menu_Templates_for_Stylish_Events-8805d259-4db4-4868-807b-01880a51e2b6.png"
)

OUT1 = OUT_DIR / "menu-glass-right.png"
OUT2 = OUT_DIR / "menu-glass-bottom.png"

# Orange/rust line art (matches menu-glass-bottom.png palette)
ORANGE_DEEP = (196, 90, 26)    # ~#C45A1A
ORANGE_BRIGHT = (230, 140, 70)
TEAL_REF = (51, 98, 114)


def find_teal_start_x(im: Image.Image) -> int:
    w, h = im.size
    rgb = im.convert("RGB")
    for x in range(int(w * 0.45), int(w * 0.90)):
        teal_hits = 0
        samples = 0
        for y in range(int(h * 0.15), int(h * 0.85), max(1, h // 100)):
            r, g, b = rgb.getpixel((x, y))
            samples += 1
            br = (r + g + b) / 3
            if br < 130 and b >= r - 5 and g >= r - 10 and b > 70:
                teal_hits += 1
        if samples and teal_hits / samples >= 0.45:
            return max(0, x - 2)
    return int(w * 0.58)


def dist_to_teal(r, g, b) -> float:
    return ((r - TEAL_REF[0]) ** 2 + (g - TEAL_REF[1]) ** 2 + (b - TEAL_REF[2]) ** 2) ** 0.5


def key_right_pixel(r, g, b):
    """Return RGBA for right-panel pixel: orange/rust line or transparent."""
    br = (r + g + b) / 3.0
    d = dist_to_teal(r, g, b)

    # Close to teal fill -> transparent (includes mid anti-alias toward teal)
    if d < 55 or (br < 140 and b >= r - 10):
        return (0, 0, 0, 0)

    # Warm beige paper (left menu bleed) -> transparent
    mx, mn = max(r, g, b), min(r, g, b)
    if br > 200 and (r - b) >= 8 and (mx - mn) <= 40 and g > 200:
        return (0, 0, 0, 0)
    if mn > 215 and (mx - mn) < 22:
        return (0, 0, 0, 0)

    # Bright line art: high brightness, not teal-like
    if br >= 185 and d > 90:
        alpha = 255 if br >= 210 else int(160 + (br - 185) * 3)
        t = min(255, alpha) / 255.0
        nr = int(round(ORANGE_BRIGHT[0] + (ORANGE_DEEP[0] - ORANGE_BRIGHT[0]) * t))
        ng = int(round(ORANGE_BRIGHT[1] + (ORANGE_DEEP[1] - ORANGE_BRIGHT[1]) * t))
        nb = int(round(ORANGE_BRIGHT[2] + (ORANGE_DEEP[2] - ORANGE_BRIGHT[2]) * t))
        return (nr, ng, nb, min(255, alpha))

    # Soft cool highlights on glass (slightly cyan/gray)
    if br >= 170 and d > 100 and (mx - mn) <= 45:
        t = 200 / 255.0
        nr = int(round(ORANGE_BRIGHT[0] + (ORANGE_DEEP[0] - ORANGE_BRIGHT[0]) * t))
        ng = int(round(ORANGE_BRIGHT[1] + (ORANGE_DEEP[1] - ORANGE_BRIGHT[1]) * t))
        nb = int(round(ORANGE_BRIGHT[2] + (ORANGE_DEEP[2] - ORANGE_BRIGHT[2]) * t))
        return (nr, ng, nb, 200)

    return (0, 0, 0, 0)


def extract_right_glass(src: Path, dest: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    print(f"SRC1: {w}x{h}")

    x0 = find_teal_start_x(im)
    print(f"  Teal start x={x0} ({100 * x0 / w:.1f}%), panel width={w - x0}")

    # Crop ONLY teal panel — never include beige menu
    panel = im.crop((x0, 0, w, h))
    px = panel.load()
    pw, ph = panel.size
    for y in range(ph):
        for x in range(pw):
            r, g, b, _ = px[x, y]
            px[x, y] = key_right_pixel(r, g, b)

    trimmed = trim_transparent(panel)

    # If glass is narrow (<300), pad with transparent left/right to reach 300
    if trimmed.width < 300:
        pad_total = 300 - trimmed.width
        pad_l = pad_total // 2
        pad_r = pad_total - pad_l
        padded = Image.new("RGBA", (300, trimmed.height), (0, 0, 0, 0))
        padded.paste(trimmed, (pad_l, 0))
        print(f"  Padded width {trimmed.width} -> 300 (L={pad_l}, R={pad_r})")
        trimmed = padded

    trimmed.save(dest, "PNG")
    return trimmed


def is_orange_line(r, g, b) -> bool:
    br = (r + g + b) / 3.0
    # Dark / black text
    if br < 75:
        return False
    # Neutral gray text
    if abs(r - g) < 20 and abs(g - b) < 20 and br < 210:
        return False

    mx, mn = max(r, g, b), min(r, g, b)
    # Cream / near-white paper
    if mn > 185 and (mx - mn) < 45:
        return False
    if r > 225 and g > 215 and b > 195 and (r - b) < 50 and (mx - mn) < 55:
        return False

    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    hue_ok = h <= 0.10 or h >= 0.93
    if not hue_ok:
        return False

    # Core orange/rust strokes
    if r >= g - 5 and (r - b) >= 35 and s >= 0.28 and v >= 0.30:
        return True
    # Deeper rust (lower V, high S)
    if r > 120 and (r - b) >= 45 and s >= 0.40 and g < r and b < 100:
        return True
    return False


def extract_bottom_glass(src: Path, dest: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    print(f"SRC2: {w}x{h}")

    # Glass lives ~y 620–920; exclude footer text band near bottom
    y0 = int(h * 0.58)
    y1 = int(h * 0.94)  # drop URL / footer text strip
    region = im.crop((0, y0, w, y1))
    print(f"  Bottom crop y=[{y0},{y1}), size={region.size}")

    px = region.load()
    rw, rh = region.size
    for y in range(rh):
        for x in range(rw):
            r, g, b, _ = px[x, y]
            if is_orange_line(r, g, b):
                _h, s, _v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                alpha = 255 if s >= 0.35 else int(210 + (s - 0.28) * 600)
                px[x, y] = (r, g, b, min(255, max(0, alpha)))
            else:
                px[x, y] = (0, 0, 0, 0)

    trimmed = trim_transparent(region)
    trimmed.save(dest, "PNG")
    return trimmed


def trim_transparent(im: Image.Image, pad: int = 6) -> Image.Image:
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    bbox = im.split()[-1].getbbox()
    if not bbox:
        print("  WARNING: fully transparent")
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def report(path: Path, im: Image.Image) -> None:
    size_kb = path.stat().st_size / 1024
    alpha = list(im.getchannel("A").get_flattened_data())
    opaque = sum(1 for p in alpha if p > 10)
    print(f"  OUT {path.name}: {im.size[0]}x{im.size[1]}, {size_kb:.1f} KB, opaque~{opaque}")


def main():
    print("=== menu-glass-right.png ===")
    g1 = extract_right_glass(SRC1, OUT1)
    report(OUT1, g1)

    print("=== menu-glass-bottom.png ===")
    g2 = extract_bottom_glass(SRC2, OUT2)
    report(OUT2, g2)

    print("=== Verify ===")
    for p in (OUT1, OUT2):
        print(f"  {p.name}: exists={p.exists()} bytes={p.stat().st_size} path={p}")


if __name__ == "__main__":
    main()
