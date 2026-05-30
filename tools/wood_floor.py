# -*- coding: utf-8 -*-
"""
wood_floor.py
몬스터 카드샵 게임 - 원목 마루 바닥 타일 생성기

[조건]
  - 128x64 픽셀, 상하좌우 심리스 타일링 (러닝 본드 = 벽돌식 엇갈림)
  - 안티앨리어싱 없음: putpixel 직접 기록 + 확대 시 NEAREST
  - 패턴 로직: 판자 단위 반복 + 미세 노이즈 + 나뭇결(grain) + 옹이(knot)

[출력] ../assets/
  wood_floor.png        128x64 원본 (게임 에셋)
  wood_floor_x6.png     6배 확대 미리보기
  wood_floor_tiled.png  3x5 타일링 (이음새 검증)
"""
from PIL import Image
import os

TILE_W  = 128
TILE_H  = 64
PLANK_W = 64          # 판자 길이
PLANK_H = 16          # 판자 두께  -> 4:1 비율
ROWS    = TILE_H // PLANK_H   # 4행

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

# 원목 색조 - 밝은~어두운 톤, 판자마다 순환 배치 (참고 이미지처럼 색이 섞인 마루)
WOOD_TONES = [
    (201, 156, 105),  # 라이트 오크
    (180, 128, 78),   # 미디엄 우드
    (158, 106, 60),   # 웜 브라운
    (140, 92, 52),    # 다크 월넛
]
GAP = (46, 28, 16)    # 판자 사이 홈 (짙은 갈색)


def shade(c, f):
    """색 밝기 조절 (f<1 어둡게, f>1 밝게)."""
    return tuple(max(0, min(255, int(v * f))) for v in c)


def rnd(seed, m):
    """결정적 의사난수: 같은 seed -> 항상 같은 값 (타일링 일관성 보장)."""
    return ((seed * 1103515245 + 12345) % 32768) % m


def draw_plank(px, x0, y0, w, h, base, seed):
    """판자 한 장 그리기: 노이즈 베이스 -> 나뭇결 -> 옹이 -> 테두리 홈/하이라이트."""
    hi   = shade(base, 1.18)   # 윗변 하이라이트
    g_lo = shade(base, 0.84)   # 결 (어두운)
    g_md = shade(base, 1.10)   # 결 (밝은)
    g_dk = shade(base, 0.66)   # 그림자 / 옹이

    # [1] 베이스 + 미세 노이즈 - 픽셀 하나하나 (나뭇결 질감)
    for j in range(h):
        for i in range(w):
            n = rnd(seed * 2 + j * w + i, 12)
            col = base
            if   n == 0: col = shade(base, 1.07)
            elif n == 1: col = shade(base, 0.93)
            px[(x0 + i) % TILE_W, (y0 + j) % TILE_H] = col

    # [2] 나뭇결 - 가로 결 라인 3줄, i//6 마다 -1/0/+1 물결
    for n in range(3):
        gy = 3 + rnd(seed + n * 31, h - 7)
        gcol = g_lo if n % 2 == 0 else g_md
        for i in range(w):
            wob = rnd(seed + n * 7 + i // 6, 3) - 1
            yy = gy + wob
            if 2 <= yy < h - 3:
                px[(x0 + i) % TILE_W, (y0 + yy) % TILE_H] = gcol

    # [3] 옹이(knot) - 약 45% 확률로 한 개, 5x5 다이아 + 짙은 중심
    if rnd(seed + 99, 100) < 45:
        kx = 9 + rnd(seed + 5, w - 18)
        ky = 4 + rnd(seed + 6, h - 9)
        for j in range(-2, 3):
            for i in range(-2, 3):
                if abs(i) + abs(j) <= 2:
                    px[(x0 + kx + i) % TILE_W, (y0 + ky + j) % TILE_H] = g_dk
        px[(x0 + kx) % TILE_W, (y0 + ky) % TILE_H] = shade(base, 0.52)

    # [4] 테두리 - 윗변 하이라이트 / 아랫변+오른변 어두운 홈 (입체 마루)
    for i in range(w):
        px[(x0 + i) % TILE_W, (y0) % TILE_H]         = hi     # 윗변 하이라이트
        px[(x0 + i) % TILE_W, (y0 + h - 2) % TILE_H] = g_dk   # 아랫변 그림자
        px[(x0 + i) % TILE_W, (y0 + h - 1) % TILE_H] = GAP    # 아랫변 홈
    for j in range(h):
        px[(x0 + w - 1) % TILE_W, (y0 + j) % TILE_H] = GAP            # 오른변 홈
        px[(x0)         % TILE_W, (y0 + j) % TILE_H] = shade(base, 0.88)  # 왼변 연한 경계


def make_floor():
    img = Image.new("RGB", (TILE_W, TILE_H))
    px = img.load()

    # 행마다 러닝 본드(엇갈림)로 판자 배치 - 반복 패턴 로직
    for r in range(ROWS):
        y0 = r * PLANK_H
        offset = (r % 2) * (PLANK_W // 2)      # 짝/홀 행을 32px 엇갈림
        for k in range(TILE_W // PLANK_W):     # 행당 판자 2장
            x0 = (offset + k * PLANK_W) % TILE_W
            seed = r * 17 + k * 53 + 7
            base = WOOD_TONES[(r + k) % len(WOOD_TONES)]
            draw_plank(px, x0, y0, PLANK_W, PLANK_H, base, seed)

    # 저장 - 원본 + 6배 확대(NEAREST=AA 없음) + 3x5 타일링 검증본
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, "wood_floor.png"))
    img.resize((TILE_W * 6, TILE_H * 6), Image.NEAREST).save(
        os.path.join(OUT, "wood_floor_x6.png"))

    tiled = Image.new("RGB", (TILE_W * 3, TILE_H * 5))
    for ty in range(5):
        for tx in range(3):
            tiled.paste(img, (tx * TILE_W, ty * TILE_H))
    tiled.resize((TILE_W * 3 * 2, TILE_H * 5 * 2), Image.NEAREST).save(
        os.path.join(OUT, "wood_floor_tiled.png"))

    print("  wood_floor.png (128x64) + _x6 + _tiled  저장 완료")


if __name__ == "__main__":
    print("원목 마루 타일 생성 중...")
    make_floor()
    print("완료 -> cardshop/assets/")
