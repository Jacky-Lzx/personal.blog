#!/usr/bin/env python3
"""生成霞鹜文楷(LXGW WenKai)的 web 字体子集并按 unicode-range 切片。

策略（针对静态博客优化）：
  - 第 1~N 片：站点当前实际使用到的全部字符（文章 + UI + 标点），
    保证现有页面只加载前几片（约 100~250KB）。
  - 后续片：GB2312 常用字按真实语料频率排序，作为新文章的兜底，
    浏览器只按需加载用到的片。

新增文章后重新运行本脚本即可把新字符并入第 1 片：
    python3 scripts/wenkai_subset.py
依赖：pip install fonttools brotli
"""
import glob
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", ".cache")
OUT = os.path.join(ROOT, "public", "fonts", "wenkai")
CHUNK = 250
TTF_URL = ("https://github.com/lxgw/LxgwWenKai/releases/download/"
           "v1.522/LXGWWenKai-Regular.ttf")
FREQ_URL = ("https://raw.githubusercontent.com/argb/hanzi-data/master/"
            "%E7%8E%B0%E4%BB%A3%E6%B1%89%E8%AF%AD%E6%B1%89%E5%AD%97%E9%A2%91%E7%8E%87%E8%A1%A8.csv")


def cached(name, url):
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print(f"downloading {url}")
        urllib.request.urlretrieve(url, path)
    return path


def site_chars():
    """站点当前用到的全部非 ASCII 字符（中文 + 全角标点）。"""
    chars = set()
    patterns = [
        os.path.join(ROOT, "index.html"),
        os.path.join(ROOT, "src", "**", "*.md"),
        os.path.join(ROOT, "src", "**", "*.vue"),
        os.path.join(ROOT, "src", "**", "*.js"),
        os.path.join(ROOT, "src", "**", "*.css"),
    ]
    for pat in patterns:
        for f in glob.glob(pat, recursive=True):
            text = open(f, encoding="utf-8").read()
            for ch in text:
                if ord(ch) > 0x2000:
                    chars.add(ch)
    return chars


def gb2312_chars():
    chars = set()
    for b1 in range(0xB0, 0xF8):
        for b2 in range(0xA1, 0xFF):
            try:
                chars.add(bytes((b1, b2)).decode("gb2312"))
            except Exception:
                pass
    return chars


def freq_map():
    freq = {}
    for line in open(cached("hanzi-freq.csv", FREQ_URL),
                     encoding="utf-8").read().splitlines()[1:]:
        parts = line.split(",")
        if len(parts) >= 3:
            try:
                freq[parts[1]] = int(parts[2])
            except ValueError:
                pass
    return freq


def main():
    from fontTools.subset import Options, Subsetter
    from fontTools.ttLib import TTFont

    ttf = cached("LXGWWenKai-Regular.ttf", TTF_URL)
    freq = freq_map()
    blog = site_chars()

    pool = gb2312_chars() | blog | set(
        "。！？，、；：“”‘’（）—…·《》【】〔〕「」～①②③④⑤⑥⑦⑧⑨⑩℃±×÷≠≤≥∞∑∏√∂∫"
    )
    pool = {c for c in pool if unicodedata.category(c)[0] != "C"}

    # 站点字符在前（按频率排），其余按频率排
    ordered = sorted(blog, key=lambda c: (-freq.get(c, -1), ord(c)))
    ordered += sorted(pool - blog, key=lambda c: (-freq.get(c, -1), ord(c)))
    print(f"site chars: {len(blog)}, total pool: {len(ordered)}")

    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "wxk-*.woff2")):
        os.remove(old)

    css_blocks, files = [], []
    for i in range(0, len(ordered), CHUNK):
        chunk = ordered[i:i + CHUNK]
        opts = Options()
        opts.flavor = "woff2"
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        opts.glyph_names = False
        opts.legacy_cmap = False
        f = TTFont(ttf)
        s = Subsetter(options=opts)
        s.populate(text="".join(chunk))
        s.subset(f)
        name = f"wxk-{i // CHUNK + 1:02d}.woff2"
        f.save(os.path.join(OUT, name))
        f.close()

        cps = [ord(c) for c in chunk]
        ranges, start, prev = [], cps[0], cps[0]
        for cp in cps[1:]:
            if cp == prev + 1:
                prev = cp
            else:
                ranges.append((start, prev))
                start = prev = cp
        ranges.append((start, prev))
        ur = ", ".join(
            f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in ranges
        )
        css_blocks.append(
            "@font-face {\n"
            "  font-family: 'LXGW WenKai';\n"
            "  font-style: normal;\n"
            "  font-weight: 400;\n"
            "  font-display: swap;\n"
            f"  src: url('./{name}') format('woff2');\n"  # 相对路径：与 CSS 同目录，避免 GitHub Pages 子目录部署（base 前缀）下 404
            f"  unicode-range: {ur};\n"
            "}"
        )
        files.append(name)

    open(os.path.join(OUT, "lxgw-wenkai.css"), "w", encoding="utf-8").write(
        "/* LXGW WenKai v1.522 (SIL OFL 1.1) - https://github.com/lxgw/LxgwWenKai\n"
        "   由 scripts/wenkai_subset.py 生成：站点字符在前，其余按语料频率排序 */\n\n"
        + "\n\n".join(css_blocks) + "\n"
    )
    total = sum(os.path.getsize(os.path.join(OUT, n)) for n in files)
    print(f"done: {len(files)} chunks, total {total / 1024:.0f} KB "
          f"(avg {total / 1024 / len(files):.0f} KB) -> public/fonts/wenkai/")


if __name__ == "__main__":
    sys.exit(main())
