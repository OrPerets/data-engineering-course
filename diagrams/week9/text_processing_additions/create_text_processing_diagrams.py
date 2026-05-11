from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


OUT_DIR = Path(__file__).resolve().parent

# Okabe-Ito inspired, tuned for white slide backgrounds.
COLORS = {
    "blue": "#0072B2",
    "sky": "#56B4E9",
    "green": "#009E73",
    "orange": "#E69F00",
    "vermillion": "#D55E00",
    "purple": "#CC79A7",
    "yellow": "#F0E442",
    "ink": "#1F2937",
    "muted": "#6B7280",
    "line": "#334155",
    "panel": "#F8FAFC",
    "panel2": "#EEF6FF",
    "panel3": "#ECFDF5",
    "panel4": "#FFF7ED",
}


@dataclass(frozen=True)
class Box:
    x: float
    y: float
    w: float
    h: float
    text: str
    fc: str = COLORS["panel"]
    ec: str = COLORS["blue"]
    lw: float = 2.0
    fontsize: int = 15
    weight: str = "bold"


def setup_ax(title: str):
    fig, ax = plt.subplots(figsize=(13.333, 7.5), dpi=180)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.text(
        0.45,
        8.55,
        title,
        fontsize=20,
        weight="bold",
        color=COLORS["ink"],
        va="top",
        ha="left",
    )
    return fig, ax


def rounded_box(ax, box: Box):
    patch = FancyBboxPatch(
        (box.x, box.y),
        box.w,
        box.h,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        linewidth=box.lw,
        edgecolor=box.ec,
        facecolor=box.fc,
    )
    ax.add_patch(patch)
    ax.text(
        box.x + box.w / 2,
        box.y + box.h / 2,
        box.text,
        ha="center",
        va="center",
        fontsize=box.fontsize,
        color=COLORS["ink"],
        weight=box.weight,
        linespacing=1.2,
    )
    return patch


def arrow(ax, start, end, color=COLORS["line"], lw=2.2, text=None, rad=0.0, fontsize=11):
    arr = FancyArrowPatch(
        start,
        end,
        arrowstyle="-|>",
        mutation_scale=16,
        linewidth=lw,
        color=color,
        connectionstyle=f"arc3,rad={rad}",
    )
    ax.add_patch(arr)
    if text:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2
        ax.text(
            mx,
            my + 0.18,
            text,
            color=color,
            fontsize=fontsize,
            ha="center",
            va="bottom",
            bbox=dict(facecolor="white", edgecolor="none", pad=1.5),
        )
    return arr


def save(fig, name: str):
    for ext in ("png", "svg", "pdf"):
        kwargs = {}
        if ext == "png":
            kwargs["dpi"] = 300
        fig.savefig(OUT_DIR / f"{name}.{ext}", **kwargs)
    plt.close(fig)


def token_box(ax, x, y, text, fc="#FFFFFF", ec=COLORS["blue"], w=2.15, h=0.78):
    rounded_box(
        ax,
        Box(
            x=x,
            y=y,
            w=w,
            h=h,
            text=text,
            fc=fc,
            ec=ec,
            fontsize=15,
        ),
    )


def diagram_sliding_windows():
    fig, ax = setup_ax("Sliding windows: from tokens to n-grams")
    tokens = ["not", "working", "today"]
    xs = [3.2, 6.1, 9.0]
    for x, token in zip(xs, tokens):
        token_box(ax, x, 6.55, token, fc="#FFFFFF", ec=COLORS["blue"])
    for i in range(len(xs) - 1):
        arrow(ax, (xs[i] + 2.2, 6.94), (xs[i + 1] - 0.1, 6.94), color=COLORS["muted"], lw=1.5)

    rows = [
        ("unigrams, n = 1", ["not", "working", "today"], COLORS["sky"], 5.2),
        ("bigrams, n = 2", ["not working", "working today"], COLORS["green"], 3.65),
        ("trigram, n = 3", ["not working today"], COLORS["orange"], 2.1),
    ]
    for label, grams, color, y in rows:
        ax.text(1.0, y + 0.37, label, fontsize=15, weight="bold", color=COLORS["ink"], ha="left")
        start_x = 5.0 if len(grams) == 1 else 4.25
        for j, gram in enumerate(grams):
            w = 3.3 if len(gram) < 14 else 4.5
            rounded_box(
                ax,
                Box(
                    x=start_x + j * 3.95,
                    y=y,
                    w=w,
                    h=0.72,
                    text=gram,
                    fc="#FFFFFF",
                    ec=color,
                    fontsize=13,
                ),
            )

    rounded_box(
        ax,
        Box(
            x=1.0,
            y=0.5,
            w=14.0,
            h=0.86,
            text="For document length L, number of n-gram windows = max(L - n + 1, 0). Here L = 3.",
            fc="#F8FAFC",
            ec="#CBD5E1",
            fontsize=15,
            weight="normal",
        ),
    )
    save(fig, "01_sliding_ngram_windows")


def diagram_feature_vs_language_model():
    fig, ax = setup_ax("N-gram counts: features vs. language models")
    rounded_box(ax, Box(0.8, 5.55, 3.2, 1.0, "Ordered tokens", fc=COLORS["panel2"], ec=COLORS["blue"], fontsize=13))
    rounded_box(ax, Box(5.0, 5.55, 3.4, 1.0, "N-gram counts", fc="#FFFFFF", ec=COLORS["line"], fontsize=13))
    arrow(ax, (4.0, 6.05), (5.0, 6.05), text="sliding windows", fontsize=10)

    rounded_box(ax, Box(9.55, 6.35, 3.95, 0.9, "TF-IDF feature view", fc="#ECFDF5", ec=COLORS["green"], fontsize=13))
    rounded_box(ax, Box(9.55, 4.45, 3.95, 0.9, "Language-model view", fc="#FFF7ED", ec=COLORS["orange"], fontsize=13))
    arrow(ax, (8.4, 6.13), (9.55, 6.8), color=COLORS["green"])
    arrow(ax, (8.4, 5.9), (9.55, 4.9), color=COLORS["orange"])

    rounded_box(ax, Box(1.0, 2.25, 5.9, 1.1, "Output: (doc_id, ngram, TF-IDF)\nQuestion: which phrases separate documents?", fc="#F0FDF4", ec=COLORS["green"], fontsize=12, weight="normal"))
    rounded_box(ax, Box(8.1, 2.25, 5.9, 1.1, "Output: P(next token | history)\nQuestion: how likely is this sequence?", fc="#FFFBEB", ec=COLORS["orange"], fontsize=12, weight="normal"))
    arrow(ax, (11.5, 6.35), (4.0, 3.35), color=COLORS["green"], rad=0.18)
    arrow(ax, (11.5, 4.45), (11.0, 3.35), color=COLORS["orange"], rad=-0.08)

    rounded_box(ax, Box(1.0, 0.75, 14.0, 0.7, "Teaching point: n-grams are counted phrases. The objective determines whether they become document features or transition probabilities.", fc="#F8FAFC", ec="#CBD5E1", fontsize=12, weight="normal"))
    save(fig, "02_feature_vs_language_model")


def diagram_markov_chain_probabilities():
    fig, ax = setup_ax("Bigram language model: count-based transitions")
    nodes = {
        "<s>": (2.0, 5.1),
        "not": (5.0, 5.1),
        "working": (8.2, 6.35),
        "responding": (8.2, 4.0),
        "</s>": (12.0, 5.1),
        "now": (8.2, 2.1),
    }
    for label, (x, y) in nodes.items():
        fc = "#FFFFFF"
        ec = COLORS["blue"]
        if label in {"working", "responding", "now"}:
            ec = COLORS["green"]
        if label == "</s>":
            ec = COLORS["orange"]
        rounded_box(ax, Box(x - 0.95, y - 0.42, 1.9, 0.84, label, fc=fc, ec=ec, fontsize=15))

    arrow(ax, (2.95, 5.1), (4.05, 5.1), color=COLORS["blue"])
    arrow(ax, (5.95, 5.28), (7.25, 6.1), color=COLORS["green"], rad=0.08)
    arrow(ax, (5.95, 4.92), (7.25, 4.22), color=COLORS["green"], rad=-0.08)
    arrow(ax, (9.15, 6.35), (11.05, 5.35), color=COLORS["orange"], rad=-0.08)
    arrow(ax, (9.15, 4.0), (11.05, 4.86), color=COLORS["orange"], rad=0.08)
    arrow(ax, (2.1, 4.68), (7.25, 2.2), color=COLORS["muted"], rad=-0.2)
    arrow(ax, (9.15, 2.1), (11.05, 4.65), color=COLORS["muted"], rad=-0.25)

    ax.text(3.48, 5.72, "P(not | <s>) = 3/4", color=COLORS["blue"], fontsize=12, ha="center")
    ax.text(6.55, 6.0, "2/3", color=COLORS["green"], fontsize=13, ha="center")
    ax.text(6.55, 4.28, "1/3", color=COLORS["green"], fontsize=13, ha="center")
    ax.text(10.18, 6.0, "P(</s> | working) = 2/3", color=COLORS["orange"], fontsize=12, ha="center")
    ax.text(10.05, 4.25, "1", color=COLORS["orange"], fontsize=13, ha="center")
    ax.text(4.25, 2.7, "P(working | <s>) = 1/4", color=COLORS["muted"], fontsize=12, ha="center")
    ax.text(10.4, 2.8, "1", color=COLORS["muted"], fontsize=13, ha="center")

    rounded_box(
        ax,
        Box(
            x=1.0,
            y=0.72,
            w=14.0,
            h=0.88,
            text="Example sentence probability: P(not working </s> | <s>) = 3/4 x 2/3 x 2/3 = 1/3",
            fc="#F8FAFC",
            ec="#CBD5E1",
            fontsize=15,
            weight="normal",
        ),
    )
    save(fig, "03_markov_chain_bigram_probabilities")


def diagram_pipeline_execution_flow():
    fig, ax = setup_ax("N-gram pipeline execution flow")
    top = [
        ("Documents", "raw notes,\ntickets,\ncomments", COLORS["blue"], 1.0, 5.55),
        ("Tokenizer", "normalize\nsplit text", COLORS["sky"], 5.0, 5.55),
        ("Stable positions", "doc_id\ntoken\nposition", COLORS["green"], 9.0, 5.55),
    ]
    bottom = [
        ("Window generation", "LEAD/LAG\narray slices", COLORS["orange"], 3.0, 3.05),
        ("Counts", "(doc_id,\nngram)", COLORS["purple"], 7.0, 3.05),
        ("DF and scoring", "df(ngram)\nTF-IDF or P", COLORS["vermillion"], 11.0, 3.05),
    ]
    for title, body, color, x, y in top + bottom:
        rounded_box(ax, Box(x, y, 2.8, 1.15, f"{title}\n{body}", fc="#FFFFFF", ec=color, fontsize=11))
    arrow(ax, (3.8, 6.13), (5.0, 6.13))
    arrow(ax, (7.8, 6.13), (9.0, 6.13))
    arrow(ax, (10.4, 5.55), (4.4, 4.2), color=COLORS["orange"], rad=0.12, text="generate windows", fontsize=10)
    arrow(ax, (5.8, 3.63), (7.0, 3.63))
    arrow(ax, (9.8, 3.63), (11.0, 3.63))

    rounded_box(ax, Box(1.0, 1.15, 4.1, 0.9, "Cost driver: row expansion\nincreases shuffle volume", fc="#FFF7ED", ec=COLORS["orange"], fontsize=11, weight="normal"))
    rounded_box(ax, Box(5.95, 1.15, 4.1, 0.9, "Correctness driver:\ndeterministic order", fc="#ECFDF5", ec=COLORS["green"], fontsize=11, weight="normal"))
    rounded_box(ax, Box(10.9, 1.15, 4.1, 0.9, "Skew driver:\ncommon phrases are hot keys", fc="#FEF2F2", ec=COLORS["vermillion"], fontsize=11, weight="normal"))

    ax.text(
        0.8,
        0.45,
        "Practical message: n-gram generation changes row counts, shuffle volume, and partition balance.",
        fontsize=12,
        color=COLORS["muted"],
        ha="left",
    )
    save(fig, "04_ngram_pipeline_execution_flow")


def diagram_regex_tfidf_contract():
    fig, ax = setup_ax("Regex + TF-IDF: keep the feature contract clean")
    rounded_box(
        ax,
        Box(
            0.75,
            5.55,
            3.7,
            1.1,
            "Raw comment\n\"delay 10 days due\nto customs\"",
            fc="#FFFFFF",
            ec=COLORS["blue"],
            fontsize=11,
        ),
    )
    rounded_box(ax, Box(5.25, 6.0, 3.2, 0.9, "Regex extraction\nfield: delay_days", fc="#E0F2FE", ec=COLORS["sky"], fontsize=11))
    rounded_box(ax, Box(5.25, 4.35, 3.2, 0.9, "Mask/remove\nnumeric field", fc="#FFF7ED", ec=COLORS["orange"], fontsize=11))
    rounded_box(ax, Box(9.35, 6.0, 2.8, 0.9, "Structured field\ndelay_days = 10", fc="#ECFDF5", ec=COLORS["green"], fontsize=11))
    rounded_box(ax, Box(9.35, 4.35, 2.8, 0.9, "reason_text\n\"customs\"", fc="#FFFFFF", ec=COLORS["purple"], fontsize=11))
    rounded_box(ax, Box(12.9, 4.35, 2.45, 0.9, "TF-IDF\non reason_text", fc="#F5F3FF", ec=COLORS["purple"], fontsize=11))

    arrow(ax, (4.45, 6.18), (5.25, 6.45), text="parse", fontsize=10)
    arrow(ax, (4.45, 5.9), (5.25, 4.8), text="clean", fontsize=10)
    arrow(ax, (8.45, 6.45), (9.35, 6.45), color=COLORS["green"])
    arrow(ax, (8.45, 4.8), (9.35, 4.8), color=COLORS["purple"])
    arrow(ax, (12.15, 4.8), (12.9, 4.8), color=COLORS["purple"])

    rounded_box(
        ax,
        Box(
            1.1,
            2.1,
            6.0,
            1.0,
            "Good denominator\nTF uses reason_text only.",
            fc="#F0FDF4",
            ec=COLORS["green"],
            fontsize=12,
        ),
    )
    rounded_box(
        ax,
        Box(
            8.9,
            2.1,
            6.0,
            1.0,
            "Bad denominator\nDo not mix raw text, IDs, numbers,\nand feature text.",
            fc="#FEF2F2",
            ec=COLORS["vermillion"],
            fontsize=11,
        ),
    )
    save(fig, "05_regex_tfidf_contract_flow")


def diagram_embedding_versioning_drift():
    fig, ax = setup_ax("Embedding systems need versioning and drift monitoring")
    stages = [
        ("Incoming text", "ticket\nor query", COLORS["blue"], 0.75),
        ("Tokenizer v3", "same rules\ntrain + infer", COLORS["sky"], 3.35),
        ("Embedding\nmodel v5", "dense vector", COLORS["green"], 5.95),
        ("Vector store", "vectors with\nversion", COLORS["orange"], 8.55),
        ("Similarity", "cosine score\nvs history", COLORS["purple"], 11.15),
        ("Action", "cluster\nsearch\ntriage", COLORS["vermillion"], 13.75),
    ]
    for title, body, color, x in stages:
        rounded_box(ax, Box(x, 5.45, 2.0, 1.25, f"{title}\n{body}", fc="#FFFFFF", ec=color, fontsize=10))
    for i in range(len(stages) - 1):
        arrow(ax, (stages[i][3] + 2.0, 6.08), (stages[i + 1][3], 6.08), lw=2)

    rounded_box(ax, Box(3.7, 2.75, 2.85, 0.95, "Version registry\nmodel + tokenizer\n+ schema", fc="#F8FAFC", ec=COLORS["line"], fontsize=10))
    rounded_box(ax, Box(7.3, 2.75, 2.85, 0.95, "Quality monitors\nOOV rate\ncoverage", fc="#FFFBEB", ec=COLORS["orange"], fontsize=10))
    rounded_box(ax, Box(10.9, 2.75, 2.85, 0.95, "Drift monitors\nscore distribution\ncluster changes", fc="#FEF2F2", ec=COLORS["vermillion"], fontsize=10))
    arrow(ax, (5.12, 3.7), (6.95, 5.45), color=COLORS["line"], rad=0.05)
    arrow(ax, (8.72, 3.7), (9.55, 5.45), color=COLORS["orange"], rad=0.05)
    arrow(ax, (12.32, 3.7), (12.15, 5.45), color=COLORS["vermillion"], rad=-0.05)

    rounded_box(
        ax,
        Box(
            1.0,
            0.9,
            14.0,
            0.8,
            "Operational rule: do not compare vectors from incompatible model/tokenizer versions without an explicit migration.",
            fc="#F8FAFC",
            ec="#CBD5E1",
            fontsize=12,
            weight="normal",
        ),
    )
    save(fig, "06_embedding_versioning_drift_flow")


def main():
    for plotter in (
        diagram_sliding_windows,
        diagram_feature_vs_language_model,
        diagram_markov_chain_probabilities,
        diagram_pipeline_execution_flow,
        diagram_regex_tfidf_contract,
        diagram_embedding_versioning_drift,
    ):
        plotter()


if __name__ == "__main__":
    main()
