from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
W17 = ROOT / "lectures" / "17-language-models" / "charts"
W18 = ROOT / "lectures" / "18-llm-systems-rag-agents" / "charts"

COLORS = {
    "ink": "#172033",
    "muted": "#637083",
    "grid": "#D8DEE9",
    "blue": "#2F5BEA",
    "teal": "#00A7A5",
    "green": "#1B9E77",
    "amber": "#F5A524",
    "coral": "#F25F5C",
    "purple": "#7C3AED",
    "bg": "#F7F9FC",
    "panel": "#FFFFFF",
}


def ensure_dirs() -> None:
    for folder in (W17, W18):
        folder.mkdir(parents=True, exist_ok=True)


def setup_style() -> None:
    plt.rcParams.update(
        {
            "figure.figsize": (16, 9),
            "figure.dpi": 160,
            "savefig.dpi": 220,
            "font.family": "DejaVu Sans",
            "axes.facecolor": COLORS["panel"],
            "figure.facecolor": COLORS["bg"],
            "axes.edgecolor": COLORS["grid"],
            "axes.labelcolor": COLORS["ink"],
            "xtick.color": COLORS["muted"],
            "ytick.color": COLORS["muted"],
            "axes.titleweight": "bold",
            "axes.titlesize": 22,
            "axes.labelsize": 14,
        }
    )


def save_pair(fig: plt.Figure, base: Path) -> None:
    fig.tight_layout(pad=2.2)
    fig.savefig(base.with_suffix(".png"), facecolor=fig.get_facecolor())
    fig.savefig(base.with_suffix(".svg"), facecolor=fig.get_facecolor())
    plt.close(fig)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.strip() + "\n", encoding="utf-8")


def render_svg_to_png(svg_path: Path) -> None:
    rsvg = shutil.which("rsvg-convert")
    if not rsvg:
        return
    png_path = svg_path.with_suffix(".png")
    subprocess.run([rsvg, "-w", "1600", "-h", "900", str(svg_path), "-o", str(png_path)], check=True)


def render_dot(dot_path: Path) -> None:
    dot = shutil.which("dot")
    if not dot:
        return
    subprocess.run([dot, "-Tsvg", str(dot_path), "-o", str(dot_path.with_suffix(".svg"))], check=True)
    render_svg_to_png(dot_path.with_suffix(".svg"))


def add_title(ax: plt.Axes, title: str, subtitle: str | None = None) -> None:
    ax.set_title(title, loc="left", color=COLORS["ink"], pad=18)
    if subtitle:
        ax.text(
            0,
            1.03,
            subtitle,
            transform=ax.transAxes,
            fontsize=13,
            color=COLORS["muted"],
            ha="left",
            va="bottom",
        )


def draw_matrix(ax: plt.Axes, data: np.ndarray, rows: list[str], cols: list[str], title: str) -> None:
    im = ax.imshow(data, cmap="YlGnBu", vmin=0, vmax=max(1, float(data.max())))
    ax.set_xticks(range(len(cols)), cols, rotation=30, ha="right")
    ax.set_yticks(range(len(rows)), rows)
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            value = data[i, j]
            label = f"{value:.2f}" if value else "-"
            color = "white" if value > 0.55 else COLORS["ink"]
            ax.text(j, i, label, ha="center", va="center", fontsize=12, color=color, weight="bold")
    ax.set_title(title, loc="left", color=COLORS["ink"], pad=18)
    ax.figure.colorbar(im, ax=ax, shrink=0.76, label="probability / attention weight")


def week17_bigram_heatmap() -> None:
    rows = ["<s>", "vpn", "not", "working", "responding", "now"]
    cols = ["vpn", "printer", "not", "working", "responding", "now", "</s>"]
    data = np.array(
        [
            [0.75, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00],
            [0.00, 0.00, 0.67, 0.33, 0.00, 0.00, 0.00],
            [0.00, 0.00, 0.00, 0.33, 0.67, 0.00, 0.00],
            [0.00, 0.00, 0.00, 0.00, 0.00, 0.50, 0.50],
            [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.00],
            [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.00],
        ]
    )
    fig, ax = plt.subplots()
    draw_matrix(ax, data, rows, cols, "Bigram probability matrix")
    ax.set_xlabel("next token")
    ax.set_ylabel("history token")
    save_pair(fig, W17 / "w17_bigram_probability_heatmap")


def week17_perplexity_curve() -> None:
    p = np.linspace(0.05, 0.95, 200)
    perplexity = 1 / p
    fig, ax = plt.subplots()
    ax.plot(p, perplexity, color=COLORS["blue"], linewidth=4)
    ax.scatter([0.5], [2.0], s=140, color=COLORS["coral"], zorder=3)
    ax.annotate(
        "p=0.5 -> PP=2",
        xy=(0.5, 2),
        xytext=(0.56, 5.5),
        arrowprops={"arrowstyle": "->", "color": COLORS["coral"], "lw": 2},
        fontsize=14,
        color=COLORS["ink"],
    )
    add_title(
        ax,
        "Perplexity falls as average next-token probability rises",
        "For a constant probability model, PP = 1 / p",
    )
    ax.set_xlabel("average probability assigned to the correct next token")
    ax.set_ylabel("perplexity")
    ax.set_ylim(0, 22)
    ax.grid(True, color=COLORS["grid"], linewidth=1)
    save_pair(fig, W17 / "w17_perplexity_probability_curve")


def week17_attention_heatmap() -> None:
    tokens = ["vpn", "not", "working", "today"]
    weights = np.array(
        [
            [1.00, 0.00, 0.00, 0.00],
            [0.71, 0.29, 0.00, 0.00],
            [0.15, 0.72, 0.13, 0.00],
            [0.34, 0.31, 0.25, 0.10],
        ]
    )
    fig, ax = plt.subplots()
    draw_matrix(ax, weights, tokens, tokens, "Causal attention heatmap")
    ax.set_xlabel("attended token")
    ax.set_ylabel("current token")
    save_pair(fig, W17 / "w17_attention_heatmap")


def week17_context_budget() -> None:
    labels = ["4k model", "8k model", "16k model"]
    components = {
        "system": [700, 700, 700],
        "user": [80, 80, 80],
        "retrieved context": [2600, 5200, 11000],
        "output budget": [600, 900, 1600],
    }
    colors = [COLORS["blue"], COLORS["teal"], COLORS["amber"], COLORS["purple"]]
    fig, ax = plt.subplots()
    left = np.zeros(len(labels))
    y = np.arange(len(labels))
    for (name, values), color in zip(components.items(), colors):
        ax.barh(y, values, left=left, label=name, color=color, height=0.55)
        for i, value in enumerate(values):
            if value > 450:
                ax.text(left[i] + value / 2, i, f"{value}", ha="center", va="center", color="white", weight="bold")
        left += np.array(values)
    add_title(ax, "Context window budget", "Retrieved evidence competes with instructions and output tokens")
    ax.set_yticks(y, labels)
    ax.set_xlabel("tokens")
    ax.grid(axis="x", color=COLORS["grid"])
    ax.legend(ncol=4, loc="lower right", frameon=False)
    save_pair(fig, W17 / "w17_context_budget_stacked_bar")


def week17_latency_waterfall() -> None:
    steps = ["validation", "retrieval", "prefill", "decode", "logging"]
    values = np.array([80, 160, 280, 420, 40])
    starts = np.r_[0, np.cumsum(values)[:-1]]
    fig, ax = plt.subplots()
    ax.bar(steps, values, bottom=starts, color=[COLORS["teal"], COLORS["blue"], COLORS["amber"], COLORS["purple"], COLORS["green"]])
    for i, (start, value) in enumerate(zip(starts, values)):
        ax.text(i, start + value / 2, f"{value} ms", ha="center", va="center", color="white", weight="bold")
    ax.plot(range(len(steps)), starts + values, color=COLORS["ink"], marker="o", linewidth=2)
    add_title(ax, "LLM request latency waterfall", "Latency is the sum of orchestration, retrieval, model, and audit work")
    ax.set_ylabel("cumulative milliseconds")
    ax.grid(axis="y", color=COLORS["grid"])
    save_pair(fig, W17 / "w17_inference_latency_waterfall")


def week17_method_matrix_svg() -> None:
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="{COLORS['bg']}"/>
  <text x="90" y="90" font-family="Inter, Arial" font-size="44" font-weight="800" fill="{COLORS['ink']}">Method selection ladder</text>
  <text x="92" y="130" font-family="Inter, Arial" font-size="22" fill="{COLORS['muted']}">Start with the smallest representation that answers the operational question</text>
  <g font-family="Inter, Arial">
    <rect x="90" y="210" width="310" height="420" rx="24" fill="#FFFFFF" stroke="{COLORS['blue']}" stroke-width="5"/>
    <rect x="445" y="170" width="310" height="460" rx="24" fill="#FFFFFF" stroke="{COLORS['teal']}" stroke-width="5"/>
    <rect x="800" y="130" width="310" height="500" rx="24" fill="#FFFFFF" stroke="{COLORS['amber']}" stroke-width="5"/>
    <rect x="1155" y="90" width="310" height="540" rx="24" fill="#FFFFFF" stroke="{COLORS['purple']}" stroke-width="5"/>
    <text x="125" y="285" font-size="32" font-weight="800" fill="{COLORS['blue']}">TF-IDF</text>
    <text x="480" y="245" font-size="32" font-weight="800" fill="{COLORS['teal']}">N-grams</text>
    <text x="835" y="205" font-size="32" font-weight="800" fill="{COLORS['amber']}">Embeddings</text>
    <text x="1190" y="165" font-size="32" font-weight="800" fill="{COLORS['purple']}">Transformer LM</text>
    <text x="125" y="350" font-size="23" fill="{COLORS['ink']}">Rare terms</text>
    <text x="125" y="390" font-size="23" fill="{COLORS['ink']}">Interpretable</text>
    <text x="125" y="430" font-size="23" fill="{COLORS['ink']}">Sparse features</text>
    <text x="480" y="310" font-size="23" fill="{COLORS['ink']}">Local order</text>
    <text x="480" y="350" font-size="23" fill="{COLORS['ink']}">Negation</text>
    <text x="480" y="390" font-size="23" fill="{COLORS['ink']}">Phrase signals</text>
    <text x="835" y="270" font-size="23" fill="{COLORS['ink']}">Meaning distance</text>
    <text x="835" y="310" font-size="23" fill="{COLORS['ink']}">Semantic search</text>
    <text x="835" y="350" font-size="23" fill="{COLORS['ink']}">Dense vectors</text>
    <text x="1190" y="230" font-size="23" fill="{COLORS['ink']}">Generation</text>
    <text x="1190" y="270" font-size="23" fill="{COLORS['ink']}">Instruction following</text>
    <text x="1190" y="310" font-size="23" fill="{COLORS['ink']}">High cost/risk</text>
    <path d="M400 420 C430 420 420 420 445 420" stroke="{COLORS['muted']}" stroke-width="4" fill="none" marker-end="url(#arrow)"/>
    <path d="M755 400 C785 400 775 390 800 390" stroke="{COLORS['muted']}" stroke-width="4" fill="none" marker-end="url(#arrow)"/>
    <path d="M1110 370 C1140 370 1130 360 1155 350" stroke="{COLORS['muted']}" stroke-width="4" fill="none" marker-end="url(#arrow)"/>
  </g>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="{COLORS['muted']}"/>
    </marker>
  </defs>
  <text x="90" y="770" font-family="Inter, Arial" font-size="24" font-weight="700" fill="{COLORS['ink']}">Engineering rule:</text>
  <text x="315" y="770" font-family="Inter, Arial" font-size="24" fill="{COLORS['muted']}">upgrade only when the added cost buys measurable decision quality.</text>
</svg>
"""
    path = W17 / "w17_method_selection_ladder_figma_ready.svg"
    write_text(path, svg)
    render_svg_to_png(path)


def week17_markov_graph() -> None:
    dot = f"""
digraph G {{
  graph [bgcolor="{COLORS['bg']}", rankdir=LR, pad=0.35, nodesep=0.7, ranksep=1.0, size="16,9!", ratio=fill, labelloc=t, label="Bigram Markov transition graph", fontname="Arial", fontsize=34, fontcolor="{COLORS['ink']}"];
  node [shape=box, style="rounded,filled", fillcolor="#FFFFFF", color="{COLORS['blue']}", penwidth=2.5, fontname="Arial", fontsize=22, fontcolor="{COLORS['ink']}"];
  edge [color="{COLORS['muted']}", penwidth=2.4, fontname="Arial", fontsize=18, fontcolor="{COLORS['ink']}"];
  start [label="<s>", fillcolor="#E8F0FF"];
  vpn [label="vpn"];
  printer [label="printer"];
  not [label="not", fillcolor="#E9FBF8", color="{COLORS['teal']}"];
  working [label="working"];
  responding [label="responding"];
  now [label="now"];
  end [label="</s>", fillcolor="#F7EDFF", color="{COLORS['purple']}"];
  start -> vpn [label="3/4"];
  start -> printer [label="1/4"];
  vpn -> not [label="2/3"];
  vpn -> working [label="1/3"];
  printer -> not [label="1"];
  not -> working [label="1/3"];
  not -> responding [label="2/3"];
  working -> now [label="1/2"];
  working -> end [label="1/2"];
  responding -> end [label="1"];
  now -> end [label="1"];
}}
"""
    path = W17 / "w17_markov_transition_graph.dot"
    write_text(path, dot)
    render_dot(path)


def week17_canvas_html() -> None:
    html = """
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Week 17 Canvas - Generation Loop</title>
<style>
  body { margin:0; background:#f7f9fc; font-family:Inter, Arial, sans-serif; }
  canvas { width:100vw; height:56.25vw; max-height:100vh; display:block; margin:auto; background:#f7f9fc; }
</style>
<canvas id="c" width="1600" height="900"></canvas>
<script>
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const colors = { ink:"#172033", muted:"#637083", blue:"#2F5BEA", teal:"#00A7A5", amber:"#F5A524", purple:"#7C3AED", coral:"#F25F5C" };
function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle=stroke; ctx.stroke();
}
function arrow(x1,y1,x2,y2,color){
  ctx.strokeStyle=color; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2);
  ctx.lineTo(x2-18*Math.cos(a-.45), y2-18*Math.sin(a-.45));
  ctx.lineTo(x2-18*Math.cos(a+.45), y2-18*Math.sin(a+.45));
  ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}
ctx.fillStyle=colors.ink; ctx.font="800 46px Inter, Arial"; ctx.fillText("Next-token generation loop", 90, 95);
ctx.fillStyle=colors.muted; ctx.font="24px Inter, Arial"; ctx.fillText("The model repeats: tokenize -> score -> decode -> append", 92, 135);
const boxes = [
  ["Prompt",90,280,250,130,colors.blue], ["Tokenizer",430,280,250,130,colors.teal],
  ["Transformer",770,280,250,130,colors.purple], ["Decoder",1110,280,250,130,colors.amber],
  ["Append token",610,570,360,130,colors.coral]
];
for (const [label,x,y,w,h,color] of boxes){ roundRect(x,y,w,h,24,"#fff",color); ctx.fillStyle=color; ctx.font="800 30px Inter, Arial"; ctx.fillText(label,x+32,y+78); }
arrow(340,345,430,345,colors.muted); arrow(680,345,770,345,colors.muted); arrow(1020,345,1110,345,colors.muted);
arrow(1235,410,880,570,colors.muted); arrow(610,635,215,410,colors.muted);
ctx.fillStyle=colors.ink; ctx.font="700 27px Inter, Arial"; ctx.fillText("Probability distribution", 790, 505);
ctx.fillStyle=colors.muted; ctx.font="22px Inter, Arial"; ctx.fillText("not truth verification", 830, 540);
ctx.fillStyle=colors.ink; ctx.font="26px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.fillText('["vpn", "not"] -> "working"', 610, 760);
</script>
</html>
"""
    write_text(W17 / "w17_generation_loop_canvas.html", html)


def week18_similarity_bar() -> None:
    chunks = ["C1 VPN incident", "C3 SLA escalation", "C2 printer policy"]
    scores = [0.990, 0.987, 0.622]
    fig, ax = plt.subplots()
    bars = ax.barh(chunks[::-1], scores[::-1], color=[COLORS["amber"], COLORS["teal"], COLORS["blue"]])
    add_title(ax, "Retrieved chunk similarity ranking", "Top-k should include relevant evidence, not just fluent context")
    ax.set_xlim(0, 1.05)
    ax.set_xlabel("cosine similarity")
    ax.grid(axis="x", color=COLORS["grid"])
    for bar in bars:
        ax.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height() / 2, f"{bar.get_width():.3f}", va="center", fontsize=14, color=COLORS["ink"])
    save_pair(fig, W18 / "w18_similarity_ranking_bar")


def week18_precision_recall() -> None:
    k = np.arange(1, 9)
    recall = np.array([0.25, 0.50, 0.50, 0.75, 0.75, 1.00, 1.00, 1.00])
    precision = np.array([1.00, 1.00, 0.67, 0.75, 0.60, 0.67, 0.57, 0.50])
    fig, ax = plt.subplots()
    ax.plot(k, recall, marker="o", linewidth=4, color=COLORS["blue"], label="Recall@k")
    ax.plot(k, precision, marker="s", linewidth=4, color=COLORS["coral"], label="Precision@k")
    ax.fill_between(k, recall, alpha=0.08, color=COLORS["blue"])
    ax.fill_between(k, precision, alpha=0.08, color=COLORS["coral"])
    add_title(ax, "Retrieval quality trade-off", "Higher k can improve recall while lowering precision and increasing context cost")
    ax.set_xlabel("k retrieved chunks")
    ax.set_ylabel("metric value")
    ax.set_ylim(0, 1.08)
    ax.set_xticks(k)
    ax.grid(True, color=COLORS["grid"])
    ax.legend(frameon=False, loc="lower right")
    save_pair(fig, W18 / "w18_retrieval_precision_recall")


def week18_context_budget() -> None:
    configs = ["RAG k=2", "RAG k=5", "agent + tools"]
    components = {
        "system policy": [600, 600, 800],
        "user/task": [90, 90, 120],
        "retrieved chunks": [800, 2100, 1500],
        "tool trace": [0, 0, 900],
        "output": [300, 450, 500],
    }
    colors = [COLORS["blue"], COLORS["teal"], COLORS["amber"], COLORS["purple"], COLORS["coral"]]
    fig, ax = plt.subplots()
    bottom = np.zeros(len(configs))
    x = np.arange(len(configs))
    for (name, values), color in zip(components.items(), colors):
        ax.bar(x, values, bottom=bottom, label=name, color=color, width=0.58)
        bottom += np.array(values)
    for i, total in enumerate(bottom):
        ax.text(i, total + 80, f"{int(total)} tokens", ha="center", color=COLORS["ink"], fontsize=14, weight="bold")
    add_title(ax, "RAG and agent context budget", "Evidence and tool traces must fit before generation begins")
    ax.set_xticks(x, configs)
    ax.set_ylabel("tokens")
    ax.grid(axis="y", color=COLORS["grid"])
    ax.legend(ncol=5, frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.07))
    save_pair(fig, W18 / "w18_context_budget_stacked_bar")


def week18_latency_waterfall() -> None:
    steps = ["guardrails", "retrieval", "model", "tool call", "HITL wait", "audit"]
    values = np.array([90, 180, 620, 260, 900, 60])
    starts = np.r_[0, np.cumsum(values)[:-1]]
    colors = [COLORS["blue"], COLORS["teal"], COLORS["purple"], COLORS["amber"], COLORS["coral"], COLORS["green"]]
    fig, ax = plt.subplots()
    ax.bar(steps, values, bottom=starts, color=colors)
    ax.plot(range(len(steps)), starts + values, color=COLORS["ink"], marker="o", linewidth=2.2)
    for i, (start, value) in enumerate(zip(starts, values)):
        ax.text(i, start + value / 2, f"{value} ms", ha="center", va="center", color="white", weight="bold")
    add_title(ax, "Agent runtime latency waterfall", "HITL and tools can dominate latency more than the model")
    ax.set_ylabel("cumulative milliseconds")
    ax.grid(axis="y", color=COLORS["grid"])
    save_pair(fig, W18 / "w18_agent_latency_waterfall")


def week18_authority_matrix() -> None:
    levels = ["read-only", "recommend", "approve-write", "act"]
    actions = ["summarize", "score risk", "create ticket", "issue refund", "delete data"]
    matrix = np.array(
        [
            [2, 1, 0, 0, 0],
            [2, 2, 1, 0, 0],
            [2, 2, 2, 1, 0],
            [2, 2, 2, 1, 0],
        ]
    )
    cmap = plt.matplotlib.colors.ListedColormap(["#FFEBEE", "#FFF3E0", "#E0F2F1"])
    fig, ax = plt.subplots()
    ax.imshow(matrix, cmap=cmap, vmin=0, vmax=2)
    ax.set_xticks(range(len(actions)), actions, rotation=25, ha="right")
    ax.set_yticks(range(len(levels)), levels)
    labels = {0: "deny", 1: "HITL", 2: "allow"}
    colors = {0: "#B71C1C", 1: "#E65100", 2: "#004D40"}
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            ax.text(j, i, labels[matrix[i, j]], ha="center", va="center", weight="bold", color=colors[matrix[i, j]], fontsize=13)
    add_title(ax, "Agent authority matrix", "Authority should be explicit before tool access is granted")
    save_pair(fig, W18 / "w18_agent_authority_matrix")


def week18_risk_threshold() -> None:
    examples = ["routine login", "VIP delay", "confirmed outage", "enterprise SLA breach"]
    scores = np.array([0.15, 0.45, 0.70, 1.00])
    fig, ax = plt.subplots()
    ax.bar(examples, scores, color=[COLORS["green"], COLORS["amber"], COLORS["purple"], COLORS["coral"]], width=0.58)
    ax.axhline(0.4, color=COLORS["amber"], linestyle="--", linewidth=3, label="medium threshold")
    ax.axhline(0.8, color=COLORS["coral"], linestyle="--", linewidth=3, label="HITL/high threshold")
    for i, score in enumerate(scores):
        ax.text(i, score + 0.035, f"{score:.2f}", ha="center", fontsize=15, weight="bold", color=COLORS["ink"])
    add_title(ax, "Deterministic risk scoring", "The LLM extracts signals; policy code computes the decision")
    ax.set_ylabel("risk score")
    ax.set_ylim(0, 1.15)
    ax.grid(axis="y", color=COLORS["grid"])
    ax.legend(frameon=False, loc="upper left")
    save_pair(fig, W18 / "w18_risk_threshold_chart")


def week18_rag_svg() -> None:
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="{COLORS['bg']}"/>
  <text x="80" y="80" font-family="Inter, Arial" font-size="44" font-weight="800" fill="{COLORS['ink']}">RAG evidence pipeline</text>
  <text x="82" y="122" font-family="Inter, Arial" font-size="22" fill="{COLORS['muted']}">Freshness, metadata, and authorization are as important as the model response</text>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,8 L12,4 z" fill="{COLORS['muted']}"/>
    </marker>
  </defs>
  <g font-family="Inter, Arial" font-size="24" font-weight="700">
    <rect x="80" y="230" width="210" height="130" rx="22" fill="#FFFFFF" stroke="{COLORS['blue']}" stroke-width="5"/>
    <text x="125" y="305" fill="{COLORS['blue']}">Documents</text>
    <rect x="365" y="230" width="210" height="130" rx="22" fill="#FFFFFF" stroke="{COLORS['teal']}" stroke-width="5"/>
    <text x="420" y="305" fill="{COLORS['teal']}">Chunks</text>
    <rect x="650" y="230" width="210" height="130" rx="22" fill="#FFFFFF" stroke="{COLORS['amber']}" stroke-width="5"/>
    <text x="700" y="305" fill="{COLORS['amber']}">Embeddings</text>
    <rect x="935" y="230" width="210" height="130" rx="22" fill="#FFFFFF" stroke="{COLORS['purple']}" stroke-width="5"/>
    <text x="985" y="305" fill="{COLORS['purple']}">Vector Index</text>
    <rect x="1220" y="230" width="250" height="130" rx="22" fill="#FFFFFF" stroke="{COLORS['coral']}" stroke-width="5"/>
    <text x="1260" y="305" fill="{COLORS['coral']}">Grounded Answer</text>
    <path d="M290 295 L365 295" stroke="{COLORS['muted']}" stroke-width="5" marker-end="url(#arrow)"/>
    <path d="M575 295 L650 295" stroke="{COLORS['muted']}" stroke-width="5" marker-end="url(#arrow)"/>
    <path d="M860 295 L935 295" stroke="{COLORS['muted']}" stroke-width="5" marker-end="url(#arrow)"/>
    <path d="M1145 295 L1220 295" stroke="{COLORS['muted']}" stroke-width="5" marker-end="url(#arrow)"/>
  </g>
  <g font-family="Inter, Arial" font-size="22">
    <rect x="220" y="520" width="1160" height="170" rx="28" fill="#FFFFFF" stroke="#D8DEE9" stroke-width="3"/>
    <text x="275" y="585" fill="{COLORS['ink']}" font-weight="800">Required metadata contract</text>
    <text x="275" y="635" fill="{COLORS['muted']}">source_id · chunk_id · created_at · embedding_model · permissions · freshness_status · evidence_id</text>
  </g>
</svg>
"""
    path = W18 / "w18_rag_pipeline_figma_ready.svg"
    write_text(path, svg)
    render_svg_to_png(path)


def week18_guardrail_svg() -> None:
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="{COLORS['bg']}"/>
  <text x="90" y="90" font-family="Inter, Arial" font-size="44" font-weight="800" fill="{COLORS['ink']}">Enterprise agent control stack</text>
  <text x="92" y="130" font-family="Inter, Arial" font-size="22" fill="{COLORS['muted']}">Controls are layered because one boundary is never enough</text>
  <g font-family="Inter, Arial">
    <rect x="190" y="190" width="1220" height="105" rx="24" fill="#FFFFFF" stroke="{COLORS['blue']}" stroke-width="5"/>
    <text x="235" y="258" font-size="31" font-weight="800" fill="{COLORS['blue']}">1. Interaction defense</text>
    <text x="650" y="258" font-size="24" fill="{COLORS['muted']}">prompt boundaries · injection detection · output validation</text>
    <rect x="190" y="335" width="1220" height="105" rx="24" fill="#FFFFFF" stroke="{COLORS['teal']}" stroke-width="5"/>
    <text x="235" y="403" font-size="31" font-weight="800" fill="{COLORS['teal']}">2. Tool safety</text>
    <text x="650" y="403" font-size="24" fill="{COLORS['muted']}">typed inputs · allowlists · deterministic execution</text>
    <rect x="190" y="480" width="1220" height="105" rx="24" fill="#FFFFFF" stroke="{COLORS['amber']}" stroke-width="5"/>
    <text x="235" y="548" font-size="31" font-weight="800" fill="{COLORS['amber']}">3. Authority gates</text>
    <text x="650" y="548" font-size="24" fill="{COLORS['muted']}">RBAC · HITL · scoped credentials · step budget</text>
    <rect x="190" y="625" width="1220" height="105" rx="24" fill="#FFFFFF" stroke="{COLORS['purple']}" stroke-width="5"/>
    <text x="235" y="693" font-size="31" font-weight="800" fill="{COLORS['purple']}">4. Auditability</text>
    <text x="650" y="693" font-size="24" fill="{COLORS['muted']}">evidence IDs · run trace · decision receipt · rollback</text>
  </g>
</svg>
"""
    path = W18 / "w18_guardrail_control_stack_figma_ready.svg"
    write_text(path, svg)
    render_svg_to_png(path)


def week18_canvas_html() -> None:
    html = """
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Week 18 Canvas - Governed Agent Runtime</title>
<style>
  body { margin:0; background:#f7f9fc; font-family:Inter, Arial, sans-serif; }
  canvas { width:100vw; height:56.25vw; max-height:100vh; display:block; margin:auto; background:#f7f9fc; }
</style>
<canvas id="c" width="1600" height="900"></canvas>
<script>
const ctx = document.getElementById("c").getContext("2d");
const colors = { ink:"#172033", muted:"#637083", blue:"#2F5BEA", teal:"#00A7A5", amber:"#F5A524", purple:"#7C3AED", coral:"#F25F5C", green:"#1B9E77" };
function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle=stroke; ctx.stroke();
}
function arrow(x1,y1,x2,y2,color){
  ctx.strokeStyle=color; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2);
  ctx.lineTo(x2-18*Math.cos(a-.45), y2-18*Math.sin(a-.45));
  ctx.lineTo(x2-18*Math.cos(a+.45), y2-18*Math.sin(a+.45));
  ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}
ctx.fillStyle=colors.ink; ctx.font="800 46px Inter, Arial"; ctx.fillText("Governed agent runtime", 90, 95);
ctx.fillStyle=colors.muted; ctx.font="24px Inter, Arial"; ctx.fillText("Reasoning is allowed only inside policy and evidence boundaries", 92, 135);
const nodes = [
  ["Request",90,260,210,120,colors.blue], ["Guardrails",380,260,230,120,colors.coral],
  ["Authority",690,260,220,120,colors.amber], ["Tools/RAG",990,260,230,120,colors.teal],
  ["HITL",690,540,220,120,colors.purple], ["Audit",990,540,230,120,colors.green],
  ["Answer",1280,400,220,120,colors.blue]
];
for (const [label,x,y,w,h,color] of nodes){ roundRect(x,y,w,h,24,"#fff",color); ctx.fillStyle=color; ctx.font="800 29px Inter, Arial"; ctx.fillText(label,x+30,y+72); }
arrow(300,320,380,320,colors.muted); arrow(610,320,690,320,colors.muted); arrow(910,320,990,320,colors.muted);
arrow(1220,320,1280,450,colors.muted); arrow(1105,380,1105,540,colors.muted); arrow(910,600,990,600,colors.muted);
arrow(910,380,800,540,colors.muted); arrow(1220,600,1390,520,colors.muted);
ctx.fillStyle=colors.ink; ctx.font="700 27px Inter, Arial"; ctx.fillText("Every edge is a control decision, not a vibe.", 90, 760);
ctx.fillStyle=colors.muted; ctx.font="22px Inter, Arial"; ctx.fillText("Log: user, prompt version, evidence IDs, tool calls, policy result, final decision.", 90, 800);
</script>
</html>
"""
    write_text(W18 / "w18_governed_agent_runtime_canvas.html", html)


def write_manifests() -> None:
    w17 = """
# Week 17 Chart Asset Manifest

All assets are local and presentation-ready. SVG files are Figma-importable. PNG files are Canva/PowerPoint-ready. HTML files are HTML5 Canvas sources.

| Asset | Type | Suggested use |
|---|---|---|
| w17_markov_transition_graph.dot/svg/png | Graphviz | Bigram Markov transition explanation |
| w17_bigram_probability_heatmap.svg/png | Python chart | Probability matrix after count estimation |
| w17_perplexity_probability_curve.svg/png | Python chart | Cross-entropy/perplexity intuition |
| w17_attention_heatmap.svg/png | Python chart | Transformer attention numeric example |
| w17_context_budget_stacked_bar.svg/png | Python chart | Context-window engineering budget |
| w17_inference_latency_waterfall.svg/png | Python chart | LLM request latency decomposition |
| w17_method_selection_ladder_figma_ready.svg/png | Figma-ready SVG | Method selection from TF-IDF to LLM |
| w17_generation_loop_canvas.html | HTML5 Canvas | Visual generation loop source |
"""
    w18 = """
# Week 18 Chart Asset Manifest

All assets are local and presentation-ready. SVG files are Figma-importable. PNG files are Canva/PowerPoint-ready. HTML files are HTML5 Canvas sources.

| Asset | Type | Suggested use |
|---|---|---|
| w18_rag_pipeline_figma_ready.svg/png | Figma-ready SVG | RAG evidence pipeline |
| w18_similarity_ranking_bar.svg/png | Python chart | Retrieved chunk ranking |
| w18_retrieval_precision_recall.svg/png | Python chart | Retrieval metric trade-off |
| w18_context_budget_stacked_bar.svg/png | Python chart | RAG/agent token-budget comparison |
| w18_agent_latency_waterfall.svg/png | Python chart | Runtime latency decomposition |
| w18_agent_authority_matrix.svg/png | Python chart | Authority and HITL policy |
| w18_risk_threshold_chart.svg/png | Python chart | Deterministic risk thresholding |
| w18_guardrail_control_stack_figma_ready.svg/png | Figma-ready SVG | Enterprise control stack |
| w18_governed_agent_runtime_canvas.html | HTML5 Canvas | Governed agent runtime visual source |
"""
    write_text(W17 / "manifest.md", w17)
    write_text(W18 / "manifest.md", w18)


def main() -> None:
    ensure_dirs()
    setup_style()
    week17_markov_graph()
    week17_bigram_heatmap()
    week17_perplexity_curve()
    week17_attention_heatmap()
    week17_context_budget()
    week17_latency_waterfall()
    week17_method_matrix_svg()
    week17_canvas_html()
    week18_rag_svg()
    week18_similarity_bar()
    week18_precision_recall()
    week18_context_budget()
    week18_latency_waterfall()
    week18_authority_matrix()
    week18_risk_threshold()
    week18_guardrail_svg()
    week18_canvas_html()
    write_manifests()


if __name__ == "__main__":
    main()
