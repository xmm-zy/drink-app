"""Generate crisp line-art cocktail glass cutouts for menu."""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(r"C:\Users\qinye\Desktop\drink")
UPLOAD_DIR = Path(r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets")
OUT_DIR = ROOT / "public" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# User-provided images from latest upload
SRC_BLUE = UPLOAD_DIR / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____18_-abdcb43f-8ea7-4c48-9608-240aedc578c8.png"
SRC_ORANGE = UPLOAD_DIR / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____16_-e75ba091-127e-4351-b889-34a203ea670b.png"

OUT_BLUE = OUT_DIR / "menu-glass-line-blue.png"
OUT_ORANGE = OUT_DIR / "menu-glass-line-orange.png"


def make_line_cutout(
    src_path: Path,
    out_path: Path,
    crop_box: tuple[int, int, int, int],
    color: tuple[int, int, int],
    output_width: int = 1200,
) -> None:
    src = Image.open(src_path).convert("RGB")
    cropped = src.crop(crop_box)

    # Upscale first so edge extraction remains crisp when users scale it in UI.
    work_w = 1800
    work_h = int(cropped.height * work_w / cropped.width)
    work = cropped.resize((work_w, work_h), Image.Resampling.LANCZOS)

    gray = ImageOps.grayscale(work)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges, cutoff=1)
    edges = edges.filter(ImageFilter.MaxFilter(3))

    # Convert edge intensity into alpha mask with hard floor for clarity.
    alpha = edges.point(lambda p: 0 if p < 40 else min(255, int((p - 40) * 1.85)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))

    line = Image.new("RGBA", work.size, (*color, 0))
    line.putalpha(alpha)

    bbox = line.getbbox()
    if not bbox:
        raise RuntimeError(f"Could not extract line art from {src_path.name}")
    line = line.crop(bbox)

    # Slight transparent padding so strokes are not clipped.
    padded = Image.new("RGBA", (line.width + 18, line.height + 18), (0, 0, 0, 0))
    padded.paste(line, (9, 9))

    out_h = int(padded.height * output_width / padded.width)
    final = padded.resize((output_width, out_h), Image.Resampling.LANCZOS)
    final.save(out_path, "PNG")

    print(f"{out_path.name}: {final.width}x{final.height}")


def main() -> None:
    # Source 18: cocktail glass on light gray background
    make_line_cutout(
        src_path=SRC_BLUE,
        out_path=OUT_BLUE,
        crop_box=(80, 140, 650, 980),
        color=(77, 194, 255),  # sky blue
        output_width=1200,
    )

    # Source 16: whiskey sour poster, crop only central glass area
    make_line_cutout(
        src_path=SRC_ORANGE,
        out_path=OUT_ORANGE,
        crop_box=(150, 250, 560, 780),
        color=(255, 119, 26),  # vivid orange
        output_width=1200,
    )


if __name__ == "__main__":
    main()
