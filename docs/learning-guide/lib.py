"""
Helper library for generating the FieldGuard Pro learning guide PDF (ReportLab).
Provides fonts, styles, flowable helpers, a diagram toolkit and the document class.
"""
import math
import os
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing, Line, Polygon, Rect, String
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle, XPreformatted,
)
from reportlab.platypus.tableofcontents import TableOfContents

# --------------------------------------------------------------------------- #
# Fonts
# --------------------------------------------------------------------------- #
FONT_DIR = r"C:\Windows\Fonts"


def _register_fonts():
    try:
        def reg(name, file):
            pdfmetrics.registerFont(TTFont(name, os.path.join(FONT_DIR, file)))
        reg("Sans", "segoeui.ttf")
        reg("Sans-B", "segoeuib.ttf")
        reg("Sans-I", "segoeuii.ttf")
        reg("Sans-BI", "segoeuiz.ttf")
        pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-B", italic="Sans-I", boldItalic="Sans-BI")
        reg("Mono", "consola.ttf")
        reg("Mono-B", "consolab.ttf")
        pdfmetrics.registerFontFamily("Mono", normal="Mono", bold="Mono-B", italic="Mono", boldItalic="Mono-B")
        return "Sans", "Sans-B", "Mono"
    except Exception as exc:  # pragma: no cover - fall back to built-ins
        print("Font fallback (", exc, ")")
        return "Helvetica", "Helvetica-Bold", "Courier"


SANS, SANS_B, MONO = _register_fonts()

# --------------------------------------------------------------------------- #
# Palette (mirrors the app's Ionic theme)
# --------------------------------------------------------------------------- #
NAVY = colors.HexColor("#0f2a52")
BLUE = colors.HexColor("#1a56db")
TEAL = colors.HexColor("#0e7490")
SLATE = colors.HexColor("#475569")
GREEN = colors.HexColor("#16a34a")
AMBER = colors.HexColor("#d97706")
RED = colors.HexColor("#dc2626")
PURPLE = colors.HexColor("#6d28d9")
LIGHT = colors.HexColor("#f1f5f9")
LINE = colors.HexColor("#cbd5e1")
INK = colors.HexColor("#1e293b")
MUTED = colors.HexColor("#64748b")

PAGE_W, PAGE_H = A4
MARGIN_X = 20 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X

# --------------------------------------------------------------------------- #
# Styles
# --------------------------------------------------------------------------- #
S = {}
S["body"] = ParagraphStyle("body", fontName=SANS, fontSize=10, leading=14.6, textColor=INK, spaceAfter=6)
S["small"] = ParagraphStyle("small", parent=S["body"], fontSize=8.6, leading=12, textColor=MUTED, spaceAfter=3)
S["H1"] = ParagraphStyle("H1", fontName=SANS_B, fontSize=23, leading=28, textColor=NAVY, spaceBefore=0, spaceAfter=4)
S["H2"] = ParagraphStyle("H2", fontName=SANS_B, fontSize=14.5, leading=19, textColor=BLUE, spaceBefore=12, spaceAfter=5)
S["H3"] = ParagraphStyle("H3", fontName=SANS_B, fontSize=11.2, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=3)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=14, bulletIndent=3, spaceAfter=2.5)
S["bullet2"] = ParagraphStyle("bullet2", parent=S["body"], leftIndent=28, bulletIndent=17, spaceAfter=2, fontSize=9.5, leading=13.5)
S["code"] = ParagraphStyle(
    "code", fontName=MONO, fontSize=7.8, leading=10.2, textColor=colors.HexColor("#0f172a"),
    backColor=colors.HexColor("#eef2f7"), borderColor=LINE, borderWidth=0.5, borderPadding=(5, 6, 5, 6),
    leftIndent=6, rightIndent=6, spaceBefore=4, spaceAfter=10,
)
S["cell"] = ParagraphStyle("cell", fontName=SANS, fontSize=8.8, leading=11.8, textColor=INK)
S["cellb"] = ParagraphStyle("cellb", parent=S["cell"], fontName=SANS_B, textColor=colors.white)
S["lead"] = ParagraphStyle("lead", parent=S["body"], fontSize=11.2, leading=16.5, textColor=SLATE, spaceAfter=10)
S["caption"] = ParagraphStyle("caption", parent=S["small"], alignment=TA_CENTER, spaceAfter=10)


def fmt(text):
    """Tiny markup: **bold**, `inline code`. Everything else is escaped."""
    def esc(t):
        return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    spans = []

    def stash(m):
        spans.append(esc(m.group(1)))
        return "\x00%d\x00" % (len(spans) - 1)

    text = re.sub(r"`(.+?)`", stash, text)           # code spans first (may contain ** or <)
    text = esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(
        "\x00(\\d+)\x00",
        lambda m: f'<font face="{MONO}" color="#9d174d" size="8.8">{spans[int(m.group(1))]}</font>',
        text,
    )
    return text


# --------------------------------------------------------------------------- #
# Story builder
# --------------------------------------------------------------------------- #
class Story:
    def __init__(self):
        self.items = []

    # text ------------------------------------------------------------------
    def chapter(self, number, title, tagline=None):
        self.items.append(PageBreak())
        label = f"{number}. {title}" if number else title
        self.items.append(Paragraph(fmt(label), S["H1"]))
        self.items.append(_Rule(CONTENT_W, 2.2, BLUE))
        self.items.append(Spacer(1, 6))
        if tagline:
            self.items.append(Paragraph(fmt(tagline), S["lead"]))

    def h2(self, text):
        self.items.append(CondPageBreak(60))
        self.items.append(Paragraph(fmt(text), S["H2"]))

    def h3(self, text):
        self.items.append(CondPageBreak(45))
        self.items.append(Paragraph(fmt(text), S["H3"]))

    def p(self, text):
        self.items.append(Paragraph(fmt(text), S["body"]))

    def small(self, text):
        self.items.append(Paragraph(fmt(text), S["small"]))

    def bullets(self, lines, level=1):
        style = S["bullet"] if level == 1 else S["bullet2"]
        mark = "•" if level == 1 else "–"
        for line in lines:
            if isinstance(line, (list, tuple)):
                self.bullets(line, level=2)
            else:
                self.items.append(Paragraph(fmt(line), style, bulletText=mark))
        self.items.append(Spacer(1, 3))

    def numbered(self, lines):
        for i, line in enumerate(lines, 1):
            self.items.append(Paragraph(fmt(line), S["bullet"], bulletText=f"{i}."))
        self.items.append(Spacer(1, 3))

    def code(self, text, title=None):
        text = text.strip("\n")
        block = []
        if title:
            block.append(Paragraph(f"<b>{fmt(title)}</b>", ParagraphStyle(
                "ct", parent=S["small"], textColor=SLATE, spaceAfter=0, spaceBefore=4)))
        esc = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        block.append(XPreformatted(esc, S["code"]))
        if len(text.splitlines()) < 28:
            self.items.append(KeepTogether(block))
        else:
            self.items.extend(block)

    def callout(self, text, kind="note", title=None):
        palette = {
            "note": (BLUE, "#eff6ff", "NOTE"),
            "tip": (GREEN, "#f0fdf4", "TIP"),
            "warn": (AMBER, "#fffbeb", "WATCH OUT"),
            "key": (PURPLE, "#f5f3ff", "KEY IDEA"),
            "beginner": (TEAL, "#ecfeff", "IN PLAIN ENGLISH"),
        }
        accent, bg, default = palette[kind]
        head = title or default
        content = [
            Paragraph(f'<font color="{accent.hexval().replace("0x", "#")}" face="{SANS_B}" size="8.2">{fmt(head)}</font>',
                      ParagraphStyle("ch", parent=S["small"], spaceAfter=2)),
            Paragraph(fmt(text), ParagraphStyle("cb", parent=S["body"], fontSize=9.4, leading=13.6, spaceAfter=0)),
        ]
        t = Table([[content]], colWidths=[CONTENT_W - 4])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
            ("LINEBEFORE", (0, 0), (0, -1), 3.2, accent),
            ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        self.items.append(KeepTogether([t, Spacer(1, 8)]))

    def table(self, header, rows, widths, zebra=True, mono_first=False):
        data = [[Paragraph(fmt(h), S["cellb"]) for h in header]]
        for r in rows:
            row = []
            for i, c in enumerate(r):
                txt = fmt(c)
                if mono_first and i == 0:
                    txt = f'<font face="{MONO}" size="8.2" color="#9d174d">{c.replace("&", "&amp;").replace("<", "&lt;")}</font>'
                row.append(Paragraph(txt, S["cell"]))
            data.append(row)
        t = Table(data, colWidths=widths, repeatRows=1)
        style = [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        if zebra:
            for i in range(1, len(data)):
                if i % 2 == 0:
                    style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f8fafc")))
        t.setStyle(TableStyle(style))
        self.items.append(t)
        self.items.append(Spacer(1, 10))

    def drawing(self, d, caption=None):
        parts = [d]
        if caption:
            parts.append(Paragraph(fmt(caption), S["caption"]))
        self.items.append(KeepTogether(parts))

    def space(self, h=8):
        self.items.append(Spacer(1, h))

    def raw(self, flowable):
        self.items.append(flowable)


class _Rule(Spacer):
    """Horizontal rule flowable."""

    def __init__(self, width, thickness, color):
        super().__init__(width, thickness + 2)
        self._w, self._t, self._c = width, thickness, color

    def draw(self):
        self.canv.setStrokeColor(self._c)
        self.canv.setLineWidth(self._t)
        self.canv.line(0, 1, self._w, 1)


# --------------------------------------------------------------------------- #
# Diagram toolkit
# --------------------------------------------------------------------------- #
def _arrow(d, x1, y1, x2, y2, color=SLATE, label=None, dashed=False, label_dx=4, label_dy=3):
    ln = Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=1.3)
    if dashed:
        ln.strokeDashArray = [3, 2]
    d.add(ln)
    ang = math.atan2(y2 - y1, x2 - x1)
    size = 6
    p1 = (x2 - size * math.cos(ang - 0.45), y2 - size * math.sin(ang - 0.45))
    p2 = (x2 - size * math.cos(ang + 0.45), y2 - size * math.sin(ang + 0.45))
    d.add(Polygon([x2, y2, p1[0], p1[1], p2[0], p2[1]], fillColor=color, strokeColor=color))
    if label:
        d.add(String((x1 + x2) / 2 + label_dx, (y1 + y2) / 2 + label_dy, label,
                     fontName=SANS, fontSize=7.4, fillColor=MUTED, textAnchor="start"))


def _box(d, x, y, w, h, title, sub=None, fill=BLUE, text_color=colors.white, title_size=9.2, sub_size=7.4):
    d.add(Rect(x, y, w, h, rx=6, ry=6, fillColor=fill, strokeColor=fill))
    lines = sub.split("\n") if sub else []
    total = 11 + 9 * len(lines)
    ty = y + h / 2 + total / 2 - 9
    d.add(String(x + w / 2, ty, title, fontName=SANS_B, fontSize=title_size, fillColor=text_color, textAnchor="middle"))
    for i, line in enumerate(lines):
        d.add(String(x + w / 2, ty - 11 - 9 * i + 1, line, fontName=SANS, fontSize=sub_size,
                     fillColor=colors.Color(1, 1, 1, 0.85) if text_color == colors.white else MUTED,
                     textAnchor="middle"))


def diagram(width, height, boxes, arrows=(), texts=()):
    """boxes: (x, y, w, h, title, sub, color); arrows: (x1, y1, x2, y2, label, color, dashed);
    texts: (x, y, text, size, color, anchor, bold)."""
    d = Drawing(width, height)
    for b in boxes:
        x, y, w, h, title, sub, fill = (list(b) + [None] * 7)[:7]
        _box(d, x, y, w, h, title, sub, fill or BLUE)
    for a in arrows:
        a = list(a) + [None] * 7
        _arrow(d, a[0], a[1], a[2], a[3], a[5] or SLATE, a[4], bool(a[6]))
    for t in texts:
        t = list(t) + [None] * 7
        d.add(String(t[0], t[1], t[2], fontName=SANS_B if t[6] else SANS, fontSize=t[3] or 8,
                     fillColor=t[4] or MUTED, textAnchor=t[5] or "start"))
    return d


def vflow(steps, width=CONTENT_W, box_h=34, gap=14, palette=None):
    """Vertical chain of boxes with arrows. steps: (title, subtitle)."""
    palette = palette or [NAVY, BLUE, TEAL, PURPLE, SLATE]
    n = len(steps)
    height = n * box_h + (n - 1) * gap + 4
    d = Drawing(width, height)
    bw = width - 30
    x = 15
    for i, (title, sub) in enumerate(steps):
        y = height - 2 - (i + 1) * box_h - i * gap
        _box(d, x, y, bw, box_h, title, sub, palette[i % len(palette)], sub_size=7.6)
        if i < n - 1:
            _arrow(d, width / 2, y, width / 2, y - gap, SLATE)
    return d


def layers(items, width=CONTENT_W, box_h=36, gap=3):
    """Stacked layers; items: (title, subtitle, color)."""
    n = len(items)
    height = n * box_h + (n - 1) * gap + 4
    d = Drawing(width, height)
    for i, (title, sub, color) in enumerate(items):
        y = height - 2 - (i + 1) * box_h - i * gap
        _box(d, 10, y, width - 20, box_h, title, sub, color, sub_size=7.6)
    return d


# --------------------------------------------------------------------------- #
# Document + page decoration
# --------------------------------------------------------------------------- #
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self._decorate(total)
            super().showPage()
        super().save()

    def _decorate(self, total):
        if self._pageNumber == 1:
            return
        self.saveState()
        self.setStrokeColor(LINE)
        self.setLineWidth(0.6)
        self.line(MARGIN_X, PAGE_H - 16 * mm, PAGE_W - MARGIN_X, PAGE_H - 16 * mm)
        self.setFont(SANS_B, 7.6)
        self.setFillColor(NAVY)
        self.drawString(MARGIN_X, PAGE_H - 13.5 * mm, "FIELDGUARD PRO  |  COMPLETE CODEBASE LEARNING GUIDE")
        self.setFont(SANS, 7.6)
        self.setFillColor(MUTED)
        self.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 13.5 * mm, "Angular 22 · Ionic 9 · Capacitor 8")
        self.line(MARGIN_X, 14 * mm, PAGE_W - MARGIN_X, 14 * mm)
        self.drawString(MARGIN_X, 9.5 * mm, "Field Inspection & Asset Maintenance Application POC")
        self.drawRightString(PAGE_W - MARGIN_X, 9.5 * mm, f"Page {self._pageNumber} of {total}")
        self.restoreState()


def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # decorative bands
    c.setFillColor(colors.HexColor("#14376d"))
    c.rect(0, PAGE_H * 0.36, PAGE_W, PAGE_H * 0.30, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.rect(0, PAGE_H * 0.36, 9 * mm, PAGE_H * 0.30, stroke=0, fill=1)
    c.setFillColor(TEAL)
    c.rect(PAGE_W - 40 * mm, 0, 40 * mm, 8 * mm, stroke=0, fill=1)
    c.setFillColor(AMBER)
    c.rect(PAGE_W - 80 * mm, 0, 40 * mm, 8 * mm, stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.rect(PAGE_W - 120 * mm, 0, 40 * mm, 8 * mm, stroke=0, fill=1)

    c.setFillColor(colors.HexColor("#93c5fd"))
    c.setFont(SANS_B, 10)
    c.drawString(24 * mm, PAGE_H - 38 * mm, "CODEBASE LEARNING GUIDE  ·  BEGINNER TO CONFIDENT")
    c.setFillColor(colors.white)
    c.setFont(SANS_B, 40)
    c.drawString(24 * mm, PAGE_H * 0.58, "FieldGuard Pro")
    c.setFont(SANS, 17)
    c.setFillColor(colors.HexColor("#dbeafe"))
    c.drawString(24 * mm, PAGE_H * 0.58 - 24, "Field Inspection & Asset Maintenance Application")
    c.setFont(SANS, 11.5)
    c.setFillColor(colors.HexColor("#bfdbfe"))
    lines = [
        "A guided tour of every concept in the project: where the code starts,",
        "how Angular, Ionic and Capacitor fit together, the offline-first sync",
        "engine, and how a tap in the UI travels all the way to storage.",
    ]
    y = PAGE_H * 0.58 - 52
    for line in lines:
        c.drawString(24 * mm, y, line)
        y -= 16

    chips = [("Angular 22", BLUE), ("Ionic 9", TEAL), ("Capacitor 8", PURPLE), ("RxJS · Signals", AMBER), ("TypeScript 6", GREEN)]
    x = 24 * mm
    y = PAGE_H * 0.36 - 34
    for label, col in chips:
        w = pdfmetrics.stringWidth(label, SANS_B, 9.5) + 22
        c.setFillColor(col)
        c.roundRect(x, y, w, 20, 10, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont(SANS_B, 9.5)
        c.drawString(x + 11, y + 6.3, label)
        x += w + 8

    c.setFillColor(colors.HexColor("#93c5fd"))
    c.setFont(SANS, 9.5)
    c.drawString(24 * mm, 30 * mm, "Based on the repository state of October 2026  ·  Standalone Angular · Offline-first architecture")
    c.restoreState()


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN_X, rightMargin=MARGIN_X,
                         topMargin=22 * mm, bottomMargin=20 * mm,
                         title="FieldGuard Pro - Complete Codebase Learning Guide",
                         author="Codebase guide", **kw)
        main = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main")
        cover = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="cover")
        self.addPageTemplates([
            PageTemplate(id="Cover", frames=[cover], onPage=draw_cover),
            PageTemplate(id="Main", frames=[main]),
        ])

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            name = flowable.style.name
            if name in ("H1", "H2"):
                level = 0 if name == "H1" else 1
                text = flowable.getPlainText()
                key = "bm_%d" % id(flowable)
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level, closed=(level == 1))
                self.notify("TOCEntry", (level, text, self.page, key))


def make_toc():
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle("toc0", fontName=SANS_B, fontSize=11, leading=17, textColor=NAVY, spaceBefore=5,
                       leftIndent=0, firstLineIndent=0),
        ParagraphStyle("toc1", fontName=SANS, fontSize=9, leading=12.5, textColor=SLATE, leftIndent=16,
                       firstLineIndent=0),
    ]
    toc.dotsMinLevel = 0
    return toc
