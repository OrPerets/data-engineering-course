(function () {
  const data = window.practice4VisualizerData;
  const state = {
    step: 1,
    showTechnicalFields: false,
    selected: null
  };

  const cyHost = document.getElementById("cy");
  const stepButtonsHost = document.getElementById("stepButtons");
  const stepBoardHost = document.getElementById("stepBoard");
  const traceButtonsHost = document.getElementById("traceButtons");
  const layerRailHost = document.getElementById("layerRail");
  const lineageButtonsHost = document.getElementById("lineageButtons");
  const detailsHost = document.getElementById("detailsContent");
  const stepBadge = document.getElementById("stepBadge");
  const stepTitle = document.getElementById("stepTitle");
  const stepSummary = document.getElementById("stepSummary");
  const stepScript = document.getElementById("stepScript");
  const stepConcept = document.getElementById("stepConcept");
  const transformBoard = document.getElementById("transformBoard");
  const transformCount = document.getElementById("transformCount");
  const subflowBoard = document.getElementById("subflowBoard");
  const fitButton = document.getElementById("fitButton");
  const resetButton = document.getElementById("resetButton");
  const techToggle = document.getElementById("techToggle");
  const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
  let cy;
  let flowAnimationFrame = null;
  let resizeTimer = null;

  const kindLabels = {
    source: "Sources",
    staging: "Raw Staging",
    view: "Cleaned Views",
    dwh: "Dimensions",
    fact: "Fact",
    analytics: "Analytics"
  };

  const typeMeta = {
    COPY: { label: "COPY", icon: "=", hebrew: "העתקה" },
    CLEAN: { label: "CLEAN", icon: "~", hebrew: "ניקוי" },
    DEDUP: { label: "DEDUP", icon: "1", hebrew: "בחירת אחרון" },
    MAP: { label: "MAP", icon: "#", hebrew: "מיפוי" },
    JOIN: { label: "JOIN", icon: "+", hebrew: "חיבור" },
    CALC: { label: "CALC", icon: "fx", hebrew: "חישוב" },
    MERGE: { label: "MERGE", icon: "M", hebrew: "טעינה חוזרת" },
    AGG: { label: "AGG", icon: "S", hebrew: "איגום" },
    WINDOW: { label: "WIN", icon: "W", hebrew: "חלון" }
  };

  const schemaOrder = ["sources", "staging", "dwh", "analytics"];
  const objectTypeOrder = ["TABLE", "VIEW", "DIM TABLE", "FACT TABLE", "QUERY"];

  const compactPositions = {
    "sources.orders_src": { x: 0, y: 0 },
    "sources.order_items_src": { x: 0, y: 108 },
    "sources.customers_src": { x: 0, y: 216 },
    "sources.returns_src": { x: 0, y: 324 },
    "staging.orders_src": { x: 292, y: 0 },
    "staging.order_items_src": { x: 292, y: 108 },
    "staging.customers_src": { x: 292, y: 216 },
    "staging.returns_src": { x: 292, y: 324 },
    "staging.v_orders_latest": { x: 530, y: 0 },
    "staging.v_order_items_latest": { x: 530, y: 108 },
    "staging.v_customers_latest": { x: 530, y: 216 },
    "staging.v_returns_agg": { x: 530, y: 324 },
    "dwh.dim_date": { x: 808, y: 0 },
    "dwh.dim_channel": { x: 808, y: 108 },
    "dwh.dim_product": { x: 808, y: 216 },
    "dwh.dim_customer": { x: 808, y: 324 },
    "dwh.fact_sales": { x: 1080, y: 170 },
    "analytics.daily_net_revenue": { x: 1350, y: 0 },
    "analytics.fulfillment_rate": { x: 1350, y: 96 },
    "analytics.monthly_segment_revenue": { x: 1350, y: 192 },
    "analytics.top_products": { x: 1350, y: 288 },
    "analytics.validation_checkpoint": { x: 1350, y: 384 }
  };

  function objectName(id) {
    return String(id).split(".").pop();
  }

  function cssToken(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function schemaParentId(schema) {
    return `schema:${schema}`;
  }

  function schemaName(node) {
    if (node.kind === "source") {
      return "sources";
    }
    if (node.kind === "view" || node.kind === "staging") {
      return "staging";
    }
    if (node.kind === "dwh" || node.kind === "fact") {
      return "dwh";
    }
    return "analytics";
  }

  function objectType(node) {
    const types = {
      source: "TABLE",
      staging: "TABLE",
      view: "VIEW",
      dwh: "DIM TABLE",
      fact: "FACT TABLE",
      analytics: "QUERY"
    };
    return types[node.kind] || "OBJECT";
  }

  function graphLabel(node) {
    return `${objectType(node)}\n${objectName(node.id)}`;
  }

  function edgeOperationLabel(edgeId) {
    const operations = Array.from(
      new Set(transformationsForEdge(edgeId).map((transformation) => transformation.type).filter(Boolean))
    );
    if (!operations.length) {
      return "";
    }
    if (operations.length <= 2) {
      return operations.join(" + ");
    }
    return `${operations.slice(0, 2).join(" + ")} +`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderInlineCode(text) {
    return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function isVisibleNode(node) {
    return node.step <= currentMaxNodeStep();
  }

  function currentStep() {
    return data.steps.find((step) => step.id === state.step) || data.steps[0];
  }

  function currentMaxNodeStep() {
    return currentStep()?.maxNodeStep || state.step;
  }

  function currentTransformationSteps() {
    return currentStep()?.transformationSteps || [];
  }

  function fieldFocusById(id) {
    return data.lineageFocuses?.find((focus) => focus.id === id);
  }

  function nodePosition(node) {
    const compact = compactPositions[node.id];
    if (compact) {
      return compact;
    }

    return {
      x: Math.round(node.position.x * 0.74),
      y: Math.round(node.position.y * 0.94)
    };
  }

  function toElements() {
    const visibleNodes = data.nodes.filter(isVisibleNode);
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const visibleSchemas = Array.from(new Set(visibleNodes.map(schemaName))).sort(
      (left, right) => schemaOrder.indexOf(left) - schemaOrder.indexOf(right)
    );
    const activeEdgeSteps = new Set(currentTransformationSteps());
    const visibleEdges = data.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target) &&
        edge.step <= currentMaxNodeStep()
    );

    const schemaParents = visibleSchemas.map((schema) => ({
      group: "nodes",
      data: {
        id: schemaParentId(schema),
        label: schema,
        schema,
        kind: "schema",
        isSchema: "yes"
      },
      selectable: false,
      grabbable: false,
      locked: true
    }));

    const nodes = visibleNodes.map((node) => ({
      group: "nodes",
      data: {
        id: node.id,
        label: node.label,
        graphLabel: graphLabel(node),
        schema: schemaName(node),
        parent: schemaParentId(schemaName(node)),
        objectType: objectType(node),
        kind: node.kind,
        isSchema: "no",
        step: node.step,
        muted: node.step < currentMaxNodeStep() && !activeEdgeSteps.has(node.step) ? "yes" : "no",
        active: node.step === 1 && state.step === 1 ? "yes" : activeEdgeSteps.has(node.step) ? "yes" : "no"
      },
      position: nodePosition(node)
    }));

    const edges = visibleEdges.map((edge) => ({
      group: "edges",
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.meaning,
        operation: edgeOperationLabel(edge.id),
        step: edge.step,
        muted: activeEdgeSteps.has(edge.step) ? "no" : "yes",
        active: activeEdgeSteps.has(edge.step) ? "yes" : "no"
      }
    }));

    return [...schemaParents, ...nodes, ...edges];
  }

  function createCy() {
    if (!window.cytoscape) {
      cyHost.innerHTML =
        '<div class="cy-error">Cytoscape.js לא נטען. בדקו חיבור אינטרנט או שמרו עותק מקומי של הספרייה.</div>';
      return;
    }

    cy = cytoscape({
      container: cyHost,
      elements: [],
      layout: { name: "preset", fit: true, padding: 45 },
      minZoom: 0.16,
      maxZoom: 1.7,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#f5f3ff",
            "border-color": "#7c3aed",
            "border-width": 3,
            color: "#17212b",
            content: "data(graphLabel)",
            "font-size": 13,
            "font-family": "Inter, Segoe UI, Arial, sans-serif",
            "font-weight": 800,
            "min-zoomed-font-size": 7,
            "text-halign": "center",
            "text-valign": "center",
            "text-wrap": "wrap",
            "text-max-width": 158,
            "line-height": 1.24,
            shape: "round-rectangle",
            width: 178,
            height: 68,
            "overlay-opacity": 0,
            "transition-duration": "160ms",
            "transition-property": "background-color, border-color, opacity, width, height"
          }
        },
        {
          selector: 'node[isSchema = "yes"]',
          style: {
            content: "data(label)",
            "background-color": "#f8fafc",
            "background-opacity": 0.72,
            "border-color": "#cbd5e1",
            "border-width": 2,
            color: "#334155",
            "font-size": 18,
            "font-weight": 900,
            "text-halign": "left",
            "text-valign": "top",
            "text-margin-x": 14,
            "text-margin-y": 12,
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.9,
            "text-background-padding": 4,
            "text-border-color": "#e2e8f0",
            "text-border-width": 1,
            "text-border-opacity": 1,
            padding: 22,
            shape: "round-rectangle",
            "overlay-opacity": 0,
            events: "no"
          }
        },
        { selector: 'node[schema = "sources"]', style: { "background-color": "#eff6ff", "border-color": "#2563eb" } },
        { selector: 'node[schema = "staging"]', style: { "background-color": "#f5f3ff", "border-color": "#7c3aed" } },
        { selector: 'node[schema = "dwh"]', style: { "background-color": "#ecfdf5", "border-color": "#0f766e" } },
        { selector: 'node[schema = "analytics"]', style: { "background-color": "#f8fafc", "border-color": "#475569" } },
        {
          selector: 'node[isSchema = "yes"][schema = "sources"]',
          style: { "background-color": "#eff6ff", "border-color": "#93c5fd", color: "#1d4ed8" }
        },
        {
          selector: 'node[isSchema = "yes"][schema = "staging"]',
          style: { "background-color": "#f5f3ff", "border-color": "#c4b5fd", color: "#5b21b6" }
        },
        {
          selector: 'node[isSchema = "yes"][schema = "dwh"]',
          style: { "background-color": "#ecfdf5", "border-color": "#99f6e4", color: "#0f766e" }
        },
        {
          selector: 'node[isSchema = "yes"][schema = "analytics"]',
          style: { "background-color": "#f8fafc", "border-color": "#cbd5e1", color: "#334155" }
        },
        {
          selector: 'node[objectType = "VIEW"]',
          style: {
            "border-style": "dashed",
            "border-width": 4,
            shape: "round-rectangle"
          }
        },
        {
          selector: 'node[objectType = "DIM TABLE"]',
          style: {
            shape: "round-rectangle"
          }
        },
        {
          selector: 'node[objectType = "FACT TABLE"]',
          style: {
            "background-color": "#dcfce7",
            "border-color": "#0f766e",
            "border-width": 5,
            width: 206,
            height: 78
          }
        },
        {
          selector: 'node[objectType = "QUERY"]',
          style: {
            shape: "round-tag",
            "border-style": "dotted"
          }
        },
        {
          selector: 'node[muted = "yes"]',
          style: {
            opacity: 0.45,
            "border-width": 2
          }
        },
        {
          selector: 'node[active = "yes"]',
          style: {
            "border-width": 4
          }
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#111827",
            "border-width": 5,
            opacity: 1
          }
        },
        {
          selector: "node.path-focus",
          style: {
            "border-color": "#f59e0b",
            "border-width": 6,
            opacity: 1
          }
        },
        {
          selector: "node.path-dim",
          style: {
            opacity: 0.42
          }
        },
        {
          selector: "node.flow-token",
          style: {
            width: 15,
            height: 15,
            "background-color": "#f59e0b",
            "border-color": "#ffffff",
            "border-width": 3,
            "z-index": 999,
            content: "",
            events: "no"
          }
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#7a8694",
            "target-arrow-color": "#7a8694",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            content: "",
            color: "#0f172a",
            "font-size": 9,
            "font-family": "Inter, Segoe UI, Arial, sans-serif",
            "font-weight": 900,
            "min-zoomed-font-size": 6,
            "text-rotation": "autorotate",
            "text-margin-y": -9,
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.94,
            "text-background-padding": 3,
            "text-border-color": "#cbd5e1",
            "text-border-width": 1,
            "text-border-opacity": 1,
            opacity: 0.78,
            "overlay-opacity": 0,
            "transition-duration": "160ms",
            "transition-property": "line-color, opacity, width"
          }
        },
        {
          selector: 'edge[muted = "yes"]',
          style: {
            opacity: 0.26,
            width: 2
          }
        },
        {
          selector: 'edge[active = "yes"]',
          style: {
            content: "data(operation)",
            "line-color": "#0f766e",
            "target-arrow-color": "#0f766e",
            width: 4,
            opacity: 0.95
          }
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#111827",
            "target-arrow-color": "#111827",
            width: 5,
            opacity: 1
          }
        },
        {
          selector: "edge.path-focus",
          style: {
            content: "data(operation)",
            "line-color": "#f59e0b",
            "target-arrow-color": "#f59e0b",
            width: 5,
            opacity: 1,
            "line-style": "dashed",
            "line-dash-pattern": [8, 5],
            "text-background-color": "#fffbeb",
            "text-border-color": "#f59e0b"
          }
        },
        {
          selector: "edge.path-dim",
          style: {
            opacity: 0.18,
            width: 2
          }
        }
      ]
    });

    cy.on("tap", "node", (event) => {
      if (isSchemaGraphNode(event.target)) {
        clearSelection();
        return;
      }

      state.selected = { type: "node", id: event.target.id() };
      renderTraceButtons();
      renderTransformationBoard();
      applyGraphFocus();
      renderDetails();
    });

    cy.on("tap", "edge", (event) => {
      state.selected = { type: "edge", id: event.target.id() };
      renderTraceButtons();
      renderTransformationBoard();
      applyGraphFocus();
      renderDetails();
    });

    cy.on("tap", (event) => {
      if (event.target === cy) {
        clearSelection();
      }
    });
  }

  function renderStepButtons() {
    stepButtonsHost.innerHTML = data.steps
      .map(
        (step, index) => `
          <button
            type="button"
            class="step-button ${state.step === step.id ? "is-active" : ""}"
            data-step="${step.id}"
          >
            <span class="step-number">${index + 1}</span>
            <span class="step-button-copy" title="${escapeHtml(step.summary)}">
              <strong>${escapeHtml(step.label)}</strong>
              <small>${escapeHtml(step.concept)}</small>
            </span>
          </button>
        `
      )
      .join("");

    stepButtonsHost.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.step = Number(button.dataset.step);
        state.selected = null;
        render();
        if (stepBoardHost) {
          stepBoardHost.scrollTop = 0;
        }
      });
    });
  }

  function selectedFieldId() {
    if (state.selected?.type === "field" || state.selected?.type === "column") {
      return state.selected.fieldId || state.selected.id;
    }
    return "";
  }

  function renderTraceButtons() {
    if (!traceButtonsHost) {
      return;
    }

    traceButtonsHost.innerHTML = (data.sampleTraces || [])
      .map((trace) => {
        const isActive = selectedFieldId() === trace.focusId;
        return `
          <button
            type="button"
            class="trace-button ${isActive ? "is-active" : ""}"
            data-trace="${escapeHtml(trace.id)}"
            title="${escapeHtml(trace.title || trace.label)}"
          >
            <span>${escapeHtml(trace.marker)}</span>
            ${escapeHtml(trace.label)}
          </button>
        `;
      })
      .join("");

    traceButtonsHost.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const trace = (data.sampleTraces || []).find((item) => item.id === button.dataset.trace);
        if (!trace || !fieldFocusById(trace.focusId)) {
          return;
        }
        if (trace.step) {
          state.step = trace.step;
        }
        selectField(trace.focusId);
      });
    });
  }

  function renderLayerRail() {
    if (!layerRailHost) {
      return;
    }

    layerRailHost.innerHTML = (data.layers || [])
      .map((layer) => {
        const isActive = state.step === layer.id;
        const isSeen = layer.id <= state.step;
        return `
          <button
            type="button"
            class="layer-pill layer-${escapeHtml(layer.kind)} ${isActive ? "is-active" : ""} ${isSeen ? "is-seen" : ""}"
            data-step="${layer.id}"
          >
            <span class="layer-dot" aria-hidden="true"></span>
            <strong>${escapeHtml(layer.label)}</strong>
          </button>
        `;
      })
      .join("");

    layerRailHost.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.step = Number(button.dataset.step);
        state.selected = null;
        render();
        if (stepBoardHost) {
          stepBoardHost.scrollTop = 0;
        }
      });
    });
  }

  function renderLineageButtons() {
    if (!lineageButtonsHost) {
      return;
    }

    lineageButtonsHost.innerHTML = (data.lineageFocuses || [])
      .map(
        (focus) => `
          <button
            type="button"
            class="lineage-button ${state.selected?.type === "field" && state.selected.id === focus.id ? "is-active" : ""}"
            data-field="${escapeHtml(focus.id)}"
            title="${escapeHtml(focus.description)}"
          >
            <span>${escapeHtml(focus.marker)}</span>
            ${escapeHtml(focus.label)}
          </button>
        `
      )
      .join("");

    lineageButtonsHost.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        selectField(button.dataset.field);
      });
    });
  }

  function renderStepPanel() {
    if (!stepTitle || !stepSummary || !stepScript || !stepConcept) {
      return;
    }

    const step = currentStep();

    if (stepBadge) {
      stepBadge.textContent = `Step ${step.id}`;
    }
    stepTitle.textContent = step.title;
    stepSummary.innerHTML = renderInlineCode(step.summary);
    stepScript.innerHTML = `<code>${escapeHtml(step.script)}</code>`;
    stepConcept.textContent = step.concept;
  }

  function renderModeButtons() {
    modeButtons.forEach((button) => {
      button.classList.toggle("is-active", false);
    });
  }

  function renderGraph() {
    if (!cy) {
      return;
    }

    stopFlowAnimation();
    cy.elements().remove();
    cy.add(toElements());
    cy.layout({ name: "preset", fit: true, padding: 26 }).run();
    applyGraphFocus();
    window.requestAnimationFrame(() => cy.fit(undefined, 26));
  }

  function nodeById(id) {
    return data.nodes.find((node) => node.id === id);
  }

  function edgeById(id) {
    return [...data.edges, ...data.erdEdges].find((edge) => edge.id === id);
  }

  function isSchemaGraphNode(graphNode) {
    return graphNode?.length && graphNode.data("isSchema") === "yes";
  }

  function clearSelection() {
    state.selected = null;
    if (cy) {
      cy.elements().unselect();
    }
    renderTraceButtons();
    renderTransformationBoard();
    applyGraphFocus();
    renderDetails();
  }

  function visibleEdgeIds() {
    if (!cy) {
      return new Set();
    }

    return new Set(cy.edges().map((edge) => edge.id()));
  }

  function factPathEdgeIds() {
    const visible = visibleEdgeIds();
    return data.edges
      .filter((edge) => visible.has(edge.id) && (edge.target === "dwh.fact_sales" || edge.source === "dwh.fact_sales"))
      .map((edge) => edge.id);
  }

  function dependencyEdgeIdsForNode(nodeId) {
    if (!cy || !nodeById(nodeId)) {
      return [];
    }

    const rootNode = cy.getElementById(nodeId);
    if (!rootNode.length || isSchemaGraphNode(rootNode)) {
      return [];
    }

    const visitedNodes = new Set([nodeId]);
    const visitedEdges = new Set();
    const queue = [nodeId];
    const maxDepth = 6;
    let depth = 0;

    while (queue.length && depth <= maxDepth) {
      const levelSize = queue.length;
      for (let index = 0; index < levelSize; index += 1) {
        const currentId = queue.shift();
        const currentNode = cy.getElementById(currentId);
        if (isSchemaGraphNode(currentNode)) {
          continue;
        }
        currentNode.connectedEdges().forEach((edge) => {
          visitedEdges.add(edge.id());
          [edge.source().id(), edge.target().id()].forEach((nextId) => {
            if (nodeById(nextId) && !visitedNodes.has(nextId)) {
              visitedNodes.add(nextId);
              queue.push(nextId);
            }
          });
        });
      }
      depth += 1;
    }

    return Array.from(visitedEdges);
  }

  function selectedFocusEdgeIds() {
    if (!state.selected || !cy) {
      return [];
    }

    if (state.selected.type === "field" || state.selected.type === "column") {
      const focus = fieldFocusById(state.selected.fieldId || state.selected.id);
      const visible = visibleEdgeIds();
      const fieldEdges = (focus?.edgeIds || []).filter((edgeId) => visible.has(edgeId));
      if (fieldEdges.length) {
        return fieldEdges;
      }
      if (state.selected.type === "column" && state.selected.nodeId) {
        return dependencyEdgeIdsForNode(state.selected.nodeId);
      }
      return [];
    }

    if (state.selected.type === "edge") {
      return cy.getElementById(state.selected.id).length ? [state.selected.id] : [];
    }

    if (state.selected.id === "dwh.fact_sales") {
      return factPathEdgeIds();
    }

    return dependencyEdgeIdsForNode(state.selected.id);
  }

  function selectedFocusNodeIds() {
    if (state.selected?.type !== "field" && state.selected?.type !== "column") {
      return new Set();
    }

    const focus = fieldFocusById(state.selected.fieldId || state.selected.id);
    const nodeIds = new Set((focus?.nodeIds || []).filter((nodeId) => cy?.getElementById(nodeId).length));
    if (state.selected.type === "column" && state.selected.nodeId && cy?.getElementById(state.selected.nodeId).length) {
      nodeIds.add(state.selected.nodeId);
    }
    return nodeIds;
  }

  function stopFlowAnimation() {
    if (flowAnimationFrame) {
      window.cancelAnimationFrame(flowAnimationFrame);
      flowAnimationFrame = null;
    }

    if (cy) {
      cy.nodes(".flow-token").remove();
    }
  }

  function startFlowAnimation(edgeIds) {
    stopFlowAnimation();

    const focusEdges = edgeIds.map((id) => cy.getElementById(id)).filter((edge) => edge.length);
    if (!focusEdges.length) {
      return;
    }

    focusEdges.forEach((edge, index) => {
      cy.add({
        group: "nodes",
        classes: "flow-token",
        data: { id: `flow-token-${edge.id()}` },
        position: edge.source().position(),
        selectable: false,
        grabbable: false,
        locked: true
      });
      cy.getElementById(`flow-token-${edge.id()}`).data("offset", index * 0.18);
    });

    const animate = (timestamp) => {
      focusEdges.forEach((edge) => {
        const token = cy.getElementById(`flow-token-${edge.id()}`);
        if (!token.length || !edge.length) {
          return;
        }

        const source = edge.source().position();
        const target = edge.target().position();
        const offset = token.data("offset") || 0;
        const progress = ((timestamp / 1700 + offset) % 1);
        token.position({
          x: source.x + (target.x - source.x) * progress,
          y: source.y + (target.y - source.y) * progress
        });
      });

      flowAnimationFrame = window.requestAnimationFrame(animate);
    };

    flowAnimationFrame = window.requestAnimationFrame(animate);
  }

  function applyGraphFocus() {
    if (!cy) {
      return;
    }

    cy.nodes().filter((node) => !node.hasClass("flow-token")).removeClass("path-focus path-dim");
    cy.edges().removeClass("path-focus path-dim");
    stopFlowAnimation();

    const edgeIds = selectedFocusEdgeIds();
    if (!edgeIds.length) {
      return;
    }

    const focusNodeIds = selectedFocusNodeIds();
    const includeNode = (nodeId) => {
      if (!nodeId) {
        return;
      }

      focusNodeIds.add(nodeId);
    };

    edgeIds.forEach((edgeId) => {
      const edge = cy.getElementById(edgeId);
      if (!edge.length) {
        return;
      }
      edge.addClass("path-focus");
      includeNode(edge.source().id());
      includeNode(edge.target().id());
    });

    if (state.selected?.type === "node" && cy.getElementById(state.selected.id).length) {
      includeNode(state.selected.id);
    }

    cy.nodes().filter((node) => !node.hasClass("flow-token")).forEach((node) => {
      if (isSchemaGraphNode(node)) {
        return;
      }
      node.addClass(focusNodeIds.has(node.id()) ? "path-focus" : "path-dim");
    });

    cy.edges().forEach((edge) => {
      if (!edge.hasClass("path-focus")) {
        edge.addClass("path-dim");
      }
    });

    startFlowAnimation(edgeIds);
  }

  function transformationsForCurrentStep() {
    const steps = new Set(currentTransformationSteps());
    return data.transformations.filter((transformation) => steps.has(transformation.step));
  }

  function selectedEdgeId() {
    return state.selected?.type === "edge" ? state.selected.id : null;
  }

  function transformationsForEdge(edgeId) {
    return data.transformations.filter((transformation) => transformation.edgeIds?.includes(edgeId));
  }

  function transformationsForField(fieldId) {
    const focus = fieldFocusById(fieldId);
    const edgeIds = new Set(focus?.edgeIds || []);
    return data.transformations.filter((transformation) =>
      transformation.step <= currentMaxNodeStep() && transformation.edgeIds?.some((edgeId) => edgeIds.has(edgeId))
    );
  }

  function transformationsForBoard() {
    if (state.selected?.type === "field" || state.selected?.type === "column") {
      const focused = transformationsForField(state.selected.fieldId || state.selected.id);
      return focused.length ? focused : transformationsForCurrentStep();
    }

    const edgeId = selectedEdgeId();
    const focused = edgeId ? transformationsForEdge(edgeId) : [];
    return focused.length ? focused : transformationsForCurrentStep();
  }

  function visibleFieldChips(transformation) {
    return (transformation.fieldChips || [...transformation.outputs, ...transformation.inputs]).slice(0, 4);
  }

  function renderPills(items, limit) {
    const visibleItems = Number.isInteger(limit) ? items.slice(0, limit) : items;
    return `
      <ul class="field-list">
        ${visibleItems
          .map((item) => {
            const focus = matchingFieldFocus(item);
            if (!focus) {
              return `<li><span class="code-pill">${escapeHtml(item)}</span></li>`;
            }
            return `
              <li>
                <button type="button" class="code-pill field-pill" data-field="${escapeHtml(focus.id)}">
                  ${escapeHtml(item)}
                </button>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function matchingFieldFocus(item) {
    const normalized = String(item).toLowerCase();
    return (data.lineageFocuses || []).find((focus) => {
      const aliases = [focus.id, focus.label, ...(focus.aliases || [])].map((alias) => String(alias).toLowerCase());
      return aliases.some((alias) => normalized.includes(alias));
    });
  }

  function bindFieldPills(root = document) {
    root.querySelectorAll("[data-field]").forEach((element) => {
      if (element.dataset.fieldBound === "true") {
        return;
      }
      element.dataset.fieldBound = "true";
      element.addEventListener("click", () => {
        selectField(element.dataset.field);
      });
    });
  }

  function renderRuleLine([before, after]) {
    return `
      <li class="rule-line">
        <code>${escapeHtml(before)}</code>
        <span class="rule-arrow" aria-hidden="true">-></span>
        <code>${escapeHtml(after)}</code>
      </li>
    `;
  }

  function renderVisualRules(transformation, limit = 2) {
    const rules = transformation.visualRules?.length
      ? transformation.visualRules
      : [[transformation.inputs[0] || transformation.source, transformation.outputs[0] || transformation.target]];

    return `
      <ul class="rule-strip">
        ${rules.slice(0, limit).map(renderRuleLine).join("")}
      </ul>
    `;
  }

  function sqlSnippet(transformation) {
    if (transformation.sqlBox?.length) {
      return transformation.sqlBox;
    }

    return [transformation.rule.replaceAll("`", "")];
  }

  function renderSqlBox(transformation) {
    return `
      <div class="sql-box" aria-label="SQL pattern">
        <span class="sql-box-label">SQL</span>
        <pre><code>${escapeHtml(sqlSnippet(transformation).join("\n"))}</code></pre>
      </div>
    `;
  }

  function renderTransformationMini(transformation) {
    const meta = typeMeta[transformation.type] || { label: transformation.type, icon: "", hebrew: "" };
    const [before, after] = transformation.visualRules?.[0] || [
      transformation.inputs[0] || transformation.source,
      transformation.outputs[0] || transformation.target
    ];

    return `
      <li class="mini-transform">
        <span class="transform-type transform-type-${escapeHtml(transformation.type.toLowerCase())}">
          ${escapeHtml(meta.label)}
        </span>
        <strong>${escapeHtml(transformation.shortTitle || transformation.title)}</strong>
        <span class="mini-rule">
          <code>${escapeHtml(before)}</code>
          <span aria-hidden="true">-></span>
          <code>${escapeHtml(after)}</code>
        </span>
      </li>
    `;
  }

  function renderExampleLine(transformation) {
    if (!transformation.visualRules?.length) {
      return "";
    }

    const [before, after] = transformation.visualRules[0];
    return `
      <div class="example-line">
        <span>example</span>
        <code>${escapeHtml(before)}</code>
        <strong aria-hidden="true">-></strong>
        <code>${escapeHtml(after)}</code>
      </div>
    `;
  }

  function renderLineagePath(focus) {
    return `
      <ol class="lineage-path">
        ${focus.path
          .map(
            ([source, action, target]) => `
              <li>
                <code>${escapeHtml(source)}</code>
                <span>${escapeHtml(action)}</span>
                <code>${escapeHtml(target)}</code>
              </li>
            `
          )
          .join("")}
      </ol>
    `;
  }

  const keyRoles = {
    "sources.orders_src": {
      PK: ["order_id"],
      BK: ["customer_ref"]
    },
    "sources.order_items_src": {
      KEY: ["order_id", "line_id"],
      FK: ["product_id"]
    },
    "sources.customers_src": {
      BK: ["customer_ref"]
    },
    "sources.returns_src": {
      PK: ["return_id"],
      KEY: ["order_id", "line_id"]
    },
    "staging.orders_src": {
      PK: ["order_id"],
      BK: ["customer_ref"],
      META: ["run_id"]
    },
    "staging.order_items_src": {
      KEY: ["order_id", "line_id"],
      FK: ["product_id"],
      META: ["run_id"]
    },
    "staging.customers_src": {
      BK: ["customer_ref"],
      META: ["run_id"]
    },
    "staging.returns_src": {
      PK: ["return_id"],
      KEY: ["order_id", "line_id"],
      META: ["run_id", "ingested_at"]
    },
    "staging.v_orders_latest": {
      PK: ["order_id"],
      BK: ["customer_ref_std"]
    },
    "staging.v_order_items_latest": {
      KEY: ["order_id", "line_id"],
      FK: ["product_id"]
    },
    "staging.v_customers_latest": {
      BK: ["customer_ref"]
    },
    "staging.v_returns_agg": {
      KEY: ["order_id", "line_id"],
      MEASURE: ["return_amount"]
    },
    "dwh.dim_date": {
      PK: ["date_key"],
      BK: ["calendar_date"]
    },
    "dwh.dim_channel": {
      PK: ["channel_key"],
      BK: ["channel_name"]
    },
    "dwh.dim_product": {
      PK: ["product_key"],
      BK: ["product_id"]
    },
    "dwh.dim_customer": {
      PK: ["customer_key"],
      BK: ["customer_ref"]
    },
    "dwh.fact_sales": {
      PK: ["order_id", "line_id"],
      FK: ["date_key", "product_key", "customer_key", "channel_key"],
      MEASURE: ["gross_revenue", "discount_amount", "return_amount", "net_revenue"]
    }
  };

  function columnRole(node, column) {
    if (!node || !column) {
      return "";
    }

    const roles = keyRoles[node.id] || {};
    const found = Object.entries(roles).find(([, columns]) => columns.includes(column));
    if (found) {
      return found[0];
    }

    if (node.kind === "analytics" && /revenue|rate|orders|total|sum/i.test(column)) {
      return "METRIC";
    }

    if (node.kind === "analytics") {
      return "GROUP";
    }

    return "";
  }

  function columnFocus(column) {
    return matchingFieldFocus(column);
  }

  function visibleColumnsForNode(node) {
    const columns = state.showTechnicalFields ? [...node.columns, ...node.technicalColumns] : node.columns;
    return Array.from(new Set(columns));
  }

  function renderColumnButton(node, column) {
    const role = columnRole(node, column);
    const focus = columnFocus(column);
    const isActive =
      state.selected?.type === "column" &&
      state.selected.nodeId === node.id &&
      state.selected.column === column;

    return `
      <button
        type="button"
        class="column-chip ${role ? `role-${escapeHtml(role.toLowerCase())}` : ""} ${focus ? "has-lineage" : ""} ${isActive ? "is-active" : ""}"
        data-node="${escapeHtml(node.id)}"
        data-column="${escapeHtml(column)}"
      >
        <span>${escapeHtml(column)}</span>
        ${role ? `<em>${escapeHtml(role)}</em>` : ""}
      </button>
    `;
  }

  function renderNodeCard(node) {
    const columns = visibleColumnsForNode(node);
    const keyColumns = columns.filter((column) => columnRole(node, column));
    const grainColumns = keyRoles[node.id]?.GRAIN || [];
    const schema = schemaName(node);
    const type = objectType(node);

    return `
      <article class="table-card table-card-${escapeHtml(node.kind)} schema-${escapeHtml(schema)} object-${escapeHtml(cssToken(type))}">
        <button type="button" class="table-card-head" data-node-card="${escapeHtml(node.id)}">
          <strong title="${escapeHtml(`${schema} · ${type}`)}">${escapeHtml(objectName(node.id))}</strong>
        </button>
        <div class="table-columns">
          ${columns.map((column) => renderColumnButton(node, column)).join("")}
        </div>
        ${
          grainColumns.length
            ? `<div class="grain-spotlight">
                <b>GRAIN</b>
                <code>${escapeHtml(grainColumns.join(" + "))}</code>
              </div>`
            : ""
        }
        ${
          keyColumns.length
            ? `<div class="key-row" aria-label="מפתחות">
                ${keyColumns
                  .map((column) => `<span><b>${escapeHtml(columnRole(node, column))}</b>${escapeHtml(column)}</span>`)
                  .join("")}
              </div>`
            : ""
        }
      </article>
    `;
  }

  function currentStepBoardNodes() {
    const seen = new Set();
    const step = currentStep();
    const nodeIds = (step.lanes || []).flatMap((lane) => lane.nodeIds || []);
    return nodeIds
      .map((nodeId) => nodeById(nodeId))
      .filter((node) => {
        if (!node || seen.has(node.id)) {
          return false;
        }
        seen.add(node.id);
        return true;
      });
  }

  function groupedStepBoardNodes(nodes) {
    const schemaMap = new Map();

    nodes.forEach((node) => {
      const schema = schemaName(node);
      const type = objectType(node);
      if (!schemaMap.has(schema)) {
        schemaMap.set(schema, new Map());
      }
      if (!schemaMap.get(schema).has(type)) {
        schemaMap.get(schema).set(type, []);
      }
      schemaMap.get(schema).get(type).push(node);
    });

    return Array.from(schemaMap.entries())
      .sort(([left], [right]) => schemaOrder.indexOf(left) - schemaOrder.indexOf(right))
      .map(([schema, typeMap]) => ({
        schema,
        typeGroups: Array.from(typeMap.entries())
          .sort(([left], [right]) => objectTypeOrder.indexOf(left) - objectTypeOrder.indexOf(right))
          .map(([type, groupNodes]) => ({ type, nodes: groupNodes }))
      }));
  }

  function renderSchemaObjectGroup(schema, group) {
    return `
      <div class="object-type-group object-${escapeHtml(cssToken(group.type))}">
        <div class="object-type-head">
          <strong title="${escapeHtml(`${schema} / ${group.type}`)}">${escapeHtml(`${schema} · ${group.type.replace(" TABLE", "")}`)}</strong>
          <span>${group.nodes.length}</span>
        </div>
        <div class="lane-grid">
          ${group.nodes.map(renderNodeCard).join("")}
        </div>
      </div>
    `;
  }

  function renderSchemaBoardGroup(schemaGroup) {
    return `
      <section class="schema-list-group schema-list-${escapeHtml(schemaGroup.schema)}">
        <div class="schema-list-head">
          <span class="schema-band-dot" aria-hidden="true"></span>
          <h3>${escapeHtml(schemaGroup.schema)}</h3>
        </div>
        ${schemaGroup.typeGroups.map((group) => renderSchemaObjectGroup(schemaGroup.schema, group)).join("")}
      </section>
    `;
  }

  function renderStepBoard() {
    if (!stepBoardHost) {
      return;
    }

    stepBoardHost.innerHTML = groupedStepBoardNodes(currentStepBoardNodes()).map(renderSchemaBoardGroup).join("");

    stepBoardHost.querySelectorAll("[data-node-card]").forEach((button) => {
      button.addEventListener("click", () => {
        selectNode(button.dataset.nodeCard);
      });
    });

    stepBoardHost.querySelectorAll("[data-column]").forEach((button) => {
      button.addEventListener("click", () => {
        selectColumn(button.dataset.node, button.dataset.column);
      });
    });
  }

  function renderTransformationCard(transformation, compact = false) {
    const meta = typeMeta[transformation.type] || { label: transformation.type, icon: "", hebrew: "" };
    const focused = selectedEdgeId() && transformation.edgeIds?.includes(selectedEdgeId());
    const title = transformation.shortTitle || transformation.title;

    return `
      <article
        class="transform-card ${compact ? "is-compact" : ""} ${focused ? "is-focused" : ""}"
        data-transform-id="${escapeHtml(transformation.id)}"
      >
        <div class="transform-card-head">
          <span class="transform-type transform-type-${escapeHtml(transformation.type.toLowerCase())}">
            <span class="transform-icon" aria-hidden="true">${escapeHtml(meta.icon)}</span>
            ${escapeHtml(meta.label)}
          </span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="chip-row" aria-label="שדות מרכזיים">
          ${visibleFieldChips(transformation)
            .map((chip) => {
              const focus = matchingFieldFocus(chip);
              return focus
                ? `<button type="button" class="code-pill field-pill" data-field="${escapeHtml(focus.id)}">${escapeHtml(chip)}</button>`
                : `<span class="code-pill">${escapeHtml(chip)}</span>`;
            })
            .join("")}
        </div>
        ${renderVisualRules(transformation, compact ? 1 : 2)}
        ${
          compact
            ? ""
            : `<details class="sql-toggle">
                <summary>SQL</summary>
                <div class="tile-flow" aria-label="זרימת טרנספורמציה">
                  <code>${escapeHtml(transformation.source)}</code>
                  <span class="flow-op">${escapeHtml(meta.hebrew || meta.label)}</span>
                  <code>${escapeHtml(transformation.target)}</code>
                </div>
                ${renderExampleLine(transformation)}
                ${renderSqlBox(transformation)}
              </details>`
        }
      </article>
    `;
  }

  function shouldShowFactSubflow(transformations) {
    return transformations.some((transformation) => transformation.step === 5);
  }

  function renderFactSubflow(transformations) {
    if (!subflowBoard) {
      return;
    }

    if (!shouldShowFactSubflow(transformations)) {
      subflowBoard.innerHTML = "";
      return;
    }

    const focusClass = (edgeIds) =>
      edgeIds.some((edgeId) => transformationsForEdge(edgeId).some((transformation) => transformations.includes(transformation)))
        ? " is-visible"
        : "";

    subflowBoard.innerHTML = `
      <section class="fact-subflow" aria-label="fact_sales mini flow">
        <div class="fact-subflow-head">
          <strong>views + dims -> fact_sales</strong>
        </div>
        <div class="fact-subflow-track">
          <button class="subflow-node subflow-source" type="button" data-edge="e16">
            <span>views</span>
            <code>v_orders_latest</code>
            <code>v_order_items_latest</code>
            <code>v_returns_agg</code>
          </button>
          <span class="subflow-arrow" aria-hidden="true">-></span>
          <button class="subflow-node subflow-processor${focusClass(["e18", "e19", "e20", "e21"])}" type="button" data-edge="e18">
            <span>JOIN</span>
            <code>business id -> surrogate key</code>
          </button>
          <span class="subflow-arrow" aria-hidden="true">-></span>
          <button class="subflow-node subflow-processor${focusClass(["e16", "e17"])}" type="button" data-edge="e16">
            <span>CALC</span>
            <code>gross - discount - return</code>
          </button>
          <span class="subflow-arrow" aria-hidden="true">-></span>
          <button class="subflow-node subflow-processor${focusClass(["e15", "e16", "e17"])}" type="button" data-edge="e17">
            <span>MERGE</span>
            <code>order_id + line_id</code>
          </button>
          <span class="subflow-arrow" aria-hidden="true">-></span>
          <button class="subflow-node subflow-target" type="button" data-node="dwh.fact_sales">
            <span>target</span>
            <code>fact_sales</code>
          </button>
        </div>
      </section>
    `;

    subflowBoard.querySelectorAll("[data-edge]").forEach((button) => {
      button.addEventListener("click", () => {
        window.practice4Visualizer.selectEdge(button.dataset.edge);
      });
    });

    subflowBoard.querySelectorAll("[data-node]").forEach((button) => {
      button.addEventListener("click", () => {
        window.practice4Visualizer.selectNode(button.dataset.node);
      });
    });
  }

  function scrollFocusedTransformationIntoView() {
    if (!transformBoard) {
      return;
    }

    const edgeId = selectedEdgeId();
    if (!edgeId) {
      return;
    }

    const focusedTransformation = transformationsForEdge(edgeId)[0];
    if (!focusedTransformation) {
      return;
    }

    window.requestAnimationFrame(() => {
      const tile = Array.from(transformBoard.querySelectorAll("[data-transform-id]")).find(
        (element) => element.dataset.transformId === focusedTransformation.id
      );
      tile?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
  }

  function renderTransformationBoard() {
    const edgeId = selectedEdgeId();
    const selected = Boolean(state.selected);
    const transformations = selected ? transformationsForBoard() : transformationsForCurrentStep();
    const visibleCards = selected ? transformations.slice(0, 4) : [];
    if (transformCount) {
      transformCount.textContent =
        !selected
          ? "Select item"
          : state.selected?.type === "field" || state.selected?.type === "column"
            ? "Column"
            : edgeId && transformations.length
              ? "Edge"
              : transformations.length === 1
                ? "1 rule"
                : `${transformations.length} rules`;
    }

    if (!transformations.length) {
      if (subflowBoard) {
        subflowBoard.innerHTML = "";
      }
      if (transformBoard) {
        transformBoard.innerHTML = "";
      }
      return;
    }

    renderFactSubflow(transformations);
    if (!transformBoard) {
      return;
    }

    transformBoard.innerHTML = selected
      ? `${visibleCards.map((transformation) => renderTransformationCard(transformation)).join("")}
        ${
          transformations.length > visibleCards.length
            ? `<p class="more-rules">${transformations.length - visibleCards.length} more related rules hidden to keep focus.</p>`
            : ""
        }`
      : "";
    bindFieldPills(transformBoard);
    scrollFocusedTransformationIntoView();
  }

  function renderNodeDetails(node) {
    if (!detailsHost) {
      return;
    }

    detailsHost.innerHTML = `
      <div class="summary-main">
        <span class="detail-kind">${escapeHtml(`${schemaName(node)} · ${objectType(node)}`)}</span>
        <h2 class="detail-title">${escapeHtml(node.id)}</h2>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Role</p>
        <p>${renderInlineCode(node.purpose)}</p>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Fields</p>
        ${renderPills(
          state.showTechnicalFields ? [...node.columns, ...node.technicalColumns] : node.columns,
          state.showTechnicalFields ? 10 : 6
        )}
      </div>
      <details class="detail-card sql-detail">
        <summary>SQL</summary>
        <div class="sql-detail-body">
          <p><strong>קובץ:</strong> <code>${escapeHtml(node.script)}</code></p>
          <p>${renderInlineCode(node.note)}</p>
        </div>
      </details>
    `;
    bindFieldPills(detailsHost);
  }

  function renderEdgeDetails(edge) {
    if (!detailsHost) {
      return;
    }

    const source = nodeById(edge.source);
    const target = nodeById(edge.target);
    const transformations = transformationsForEdge(edge.id);

    detailsHost.innerHTML = `
      <div class="summary-main">
        <span class="detail-kind">Flow</span>
        <h2>Edge</h2>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Path</p>
        <div class="edge-flow">
          <span>${escapeHtml(edge.source)}</span>
          <span class="edge-arrow">-></span>
          <span>${escapeHtml(edge.target)}</span>
        </div>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Meaning</p>
        <p>${renderInlineCode(edge.meaning)}</p>
      </div>
      ${
        transformations.length
          ? `<div class="detail-card">
              <p class="detail-heading">Rules</p>
              <ul class="mini-transform-list">
                ${transformations.map(renderTransformationMini).join("")}
              </ul>
            </div>`
          : ""
      }
      <details class="detail-card sql-detail">
        <summary>SQL</summary>
        <div class="sql-detail-body">
          <p>${renderInlineCode(`${source?.label || edge.source} מוביל אל ${target?.label || edge.target} כחלק משלב ${edge.step}.`)}</p>
        </div>
      </details>
    `;
  }

  function renderFieldDetails(focus) {
    if (!detailsHost) {
      return;
    }

    detailsHost.innerHTML = `
      <div class="summary-main">
        <span class="detail-kind">${escapeHtml(focus.marker)} lineage</span>
        <h2 class="detail-title">${escapeHtml(focus.label)}</h2>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Context</p>
        <p>${renderInlineCode(focus.description)}</p>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Path</p>
        ${renderLineagePath(focus)}
      </div>
    `;
  }

  function renderColumnDetails(selection) {
    if (!detailsHost) {
      return;
    }

    const node = nodeById(selection.nodeId);
    const focus = fieldFocusById(selection.fieldId);
    const role = columnRole(node, selection.column);

    detailsHost.innerHTML = `
      <div class="summary-main">
        <span class="detail-kind">${escapeHtml(`${schemaName(node)} · ${objectType(node)}${role ? ` · ${role}` : ""}`)}</span>
        <h2 class="detail-title">${escapeHtml(`${node?.label || selection.nodeId}.${selection.column}`)}</h2>
      </div>
      <div class="detail-card">
        <p class="detail-heading">Context</p>
        <p>${renderInlineCode(node?.purpose || "Column in the selected step.")}</p>
      </div>
      ${
        focus
          ? `<div class="detail-card">
        <p class="detail-heading">Path</p>
              ${renderLineagePath(focus)}
            </div>`
          : `<div class="detail-card">
              <p class="detail-heading">Lineage</p>
              <p>הטבלה והקשרים שלה מודגשים בגרף.</p>
            </div>`
      }
      <details class="detail-card sql-detail">
        <summary>SQL</summary>
        <div class="sql-detail-body">
          <p><strong>קובץ:</strong> <code>${escapeHtml(node?.script || currentStep().script)}</code></p>
          <p>${renderInlineCode(node?.note || currentStep().summary)}</p>
        </div>
      </details>
    `;
  }

  function renderDetails() {
    if (!detailsHost) {
      return;
    }

    if (!state.selected) {
      detailsHost.innerHTML = `
        <p class="empty-details">
          Select a table, column, edge, or trace.
        </p>
      `;
      return;
    }

    if (state.selected.type === "field") {
      const focus = fieldFocusById(state.selected.id);
      if (focus) {
        renderFieldDetails(focus);
      }
      return;
    }

    if (state.selected.type === "column") {
      renderColumnDetails(state.selected);
      return;
    }

    if (state.selected.type === "node") {
      const node = nodeById(state.selected.id);
      if (node) {
        renderNodeDetails(node);
      }
      return;
    }

    const edge = edgeById(state.selected.id);
    if (edge) {
      renderEdgeDetails(edge);
    }
  }

  function render() {
    renderModeButtons();
    renderStepButtons();
    renderTraceButtons();
    renderLayerRail();
    renderLineageButtons();
    renderStepPanel();
    renderStepBoard();
    renderGraph();
    renderTransformationBoard();
    renderDetails();
  }

  function selectField(id) {
    if (!fieldFocusById(id)) {
      return false;
    }
    state.selected = { type: "field", id };
    if (cy) {
      cy.elements().unselect();
    }
    render();
    return true;
  }

  function selectColumn(nodeId, column) {
    const node = nodeById(nodeId);
    if (!node || !column) {
      return false;
    }

    const focus = columnFocus(column);
    state.selected = {
      type: "column",
      nodeId,
      column,
      fieldId: focus?.id || null
    };

    if (cy) {
      cy.elements().unselect();
      const graphNode = cy.getElementById(nodeId);
      if (graphNode.length) {
        graphNode.select();
      }
    }

    renderTraceButtons();
    renderStepBoard();
    renderTransformationBoard();
    applyGraphFocus();
    renderDetails();
    return true;
  }

  window.practice4Visualizer = {
    selectStep(step) {
      state.step = Number(step);
      state.selected = null;
      render();
      if (stepBoardHost) {
        stepBoardHost.scrollTop = 0;
      }
    },
    selectMode(mode) {
      state.selected = null;
      render();
    },
    selectNode(id) {
      const graphNode = cy?.getElementById(id);
      if (!cy || !nodeById(id) || !graphNode.length || isSchemaGraphNode(graphNode)) {
        return false;
      }
      cy.elements().unselect();
      graphNode.select();
      state.selected = { type: "node", id };
      renderTraceButtons();
      renderTransformationBoard();
      applyGraphFocus();
      renderDetails();
      return true;
    },
    selectEdge(id) {
      if (!cy || !cy.getElementById(id).length) {
        return false;
      }
      cy.elements().unselect();
      cy.getElementById(id).select();
      state.selected = { type: "edge", id };
      renderTraceButtons();
      renderTransformationBoard();
      applyGraphFocus();
      renderDetails();
      return true;
    },
    selectField,
    selectTrace(id) {
      const trace = (data.sampleTraces || []).find((item) => item.id === id);
      if (!trace || !fieldFocusById(trace.focusId)) {
        return false;
      }
      if (trace.step) {
        state.step = trace.step;
      }
      return selectField(trace.focusId);
    },
    selectColumn,
    visibleSummary() {
      if (!cy) {
        return { nodes: 0, edges: 0, step: state.step };
      }
      const visibleNodes = cy
        .nodes()
        .filter((node) => !node.hasClass("flow-token") && node.data("isSchema") !== "yes").length;
      return {
        nodes: visibleNodes,
        edges: cy.edges().length,
        transformations: transformationsForCurrentStep().length,
        step: state.step
      };
    },
    focusSummary() {
      if (!cy) {
        return { nodes: 0, edges: 0, tokens: 0 };
      }
      return {
        nodes: cy.nodes(".path-focus").length,
        edges: cy.edges(".path-focus").length,
        tokens: cy.nodes(".flow-token").length
      };
    }
  };

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = null;
      render();
    });
  });

  fitButton.addEventListener("click", () => {
    if (cy) {
      cy.fit(undefined, 55);
    }
  });

  resetButton.addEventListener("click", () => {
    state.selected = null;
    if (cy) {
      cy.elements().unselect();
      cy.fit(undefined, 55);
    }
    renderTraceButtons();
    renderStepBoard();
    renderTransformationBoard();
    applyGraphFocus();
    renderDetails();
  });

  techToggle.addEventListener("change", () => {
    state.showTechnicalFields = techToggle.checked;
    renderStepBoard();
    renderDetails();
  });

  window.addEventListener("resize", () => {
    if (!cy) {
      return;
    }

    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      cy.resize();
      cy.fit(undefined, 45);
    }, 80);
  });

  createCy();
  render();
})();
