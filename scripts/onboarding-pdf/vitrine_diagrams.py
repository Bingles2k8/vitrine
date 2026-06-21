# -*- coding: utf-8 -*-
"""
Custom annotated UI diagrams for the Vitrine onboarding guide.

Each diagram is a hand-built SVG rendered in Vitrine's visual language
(dark stone dashboard, amber accent, serif-italic wordmark) with numbered
amber callout badges. Every diagram function returns:

    (svg_markup: str, callouts: list[str])

The numbered `callouts` list is rendered as a legend beneath the figure, so
each numbered badge on the screenshot maps to a plain-language explanation.
"""

# ── Vitrine palette ───────────────────────────────────────────────────────────
BG      = "#1c1917"   # dashboard background (stone-900)
BAR     = "#0c0a09"   # window chrome / deep
PANEL   = "#292524"   # raised card (stone-800)
PANEL2  = "#1f1b1a"   # inset
LINE    = "#3f3b38"   # hairline border
TXT     = "#e7e5e4"   # primary text on dark
MUT     = "#a8a29e"   # muted
DIM     = "#78716c"   # dim
AMBER   = "#f59e0b"
AMBERT  = "#fbbf24"   # amber text
EMER    = "#34d399"
EMERBG  = "#064e3b"
WHITE   = "#ffffff"
BLUE    = "#60a5fa"

SANS  = "Liberation Sans, DejaVu Sans, sans-serif"
SERIF = "Liberation Serif, DejaVu Serif, serif"
MONO  = "DejaVu Sans Mono, monospace"
# Geometric glyphs (●◆■▲▼★◉◈◫⬡ …) come from DejaVu Sans and render reliably in
# WeasyPrint; colour emoji do not, so we use drawn icons / geometric glyphs instead.
GEOM  = "DejaVu Sans, Liberation Sans, sans-serif"

W = 720  # diagram content width (viewBox units)


# ── primitives ────────────────────────────────────────────────────────────────
def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def rect(x, y, w, h, fill, rx=0, stroke=None, sw=1, op=None, dash=None):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if dash:
        s += f' stroke-dasharray="{dash}"'
    if op is not None:
        s += f' fill-opacity="{op}"'
    return s + "/>"


def line(x1, y1, x2, y2, stroke, sw=1, dash=None):
    s = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"'
    if dash:
        s += f' stroke-dasharray="{dash}"'
    return s + "/>"


def txt(x, y, s, fill=TXT, size=11, weight="normal", anchor="start",
        family=SANS, italic=False, spacing=None):
    style = ""
    if italic:
        style += "font-style:italic;"
    if spacing:
        style += f"letter-spacing:{spacing}px;"
    st = f' style="{style}"' if style else ""
    return (f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" '
            f'font-weight="{weight}" text-anchor="{anchor}" '
            f'font-family="{family}" dominant-baseline="central"{st}>{esc(s)}</text>')


def emoji(x, y, ch, size=14, anchor="start", fill=MUT):
    """Render a monochrome geometric glyph (not colour emoji)."""
    return (f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" '
            f'fill="{fill}" font-family="{GEOM}" dominant-baseline="central">{ch}</text>')


def thumb(x, y, size=14, accent=DIM):
    """A small generic image-thumbnail icon (rounded frame + horizon + sun)."""
    r = size
    return (rect(x, y, r, r, "#44403c", rx=3, stroke=LINE)
            + f'<circle cx="{x+r*0.32}" cy="{y+r*0.34}" r="{r*0.11}" fill="{accent}"/>'
            + f'<path d="M{x+2} {y+r-3} L{x+r*0.42} {y+r*0.5} L{x+r*0.62} {y+r*0.7} '
              f'L{x+r*0.8} {y+r*0.46} L{x+r-2} {y+r-3} Z" fill="{accent}"/>')


def magnifier(x, y, r=4, stroke=DIM):
    """A small search/magnifier icon centred near (x, y)."""
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{stroke}" stroke-width="1.4"/>'
            f'<line x1="{x+r*0.7}" y1="{y+r*0.7}" x2="{x+r*1.7}" y2="{y+r*1.7}" '
            f'stroke="{stroke}" stroke-width="1.4"/>')


def qricon(x, y, s=12, fill=MUT):
    """A tiny QR-code glyph."""
    b = [rect(x, y, s, s, "none", stroke=fill, sw=1)]
    cells = [(0, 0), (0, 1), (1, 0), (3, 0), (4, 0), (4, 1), (2, 2),
             (0, 3), (0, 4), (1, 4), (3, 3), (4, 4), (3, 4)]
    u = s / 5.0
    for cxn, cyn in cells:
        b.append(rect(x + cxn * u, y + cyn * u, u, u, fill))
    return "".join(b)


def photo_placeholder(cx, cy, w):
    """A large image placeholder icon (frame + horizon + sun) centred at (cx, cy)."""
    s = w
    x = cx - s / 2
    y = cy - s / 2
    return (rect(x, y, s, s, "none", rx=4, stroke=DIM, sw=1.5)
            + f'<circle cx="{x+s*0.3}" cy="{y+s*0.32}" r="{s*0.08}" fill="{DIM}"/>'
            + f'<path d="M{x+3} {y+s-4} L{x+s*0.4} {y+s*0.5} L{x+s*0.6} {y+s*0.72} '
              f'L{x+s*0.78} {y+s*0.45} L{x+s-3} {y+s-4} Z" fill="{DIM}"/>')


def pill(x, y, w, label, fg, bg, size=8.5):
    return (rect(x, y, w, 15, bg, rx=7) +
            txt(x + w / 2, y + 8, label, fg, size, anchor="middle", family=MONO))


def badge(n, cx, cy, r=11):
    """Numbered amber callout badge with white ring."""
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{AMBER}" '
            f'stroke="{WHITE}" stroke-width="2"/>'
            + txt(cx, cy + 0.5, n, "#1c1917", 11.5, weight="bold",
                  anchor="middle", family=SANS))


def wrap(h, body, dark=True):
    bg = BG if dark else "#fafaf9"
    return (f'<svg viewBox="0 0 {W} {h}" width="100%" '
            f'xmlns="http://www.w3.org/2000/svg" '
            f'font-family="{SANS}">' + body + "</svg>")


def chrome(url, h, inner, dark=True):
    """Browser/app window with chrome bar + URL pill, then inner content."""
    bg = BG if dark else "#fafaf9"
    b = []
    b.append(rect(1, 1, W - 2, h - 2, bg, rx=12, stroke=LINE, sw=1.5))
    b.append(rect(1, 1, W - 2, 30, BAR, rx=12))
    b.append(rect(1, 16, W - 2, 15, BAR))  # square off bottom of bar
    for i, c in enumerate(["#ef4444", "#f59e0b", "#10b981"]):
        b.append(f'<circle cx="{20 + i*14}" cy="16" r="4" fill="{c}" fill-opacity="0.55"/>')
    b.append(rect(W / 2 - 150, 8, 300, 16, "#1c1917", rx=8, stroke=LINE))
    b.append(txt(W / 2, 16.5, url, DIM, 9.5, anchor="middle", family=MONO))
    b.append(inner)
    return wrap(h, "".join(b), dark)


# ── shared dashboard sidebar ──────────────────────────────────────────────────
SIDE_W = 124
NAV = [("⬡", "Objects"), ("◫", "Site Builder"), ("▦", "Analytics"),
       ("★", "Events"), ("◆", "Compliance"), ("◉", "Staff"), ("◷", "Settings")]


def sidebar(active="Objects", top=30):
    b = [rect(1, top, SIDE_W, 999, BAR)]
    b.append(line(SIDE_W, top, SIDE_W, top + 999, LINE))
    b.append(txt(14, top + 26, "Vitrine.", AMBERT, 15, italic=True, family=SERIF))
    b.append(txt(16, top + 50, "MENU", DIM, 7.5, family=MONO, spacing=1.5))
    y = top + 64
    for ic, label in NAV:
        on = label == active
        if on:
            b.append(rect(8, y - 11, SIDE_W - 14, 22, "#3f3b38", rx=5))
        b.append(emoji(20, y, ic, 10, anchor="middle", fill=(AMBERT if on else DIM)))
        b.append(txt(34, y, label, TXT if on else MUT, 10))
        y += 27
    return "".join(b), top + 64, SIDE_W + 14  # body, first-y, content-x


def cx0():
    return SIDE_W + 20  # left edge of content area


# ── 1. Dashboard overview ─────────────────────────────────────────────────────
def dashboard_overview():
    h = 318
    sb, _, _ = sidebar("Objects")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 50, "Your collection at a glance", MUT, 10, family=MONO))
    # toolbar buttons (top-right)
    b.append(rect(W - 18 - 92, 40, 50, 20, PANEL, rx=5, stroke=LINE))
    b.append(emoji(W - 18 - 80, 50, "⭱", 10))
    b.append(txt(W - 18 - 66, 50.5, "Import", MUT, 9, family=MONO))
    b.append(rect(W - 18 - 36, 40, 36, 20, AMBER, rx=5))
    b.append(txt(W - 18 - 18, 50.5, "+ Add", "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
    # stat cards
    stats = [("Total objects", "2,847"), ("On Display", "1,203"),
             ("In Storage", "1,512"), ("On Loan", "132")]
    gap = 8
    sw_ = (cw - 3 * gap) / 4
    sx = x
    for i, (lab, val) in enumerate(stats):
        b.append(rect(sx, 70, sw_, 46, PANEL, rx=7, stroke=LINE))
        b.append(txt(sx + 10, 84, lab, DIM, 8.5))
        b.append(txt(sx + 10, 102, val, TXT, 17, family=SERIF))
        sx += sw_ + gap
    # search + filter
    b.append(rect(x, 128, cw - 120, 22, PANEL, rx=5, stroke=LINE))
    b.append(magnifier(x + 13, 139))
    b.append(txt(x + 26, 139.5, "Search titles, descriptions, medium…", DIM, 9))
    b.append(rect(x + cw - 112, 128, 112, 22, PANEL, rx=5, stroke=LINE))
    b.append(txt(x + cw - 104, 139.5, "Status: All", MUT, 9))
    b.append(emoji(x + cw - 12, 139, "▼", 6, "end", DIM))
    # table
    ty = 160
    b.append(rect(x, ty, cw, 132, PANEL, rx=7, stroke=LINE))
    cols = ["OBJECT", "YEAR", "MEDIUM", "STATUS"]
    cxs = [x + 12, x + cw * 0.50, x + cw * 0.66, x + cw * 0.83]
    for c, cxp in zip(cols, cxs):
        b.append(txt(cxp, ty + 15, c, DIM, 7.5, family=MONO, spacing=1))
    b.append(line(x, ty + 26, x + cw, ty + 26, LINE))
    rows = [("🖼️", "Turner's Thames at Sunset", "1809", "Oil on canvas", "On Display", True),
            ("🏺", "Egyptian shabti — Amenhotep II", "1400 BCE", "Faience", "On Display", True),
            ("🗿", "Roman mosaic fragment", "200 CE", "Tesserae", "In Storage", False),
            ("🪙", "Celtic gold stater", "50 BCE", "Gold", "On Loan", False)]
    ry = ty + 40
    for ic, title, yr, med, st, disp in rows:
        b.append(thumb(x + 10, ry - 7, 14))
        b.append(txt(x + 30, ry, title, TXT, 9.5))
        b.append(txt(cxs[1], ry, yr, MUT, 9, family=MONO))
        b.append(txt(cxs[2], ry, med, MUT, 9))
        fg, bgc = (EMER, EMERBG) if disp else (MUT, "#292524")
        b.append(pill(cxs[3], ry - 7, 64, st, fg, bgc))
        ry += 24
        if ry < ty + 130:
            b.append(line(x + 10, ry - 12, x + cw - 10, ry - 12, "#2a2522"))
    # callouts
    b.append(badge("1", 14, 30 + 64))            # sidebar
    b.append(badge("2", x + sw_ / 2, 70))         # stat card
    b.append(badge("3", x, 139))                  # search
    b.append(badge("4", x + 30 + 6, ty + 40))     # object title link
    b.append(badge("5", W - 18 - 18, 40))         # add object
    b.append(badge("6", W - 18 - 92, 40))         # import
    callouts = [
        "Sidebar — your main navigation. Every area of Vitrine is one click away; the highlighted item is the page you're on.",
        "Collection summary — live counts by status (total, on display, in storage, on loan) so you see the shape of your collection at a glance.",
        "Search & filter bar — type to search titles, descriptions and medium in real time; use the Status dropdown to narrow the list.",
        "Object row — click an object's title to open its full detail page for editing.",
        "+ Add object — opens a blank object record (top-right of the Objects page).",
        "Import — bulk-import objects from a CSV spreadsheet (Professional and above).",
    ]
    return chrome("vitrine.app/dashboard", h, "".join(b)), callouts


# ── 2. Onboarding flow (3 steps) ──────────────────────────────────────────────
def onboarding_flow():
    h = 250
    b = [rect(1, 1, W - 2, h - 2, "#fafaf9", rx=12, stroke="#e7e5e4", sw=1.5)]
    b.append(txt(W / 2, 26, "Welcome to Vitrine.", "#1c1917", 18, italic=True,
                 anchor="middle", family=SERIF))
    b.append(txt(W / 2, 44, "Set up your museum in three quick steps", "#a8a29e", 9.5, anchor="middle"))
    # step dots
    sxs = [W / 2 - 60, W / 2, W / 2 + 60]
    for i, sx in enumerate(sxs):
        b.append(f'<circle cx="{sx}" cy="62" r="9" fill="#1c1917"/>')
        b.append(txt(sx, 62.5, str(i + 1), "#fff", 9, anchor="middle", family=MONO))
        if i < 2:
            b.append(line(sx + 9, 62, sx + 51, 62, "#1c1917"))
    # three cards
    cw = (W - 2 * 24 - 2 * 14) / 3
    titles = ["STEP 1 — YOUR MUSEUM", "STEP 2 — TEMPLATE", "STEP 3 — PLAN"]
    cardx = 24
    cardtops = 84
    cardh = 142
    for i in range(3):
        b.append(rect(cardx, cardtops, cw, cardh, "#ffffff", rx=9, stroke="#e7e5e4"))
        b.append(txt(cardx + 12, cardtops + 16, titles[i], "#a8a29e", 7, family=MONO, spacing=1))
        cardx += cw + 14
    # card 1 contents
    c1 = 24
    b.append(txt(c1 + 12, 84 + 34, "Museum name", "#a8a29e", 7.5, family=MONO))
    b.append(rect(c1 + 12, 84 + 40, cw - 24, 16, "#fafaf9", rx=4, stroke="#e7e5e4"))
    b.append(txt(c1 + 18, 84 + 48.5, "Victoria Hamlet Collection", "#1c1917", 8))
    b.append(txt(c1 + 12, 84 + 66, "Logo", "#a8a29e", 7.5, family=MONO))
    ex = c1 + 12
    for j, ch in enumerate(["⬡", "◆", "★", "●"]):
        sel0 = j == 0
        b.append(rect(ex, 84 + 72, 17, 17, "#fafaf9", rx=4,
                      stroke=AMBER if sel0 else "#e7e5e4", sw=1.5 if sel0 else 1))
        b.append(emoji(ex + 8.5, 84 + 80.5, ch, 9, anchor="middle", fill="#1c1917"))
        ex += 21
    b.append(txt(c1 + 12, 84 + 102, "Public URL", "#a8a29e", 7.5, family=MONO))
    b.append(rect(c1 + 12, 84 + 108, cw - 24, 16, "#fafaf9", rx=4, stroke="#e7e5e4"))
    b.append(txt(c1 + 16, 84 + 116.5, "vitrinecms.com/victoriahamlet", "#57534e", 7, family=MONO))
    b.append(txt(c1 + 12, 84 + 132, "✓ Available", "#059669", 7.5, family=MONO))
    # card 2 contents (template tiles)
    c2 = 24 + cw + 14
    tnames = ["Minimal", "Dramatic", "Archival"]
    tcols = ["#ffffff", "#0f0e0c", "#f5f0e8"]
    ty = 84 + 30
    for j, (tn, tc) in enumerate(zip(tnames, tcols)):
        sel = j == 1
        b.append(rect(c2 + 12, ty, cw - 24, 22, tc, rx=4,
                      stroke=AMBER if sel else "#e7e5e4", sw=2 if sel else 1))
        b.append(txt(c2 + 20, ty + 11.5, tn, "#1c1917" if j != 1 else "#f5f2ec", 8.5, italic=True, family=SERIF))
        if sel:
            b.append(txt(c2 + cw - 22, ty + 11.5, "✓", AMBER, 9, anchor="end", weight="bold"))
        ty += 30
    # card 3 contents (plan rows)
    c3 = 24 + 2 * (cw + 14)
    plans = [("Community", "Free"), ("Hobbyist", "£5/mo"), ("Professional", "£79/mo")]
    py = 84 + 30
    for k, (pn, pp) in enumerate(plans):
        sel = k == 2
        b.append(rect(c3 + 12, py, cw - 24, 22, "#ffffff", rx=4,
                      stroke=AMBER if sel else "#e7e5e4", sw=2 if sel else 1))
        b.append(txt(c3 + 20, py + 11.5, pn, "#1c1917", 8.5))
        b.append(txt(c3 + cw - 22, py + 11.5, pp, "#57534e", 8, anchor="end", family=MONO))
        py += 30
    # callouts
    b.append(badge("1", 24 + 12 + 6, 84 + 48.5))
    b.append(badge("2", 24 + 12 + 6, 84 + 80.5))
    b.append(badge("3", 24 + 12 + 6, 84 + 116.5))
    b.append(badge("4", c2 + cw - 22, 84 + 30 + 11.5 + 30))
    b.append(badge("5", c3 + cw - 22, 84 + 30 + 11.5 + 60))
    callouts = [
        "Museum name — appears on your public website and in every automated email. You can change it later in Settings.",
        "Logo emoji — a quick visual identity for the dashboard; you can upload a real logo image afterwards in Site Builder.",
        "Public URL (slug) — your permanent web address, e.g. yourslug.vitrine.app. Vitrine checks availability live and suggests an alternative if it's taken.",
        "Template — pick a starting look (Minimal, Dramatic, Archival). Everything is customisable later in the Site Builder.",
        "Plan — choose Community (free) up to Enterprise. Paid plans go to secure Stripe checkout; you can upgrade or downgrade any time.",
    ]
    return wrap(h, "".join(b), dark=False), callouts


# ── 3. Add / edit object form ─────────────────────────────────────────────────
def add_object_form():
    h = 300
    sb, _, _ = sidebar("Objects")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "New object", TXT, 11, family=MONO))
    b.append(rect(W - 18 - 44, 40, 44, 20, AMBER, rx=5))
    b.append(txt(W - 18 - 22, 50.5, "Save", "#1c1917", 9.5, anchor="middle", weight="bold", family=MONO))
    # form fields (left), image panel (right)
    fields = [("Title", "Egyptian shabti — Amenhotep II", True),
              ("Date / year", "c. 1400 BCE", False),
              ("Medium", "Faience", False),
              ("Dimensions", "14.2 × 4.1 cm", False),
              ("Accession no.", "LCV-1923-041", False)]
    fy = 72
    fw = cw - 150
    for lab, val, req in fields:
        star = ' *' if req else ''
        b.append(txt(x, fy, lab, DIM, 8.5, family=MONO))
        if req:
            b.append(txt(x + len(lab) * 4.6 + 4, fy, "*", AMBERT, 9, family=MONO))
        b.append(rect(x, fy + 6, fw, 18, PANEL, rx=4, stroke=LINE))
        b.append(txt(x + 8, fy + 15, val, TXT, 9))
        fy += 30
    # status dropdown
    b.append(txt(x, fy, "Status", DIM, 8.5, family=MONO))
    b.append(rect(x, fy + 6, fw, 18, PANEL, rx=4, stroke=LINE))
    b.append(txt(x + 8, fy + 15, "On Display", EMER, 9))
    b.append(emoji(x + fw - 10, fy + 15, "▼", 6, "end", DIM))
    # image panel
    ix = x + fw + 18
    iw = W - 18 - ix
    b.append(txt(ix, 72, "Images (up to 10)", DIM, 8.5, family=MONO))
    b.append(rect(ix, 80, iw, iw, PANEL2, rx=8, stroke=LINE, dash="4 3"))
    b.append(photo_placeholder(ix + iw / 2, 80 + iw / 2 - 12, 26))
    b.append(txt(ix + iw / 2, 80 + iw / 2 + 14, "Drag photos here", DIM, 8.5, anchor="middle"))
    b.append(txt(ix + iw / 2, 80 + iw / 2 + 26, "or click to upload", DIM, 8.5, anchor="middle"))
    # callouts
    b.append(badge("1", x + 4, 72))
    b.append(badge("2", x + 4, 72 + 30))
    b.append(badge("3", ix + iw / 2, 80 + iw / 2))
    b.append(badge("4", x + 4, fy))
    b.append(badge("5", W - 18 - 22, 40))
    callouts = [
        "Title — the only required field (marked *). Everything else is optional; add what you have now and fill in the rest later.",
        "Descriptive fields — date, medium, dimensions, accession number and a free-text description. The more you add, the richer your public pages.",
        "Image panel — drag photos or click to upload (JPG/PNG/WebP). Drag to reorder; the first image becomes the primary display image. 1 image on Community, up to 10 on Professional.",
        "Status — controls public visibility. On Display = live on your website; any other status hides it from visitors.",
        "Save — adds the object. If it's On Display, it appears on your public site immediately.",
    ]
    return chrome("vitrine.app/dashboard/objects/new", h, "".join(b)), callouts


# ── 4. Object detail with tabs ────────────────────────────────────────────────
def object_detail_tabs():
    h = 280
    sb, _, _ = sidebar("Objects")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "Egyptian shabti — Amenhotep II", TXT, 11))
    b.append(txt(x, 62, "Faience · c. 1400 BCE · LCV-1923-041", DIM, 8.5))
    # QR + status (top right)
    b.append(rect(W - 18 - 34, 40, 34, 20, PANEL, rx=5, stroke=LINE))
    b.append(qricon(W - 18 - 27, 43, 13, fill=MUT))
    b.append(txt(W - 18 - 11, 50.5, "QR", MUT, 8, anchor="end", family=MONO))
    b.append(pill(W - 18 - 100, 41, 60, "On Display", EMER, EMERBG))
    # tabs
    tabs = ["Details", "Provenance", "Conservation", "Rights", "Acquisition", "Loans", "Documents"]
    tx = x
    ty = 80
    for i, t in enumerate(tabs):
        wt = len(t) * 5.4 + 14
        if i == 0:
            b.append(line(tx + 4, ty + 11, tx + wt - 4, ty + 11, AMBER, 2))
        b.append(txt(tx + wt / 2, ty, t, AMBERT if i == 0 else DIM, 9, anchor="middle", family=MONO))
        tx += wt
    b.append(line(x, ty + 11, x + cw, ty + 11, LINE))
    # details grid
    grid = [("Medium", "Faience"), ("Dimensions", "14.2 × 4.1 cm"),
            ("Acquired", "1923, donation"), ("Accession no.", "LCV-1923-041"),
            ("Condition", "Good"), ("Copyright", "Public domain")]
    gy = ty + 26
    gw = (cw - 10) / 2
    for i, (lab, val) in enumerate(grid):
        col = i % 2
        row = i // 2
        gx = x + col * (gw + 10)
        yy = gy + row * 40
        b.append(rect(gx, yy, gw, 34, PANEL, rx=6, stroke=LINE))
        b.append(txt(gx + 10, yy + 11, lab, DIM, 8))
        b.append(txt(gx + 10, yy + 23, val, TXT, 9.5))
    b.append(badge("1", x + 4, 48))
    b.append(badge("2", x + 30, ty))
    b.append(badge("3", W - 18 - 100 + 60, 41))
    b.append(badge("4", W - 18 - 27, 40))
    callouts = [
        "Identity header — title, key facts and accession number stay visible while you work through the tabs.",
        "Record tabs — each tab holds a slice of the record: Details, Provenance, Conservation, Rights, Acquisition, Loans and Documents. (Compliance tabs appear on Professional and above.)",
        "Status badge — shows and lets you change public visibility at a glance.",
        "QR label — generate a printable QR code that links straight to this object; ideal for gallery labels and storage tags.",
    ]
    return chrome("vitrine.app/dashboard/objects/…", h, "".join(b)), callouts


# ── 5. Site Builder ───────────────────────────────────────────────────────────
def site_builder():
    h = 296
    sb, _, _ = sidebar("Site Builder")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "Site Builder", TXT, 11, family=MONO))
    b.append(rect(W - 18 - 110, 40, 56, 20, PANEL, rx=5, stroke=LINE))
    b.append(txt(W - 18 - 82, 50.5, "Preview", MUT, 9, anchor="middle", family=MONO))
    b.append(rect(W - 18 - 50, 40, 50, 20, AMBER, rx=5))
    b.append(txt(W - 18 - 25, 50.5, "Publish", "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
    # tabs
    tabs = ["Appearance", "Content", "Visit info"]
    tx = x
    ty = 72
    for i, t in enumerate(tabs):
        wt = len(t) * 5.6 + 18
        if i == 0:
            b.append(line(tx + 4, ty + 11, tx + wt - 4, ty + 11, AMBER, 2))
        b.append(txt(tx + wt / 2, ty, t, AMBERT if i == 0 else DIM, 9, anchor="middle", family=MONO))
        tx += wt
    b.append(line(x, ty + 11, x + cw, ty + 11, LINE))
    # template picker
    yy = ty + 26
    b.append(txt(x, yy, "Template", DIM, 8.5, family=MONO))
    tnames = ["Minimal", "Dramatic", "Archival"]
    tcol = ["#ffffff", "#0f0e0c", "#f5f0e8"]
    tw = (cw - 16) / 3
    for j, (tn, tc) in enumerate(zip(tnames, tcol)):
        sel = j == 1
        b.append(rect(x + j * (tw + 8), yy + 8, tw, 26, tc, rx=5,
                      stroke=AMBER if sel else LINE, sw=2 if sel else 1))
        b.append(txt(x + j * (tw + 8) + tw / 2, yy + 21, tn,
                     "#1c1917" if j != 1 else "#f5f2ec", 9, anchor="middle", italic=True, family=SERIF))
    # accent colour
    yy2 = yy + 48
    b.append(txt(x, yy2, "Accent colour", DIM, 8.5, family=MONO))
    b.append(rect(x, yy2 + 8, 22, 22, AMBER, rx=5, stroke=LINE))
    b.append(rect(x + 30, yy2 + 8, 110, 22, PANEL, rx=5, stroke=LINE))
    b.append(txt(x + 40, yy2 + 19, "#f59e0b", MUT, 9, family=MONO))
    # logo upload
    b.append(txt(x + cw / 2 + 10, yy2, "Logo", DIM, 8.5, family=MONO))
    b.append(rect(x + cw / 2 + 10, yy2 + 8, cw / 2 - 10, 22, PANEL2, rx=5, stroke=LINE, dash="4 3"))
    b.append(emoji(x + cw / 2 + 22, yy2 + 19, "⭱", 11, fill=MUT))
    b.append(txt(x + cw / 2 + 36, yy2 + 19, "victoria-logo.png", MUT, 8.5))
    b.append(txt(x + cw - 14, yy2 + 19, "✓", EMER, 10, anchor="end"))
    # preview panel
    py = yy2 + 44
    b.append(rect(x, py, cw, 60, PANEL2, rx=7, stroke=LINE))
    b.append(txt(x + 10, py + 14, "LIVE PREVIEW", DIM, 7, family=MONO, spacing=1.5))
    b.append(txt(x + 10, py + 32, "Victoria Hamlet Collection.", TXT, 12, italic=True, family=SERIF))
    b.append(txt(x + 10, py + 46, "Exploring two centuries of British textile craft", MUT, 8.5))
    b.append(badge("1", x + tw + 8 + tw / 2, yy + 8 + 26))
    b.append(badge("2", x + 11, yy2 + 8 + 11))
    b.append(badge("3", x + cw / 2 + 10 + 6, yy2))
    b.append(badge("4", x + 6, py))
    b.append(badge("5", W - 18 - 25, 40))
    callouts = [
        "Template — switch the whole site layout & typography (Minimal, Dramatic, Archival, and premium templates on paid plans).",
        "Accent colour — set the colour used for buttons, links and highlights; type a hex code or use the picker to match your brand.",
        "Logo — upload a PNG or SVG (transparent background recommended) to replace the emoji in your site header.",
        "Live preview — every change is shown here before it goes live, so you can experiment safely.",
        "Publish — pushes your changes to the live public site. Nothing is visible to the public until you click it.",
    ]
    return chrome("vitrine.app/dashboard/site", h, "".join(b)), callouts


# ── 6. Public site (multi-page) ───────────────────────────────────────────────
def public_site():
    h = 250
    b = [rect(1, 1, W - 2, h - 2, BG, rx=12, stroke=LINE, sw=1.5)]
    b.append(rect(1, 1, W - 2, 30, BAR, rx=12))
    b.append(rect(1, 16, W - 2, 15, BAR))
    b.append(rect(W / 2 - 130, 8, 260, 16, "#1c1917", rx=8, stroke=LINE))
    b.append(txt(W / 2, 16.5, "victoriahamlet.vitrine.app", DIM, 9.5, anchor="middle", family=MONO))
    # site header / nav
    hy = 44
    b.append(rect(20, hy, W - 40, 30, PANEL, rx=7, stroke=LINE))
    b.append(txt(34, hy + 16, "Victoria Hamlet Collection.", TXT, 11, italic=True, family=SERIF))
    nav = ["Home", "Collection", "About", "Visit", "Events"]
    nx = W - 40
    for i, n in enumerate(reversed(nav)):
        b.append(txt(nx, hy + 16, n, TXT if n == "Home" else MUT, 9, anchor="end", family=MONO))
        if n == "Home":
            b.append(line(nx - len(n) * 5.2, hy + 24, nx, hy + 24, AMBER, 1.5))
        nx -= len(n) * 6.0 + 16
    # hero
    b.append(txt(34, hy + 56, "Two centuries of British textile craft", TXT, 15, italic=True, family=SERIF))
    b.append(txt(34, hy + 74, "A working collection of looms, samplers and printed cloth.", MUT, 9))
    # search bar
    b.append(rect(20, hy + 86, W - 200, 20, PANEL, rx=5, stroke=LINE))
    b.append(magnifier(33, hy + 96))
    b.append(txt(46, hy + 96.5, "Search the collection…", DIM, 9))
    b.append(rect(W - 174, hy + 86, 154, 20, PANEL, rx=5, stroke=LINE))
    b.append(txt(W - 166, hy + 96.5, "All statuses", MUT, 9))
    b.append(emoji(W - 28, hy + 96, "▼", 6, "end", DIM))
    # object grid
    gy = hy + 114
    items = ["Thames at Sunset", "Egyptian shabti", "Spitalfields silk", "Sampler, 1801"]
    gw = (W - 40 - 3 * 8) / 4
    for i, t in enumerate(items):
        gx = 20 + i * (gw + 8)
        b.append(rect(gx, gy, gw, 48, PANEL, rx=6, stroke=LINE))
        b.append(photo_placeholder(gx + gw / 2, gy + 18, 20))
        b.append(txt(gx + gw / 2, gy + 38, t, MUT, 8, anchor="middle"))
    b.append(badge("1", W - 40 - len("Home") * 2.6, hy + 16))
    b.append(badge("2", 34 + 6, hy + 56))
    b.append(badge("3", 32, hy + 96))
    b.append(badge("4", 20 + gw / 2, gy))
    callouts = [
        "Page navigation — visitors move between Home, Collection, About, Visit and Events. About/Visit/Events appear on Professional and above.",
        "Hero — your tagline and description, set in Site Builder → Content.",
        "Search & filter — visitors search and filter your published objects exactly as you do in the dashboard.",
        "Object grid — every object set to On Display appears here; clicking one opens its public detail page.",
    ]
    return wrap(h, "".join(b)), callouts


# ── 7. Analytics ──────────────────────────────────────────────────────────────
def analytics():
    h = 300
    sb, _, _ = sidebar("Analytics")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "Analytics", TXT, 11, family=MONO))
    # date range + export (top-right)
    b.append(rect(W - 18 - 130, 40, 90, 20, PANEL, rx=5, stroke=LINE))
    b.append(txt(W - 18 - 122, 50.5, "Last 7 days", MUT, 9, family=MONO))
    b.append(emoji(W - 18 - 46, 50, "▼", 6, "end", DIM))
    b.append(rect(W - 18 - 34, 40, 34, 20, PANEL, rx=5, stroke=LINE))
    b.append(emoji(W - 18 - 17, 50, "⭳", 11, anchor="middle"))
    # headline stats
    stats = [("Page views", "18,204", "+9%"), ("Unique visitors", "6,891", "+12%"),
             ("Avg. time on site", "3m 12s", "+4%")]
    gw = (cw - 16) / 3
    for i, (lab, val, dv) in enumerate(stats):
        sx = x + i * (gw + 8)
        b.append(rect(sx, 70, gw, 50, PANEL, rx=7, stroke=LINE))
        b.append(txt(sx + 10, 84, lab, DIM, 8.5))
        b.append(txt(sx + 10, 101, val, TXT, 16, family=SERIF))
        b.append(txt(sx + 10, 114, dv + " this week", EMER, 8, family=MONO))
    # bar chart
    cy = 132
    b.append(rect(x, cy, cw, 96, PANEL, rx=7, stroke=LINE))
    b.append(txt(x + 12, cy + 14, "Page views — last 7 days", DIM, 8.5, family=MONO))
    bars = [45, 62, 58, 80, 74, 91, 68]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    bw = (cw - 40) / 7
    base = cy + 78
    for i, (hh, d) in enumerate(zip(bars, days)):
        bx = x + 20 + i * bw
        bh = hh * 0.5
        b.append(rect(bx, base - bh, bw - 8, bh, AMBER, rx=2, op=0.8))
        b.append(txt(bx + (bw - 8) / 2, base + 8, d, DIM, 7.5, anchor="middle", family=MONO))
    # top objects
    ty = cy + 106
    b.append(rect(x, ty, cw, 60, PANEL, rx=7, stroke=LINE))
    b.append(txt(x + 12, ty + 14, "Top objects this week", DIM, 8.5, family=MONO))
    tops = [("Thames at Sunset", "1,842"), ("Egyptian shabti", "1,304"), ("Roman mosaic fragment", "987")]
    oy = ty + 30
    for t, v in tops:
        b.append(txt(x + 12, oy, t, MUT, 9))
        b.append(txt(x + cw - 12, oy, v, AMBERT, 9, anchor="end", family=MONO))
        oy += 15
    b.append(badge("1", x + gw / 2, 70))
    b.append(badge("2", x + 6, cy))
    b.append(badge("3", x + 6, ty))
    b.append(badge("4", W - 18 - 130, 40))
    b.append(badge("5", W - 18 - 17, 40))
    callouts = [
        "Headline numbers — page views, unique visitors and average time on site, each with the change vs. the previous period. (First-party data — no cookie banner needed.)",
        "Daily chart — page views per day across the selected range; spot the effect of social posts, press or school holidays.",
        "Top objects & traffic sources — your most-visited object pages and whether visitors arrived direct, via search, or from social.",
        "Date range — switch between Last 7 / 30 / 90 days or a custom range.",
        "Export — download the selected period as a CSV for spreadsheets or reports.",
    ]
    return chrome("vitrine.app/dashboard/analytics", h, "".join(b)), callouts


# ── 8. New event form ─────────────────────────────────────────────────────────
def new_event():
    h = 268
    sb, _, _ = sidebar("Events")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "New event", TXT, 11, family=MONO))
    b.append(rect(W - 18 - 92, 40, 92, 20, AMBER, rx=5))
    b.append(txt(W - 18 - 46, 50.5, "Publish event", "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
    fields = [("Event title", "Behind the Collection: A Curator-Led Tour"),
              ("Date & time", "14 April 2026 · 14:00"),
              ("Description", "An hour with our textiles curator, behind the scenes."),
              ("Capacity", "40 attendees"),
              ("Ticket price", "£12.00 per person  (enter 0 for free)")]
    fy = 72
    for lab, val in fields:
        b.append(txt(x, fy, lab, DIM, 8.5, family=MONO))
        b.append(rect(x, fy + 6, cw, 18, PANEL, rx=4, stroke=LINE))
        b.append(txt(x + 8, fy + 15, val, TXT, 9))
        fy += 32
    b.append(badge("1", x + 4, 72))
    b.append(badge("2", x + 4, 72 + 32))
    b.append(badge("3", x + 4, 72 + 96))
    b.append(badge("4", x + 4, 72 + 128))
    b.append(badge("5", W - 18 - 46, 40))
    callouts = [
        "Event title & description — shown on the public Events page and in the confirmation email each attendee receives.",
        "Date & time — set the start (and optionally end) with the date picker.",
        "Capacity — the booking form closes automatically once this many tickets are taken.",
        "Ticket price — enter 0 for a free event (no payment setup needed). Paid events require a one-time Stripe Connect bank setup on the Payouts tab; Vitrine charges a 2% platform fee plus Stripe's fees.",
        "Publish event — it appears on your public Events page immediately and starts taking bookings.",
    ]
    return chrome("vitrine.app/dashboard/events/new", h, "".join(b)), callouts


# ── 9. Staff & roles ──────────────────────────────────────────────────────────
def staff():
    h = 250
    sb, _, _ = sidebar("Staff")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "Staff & roles", TXT, 11, family=MONO))
    b.append(rect(W - 18 - 56, 40, 56, 20, AMBER, rx=5))
    b.append(txt(W - 18 - 28, 50.5, "+ Invite", "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
    people = [("EH", "Eleanor Hartley", "Admin", "Active", True),
              ("KA", "Dr. Kwame Asante", "Curator", "Active", True),
              ("MN", "Mei Nakamura", "Registrar", "Active", True),
              ("OB", "Oliver Bright", "Volunteer", "Invite pending", False)]
    ry = 70
    for ini, name, role, st, active in people:
        b.append(rect(x, ry, cw, 32, PANEL, rx=7, stroke=LINE))
        b.append(f'<circle cx="{x+20}" cy="{ry+16}" r="11" fill="#3a2f15"/>')
        b.append(txt(x + 20, ry + 16.5, ini, AMBERT, 8.5, anchor="middle", family=MONO))
        b.append(txt(x + 40, ry + 12, name, TXT, 9.5))
        b.append(txt(x + 40, ry + 23, role, DIM, 8, family=MONO))
        fg, bgc = (EMER, EMERBG) if active else (MUT, "#292524")
        b.append(pill(x + cw - 96, ry + 8.5, 88, st, fg, bgc))
        ry += 40
    b.append(badge("1", x + 40 + 8, 70 + 23))
    b.append(badge("2", x + cw - 96 + 44, 70 + 16))
    b.append(badge("3", W - 18 - 28, 40))
    callouts = [
        "Role — every member has one of four roles that precisely controls access: Admin, Curator, Registrar or Volunteer. Click a name to change role or remove the person.",
        "Status — shows whether an invitation is still pending or the member is Active. Invitations are valid for 7 days and can be resent.",
        "+ Invite — add a teammate by email and assign a role; they get a link to create their own login (10 staff on Professional, unlimited on Institution/Enterprise).",
    ]
    return chrome("vitrine.app/dashboard/staff", h, "".join(b)), callouts


# ── 10. Compliance dashboard ──────────────────────────────────────────────────
def compliance():
    h = 256
    sb, _, _ = sidebar("Compliance")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    b.append(txt(x, 48, "Collections compliance", TXT, 11, family=MONO))
    b.append(pill(W - 18 - 90, 41, 90, "79% complete", EMER, EMERBG))
    # progress bar
    b.append(rect(x, 64, cw, 8, "#292524", rx=4))
    b.append(rect(x, 64, cw * 0.79, 8, AMBER, rx=4))
    cats = [("Provenance documented", "2,108 / 2,847", True),
            ("Acquisition method recorded", "2,847 / 2,847", True),
            ("Conservation condition logged", "1,944 / 2,847", True),
            ("Rights & reproduction status", "1,203 / 2,847", False),
            ("Loan agreements on file", "132 / 132", True)]
    ry = 86
    for lab, val, ok in cats:
        b.append(rect(x, ry, cw, 26, PANEL, rx=6, stroke=LINE))
        b.append(txt(x + 12, ry + 13.5, "✓" if ok else "!", EMER if ok else AMBERT, 11, weight="bold"))
        b.append(txt(x + 28, ry + 13.5, lab, TXT, 9.5))
        b.append(txt(x + cw - 12, ry + 13.5, val, DIM, 9, anchor="end", family=MONO))
        ry += 32
    b.append(badge("1", W - 18 - 90, 41))
    b.append(badge("2", x + 6, 64 + 4))
    b.append(badge("3", x + 28 + 6, 86 + 13.5))
    callouts = [
        "Compliance score — the share of your whole collection with all five key fields documented (Spectrum-aligned; supports Arts Council England accreditation).",
        "Progress bar — your overall documentation completeness at a glance.",
        "Category breakdown — provenance, acquisition method, conservation condition, rights and loans. A ✓ means complete; an amber ! flags gaps — click a category to see exactly which objects are missing data.",
    ]
    return chrome("vitrine.app/dashboard/compliance", h, "".join(b)), callouts


# ── 11. Settings — plan & billing ─────────────────────────────────────────────
def settings_plan():
    h = 258
    sb, _, _ = sidebar("Settings")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    # settings tabs
    tabs = ["Profile", "Security", "Plan", "Billing", "Museum"]
    tx = x
    ty = 48
    for i, t in enumerate(tabs):
        wt = len(t) * 5.6 + 16
        sel = t == "Plan"
        if sel:
            b.append(line(tx + 4, ty + 11, tx + wt - 4, ty + 11, AMBER, 2))
        b.append(txt(tx + wt / 2, ty, t, AMBERT if sel else DIM, 9, anchor="middle", family=MONO))
        tx += wt
    b.append(line(x, ty + 11, x + cw, ty + 11, LINE))
    # plan card
    py = ty + 24
    b.append(rect(x, py, cw, 52, "#2a2110", rx=8, stroke="#5a4410"))
    b.append(txt(x + 12, py + 16, "PROFESSIONAL", AMBERT, 8, family=MONO, spacing=1.5))
    b.append(txt(x + 12, py + 36, "£79", TXT, 18, family=SERIF))
    b.append(txt(x + 52, py + 38, "/ month", DIM, 9))
    b.append(pill(x + cw - 70, py + 10, 58, "Active", EMER, EMERBG))
    b.append(txt(x + cw - 12, py + 40, "Next billing: 1 May 2026", DIM, 8, anchor="end", family=MONO))
    # usage bars
    uy = py + 64
    usage = [("Objects used", 2847, 5000, "2,847 / 5,000"),
             ("Staff accounts", 6, 10, "6 / 10"),
             ("Document storage", 0.7, 1, "0.7 / 1 GB")]
    for lab, used, mx, valtxt in usage:
        b.append(txt(x, uy, lab, MUT, 8.5, family=MONO))
        b.append(txt(x + cw, uy, valtxt, DIM, 8.5, anchor="end", family=MONO))
        b.append(rect(x, uy + 6, cw, 5, "#292524", rx=3))
        b.append(rect(x, uy + 6, cw * (used / mx), 5, AMBER, rx=3, op=0.7))
        uy += 24
    # buttons
    by = uy + 2
    b.append(rect(x, by, cw / 2 - 5, 22, PANEL, rx=5, stroke=LINE))
    b.append(txt(x + cw / 4, by + 11.5, "Cancel subscription", MUT, 9, anchor="middle", family=MONO))
    b.append(rect(x + cw / 2 + 5, by, cw / 2 - 5, 22, AMBER, rx=5))
    b.append(txt(x + cw * 0.75 + 2, by + 11.5, "Upgrade plan", "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
    b.append(badge("1", x + 14, ty))
    b.append(badge("2", x + 6, py))
    b.append(badge("3", x + 6, py + 64 + 6))
    b.append(badge("4", x + cw / 2 + 5 + 6, by))
    callouts = [
        "Settings tabs — Profile (name/email), Security (password), Plan, Billing (download invoices) and Museum (name & details).",
        "Current plan — your tier, monthly price, status and next billing date.",
        "Usage — how much of your object, staff and document-storage allowance you've used. Upgrade before you hit a limit.",
        "Cancel / Upgrade — change plan any time. Cancelling keeps access until the period ends, then reverts to free Community; nothing is deleted.",
    ]
    return chrome("vitrine.app/dashboard/settings", h, "".join(b)), callouts
