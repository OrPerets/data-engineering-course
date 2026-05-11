from __future__ import annotations

import html
import re
import shutil
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PPTX = ROOT / "build/07-pagerank-algorithm.pptx"

A14_NS = "http://schemas.microsoft.com/office/drawing/2010/main"
M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math"


EQUATIONS: dict[str, list[str]] = {
    "GRAPH_DEF": ["G = (V, E)"],
    "WEB_GRAPH": ["V = {pages},    E = {hyperlinks}"],
    "GAMMA_DEF": ["Γ(p) = {q : p → q}"],
    "OUTDEG_DEF": ["|Γ(p)| = outdeg(p)"],
    "RANK_SUM": ["∑_(p∈V) PR(p) = 1"],
    "RANK_FLOW": ["0.30 / 3 = 0.10"],
    "INITIAL_RANK": ["PR₀(p) = 1 / N"],
    "CONVERGENCE": ["∑_(p∈V) |PRₜ₊₁(p) - PRₜ(p)| < ε"],
    "SIMPLE_UPDATE": [
        "PRₜ₊₁(p) = ∑_(q→p) PRₜ(q) / |Γ(q)|",
    ],
    "EXAMPLE_V": ["V = {A, B, C}"],
    "EXAMPLE_EDGES": ["A → B,    A → C,    B → C,    C → A"],
    "EXAMPLE_GAMMA": ["Γ(A) = {B,C},    Γ(B) = {C},    Γ(C) = {A}"],
    "EXAMPLE_OUTDEG": ["|Γ(A)| = 2,    |Γ(B)| = 1,    |Γ(C)| = 1"],
    "EXAMPLE_INIT": ["PR₀(A) = PR₀(B) = PR₀(C) = 1/3"],
    "ITER1_DISTRIBUTE": [
        "A → B: (1/3)/2 = 1/6,    A → C: (1/3)/2 = 1/6",
        "B → C: (1/3)/1 = 1/3,    C → A: (1/3)/1 = 1/3",
    ],
    "ITER1_COLLECT": [
        "PR₁(A) = 1/3,    PR₁(B) = 1/6,    PR₁(C) = 1/6 + 1/3 = 1/2",
    ],
    "ITER2_INPUT": ["PR₁(A)=1/3,    PR₁(B)=1/6,    PR₁(C)=1/2"],
    "ITER2_DISTRIBUTE": [
        "A → B: (1/3)/2 = 1/6,    A → C: (1/3)/2 = 1/6",
        "B → C: (1/6)/1 = 1/6,    C → A: (1/2)/1 = 1/2",
    ],
    "ITER2_COLLECT": [
        "PR₂(A) = 1/2,    PR₂(B) = 1/6,    PR₂(C) = 1/6 + 1/6 = 1/3",
    ],
    "TRANSITION_DEF": [
        "Mᵢⱼ = 1/outdeg(j)  if page j links to page i",
        "Mᵢⱼ = 0            otherwise",
    ],
    "TRANSITION_MATRIX": [
        "M = [ 0    0    1 ]",
        "    [ 1/2  0    0 ]",
        "    [ 1/2  1    0 ]",
    ],
    "MATRIX_UPDATE": ["rₜ₊₁ = M rₜ"],
    "STATIONARY": ["r = M r"],
    "DANGLING": ["D → ∅"],
    "DAMPING_VALUE": ["d = 0.85"],
    "DAMPED_FORMULA": [
        "PRₜ₊₁(p) = (1-d)/N",
        "        + d ( ∑_(q→p) PRₜ(q)/|Γ(q)| + Mₜ/N )",
    ],
    "DAMPED_GRAPH": ["A→B,  A→C,  B→C,  C→A,  D→∅"],
    "DAMPED_INIT": ["N=4,  PR₀(A)=PR₀(B)=PR₀(C)=PR₀(D)=0.25,  d=0.85"],
    "DANGLING_MASS": ["M₀ = PR₀(D) = 0.25"],
    "DANGLING_SHARE": ["M₀/N = 0.25/4 = 0.0625"],
    "TELEPORT": ["(1-d)/N = (1-0.85)/4 = 0.0375"],
    "INCOMING": [
        "in(A)=0.25,  in(B)=0.125,  in(C)=0.125+0.25=0.375,  in(D)=0",
    ],
    "DAMPED_APPLY": ["PR₁(p)=0.0375 + 0.85(in(p)+0.0625)"],
    "DAMPED_TOTAL": ["0.3031 + 0.1969 + 0.4094 + 0.0906 = 1.0000"],
    "RECORD": ["(page, current rank, adjacency list)"],
    "MAPPER_INPUT": ["(p, PRₜ(p), Γ(p))"],
    "MAPPER_EMIT": ["for each q ∈ Γ(p): emit(q, PRₜ(p)/|Γ(p)|)"],
    "MAPPER_STRUCTURE": ["emit(p, AdjacencyList(Γ(p)))"],
    "MAPPER_DANGLING": ["add PRₜ(p) to global dangling mass"],
    "REDUCER_INPUT": ["(p, [values grouped by key p])"],
    "SUM_IN": ["sum_in(p) = ∑ numeric contributions received by p"],
    "REDUCER_UPDATE": ["PRₜ₊₁(p) = (1-d)/N + d(sum_in(p) + Mₜ/N)"],
    "REDUCER_EMIT": ["emit(p, PRₜ₊₁(p), Γ(p))"],
    "CONVERGENCE_DIFF": ["|PRₜ₊₁(p) - PRₜ(p)|"],
    "SCALED_DANGLING": ["10¹² · Mₜ"],
    "SHUFFLE_COST": ["O(|E|) per iteration"],
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
    size = 2000 if longest > 70 else 2200
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
    count = patch_pptx(PPTX)
    print(f"Patched {count} native PowerPoint equation placeholders in {PPTX}")
