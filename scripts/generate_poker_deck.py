"""Generate a full 54-card mosaic cocktail poker deck from the Ace of Spades reference."""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REF = Path(
    r"C:\Users\qinye\.cursor\projects\c-Users-qinye-Desktop-drink\assets"
    r"\c__Users_qinye_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_____24_-68e58844-e576-4a3e-ad69-a5dcb182dd59.png"
)
OUT = ROOT / "public" / "assets" / "cards"
W, H = 500, 700
MARGIN = 28
CORNER_X, CORNER_Y = 34, 28

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = {
    "S": {"name": "spades", "color": (20, 20, 20), "symbol": "♠"},
    "H": {"name": "hearts", "color": (180, 28, 36), "symbol": "♥"},
    "C": {"name": "clubs", "color": (20, 20, 20), "symbol": "♣"},
    "D": {"name": "diamonds", "color": (180, 28, 36), "symbol": "♦"},
}

# Pip layouts for number cards (normalized 0-1 coords inside center box)
PIP_LAYOUTS = {
    "A": [(0.5, 0.5)],
    "2": [(0.5, 0.22), (0.5, 0.78)],
    "3": [(0.5, 0.2), (0.5, 0.5), (0.5, 0.8)],
    "4": [(0.32, 0.24), (0.68, 0.24), (0.32, 0.76), (0.68, 0.76)],
    "5": [(0.32, 0.24), (0.68, 0.24), (0.5, 0.5), (0.32, 0.76), (0.68, 0.76)],
    "6": [(0.32, 0.22), (0.68, 0.22), (0.32, 0.5), (0.68, 0.5), (0.32, 0.78), (0.68, 0.78)],
    "7": [
        (0.32, 0.2),
        (0.68, 0.2),
        (0.5, 0.35),
        (0.32, 0.5),
        (0.68, 0.5),
        (0.32, 0.8),
        (0.68, 0.8),
    ],
    "8": [
        (0.32, 0.18),
        (0.68, 0.18),
        (0.32, 0.4),
        (0.68, 0.4),
        (0.32, 0.6),
        (0.68, 0.6),
        (0.32, 0.82),
        (0.68, 0.82),
    ],
    "9": [
        (0.32, 0.16),
        (0.68, 0.16),
        (0.32, 0.36),
        (0.68, 0.36),
        (0.5, 0.5),
        (0.32, 0.64),
        (0.68, 0.64),
        (0.32, 0.84),
        (0.68, 0.84),
    ],
    "10": [
        (0.32, 0.14),
        (0.68, 0.14),
        (0.5, 0.26),
        (0.32, 0.38),
        (0.68, 0.38),
        (0.32, 0.62),
        (0.68, 0.62),
        (0.5, 0.74),
        (0.32, 0.86),
        (0.68, 0.86),
    ],
}

FACE_THEMES = {
    "J": "shaker",
    "Q": "lemon",
    "K": "bottle",
}


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\timesbd.ttf",
        r"C:\Windows\Fonts\georgia.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def blank_card() -> Image.Image:
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((8, 8, W - 9, H - 9), radius=28, outline=(28, 28, 28), width=4)
    draw.rounded_rectangle((18, 18, W - 19, H - 19), radius=22, outline=(210, 210, 210), width=1)
    return img


def draw_corners(img: Image.Image, rank: str, suit_key: str) -> None:
    color = SUITS[suit_key]["color"]
    symbol = SUITS[suit_key]["symbol"]
    draw = ImageDraw.Draw(img)
    rank_font = load_font(54 if rank != "10" else 44)
    suit_font = load_font(42)

    def paint(x: int, y: int, upside_down: bool = False) -> None:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.text((x, y), rank, font=rank_font, fill=color + (255,), anchor="ma")
        ld.text((x, y + 48), symbol, font=suit_font, fill=color + (255,), anchor="ma")
        if upside_down:
            layer = layer.rotate(180)
        img.alpha_composite(layer.convert("RGBA")) if img.mode == "RGBA" else img.paste(
            layer, (0, 0), layer
        )

    # Work on RGBA for rotation paste
    rgba = img.convert("RGBA")
    paint(CORNER_X + 18, CORNER_Y + 8, False)
    paint(W - CORNER_X - 18, H - CORNER_Y - 70, True)
    # paint upside-down via rotated layer already handled; redo bottom properly
    bottom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bottom)
    bd.text((CORNER_X + 18, CORNER_Y + 8), rank, font=rank_font, fill=color + (255,), anchor="ma")
    bd.text((CORNER_X + 18, CORNER_Y + 56), symbol, font=suit_font, fill=color + (255,), anchor="ma")
    bottom = bottom.rotate(180)
    rgba.alpha_composite(bottom)
    # top corners again cleanly
    top = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(top)
    td.text((CORNER_X + 18, CORNER_Y + 8), rank, font=rank_font, fill=color + (255,), anchor="ma")
    td.text((CORNER_X + 18, CORNER_Y + 56), symbol, font=suit_font, fill=color + (255,), anchor="ma")
    rgba.alpha_composite(top)
    img.paste(rgba.convert("RGB"))


def mosaic_fill(draw: ImageDraw.ImageDraw, bbox: tuple[int, int, int, int], palette: list[tuple[int, int, int]], seed: int) -> None:
    rng = random.Random(seed)
    x0, y0, x1, y1 = bbox
    y = y0
    while y < y1:
        x = x0
        h = rng.randint(8, 16)
        while x < x1:
            w = rng.randint(8, 18)
            color = rng.choice(palette)
            draw.rectangle((x, y, min(x + w, x1), min(y + h, y1)), fill=color, outline=(255, 255, 255))
            x += w
        y += h


def draw_mosaic_suit(img: Image.Image, suit_key: str, cx: int, cy: int, size: int, seed: int) -> None:
    """Draw a mosaic-tiled suit symbol as a filled polygon approximation."""
    color = SUITS[suit_key]["color"]
    palette = [
        color,
        tuple(max(0, c - 30) for c in color),
        tuple(min(255, c + 40) for c in color),
        (40, 40, 40) if suit_key in ("S", "C") else (220, 90, 90),
        (90, 90, 90) if suit_key in ("S", "C") else (255, 170, 170),
    ]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    s = size

    if suit_key == "S":
        points = [
            (cx, cy - s),
            (cx + s * 0.72, cy - s * 0.05),
            (cx + s * 0.35, cy + s * 0.2),
            (cx + s * 0.28, cy + s * 0.55),
            (cx, cy + s * 0.35),
            (cx - s * 0.28, cy + s * 0.55),
            (cx - s * 0.35, cy + s * 0.2),
            (cx - s * 0.72, cy - s * 0.05),
        ]
        stem = [(cx - s * 0.12, cy + s * 0.25), (cx + s * 0.12, cy + s * 0.25), (cx + s * 0.18, cy + s), (cx - s * 0.18, cy + s)]
    elif suit_key == "H":
        points = [
            (cx, cy + s * 0.85),
            (cx + s * 0.85, cy - s * 0.05),
            (cx + s * 0.45, cy - s * 0.75),
            (cx, cy - s * 0.35),
            (cx - s * 0.45, cy - s * 0.75),
            (cx - s * 0.85, cy - s * 0.05),
        ]
        stem = []
    elif suit_key == "D":
        points = [(cx, cy - s), (cx + s * 0.7, cy), (cx, cy + s), (cx - s * 0.7, cy)]
        stem = []
    else:  # clubs
        r = s * 0.38
        for ox, oy in [(0, -0.42), (-0.42, 0.18), (0.42, 0.18)]:
            draw.ellipse((cx + ox * s - r, cy + oy * s - r, cx + ox * s + r, cy + oy * s + r), fill=color)
        stem = [(cx - s * 0.12, cy + s * 0.15), (cx + s * 0.12, cy + s * 0.15), (cx + s * 0.16, cy + s), (cx - s * 0.16, cy + s)]
        points = []

    if points:
        draw.polygon(points, fill=color)
    if stem:
        draw.polygon(stem, fill=color)

    # overlay mosaic noise inside bounding box
    bbox = (cx - s, cy - s, cx + s, cy + s)
    mosaic = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md = ImageDraw.Draw(mosaic)
    mosaic_fill(md, bbox, palette, seed)
    # keep mosaic only where suit exists
    mask = layer.split()[-1]
    mosaic.putalpha(mask)
    img_rgba = img.convert("RGBA")
    img_rgba.alpha_composite(layer)
    img_rgba.alpha_composite(mosaic)
    img.paste(img_rgba.convert("RGB"))


def draw_face_art(img: Image.Image, suit_key: str, theme: str, seed: int) -> None:
    color = SUITS[suit_key]["color"]
    is_red = suit_key in ("H", "D")
    palette = (
        [(210, 70, 80), (255, 180, 180), (140, 30, 40), (255, 230, 230), (90, 20, 25)]
        if is_red
        else [(30, 30, 30), (80, 80, 80), (140, 140, 140), (220, 220, 220), (10, 10, 10)]
    )
    if theme == "shaker":
        palette += [(190, 190, 190), (120, 120, 120)]
    elif theme == "lemon":
        palette += [(230, 200, 70), (180, 150, 40), (255, 240, 160)]
    else:
        palette += [(90, 50, 20), (150, 90, 40), (40, 20, 10)]

    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2
    box = (cx - 110, cy - 150, cx + 110, cy + 150)
    mosaic_fill(draw, box, palette, seed)

    # silhouette overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    if theme == "shaker":
        od.polygon([(cx - 55, cy - 120), (cx + 55, cy - 120), (cx + 70, cy + 90), (cx - 70, cy + 90)], outline=color + (220,), width=6)
        od.rectangle((cx - 25, cy - 145, cx + 25, cy - 120), outline=color + (220,), width=5)
        od.ellipse((cx - 70, cy + 85, cx + 70, cy + 120), outline=color + (220,), width=5)
    elif theme == "lemon":
        od.ellipse((cx - 90, cy - 60, cx + 90, cy + 60), outline=color + (220,), width=6)
        od.arc((cx - 70, cy - 40, cx + 70, cy + 40), 200, 340, fill=color + (220,), width=4)
    else:
        od.rectangle((cx - 35, cy - 130, cx + 35, cy + 110), outline=color + (220,), width=6)
        od.rectangle((cx - 20, cy - 150, cx + 20, cy - 130), outline=color + (220,), width=5)
        od.ellipse((cx - 45, cy + 100, cx + 45, cy + 135), outline=color + (220,), width=5)

    rgba = img.convert("RGBA")
    rgba.alpha_composite(overlay)
    img.paste(rgba.convert("RGB"))
    # small suit badge
    draw_mosaic_suit(img, suit_key, cx, cy + 170, 28, seed + 9)


def extract_as_center(ref: Image.Image) -> Image.Image:
    """Crop the mosaic martini area from the reference Ace of Spades."""
    rw, rh = ref.size
    # center region roughly between corners
    left = int(rw * 0.18)
    top = int(rh * 0.16)
    right = int(rw * 0.82)
    bottom = int(rh * 0.84)
    return ref.crop((left, top, right, bottom)).resize((320, 420), Image.Resampling.LANCZOS)


def make_ace_spades(ref: Image.Image) -> Image.Image:
    card = blank_card()
    center = extract_as_center(ref)
    card.paste(center, ((W - center.width) // 2, (H - center.height) // 2 - 10))
    # redraw corners for consistency
    rgba = card.convert("RGBA")
    draw_corners_clean(rgba, "A", "S")
    return rgba.convert("RGB")


def draw_corners_clean(img: Image.Image, rank: str, suit_key: str) -> None:
    color = SUITS[suit_key]["color"]
    symbol = SUITS[suit_key]["symbol"]
    rank_font = load_font(54 if rank != "10" else 44)
    suit_font = load_font(42)

    def corner_layer(upside_down: bool) -> Image.Image:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        x, y = CORNER_X + 18, CORNER_Y + 10
        # white backing to cover any leftover corner art
        d.rectangle((8, 8, 90, 130), fill=(255, 255, 255, 255))
        d.text((x, y), rank, font=rank_font, fill=color + (255,), anchor="ma")
        d.text((x, y + 48), symbol, font=suit_font, fill=color + (255,), anchor="ma")
        return layer.rotate(180) if upside_down else layer

    img.alpha_composite(corner_layer(False))
    img.alpha_composite(corner_layer(True))


def make_number_card(rank: str, suit_key: str) -> Image.Image:
    card = blank_card().convert("RGBA")
    draw_corners_clean(card, rank, suit_key)
    layouts = PIP_LAYOUTS[rank]
    box = (90, 120, W - 90, H - 120)
    bw, bh = box[2] - box[0], box[3] - box[1]
    size = 48 if rank != "A" else 110
    rgb = card.convert("RGB")
    for i, (nx, ny) in enumerate(layouts):
        cx = int(box[0] + nx * bw)
        cy = int(box[1] + ny * bh)
        draw_mosaic_suit(rgb, suit_key, cx, cy, size, hash((rank, suit_key, i)) % 10_000)
    out = rgb.convert("RGBA")
    draw_corners_clean(out, rank, suit_key)
    return out.convert("RGB")


def make_face_card(rank: str, suit_key: str) -> Image.Image:
    card = blank_card().convert("RGBA")
    rgb = card.convert("RGB")
    draw_face_art(rgb, suit_key, FACE_THEMES[rank], hash((rank, suit_key)) % 10_000)
    out = rgb.convert("RGBA")
    draw_corners_clean(out, rank, suit_key)
    return out.convert("RGB")


def make_joker(kind: str) -> Image.Image:
    card = blank_card()
    draw = ImageDraw.Draw(card)
    color = (180, 28, 36) if kind == "red" else (20, 20, 20)
    font = load_font(64)
    small = load_font(28)
    text = f"{kind} joker"
    draw.text((W // 2, H // 2 - 10), text, font=font, fill=color, anchor="mm")
    draw.text((W // 2, H // 2 + 55), "LUCERIA", font=small, fill=(120, 120, 120), anchor="mm")
    # corner marks
    draw.text((CORNER_X + 18, CORNER_Y + 20), "J", font=load_font(48), fill=color, anchor="ma")
    draw.text((CORNER_X + 18, CORNER_Y + 70), "★", font=load_font(28), fill=color, anchor="ma")
    return card


def make_sheet(cards: list[tuple[str, Image.Image]], cols: int, path: Path) -> None:
    if not cards:
        return
    rows = math.ceil(len(cards) / cols)
    gap = 16
    sheet = Image.new("RGB", (cols * W + (cols + 1) * gap, rows * H + (rows + 1) * gap), (245, 240, 230))
    for i, (_, card) in enumerate(cards):
        r, c = divmod(i, cols)
        sheet.paste(card, (gap + c * (W + gap), gap + r * (H + gap)))
    sheet.save(path, "PNG", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ref = Image.open(REF).convert("RGB")
    deck: list[tuple[str, Image.Image]] = []

    for suit_key, meta in SUITS.items():
        for rank in RANKS:
            code = f"{rank}{suit_key}"
            if rank == "A" and suit_key == "S":
                card = make_ace_spades(ref)
            elif rank in FACE_THEMES:
                card = make_face_card(rank, suit_key)
            else:
                card = make_number_card(rank, suit_key)
            card.save(OUT / f"{code}.png", "PNG", optimize=True)
            deck.append((code, card))
            print(f"saved {code}.png")

    for kind in ("red", "black"):
        card = make_joker(kind)
        name = f"joker_{kind}"
        card.save(OUT / f"{name}.png", "PNG", optimize=True)
        deck.append((name, card))
        print(f"saved {name}.png")

    make_sheet(deck, 9, OUT / "deck_sheet.png")
    print(f"done: {len(deck)} cards -> {OUT}")


if __name__ == "__main__":
    main()
