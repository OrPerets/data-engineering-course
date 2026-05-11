from __future__ import annotations

import html
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PPTX = ROOT / "build/08-TF-IDF-slides.pptx"

A14_NS = "http://schemas.microsoft.com/office/drawing/2010/main"
M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math"


EQUATIONS: dict[str, list[str]] = {
    "TF_FORMULA": ["tf(t,d) = count(t,d) / |d|"],
    "IDF_FORMULA": ["idf(t) = log((N + 1) / (df(t) + 1))"],
    "TFIDF_FORMULA": ["tfidf(t,d) = tf(t,d) · idf(t)"],
}


def equation_paragraph(line: str, size: int = 2200) -> str:
    text = html.escape(line, quote=False)
    return (
        '<a:p><a:pPr algn="ctr"/>'
        f'<a14:m xmlns:a14="{A14_NS}">'
        f'<m:oMathPara xmlns:m="{M_NS}"><m:oMath>'
        '<m:r><a:rPr lang="en-US" '
        f'sz="{size}" b="0" i="0" smtClean="0">'
        '<a:latin typeface="Cambria Math" panose="02040503050406030204" '
        'pitchFamily="18" charset="0"/></a:rPr>'
        f"<m:t>{text}</m:t></m:r>"
        "</m:oMath></m:oMathPara></a14:m>"
        f'<a:endParaRPr lang="en-US" sz="{size}"/>'
        "</a:p>"
    )


def equation_block(lines: list[str]) -> str:
    longest = max(len(line) for line in lines)
    size = 2000 if longest > 60 else 2200
    return "".join(equation_paragraph(line, size) for line in lines)


def patch_xml(xml: str) -> tuple[str, int]:
    replacements = 0
    for key, lines in EQUATIONS.items():
        marker = re.escape(f"[[EQ:{key}]]")
        pattern = re.compile(rf"<a:p\b[^>]*>.*?{marker}.*?</a:p>", re.DOTALL)
        xml, count = pattern.subn(equation_block(lines), xml)
        replacements += count
    return xml, replacements


def patch_pptx(path: Path) -> int:
    if not path.exists():
        raise FileNotFoundError(path)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        with zipfile.ZipFile(path) as zin:
            zin.extractall(tmp)

        total = 0
        for slide in (tmp / "ppt" / "slides").glob("slide*.xml"):
            xml = slide.read_text(encoding="utf-8")
            patched, count = patch_xml(xml)
            if count:
                slide.write_text(patched, encoding="utf-8")
                total += count

        missing = []
        for slide in (tmp / "ppt" / "slides").glob("slide*.xml"):
            xml = slide.read_text(encoding="utf-8")
            missing.extend(re.findall(r"\[\[EQ:([A-Z0-9_]+)\]\]", xml))
        if missing:
            raise RuntimeError(f"Unpatched equation markers remain: {sorted(set(missing))}")

        out = path.with_suffix(".patched.pptx")
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in tmp.rglob("*"):
                if item.is_file():
                    zout.write(item, item.relative_to(tmp).as_posix())
        shutil.move(out, path)
        return total


if __name__ == "__main__":
    pptx = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_PPTX
    count = patch_pptx(pptx)
    print(f"Patched {count} native PowerPoint equation placeholders in {pptx}")
