#!/usr/bin/env python3
"""Align all .puml files to the working template.puml header (multi-line skinparam)."""
import re
from pathlib import Path

DIAGRAMS = Path(__file__).parent
TEMPLATE = DIAGRAMS / "template.puml"

# Template header: from start through line before LAYERED PLACEHOLDERS
def get_template_header():
    lines = TEMPLATE.read_text(encoding="utf-8").splitlines()
    idx = next((i for i, L in enumerate(lines) if "LAYERED PLACEHOLDERS" in L), len(lines))
    return lines[:idx]

def end_of_first_header(lines):
    """Index of last line of first canonical header (closing } of component<<failure>>)."""
    seen_failure = False
    for i, line in enumerate(lines):
        if "component<<failure>>" in line:
            seen_failure = True
        if seen_failure and line.strip() == "}":
            return i
    return -1

def find_content_start(lines):
    """First line index of diagram content, after first header and any duplicate header."""
    header_end = end_of_first_header(lines)
    if header_end < 0:
        header_end = 0
    i = header_end + 1
    while i < len(lines):
        s = lines[i].strip()
        if not s:
            i += 1
            continue
        if s.startswith("'") and ("====" in s or "CANONICAL" in s or "---" in s or "FONT" in s or "GENERIC" in s or "SEMANTIC" in s or "LAYERED" in s):
            i += 1
            continue
        if s in ("top to bottom direction", "left to right direction") or s.startswith("skinparam "):
            i += 1
            continue
        if s.startswith("'") and len(s) > 15 and re.match(r"'\s*[A-Z]", s):
            return i
        if re.match(r"^(rectangle|package|component|database|note|together)\s", s):
            return i
        if re.match(r"^skinparam\s+(component|database)<<(Bad|V1|V2|up|down|success|failure)>>", s):
            return i
        i += 1
    return len(lines)

def has_left_to_right(content):
    return "left to right direction" in content

def main():
    header_lines = get_template_header()
    # Join as single string; we'll replace direction line per file
    base_header = "\n".join(header_lines)
    # Default direction line in template is "top to bottom direction"
    top_bottom = "top to bottom direction"
    left_right = "left to right direction"

    for puml in sorted(DIAGRAMS.rglob("*.puml")):
        if puml.name == "template.puml":
            continue
        text = puml.read_text(encoding="utf-8")
        lines = text.splitlines()
        content_start = find_content_start(lines)
        if content_start == 0:
            continue  # no header to replace
        body = "\n".join(lines[content_start:]).lstrip()
        use_left_right = has_left_to_right(text)
        new_header = base_header.replace(top_bottom, left_right) if use_left_right else base_header
        # Normalize body: Unicode arrow and em dash so PlantUML does not choke
        body = body.replace("\u2192", "->").replace("\u2014", "-")
        out = new_header + "\n\n" + body
        puml.write_text(out, encoding="utf-8")
        print("Aligned:", puml.relative_to(DIAGRAMS))

    print("Done.")

if __name__ == "__main__":
    main()
