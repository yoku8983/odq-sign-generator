#!/usr/bin/env python3
"""
フォントサブセット化 + woff2変換スクリプト

Usage:
  pip install fonttools brotli
  python3 scripts/subset-fonts.py

入力: fonts-src/*.ttf
出力: public/fonts/*.woff2
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FONTS_SRC = PROJECT_ROOT / "fonts-src"
FONTS_OUT = PROJECT_ROOT / "public" / "fonts"

MPLUS2C_UNICODES = ",".join([
    "U+0020-007E",  # ASCII
    "U+3000-303F",  # CJK記号・句読点
    "U+3005",       # 々
    "U+3040-309F",  # ひらがな
    "U+30A0-30FF",  # カタカナ
    "U+FF00-FFEF",  # 全角ASCII・半角カタカナ
    "U+4E00-9FFF",  # CJK統合漢字
])


def run_subset(input_ttf: Path, output_woff2: Path, unicodes: str | None = None):
    cmd = [
        sys.executable, "-m", "fontTools.subset",
        str(input_ttf),
        f"--output-file={output_woff2}",
        "--flavor=woff2",
        "--layout-features=*",
        "--desubroutinize",
    ]
    if unicodes:
        cmd.append(f"--unicodes={unicodes}")
    else:
        cmd.append("--unicodes=*")

    print(f"  {input_ttf.name} -> {output_woff2.name}")
    subprocess.run(cmd, check=True)


def main():
    FONTS_OUT.mkdir(parents=True, exist_ok=True)

    fonts = [
        {
            "input": "Mplus2c-Medium.ttf",
            "output": "Mplus2c-Medium.woff2",
            "unicodes": MPLUS2C_UNICODES,
        },
        {
            "input": "Frutiger-Bold.ttf",
            "output": "Frutiger-Bold.woff2",
            "unicodes": None,
        },
        {
            "input": "VialogLT-Regular.ttf",
            "output": "VialogLT-Regular.woff2",
            "unicodes": None,
        },
    ]

    print("フォント変換開始...")
    for font in fonts:
        input_path = FONTS_SRC / font["input"]
        output_path = FONTS_OUT / font["output"]

        if not input_path.exists():
            print(f"  SKIP: {input_path} が見つかりません")
            continue

        run_subset(input_path, output_path, font["unicodes"])

    print("\n生成結果:")
    for woff2 in sorted(FONTS_OUT.glob("*.woff2")):
        size_kb = woff2.stat().st_size / 1024
        print(f"  {woff2.name}: {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
