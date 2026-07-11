from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(r"C:\Users\qinye\Desktop\drink")
ASSET_SRC = Path(r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets")
OUT_DIR = ROOT / "public" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SRC_WATERCOLOR = ASSET_SRC / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____18_-abdcb43f-8ea7-4c48-9608-240aedc578c8.png"
SRC_POSTER = ASSET_SRC / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____16_-e75ba091-127e-4351-b889-34a203ea670b.png"
SRC_TURNTABLE = ASSET_SRC / "c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____14_-9b42d6cc-04f1-414e-9f68-54441b66d2bf.png"

OUT_ORANGE = OUT_DIR / "menu-glass-line-orange.png"
OUT_BLUE = OUT_DIR / "menu-glass-line-blue.png"
OUT_TURNTABLE = OUT_DIR / "menu-turntable-cutout.png"

ORANGE = np.array([255, 121, 26], dtype=np.float32)
SKY_BLUE = np.array([82, 188, 255], dtype=np.float32)


def trim_rgba(image: Image.Image, pad: int = 6) -> Image.Image:
    alpha = image.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def _edge_mask(gray: np.ndarray) -> np.ndarray:
    edge = Image.fromarray(gray).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
    edge_np = np.asarray(edge, dtype=np.uint8)
    return edge_np > 20


def _build_subject_mask(rgb: np.ndarray, bg_threshold: float) -> np.ndarray:
    pad = 36
    corners = np.concatenate(
        [
            rgb[:pad, :pad, :].reshape(-1, 3),
            rgb[:pad, -pad:, :].reshape(-1, 3),
            rgb[-pad:, :pad, :].reshape(-1, 3),
            rgb[-pad:, -pad:, :].reshape(-1, 3),
        ],
        axis=0,
    )
    bg = np.median(corners, axis=0, keepdims=True)
    diff = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)

    maxc = rgb.max(axis=2).astype(np.float32)
    minc = rgb.min(axis=2).astype(np.float32)
    saturation = (maxc - minc) / np.clip(maxc, 1.0, None)
    return (diff > bg_threshold) | (saturation > 0.10)


def extract_line_glass(src: Path, crop_box: tuple[int, int, int, int], tint: np.ndarray, out: Path) -> None:
    base = Image.open(src).convert("RGB").crop(crop_box)
    rgb = np.asarray(base, dtype=np.uint8)
    gray = np.asarray(base.convert("L"), dtype=np.uint8)

    # White/beige paper keying: remove box background like "drinking stories" cutout style.
    corners = np.concatenate(
        [
            rgb[:32, :32, :].reshape(-1, 3),
            rgb[:32, -32:, :].reshape(-1, 3),
            rgb[-32:, :32, :].reshape(-1, 3),
            rgb[-32:, -32:, :].reshape(-1, 3),
        ],
        axis=0,
    ).astype(np.float32)
    bg = np.median(corners, axis=0, keepdims=True)
    diff = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)

    edge_strength = np.asarray(Image.fromarray(gray).filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    edge_boost = np.asarray(
        Image.fromarray(edge_strength.astype(np.uint8)).filter(ImageFilter.MaxFilter(3)),
        dtype=np.float32,
    )
    alpha_from_bg = np.clip((diff - 11.0) * 11.5, 0, 255)
    alpha_from_edge = np.clip((edge_boost - 18.0) * 6.2, 0, 255)
    alpha = np.maximum(alpha_from_bg, alpha_from_edge).astype(np.uint8)

    # Drop residual frame/paper noise.
    near_bg = diff < 8.5
    alpha = np.where(near_bg, 0, alpha)
    alpha = np.where(alpha > 22, alpha, 0).astype(np.uint8)
    alpha[:3, :] = 0
    alpha[-3:, :] = 0
    alpha[:, :3] = 0
    alpha[:, -3:] = 0

    darkness = (255 - gray).astype(np.float32) / 255.0
    shade = 0.45 + darkness * 0.78
    color = np.clip(tint[None, None, :] * shade[..., None], 0, 255).astype(np.uint8)

    rgba = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = color
    rgba[..., 3] = alpha

    out_im = trim_rgba(Image.fromarray(rgba, mode="RGBA"), pad=3)
    out_im = out_im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=145, threshold=2))
    out_im.save(out, "PNG")


def extract_turntable(src: Path, crop_box: tuple[int, int, int, int], out: Path) -> None:
    base = Image.open(src).convert("RGB").crop(crop_box)
    rgb = np.asarray(base, dtype=np.uint8)
    gray = np.asarray(base.convert("L"), dtype=np.uint8)

    subject = _build_subject_mask(rgb, bg_threshold=18.0)
    stroke = (gray < 205) | _edge_mask(gray)
    mask = subject & stroke

    # Keep graphite strokes, drop paper background.
    alpha = np.clip((240 - gray).astype(np.float32) * 3.1, 0, 255).astype(np.uint8)
    alpha = np.where(mask, alpha, 0).astype(np.uint8)

    rgba = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = rgb
    rgba[..., 3] = alpha

    out_im = trim_rgba(Image.fromarray(rgba, mode="RGBA"), pad=4)
    out_im.save(out, "PNG")


def main() -> None:
    # 1) Watercolor glass -> vivid orange line glass.
    extract_line_glass(
        SRC_WATERCOLOR,
        crop_box=(92, 136, 656, 930),
        tint=ORANGE,
        out=OUT_ORANGE,
    )

    # 2) Recipe poster glass -> sky-blue line glass.
    extract_line_glass(
        SRC_POSTER,
        crop_box=(152, 248, 520, 828),
        tint=SKY_BLUE,
        out=OUT_BLUE,
    )

    # 3) Turntable drawing -> transparent cutout only.
    extract_turntable(
        SRC_TURNTABLE,
        crop_box=(18, 106, 560, 980),
        out=OUT_TURNTABLE,
    )

    print(f"Saved {OUT_ORANGE}")
    print(f"Saved {OUT_BLUE}")
    print(f"Saved {OUT_TURNTABLE}")


if __name__ == "__main__":
    main()
