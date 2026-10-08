"""
Build the FieldGuard Pro learning guide.

Usage (from the repository root):
    python docs/learning-guide/build_guide.py

Output: docs/learning-guide/FieldGuard_Pro_Complete_Learning_Guide.pdf
Requires: reportlab  (pip install reportlab)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib import *  # noqa: E402,F401,F403
import part1, part2, part3  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FieldGuard_Pro_Complete_Learning_Guide.pdf")


def main():
    s = Story()

    # Cover page (drawn by the Cover page template), then switch to the Main template
    s.raw(NextPageTemplate("Main"))
    s.raw(PageBreak())

    # Table of contents
    s.raw(Paragraph("Contents", ParagraphStyle("TOCTitle", fontName=SANS_B, fontSize=23, leading=28, textColor=NAVY)))
    s.raw(Spacer(1, 4))
    s.raw(Paragraph("Click any entry to jump to that section.", S["small"]))
    s.raw(Spacer(1, 8))
    s.raw(make_toc())

    part1.chapter_overview(s)
    part1.chapter_anatomy(s)
    part1.chapter_startup(s)
    part1.chapter_angular(s)
    part2.chapter_ionic(s)
    part2.chapter_capacitor(s)
    part2.chapter_architecture(s)
    part2.chapter_domain(s)
    part2.chapter_core(s)
    part3.chapter_features(s)
    part3.chapter_shared(s)
    part3.chapter_scenarios(s)
    part3.chapter_tooling(s)
    part3.chapter_extend(s)
    part3.chapter_notes(s)
    part3.chapter_exercises(s)
    part3.chapter_glossary(s)

    doc = GuideDoc(OUT)
    doc.multiBuild(s.items, canvasmaker=NumberedCanvas)
    print("Created:", OUT, f"({os.path.getsize(OUT) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
