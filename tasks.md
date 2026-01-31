# Diagram styling refinement – agent instructions

## Goal

Refine **all** PlantUML diagrams under `diagrams/` so they use the **template styling** defined in `diagrams/template.puml`: elegant, professional, and visually consistent (deep blue theme, ortho lines, rounded corners, clear hierarchy).

---

## Reference: template styling (`diagrams/template.puml`)

- **Layout:** `top to bottom direction`, `skinparam linetype ortho`, `skinparam shadowing true`, `skinparam roundcorner 12`, `nodesep 60`, `ranksep 50`
- **Font:** `Segoe UI, Arial, sans-serif`, size 18 (default), color `#1A237E`
- **Background:** `#FAFBFC`
- **Rectangles:** `#E8EAF6` bg, `#3949AB` border, thickness 2.5, padding 22, round 12
- **Components:** white / `#E8EAF6` (by stereotype), `#5C6BC0` border, thickness 2, padding 16
- **Databases:** `#E8EAF6` bg, `#3949AB` border, thickness 2.5
- **Arrows:** `#5C6BC0` color, thickness 2, label color `#3949AB`
- **Semantic stereotypes (use these for meaning):**
  - `<<A>>` – primary / role (indigo)
  - `<<B>>` – control / runtime (blue)
  - `<<C>>` – function / task (teal)
  - `<<D>>` – schema / model (orange)
  - `<<Bad>>` – bad / failure path (red)
  - `<<V1>>` / `<<V2>>` – version or variant (orange / teal)
  - `<<up>>` / `<<down>>` or `<<success>>` / `<<failure>>` – outcome (green / red)

Use `template.puml` as the **single source of truth** for these values when refining each diagram.

---

## What to do per diagram

1. **Apply template styling**
   - Either:
     - **Option A:** Create `diagrams/_template_styles.puml` containing only the skinparam block from `template.puml` (no `@startuml`, no example boxes/flows). Then at the top of each `.puml` (after `@startuml`), add: `!include ../_template_styles.puml` (or the correct relative path from that week folder to `diagrams/`).
     - **Option B:** Copy the full skinparam section from `template.puml` into each diagram (no new file), and remove any duplicate or conflicting skinparam/theme blocks from that file.
   - Ensure layout/direction (e.g. `top to bottom` or `left to right`) is set; keep the diagram’s intended direction if it differs from the template example.

2. **Remove local overrides**
   - Delete any local `skinparam` blocks that conflict with the template (e.g. different fonts, colors, shadowing false, roundcorner 8, gray theme).
   - Remove inline color overrides on shapes (e.g. `#FFF9C4`, `#C8E6C9`) unless they are intentional semantic accents that match the template palette (e.g. green/red for success/failure).

3. **Map stereotypes to the template set**
   - Replace ad‑hoc stereotypes (e.g. `<<UI>>`, `<<Agent>>`, `<<Tool>>`, `<<Config>>`) with the template’s semantic set where it makes sense:
     - Control/routing → `<<B>>`
     - Function/task/worker → `<<C>>`
     - Schema/model → `<<D>>`
     - Bad path / failure → `<<Bad>>` or `<<failure>>`
     - Good path / success → `<<success>>` or `<<up>>`
     - Version or variant → `<<V1>>` / `<<V2>>`
   - If a diagram has no stereotypes, add them only when they improve clarity (e.g. failure vs success).
   - **Use all five entity styles for visual variety:** assign `<<A>>` (primary/role, indigo), `<<B>>` (control, blue), `<<C>>` (function/task, teal), `<<D>>` (schema/model, orange), and `<<Bad>>` (failure, red) across components, storage, cloud, card, and database elements so that diagrams do not look monochrome. Prefer spreading A/B/C/D across the diagram rather than giving most entities the same stereotype.
   - **In real diagrams use meaningful stereotype names, not letter codes:** use `<<Primary>>`, `<<Control>>`, `<<Task>>`, `<<Schema>>`, `<<Failure>>` (and `<<success>>` / `<<failure>>` / `<<up>>` / `<<down>>` for outcomes) so the rendered diagram shows readable labels. Reserve `<<A>>`, `<<B>>`, `<<C>>`, `<<D>>`, `<<Bad>>` for the reference template only (`template.puml`).

4. **Arrows and labels**
   - Use template-like arrow styling: thickness 2, colors from the template (e.g. `#5C6BC0`, `#00897B`, `#1565C0`, `#7C4DFF` for emphasis). Prefer `#3949AB` or `#0D47A1` for label text.

5. **Content and structure**
   - Do **not** change the logical content, box names, or structure of the diagram; only styling, skinparams, stereotypes, and arrow/label appearance.

6. **Regenerate PNGs**
   - After changing any `.puml`, re-run the project’s diagram render script (e.g. `render_diagrams.sh` or equivalent) so all corresponding `.png` files are updated.

---

## Sprints and todo list

Work **week by week** to avoid mixing unrelated changes. Each sprint = “apply template to that week’s diagrams + re-render PNGs.”

| Sprint | Scope | Todo |
|--------|--------|------|
| **0** | Setup (optional) | [x] Create `diagrams/_template_styles.puml` from `template.puml` (skinparams only) if using Option A |
| **1** | week01 | [x] Apply template styling to all `diagrams/week01/*.puml`; re-render week01 PNGs |
| **2** | week02 | [x] Apply template styling to all `diagrams/week02/*.puml`; re-render week02 PNGs |
| **3** | week03 | [x] Apply template styling to all `diagrams/week03/*.puml`; re-render week03 PNGs |
| **4** | week04 | [ ] Apply template styling to all `diagrams/week04/*.puml`; re-render week04 PNGs |
| **5** | week05 | [ ] Apply template styling to all `diagrams/week05/*.puml`; re-render week05 PNGs |
| **6** | week06 | [ ] Apply template styling to all `diagrams/week06/*.puml`; re-render week06 PNGs |
| **7** | week7  | [ ] Apply template styling to all `diagrams/week7/*.puml`; re-render week7 PNGs |
| **8** | week8  | [ ] Apply template styling to all `diagrams/week8/*.puml`; re-render week8 PNGs |
| **9** | week9  | [ ] Apply template styling to all `diagrams/week9/*.puml`; re-render week9 PNGs |
| **10** | week10 | [ ] Apply template styling to all `diagrams/week10/*.puml`; re-render week10 PNGs |
| **11** | week11 | [ ] Apply template styling to all `diagrams/week11/*.puml`; re-render week11 PNGs |
| **12** | week12 | [ ] Apply template styling to all `diagrams/week12/*.puml`; re-render week12 PNGs |
| **13** | week13 | [ ] Apply template styling to all `diagrams/week13/*.puml`; re-render week13 PNGs |
| **14** | week14 | [ ] Apply template styling to all `diagrams/week14/*.puml`; re-render week14 PNGs |
| **Final** | All | [ ] Run full diagram render; spot-check PNGs for consistency and readability |

---

## Checklist (per file)

- [ ] Template skinparams applied (include or in-file)
- [ ] No conflicting local skinparam/theme
- [ ] Stereotypes aligned with template set (or removed if redundant)
- [ ] Arrow/label colors from template palette
- [ ] Diagram structure and text unchanged
- [ ] PNG regenerated

---

## Notes for the agent

- Prefer **one option** (A or B) for the whole repo and apply it consistently.
- If a diagram uses a stereotype not in the template (e.g. `<<Config>>`), map it to the closest template stereotype or drop it and rely on default component style.
- Keep `template.puml` itself unchanged; it remains the reference diagram and style definition.
- **Five entity styles:** Use the five semantic stereotypes (`<<A>>`, `<<B>>`, `<<C>>`, `<<D>>`, `<<Bad>>`) to create visual variety. Avoid having almost all entities the same color; spread indigo (A), blue (B), teal (C), orange (D), and red (Bad) across the diagram so roles are visually distinct. The template defines these for component, storage, cloud, card, database, and rectangle.
- **Meaningful labels in diagrams:** In real diagrams (week01, week02, …) use the readable stereotype names `<<Primary>>`, `<<Control>>`, `<<Task>>`, `<<Schema>>`, `<<Failure>>` so the PNG shows "Primary", "Control", etc., not "A", "B". Keep `<<A>>` / `<<B>>` / `<<C>>` / `<<D>>` / `<<Bad>>` only in `template.puml` as the reference key.
