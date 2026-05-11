const presets = {
  lecture: {
    title: "Lecture graph",
    defaultUseDamping: false,
    nodes: ["A", "B", "C"],
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "C"],
      ["C", "A"],
    ],
    positions: {
      A: [175, 115],
      B: [545, 115],
      C: [360, 335],
    },
  },
  damping: {
    title: "Dangling page",
    defaultUseDamping: true,
    nodes: ["A", "B", "C", "D"],
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "C"],
      ["C", "A"],
    ],
    positions: {
      A: [160, 125],
      B: [520, 105],
      C: [340, 320],
      D: [600, 330],
    },
    dangling: ["D"],
  },
  trap: {
    title: "Spider trap",
    defaultUseDamping: false,
    nodes: ["A", "B", "C", "D"],
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "C"],
      ["C", "A"],
      ["C", "D"],
      ["D", "C"],
    ],
    positions: {
      A: [145, 125],
      B: [360, 82],
      C: [360, 315],
      D: [590, 315],
    },
    trap: ["C", "D"],
  },
};

const state = {
  presetName: "lecture",
  iteration: 0,
  ranks: {},
  previousRanks: {},
  incoming: {},
  nextRanks: {},
  damping: 0.85,
  useDamping: false,
};

const svg = document.querySelector("#graphSvg");
const pageCards = document.querySelector("#pageCards");
const iterationLabel = document.querySelector("#iterationLabel");
const lessonTitle = document.querySelector("#lesson-title");
const lessonText = document.querySelector("#lessonText");
const formulaText = document.querySelector("#formulaText");
const contributionList = document.querySelector("#contributionList");
const rankRows = document.querySelector("#rankRows");
const matrixBoard = document.querySelector("#matrixBoard");
const matrixFormulaText = document.querySelector("#matrixFormulaText");
const massBadge = document.querySelector("#massBadge");
const deltaBadge = document.querySelector("#deltaBadge");
const dampingSlider = document.querySelector("#dampingSlider");
const dampingValue = document.querySelector("#dampingValue");
const dampingToggle = document.querySelector("#dampingToggle");

document.querySelector("#nextStep").addEventListener("click", () => {
  runIteration();
  render();
});

document.querySelector("#prevStep").addEventListener("click", () => {
  if (state.iteration === 0) return;
  state.ranks = { ...state.previousRanks };
  state.iteration -= 1;
  computePreview();
  render();
});

document.querySelector("#resetStep").addEventListener("click", () => {
  resetRanks();
  render();
});

dampingSlider.addEventListener("input", () => {
  state.damping = Number(dampingSlider.value);
  dampingValue.textContent = state.damping.toFixed(2);
  computePreview();
  render();
});

dampingToggle.addEventListener("change", () => {
  state.useDamping = dampingToggle.checked;
  computePreview();
  render();
});

document.querySelectorAll(".preset-button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".preset-button")
      .forEach((item) => item.classList.toggle("is-active", item === button));
    state.presetName = button.dataset.preset;
    state.useDamping = Boolean(preset().defaultUseDamping);
    dampingToggle.checked = state.useDamping;
    resetRanks();
    render();
  });
});

function preset() {
  return presets[state.presetName];
}

function resetRanks() {
  const graph = preset();
  const initial = 1 / graph.nodes.length;
  state.iteration = 0;
  state.ranks = Object.fromEntries(graph.nodes.map((node) => [node, initial]));
  state.previousRanks = { ...state.ranks };
  computePreview();
}

function runIteration() {
  state.previousRanks = { ...state.ranks };
  computePreview();
  state.ranks = { ...state.nextRanks };
  state.iteration += 1;
  computePreview();
}

function computePreview() {
  const graph = preset();
  const nodes = graph.nodes;
  const outlinks = Object.fromEntries(nodes.map((node) => [node, []]));
  graph.edges.forEach(([from, to]) => outlinks[from].push(to));

  const incoming = Object.fromEntries(nodes.map((node) => [node, 0]));
  let danglingMass = 0;

  nodes.forEach((node) => {
    const links = outlinks[node];
    if (links.length === 0) {
      danglingMass += state.ranks[node];
      return;
    }
    const share = state.ranks[node] / links.length;
    links.forEach((target) => {
      incoming[target] += share;
    });
  });

  const d = state.useDamping ? state.damping : 1;
  const teleport = state.useDamping ? (1 - d) / nodes.length : 0;
  const danglingShare = state.useDamping ? danglingMass / nodes.length : 0;
  const nextRanks = {};

  nodes.forEach((node) => {
    nextRanks[node] = teleport + d * (incoming[node] + danglingShare);
  });

  state.incoming = incoming;
  state.nextRanks = nextRanks;
  state.danglingMass = danglingMass;
  state.teleport = teleport;
  state.danglingShare = danglingShare;
}

function render() {
  renderGraph();
  renderCards();
  renderLesson();
  renderTable();
  renderMatrix();
  const total = Object.values(state.ranks).reduce((sum, rank) => sum + rank, 0);
  const delta = sumDelta(state.ranks, state.nextRanks);
  massBadge.textContent = `mass ${format(total)}`;
  deltaBadge.textContent = `delta ${format(delta)}`;
  iterationLabel.textContent =
    state.iteration === 0
      ? "Iteration 0: all pages start equal."
      : `Iteration ${state.iteration}: ranks after collecting incoming mass.`;
}

function renderGraph() {
  const graph = preset();
  const topNode = graph.nodes.reduce((best, node) =>
    state.ranks[node] > state.ranks[best] ? node : best,
  graph.nodes[0]);
  const activeEdges = new Set(
    graph.edges.map(([from, to]) => `${from}-${to}`),
  );

  svg.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7b8d9b"></path>
      </marker>
      <marker id="arrowActive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#b85c00"></path>
      </marker>
    </defs>
  `;

  graph.edges.forEach(([from, to]) => {
    const [x1, y1] = graph.positions[from];
    const [x2, y2] = graph.positions[to];
    const { start, end } = trimLine(x1, y1, x2, y2, 54);
    const share = shareForEdge(from);
    const line = makeSvg("line", {
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      class: `edge-line ${activeEdges.has(`${from}-${to}`) ? "is-active" : ""}`,
      markerEnd: activeEdges.has(`${from}-${to}`) ? "url(#arrowActive)" : "url(#arrow)",
    });
    svg.appendChild(line);

    const label = makeSvg("text", {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2 - 8,
      class: "edge-label",
    });
    label.textContent = share > 0 ? format(share) : "";
    svg.appendChild(label);
  });

  graph.nodes.forEach((node) => {
    const [x, y] = graph.positions[node];
    const group = makeSvg("g", {});
    const isDangling = (graph.dangling || []).includes(node) || !hasOutlinks(node);
    const isTrap = (graph.trap || []).includes(node);
    const circle = makeSvg("circle", {
      cx: x,
      cy: y,
      r: 48,
      class: [
        "node-circle",
        node === topNode ? "is-top" : "",
        isDangling ? "is-dangling" : "",
        isTrap ? "is-trap" : "",
      ].join(" "),
    });
    const name = makeSvg("text", { x, y: y - 6, class: "node-text" });
    name.textContent = node;
    const rank = makeSvg("text", { x, y: y + 30, class: "node-rank" });
    rank.textContent = format(state.ranks[node]);
    group.append(circle, name, rank);
    svg.appendChild(group);
  });
}

function renderCards() {
  const graph = preset();
  const maxRank = Math.max(...graph.nodes.map((node) => state.ranks[node]));
  pageCards.innerHTML = graph.nodes
    .map((node) => {
      const width = Math.max(4, (state.ranks[node] / maxRank) * 100);
      const out = outlinksFor(node);
      const outText = out.length ? out.join(", ") : "none";
      return `
        <article class="page-card">
          <strong>Page ${node}: ${format(state.ranks[node])}</strong>
          <div class="rank-bar" aria-hidden="true"><span style="width:${width}%"></span></div>
          <small>outlinks: ${outText}</small>
        </article>
      `;
    })
    .join("");
}

function renderLesson() {
  const graph = preset();
  const formula = state.useDamping
    ? "PR(t+1,p) = (1-d)/N + d * (incoming(p) + danglingMass/N)"
    : "PR(t+1,p) = sum over inlinks q: PR(t,q) / outdeg(q)";

  lessonTitle.textContent =
    state.iteration === 0
      ? "Rank starts as a probability distribution"
      : "Each iteration distributes, collects, and normalizes rank";

  lessonText.textContent = state.useDamping
    ? `Damping is active. With d=${state.damping.toFixed(2)}, each page receives teleportation mass ${format(state.teleport)} and dangling share ${format(state.danglingShare)} before the next rank is written.`
    : "Damping is off. Rank follows only the directed links, so dangling pages lose mass and spider traps can collect rank permanently.";

  formulaText.textContent = formula;
  matrixFormulaText.textContent = state.useDamping
    ? "r(t+1) = d * M * r(t) + teleportation + dangling share"
    : "r(t+1) = M * r(t)";

  const items = [];
  graph.edges.forEach(([from, to]) => {
    items.push(
      `<div class="contribution-item"><strong>${from} -> ${to}</strong> sends ${format(shareForEdge(from))} to page ${to}.</div>`,
    );
  });
  if (state.danglingMass > 0) {
    items.push(
      `<div class="contribution-item"><strong>Dangling mass</strong> ${format(state.danglingMass)} is redistributed as ${format(state.danglingShare)} per page.</div>`,
    );
  }
  contributionList.innerHTML = items.join("");
}

function renderTable() {
  const graph = preset();
  rankRows.innerHTML = graph.nodes
    .map((node) => {
      return `
        <tr>
          <td><strong>${node}</strong></td>
          <td>${format(state.ranks[node])}</td>
          <td>${format(state.incoming[node])}</td>
          <td>${format(state.nextRanks[node])}</td>
        </tr>
      `;
    })
    .join("");
}

function renderMatrix() {
  const graph = preset();
  const nodes = graph.nodes;
  const cols = nodes.length + 1;
  matrixBoard.innerHTML = "";
  matrixBoard.style.gridTemplateColumns = `repeat(${cols}, minmax(58px, auto))`;

  const header = ["M", ...nodes.map((node) => `from ${node}`)];
  header.forEach((value) => matrixBoard.appendChild(matrixCell(value, "header")));

  nodes.forEach((to) => {
    matrixBoard.appendChild(matrixCell(`to ${to}`, "header"));
    nodes.forEach((from) => {
      const out = outlinksFor(from);
      const value = out.includes(to) ? 1 / out.length : 0;
      matrixBoard.appendChild(matrixCell(formatMatrix(value), value ? "nonzero" : ""));
    });
  });
}

function matrixCell(text, className) {
  const cell = document.createElement("div");
  cell.className = `matrix-cell ${className}`;
  cell.textContent = text;
  return cell;
}

function outlinksFor(node) {
  return preset()
    .edges.filter(([from]) => from === node)
    .map(([, to]) => to);
}

function hasOutlinks(node) {
  return outlinksFor(node).length > 0;
}

function shareForEdge(node) {
  const out = outlinksFor(node);
  return out.length ? state.ranks[node] / out.length : 0;
}

function trimLine(x1, y1, x2, y2, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  return {
    start: { x: x1 + ux * radius, y: y1 + uy * radius },
    end: { x: x2 - ux * radius, y: y2 - uy * radius },
  };
}

function makeSvg(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "markerEnd") {
      el.setAttribute("marker-end", value);
    } else {
      el.setAttribute(key, value);
    }
  });
  return el;
}

function format(value) {
  return Number(value).toFixed(4);
}

function formatMatrix(value) {
  if (value === 0) return "0";
  if (value === 1) return "1";
  if (value === 0.5) return "1/2";
  return value.toFixed(2);
}

function sumDelta(a, b) {
  return Object.keys(a).reduce((sum, key) => sum + Math.abs(a[key] - b[key]), 0);
}

resetRanks();
render();
