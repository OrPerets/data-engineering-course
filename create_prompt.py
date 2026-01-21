#!/usr/bin/env python3

import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(
        description="Generate a filled agent prompt from prompt.md template"
    )
    parser.add_argument("--week", required=True, type=int, help="Week number (e.g. 6)")
    parser.add_argument("--folder", required=True, help="Week folder (e.g. 06-mapreduce)")
    parser.add_argument("--topic", required=True, help="Lecture topic title")

    args = parser.parse_args()

    template_path = Path("prompt.md")
    if not template_path.exists():
        raise FileNotFoundError("prompt.md not found in current directory")

    template = template_path.read_text(encoding="utf-8")

    filled = (
        template
        .replace("{WEEK_NO}", str(args.week))
        .replace("{WEEK_FOLDER}", args.folder)
        .replace("{TOPIC}", args.topic)
    )

    output_dir = Path("prompts")
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / f"week{args.week:02d}-{args.folder}.md"
    output_path.write_text(filled, encoding="utf-8")

    print(f"✅ Prompt created: {output_path}")

if __name__ == "__main__":
    main()
