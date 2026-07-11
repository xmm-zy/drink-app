from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = Path(r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets")
OUT_DIR = ROOT / "public" / "assets"

GLASS_WATERCOLOR = SRC_DIR / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____18_-abdcb43f-8ea7-4c48-9608-240aedc578c8.png"
GLASS_POSTER = SRC_DIR / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____16_-e75ba091-127e-4351-b889-34a203ea670b.png"
TURNTABLE = SRC_DIR / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____14_-9b42d6cc-04f1-414e-9f68-54441b66d2bf.png"


def remove_light_bg(image: Image.Image, threshold: int = 245) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def trim_transparent(image: Image.Image, pad: int = 14) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def line_tint(image: Image.Image, color: tuple[int, int, int], edge_threshold: int = 42) -> Image.Image:
    gray = ImageOps.grayscale(image.convert("RGB"))
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges)
    edges = ImageEnhance.Contrast(edges).enhance(2.8)
    edges = ImageEnhance.Sharpness(edges).enhance(2.4)

    alpha = edges.point(lambda p: 255 if p > edge_threshold else 0)
    alpha = alpha.filter(ImageFilter.MaxFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))
    alpha = alpha.point(lambda p: 0 if p < 18 else p)

    tinted = Image.new("RGBA", image.size, (*color, 0))
    tinted.putalpha(alpha)
    return trim_transparent(tinted, pad=4)


def extract_glass_poster(image: Image.Image) -> Image.Image:
    # Focus on the central illustrated glass area to avoid title/text blocks.
    crop = image.crop((130, 210, 545, 760))
    # Poster background is warm beige.
    bg = Image.new("RGB", crop.size, (233, 221, 196))
    diff = ImageChops.difference(crop.convert("RGB"), bg)
    mask = ImageOps.grayscale(diff).point(lambda p: 255 if p > 28 else 0)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2)).point(lambda p: 255 if p > 26 else 0)
    out = crop.convert("RGBA")
    out.putalpha(mask)
    return trim_transparent(out, pad=10)


def extract_turntable(image: Image.Image) -> Image.Image:
    # Keep only linework and record details, drop paper background.
    gray = ImageOps.grayscale(image.convert("RGB"))
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges)
    edges = ImageEnhance.Contrast(edges).enhance(2.2)
    alpha = edges.point(lambda p: 255 if p > 36 else 0)
    alpha = alpha.filter(ImageFilter.MaxFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))
    alpha = alpha.point(lambda p: 0 if p < 16 else p)
    out = Image.new("RGBA", image.size, (24, 24, 24, 0))
    out.putalpha(alpha)
    return trim_transparent(out, pad=10)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    glass_a = remove_light_bg(Image.open(GLASS_WATERCOLOR), threshold=240)
    glass_a = trim_transparent(glass_a, pad=8)
    glass_orange = line_tint(glass_a, color=(235, 111, 28), edge_threshold=36)

    glass_b_src = extract_glass_poster(Image.open(GLASS_POSTER))
    glass_blue = line_tint(glass_b_src, color=(83, 193, 255), edge_threshold=40)

    turntable = extract_turntable(Image.open(TURNTABLE))

    glass_orange.save(OUT_DIR / "menu-glass-line-orange.png")
    glass_blue.save(OUT_DIR / "menu-glass-line-blue.png")
    turntable.save(OUT_DIR / "menu-turntable-cutout.png")


if __name__ == "__main__":
    main()
