# -*- coding: utf-8 -*-
"""
arcade_carpet.py
몬스터 카드샵 게임 - 아케이드 카펫 바닥 타일 생성기

[조건]
  - 64x64 픽셀, 상하좌우 심리스(seamless) 타일링
  - 안티앨리어싱 없음: putpixel 직접 기록 + 확대 시 NEAREST 보간
  - 패턴 로직: 아가일(argyle) 다이아 격자(모듈로 반복) + 카드 문양(비트맵 스탬프) + 컨페티

[출력] ../assets/ 폴더
  carpet_<theme>.png        원본 64x64 (게임 에셋)
  carpet_<theme>_x8.png     8배 확대 미리보기
  carpet_<theme>_tiled.png  4x4 타일링 미리보기 (이음새 확인용)
"""
from PIL import Image
import os

TILE  = 64           # 타일 한 변 (px)
HALF  = 16           # 다이아몬드 반각
PITCH = HALF * 2     # 격자 피치 = 32  (TILE을 정확히 나눔 -> 심리스 보장)

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

# ──────────────────────────────────────────────
# 팔레트 (테마별 RGB 튜플)
# ──────────────────────────────────────────────
PALETTES = {
    "cozy": {        # 테마 A - 따뜻한 우드 카드샵
        "base":    (58,  35,  72),
        "dia_a":   (122, 54,  88),
        "dia_b":   (92,  52,  108),
        "rim_hi":  (170, 100, 130),   # 다이아 윗변 하이라이트
        "lattice": (242, 160, 52),    # 다이아 아랫변 골드 라인
        "pip":     (245, 224, 176),   # 카드 문양 (크림)
        "pip2":    (232, 96,  76),    # 카드 문양 (코랄)
        "speck1":  (245, 232, 205),   # 컨페티 (크림)
        "speck2":  (63,  167, 150),   # 컨페티 (틸)
    },
    "arcade": {      # 테마 B - 레트로 아케이드 팝
        "base":    (27,  16,  51),
        "dia_a":   (124, 58,  160),
        "dia_b":   (61,  44,  141),
        "rim_hi":  (175, 110, 210),
        "lattice": (0,   194, 203),
        "pip":     (255, 210, 63),
        "pip2":    (255, 107, 53),
        "speck1":  (255, 77,  109),
        "speck2":  (0,   194, 203),
    },
}

# ──────────────────────────────────────────────
# 카드 문양 비트맵 (7x7, '#' = 칠함 / '.' = 건너뜀)
#   -> 픽셀을 하나하나 직접 찍기 위한 도트 정의
# ──────────────────────────────────────────────
SUITS = {
    "diamond": ["...#...", "..###..", ".#####.", "#######",
                ".#####.", "..###..", "...#..."],
    "spade":   ["...#...", "..###..", ".#####.", "#######",
                "#######", "...#...", "..###.."],
    "heart":   [".##.##.", "#######", "#######", "#######",
                ".#####.", "..###..", "...#..."],
    "club":    ["..#.#..", ".#.#.#.", "#######", ".#####.",
                "#######", "...#...", "..###.."],
}
SPARKLE = ["...#...", "...#...", "..###..", "#######",
           "..###..", "...#...", "...#..."]


def stamp(px, bmp, cx, cy, color):
    """비트맵을 (cx,cy) 중심에 한 픽셀씩 찍는다. 가장자리는 wrap -> 심리스 유지."""
    h, w = len(bmp), len(bmp[0])
    for j in range(h):
        for i in range(w):
            if bmp[j][i] == '#':
                x = (cx - w // 2 + i) % TILE
                y = (cy - h // 2 + j) % TILE
                px[x, y] = color


def make_carpet(theme):
    pal = PALETTES[theme]
    img = Image.new("RGB", (TILE, TILE))
    px = img.load()

    # [1] 베이스 단색 채우기 - 픽셀 하나하나 직접 기록
    for y in range(TILE):
        for x in range(TILE):
            px[x, y] = pal["base"]

    # [2] 아가일 다이아몬드 격자 - 모듈로(%)로 패턴 반복
    #     맨해튼 거리(|dx|+|dy|)로 다이아 영역 판정.
    #     d<=HALF 는 메인 다이아, d>HALF 는 오프셋 다이아가 빈틈 없이 맞물림.
    for y in range(TILE):
        for x in range(TILE):
            cx, cy = x % PITCH, y % PITCH
            d = abs(cx - HALF) + abs(cy - HALF)
            if d <= HALF:
                ix, iy = x // PITCH, y // PITCH
                col = pal["dia_a"] if (ix + iy) % 2 == 0 else pal["dia_b"]
            else:
                ix, iy = (x + HALF) // PITCH, (y + HALF) // PITCH
                col = pal["dia_b"] if (ix + iy) % 2 == 0 else pal["dia_a"]
            px[x, y] = col

    # [3] 다이아 테두리 - 윗변=하이라이트, 아랫변=골드 라인 (직조 카펫 입체감)
    for y in range(TILE):
        for x in range(TILE):
            cx, cy = x % PITCH, y % PITCH
            d = abs(cx - HALF) + abs(cy - HALF)
            if d == HALF:
                px[x, y] = pal["rim_hi"] if cy < HALF else pal["lattice"]

    # [4] 카드 문양 - 메인 다이아 중심마다 4종(♦♠♥♣) 순환 스탬프
    suit_order = ["diamond", "spade", "heart", "club"]
    k = 0
    for iy in range(TILE // PITCH):
        for ix in range(TILE // PITCH):
            cx, cy = HALF + ix * PITCH, HALF + iy * PITCH
            color = pal["pip"] if k % 2 == 0 else pal["pip2"]
            stamp(px, SUITS[suit_order[k % 4]], cx, cy, color)
            k += 1

    # [5] 오프셋 다이아 중심엔 반짝이(sparkle) 스탬프
    for iy in range(TILE // PITCH):
        for ix in range(TILE // PITCH):
            stamp(px, SPARKLE, ix * PITCH, iy * PITCH, pal["speck1"])

    # [6] 컨페티 점 - 2x2 픽셀, wrap 처리로 이음새에서도 끊기지 않음
    specks = [(9, 25), (27, 7), (41, 41), (55, 13),
              (13, 53), (49, 57), (35, 31), (5, 5)]
    for idx, (sx, sy) in enumerate(specks):
        c = pal["speck1"] if idx % 2 else pal["speck2"]
        for dx in range(2):
            for dy in range(2):
                px[(sx + dx) % TILE, (sy + dy) % TILE] = c

    # [7] 저장 - 원본 + 8배 확대(NEAREST=AA 없음) + 4x4 타일링 검증본
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, f"carpet_{theme}.png"))
    img.resize((TILE * 8, TILE * 8), Image.NEAREST).save(
        os.path.join(OUT, f"carpet_{theme}_x8.png"))

    tiled = Image.new("RGB", (TILE * 4, TILE * 4))
    for ty in range(4):
        for tx in range(4):
            tiled.paste(img, (tx * TILE, ty * TILE))
    tiled.resize((TILE * 4 * 3, TILE * 4 * 3), Image.NEAREST).save(
        os.path.join(OUT, f"carpet_{theme}_tiled.png"))

    print(f"  [{theme:6s}] carpet_{theme}.png (64x64) + _x8 + _tiled  저장 완료")


if __name__ == "__main__":
    print("아케이드 카펫 타일 생성 중...")
    for theme in PALETTES:
        make_carpet(theme)
    print("완료 -> cardshop/assets/ 폴더 확인")
