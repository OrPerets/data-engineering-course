# Diagram Agent Playbook (All Lectures)

This file is the canonical guide for creating and refining PlantUML diagrams across the whole course.

Goal: diagrams should teach visually in seconds, not by reading paragraphs inside boxes.

---

## 1) Scope

Use this guide for every week under `diagrams/weekXX/` and every lecture/practice markdown under `lectures/`.

Applies to:
- New diagrams
- Refactoring old diagrams
- Replacing weak or overly textual diagrams

---

## 2) Core Principles (Non-Negotiable)

- Visual-first: shape + flow should communicate the idea before text does.
- Low text density: short labels, no long notes, no paragraph boxes.
- One diagram = one message.
- Professional consistency: same visual language across weeks.
- Readability on slides: must be clear when projected.

---

## 3) Required Diagram Set Per Lecture

Every lecture must include at least:

1. System Overview
2. Execution/Request Flow
3. Failure/Edge Case
4. At least one comparison diagram (trade-off or choice)

Practice decks must include at least one reasoning-support diagram.

---

## 4) Workflow for Agents

### Step 1: Understand the lecture

Read the lecture markdown first:
- Main learning objectives
- Key formulas
- Critical trade-offs
- Failure scenarios

### Step 2: Map slides to diagrams

Create a quick map:
- Keep as-is
- Refine (same concept, better visual)
- Redesign (concept unclear/too textual)

### Step 3: Choose diagram archetype

Use only what the slide needs:
- Pipeline flow
- Hub-and-spoke
- Side-by-side comparison
- Layered architecture
- Sequence/failure flow
- Formula-to-impact visual

### Step 4: Implement in PlantUML

Start from shared style:
- `!include ../_template_styles.puml`

Optional week override for stronger visual identity:
- `diagrams/weekXX/_weekXX_visual_style.puml`

### Step 5: Render and QA

Run:
- `./render_diagrams.sh weekXX`

Then check:
- readability
- text density
- visual balance
- consistency with slide message

---

## 5) Visual Style Rules

### 5.1 Text density limits

- 1-4 words preferred per node label
- Max 2 short lines in most nodes
- Avoid notes unless absolutely necessary
- Move detail to slide bullets, not inside the diagram

### 5.2 Shape semantics

Keep semantics stable across weeks:
- `database`: storage/data system
- `component`: processing logic
- `rectangle`: concept/decision/state
- `cloud`: network/external boundary/failure domain

### 5.3 Color semantics

Use color intentionally, not decoratively:
- Blue family: sources/storage/platform
- Green family: successful path/healthy outcome
- Orange family: decision/trade-off/branch
- Red family: failure/risk/blocked path

Only highlight what matters for this slide.

### 5.4 Arrow semantics

- Normal solid arrow: primary flow
- Dashed arrow: replication/async/secondary path
- Thicker or red arrow: failure-critical path

Label only meaningful transitions.

---

## 6) Layout Rules

- Prefer balanced compositions over long linear chains.
- Prefer fan-out/fan-in for distributed systems.
- Prefer side-by-side for comparisons.
- Avoid single narrow top-to-bottom towers.
- Keep enough white space (`nodesep`, `ranksep`).

Recommended defaults:
- `skinparam nodesep 60-90`
- `skinparam ranksep 60-90`

If a diagram renders too tall/narrow:
- reduce chain depth
- convert to branching layout
- split into two diagrams if needed

---

## 7) Diagram Quality Gate (Must Pass)

Before finalizing, every diagram must pass:

1. 3-second test: message understood quickly
2. No text wall: no paragraph-like nodes
3. Visual hierarchy: key element stands out
4. Flow clarity: arrows easy to follow
5. Slide fit: legible in presentation context
6. Semantic consistency with other weeks

If any fail -> redesign, not micro-tweak.

---

## 8) Refactoring Existing Diagrams

When refining old diagrams:

1. Keep concept, reduce words.
2. Remove noisy notes and long inline explanations.
3. Convert generic boxes to semantic shapes.
4. Strengthen comparison/failure contrast with color.
5. Re-check whether the layout tells the story at a glance.

Do not preserve weak structure just to avoid edits.

---

## 9) Naming and File Conventions

Store in week folder:
- `diagrams/weekXX/`

Preferred names:
- `weekXX_<topic>.puml`
- `weekXX_lecture_slideNN_<topic>.puml` when tightly coupled to a slide

Keep `.png` generated next to `.puml`.

Do not leave duplicate “copy” files.

---

## 10) Minimal Authoring Template

```plantuml
@startuml
!include ../_template_styles.puml
' Optional:
' !include _weekXX_visual_style.puml

top to bottom direction
skinparam nodesep 75
skinparam ranksep 70

rectangle "Input" as A
component "Process" as B
database "Store" as C
rectangle "Outcome" as D <<success>>

A -down-> B
B -down-> C
C -down-> D
@enduml
```

Use this as a starter, then adapt per slide archetype.

---

## 11) Rendering Commands

Render one week:
- `./render_diagrams.sh week02`

Render all:
- `./render_diagrams.sh`

After rendering, quickly spot-check key lecture diagrams before finishing.

---

## 12) Done Definition

A lecture’s diagram set is done only if:

- all required diagram types exist
- style is visual-first and consistent
- no diagram feels generic/boring/text-heavy
- all `.puml` render successfully
- lecture markdown references valid diagram files

