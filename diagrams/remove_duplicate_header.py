#!/usr/bin/env python3
"""Remove duplicate header block (old single-line skinparam) from aligned .puml files."""
import re
from pathlib import Path

DIAGRAMS = Path(__file__).parent

def remove_duplicate(lines):
    """After the first full header (through component<<failure>>), remove any duplicate header block."""
    if len(lines) <= 83:
        return lines
    # Find end of first header: closing } of skinparam component<<failure>>
    first_header_end = None
    seen_failure = False
    for i in range(len(lines)):
        if "component<<failure>>" in lines[i]:
            seen_failure = True
        if seen_failure and lines[i].strip() == "}":
            first_header_end = i
            break
    if first_header_end is None:
        return lines
    # Search for duplicate start only after first header (skip optional '==== and blank)
    search_from = min(first_header_end + 3, len(lines) - 1)
    start = None
    for i in range(search_from, len(lines)):
        s = lines[i].strip()
        if s.startswith("'") and ("====" in s or "CANONICAL" in s):
            start = i
            break
        if s == "top to bottom direction":
            start = i
            break
    if start is None:
        return lines
    # Find end of duplicate: first line that is actual diagram content (section comment, rectangle, package, etc.)
    end = None
    for i in range(start + 1, len(lines)):
        s = lines[i].strip()
        if not s:
            continue
        if re.match(r"^(rectangle|package)\s+", s):
            end = i
            break
        if s.startswith("'") and "====" in s and "CANONICAL" not in s and len(s) > 30:
            end = i
            break
        # Section comment like ' BAD ARCHITECTURE or '==== SHORT TITLE
        if s.startswith("'") and "CANONICAL" not in s and "LAYERED" not in s and "FONT" not in s and "GENERIC" not in s and "SEMANTIC" not in s:
            if ("====" in s) or (len(s) > 20 and re.match(r"'\s*[A-Z]", s)):
                end = i
                break
        if s.startswith("component ") or s.startswith("database ") or s.startswith("note "):
            end = i
            break
    if end is None:
        return lines
    # Remove lines [start, end)
    return lines[:start] + lines[end:]

def main():
    for puml in sorted(DIAGRAMS.rglob("*.puml")):
        if puml.name == "template.puml":
            continue
        text = puml.read_text(encoding="utf-8")
        original = text.splitlines(keepends=True)
        lines = original
        while True:
            new_lines = remove_duplicate(lines)
            if new_lines == lines:
                break
            lines = new_lines
            print("Fixed:", puml.relative_to(DIAGRAMS))
        if lines != original:
            puml.write_text("".join(lines), encoding="utf-8")
    print("Done.")

if __name__ == "__main__":
    main()
