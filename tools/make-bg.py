# 壁紙の別シリーズ（ミント／ふじ色／もも色）を、会社HPの bg.gif から起こす。
#
#   python3 tools/make-bg.py [色みの強さ]     既定 0.5（クリームの半分）
#   python3 tools/make-bg.py 0.5 --試し       public/hp は触らず shots/ に見本だけ出す
#
# bg.gif は16色のGIFで、150pxのタイルにこすくまが薄く入っている。
# 画素の番号（どの色を使うか）はいっさい触らず、**パレットの16色だけ**を作り替える。
# 絵柄が1pxもずれず、16色のGIFのまま残る。
#
# ── なぜ HSV をやめて Lab で作るのか
# はじめは HSV で色相を回して作っていた。それだと「ふじ色」がクリームより
# 明るさ L* で11.2も暗くなり（84.7 対 95.9）、壁紙だけが濃く沈んで目立った。
# HSV の V は「青は同じVでも黄より暗く見える」ことを知らないため。
# CIE Lab なら明るさと色みを別々に扱えるので、
#   ・16色それぞれの L* の差（＝こすくまの模様の見えやすさ）をそのまま残す
#   ・色みの強さ（a*b*の長さ）だけを狙った値に落とす
# ができる。
#
# ── なぜ3色で明るさが同じにならないのか
# sRGB で出せる色みの強さは、明るさと色相で上限が決まっている。
# クリームと同じ明るさ95.9では、青紫は6.5、赤橙は5.5しか乗らない
# （青みの緑は20.7まで乗る）。そこまで薄いと「ふじ色」「もも色」と呼べなくなる。
# なので3色は**色みの強さでそろえ**、明るさは入るところまでしか下げない。
# 結果、クリームとの明るさの差は 0.1 / 2.6 / 3.4 になる（もとは 0.5 / 11.2 / 6.2）。
import math
import sys

from PIL import Image

SRC = "public/hp/bg.gif"

# Lab の色相角（度）。もとのミント／ふじ色／もも色から測った向き。色そのものは変えない。
# クリームの地色 #fff3cb は 96.0 度（黄）。
# 色相の順は色相環をひとまわりする向き。名前は当時の色見本の言い方で。
# クリーム（96.0度）はもとの bg.gif そのままなので、ここには入れない。
HUE = {
    "wakaba": 135.0,  # わかば（黄緑）
    "mint": 191.6,  # ミント（青みの緑）
    "mizu": 245.0,  # みずいろ
    "sky": 288.6,  # ふじ色（青紫）
    "sumire": 320.0,  # すみれ（紫）
    "sakura": 355.0,  # さくら
    "peach": 32.4,  # もも色（赤橙）
    "anzu": 62.0,  # あんず（橙）
    "hai": None,  # はいいろ。色みを抜くだけなので色相は無い
}

# ── こす.くまの字だけは色を回さない
# タイルには「こすくまの輪郭」と「kosukuma の字」の2つが描かれている。
# 輪郭は地色と同じ色相で、明るさだけが違う（地色との色相差 -0.6〜+2.0度）。
# 字のほうは地色より32度ぶん赤い＝こす.くまの桃色（色相差 -12〜-32度）。
#
# 全部いっしょに回すと、ミントでは字が抹茶色に、ふじ色では青灰に、
# もも色では薄茶に濁った。字はブランドの桃色なので、どの色でも桃色のまま置く。
# 見分けは地色との色相差だけで足りる（輪郭は2度以内、字は12度以上。間が空いている）。
WORDMARK_MIN_HUE_GAP = 8.0

# 字を桃色に留めるときの、絶対の色相。cream の #ffe3cf を測った値
WORDMARK_HUE = 63.8

# 字の色みだけ、地色よりさらに落とす。
# 桃色をそのままの濃さで置くと、青や緑の地色の上では補色になって橙に浮いた。
# 字が見えているのは明るさの差（地色より3.9暗い）のほうなので、
# 色みを6割にしても読めるし、浮かなくなる。
WORDMARK_CHROMA = 0.6

# 明るさをここより下げない。下げてよいのは sRGB に色みが乗らないときだけで、
# それでもここで止める。これより暗いと壁紙が「濃い」と感じられる
L_FLOOR = 91.5

WHITE = (0.95047, 1.0, 1.08883)
M_TO_LIN = ((3.2406, -1.5372, -0.4986), (-0.9689, 1.8758, 0.0415), (0.0557, -0.2040, 1.0570))


def _to_lin(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _to_srgb(c: float) -> int:
    c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return min(255, max(0, round(c * 255)))


def to_lab(rgb) -> tuple[float, float, float]:
    r, g, b = (_to_lin(v) for v in rgb)
    xyz = (
        (r * 0.4124 + g * 0.3576 + b * 0.1805) / WHITE[0],
        (r * 0.2126 + g * 0.7152 + b * 0.0722) / WHITE[1],
        (r * 0.0193 + g * 0.1192 + b * 0.9505) / WHITE[2],
    )
    fx, fy, fz = (t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116 for t in xyz)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def lab_to_linear(L: float, a: float, b: float) -> tuple[float, float, float]:
    fy = (L + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200

    def inv(t: float) -> float:
        return t**3 if t**3 > 0.008856 else (t - 16 / 116) / 7.787

    xyz = (inv(fx) * WHITE[0], inv(fy) * WHITE[1], inv(fz) * WHITE[2])
    return tuple(sum(m * v for m, v in zip(row, xyz)) for row in M_TO_LIN)


def to_rgb(lab) -> tuple[int, int, int]:
    return tuple(_to_srgb(v) for v in lab_to_linear(*lab))


def in_gamut(L: float, c: float, hue_deg: float) -> bool:
    h = math.radians(hue_deg)
    return all(-0.0005 <= v <= 1.0005 for v in lab_to_linear(L, math.cos(h) * c, math.sin(h) * c))


def highest_L(target_c: float, hue_deg: float, top: float) -> float:
    """狙った色みの強さが sRGB に入る、いちばん明るい L*。top より上げず、L_FLOOR より下げない。"""
    if in_gamut(top, target_c, hue_deg):
        return top
    lo, hi = L_FLOOR, top
    if not in_gamut(lo, target_c, hue_deg):
        return L_FLOOR  # そこまで下げても乗らない。色みのほうを削る（下の fit_c）
    for _ in range(40):
        mid = (lo + hi) / 2
        if in_gamut(mid, target_c, hue_deg):
            lo = mid
        else:
            hi = mid
    return lo


def fit_c(L: float, hue_deg: float, want: float) -> float:
    """その明るさで sRGB に乗る色みの強さ。乗らなければ乗るところまで削る。"""
    if in_gamut(L, want, hue_deg):
        return want
    lo, hi = 0.0, want
    for _ in range(40):
        mid = (lo + hi) / 2
        if in_gamut(L, mid, hue_deg):
            lo = mid
        else:
            hi = mid
    return lo


def repalette(src: Image.Image, hue_deg: float | None, k: float) -> Image.Image:
    pal = src.getpalette()
    base = to_lab(pal[45:48])  # 15番＝地色。いちばん面積が大きい
    base_c = math.hypot(base[1], base[2])
    base_h = math.degrees(math.atan2(base[2], base[1]))

    # 灰いろは色みを抜くだけ。明るさは1つも動かさない
    if hue_deg is None:
        out: list[int] = []
        for i in range(0, len(pal), 3):
            out += list(to_rgb((to_lab(pal[i : i + 3])[0], 0.0, 0.0)))
        im = src.copy()
        im.putpalette(out)
        return im

    L_new = highest_L(base_c * k, hue_deg, base[0])
    target_c = fit_c(L_new, hue_deg, base_c * k)
    dL = L_new - base[0]  # 全16色を同じだけ動かす。差は変えないので模様の濃さは残る

    out = []
    for i in range(0, len(pal), 3):
        L, a, b = to_lab(pal[i : i + 3])
        gap = (math.degrees(math.atan2(b, a)) - base_h + 180) % 360 - 180
        # こす.くまの字は、どの色でも桃色のまま置く（上の説明）
        word = abs(gap) >= WORDMARK_MIN_HUE_GAP
        h_deg = WORDMARK_HUE if word else hue_deg + gap
        h = math.radians(h_deg)
        c = fit_c(L + dL, h_deg, math.hypot(a, b) * k * (WORDMARK_CHROMA if word else 1.0))
        out += list(to_rgb((L + dL, math.cos(h) * c, math.sin(h) * c)))
    im = src.copy()
    im.putpalette(out)
    return im


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    k = float(args[0]) if args else 0.5
    dry = "--試し" in sys.argv or "--dry" in sys.argv
    src = Image.open(SRC)
    cl, ca, cb = to_lab(src.getpalette()[45:48])
    cc = math.hypot(ca, cb)
    print(f"クリーム  地色 明るさ{cl:.1f}  色みの強さ{cc:.1f}  色相{math.degrees(math.atan2(cb, ca)):.1f}度")
    for name, hue in HUE.items():
        im = repalette(src, hue, k)
        path = f"shots/bg_{name}.gif" if dry else f"public/hp/bg_{name}.gif"
        im.save(path)
        p = im.getpalette()[45:48]
        L, a, b = to_lab(p)
        c = math.hypot(a, b)
        # 13番＝こす.くまの字の芯。桃色のまま残っているかを見る
        w = im.getpalette()[39:42]
        wl, wa, wb = to_lab(w)
        print(
            f"{name:7} 地色 #{p[0]:02x}{p[1]:02x}{p[2]:02x}"
            f"  明るさ{L:5.1f}（クリーム比{L - cl:+5.1f}）"
            f"  色み{c:5.1f}（{c / cc:.2f}倍）"
            f"  ／ こす.くまの字 #{w[0]:02x}{w[1]:02x}{w[2]:02x}"
            f" 色相{math.degrees(math.atan2(wb, wa)):5.1f}度"
        )


if __name__ == "__main__":
    main()
