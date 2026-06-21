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


# ══════════════════════════════════════════════════════════════════════════════
# Generic register-page builder + SPECTRUM procedure / tool diagrams
# ══════════════════════════════════════════════════════════════════════════════
def _pill_kind(kind):
    return {
        "ok":      (EMER, EMERBG),
        "warn":    (AMBERT, "#3a2f15"),
        "bad":     ("#f87171", "#3f1d1d"),
        "neutral": (MUT, "#292524"),
        "info":    (BLUE, "#1e3a5f"),
    }.get(kind, (MUT, "#292524"))


def register_page(url, active, title, cols, widths, rows, badges,
                  stats=None, tabs=None, add_label="+ New", extra=None, alert=None):
    """Generic 'register' dashboard page: title, optional stat cards, optional
    tab strip, a toolbar (add + optional extra button), and a data table whose
    last-column cells may be ('pill', text, kind) status chips.

    `badges` is a list of (anchor_key, callout_text); anchors:
      title, stats, tabs, add, extra, row, row2.  Badges are numbered in order.
    """
    sb, _, _ = sidebar(active)
    x = cx0()
    cw = W - x - 18
    b = [sb]
    anchors = {}
    b.append(txt(x, 48, title, TXT, 11, family=MONO))
    anchors["title"] = (x + 4, 48)
    # toolbar (right-aligned)
    bx = W - 18
    if add_label:
        wadd = len(add_label) * 5.2 + 16
        bx -= wadd
        b.append(rect(bx, 40, wadd, 20, AMBER, rx=5))
        b.append(txt(bx + wadd / 2, 50.5, add_label, "#1c1917", 9, anchor="middle", weight="bold", family=MONO))
        anchors["add"] = (bx + wadd / 2, 40)
    if extra:
        wex = len(extra) * 5.2 + 16
        bx -= wex + 6
        b.append(rect(bx, 40, wex, 20, PANEL, rx=5, stroke=LINE))
        b.append(txt(bx + wex / 2, 50.5, extra, MUT, 9, anchor="middle", family=MONO))
        anchors["extra"] = (bx + wex / 2, 40)
    y = 70
    if alert:
        b.append(rect(x, y, cw, 22, "#3a2f15", rx=6, stroke="#5a4410"))
        b.append(emoji(x + 12, y + 11, "▲", 8, fill=AMBERT))
        b.append(txt(x + 24, y + 11.5, alert, AMBERT, 8.5))
        y += 30
    if stats:
        n = len(stats)
        gap = 8
        sw_ = (cw - (n - 1) * gap) / n
        sx = x
        for i, (lab, val) in enumerate(stats):
            b.append(rect(sx, y, sw_, 44, PANEL, rx=7, stroke=LINE))
            b.append(txt(sx + 10, y + 14, lab, DIM, 8))
            b.append(txt(sx + 10, y + 31, val, TXT, 15, family=SERIF))
            if i == 0:
                anchors["stats"] = (sx + sw_ / 2, y)
            sx += sw_ + gap
        y += 54
    if tabs:
        tx = x
        for i, t in enumerate(tabs):
            wt = len(t) * 5.6 + 16
            if i == 0:
                b.append(line(tx + 4, y + 11, tx + wt - 4, y + 11, AMBER, 2))
            b.append(txt(tx + wt / 2, y, t, AMBERT if i == 0 else DIM, 9, anchor="middle", family=MONO))
            if i == 0:
                anchors["tabs"] = (tx + wt / 2, y)
            tx += wt
        b.append(line(x, y + 11, x + cw, y + 11, LINE))
        y += 22
    # table
    th = len(rows) * 24 + 28
    b.append(rect(x, y, cw, th, PANEL, rx=7, stroke=LINE))
    xs = [x + 12]
    acc = 0
    for wfrac in widths[:-1]:
        acc += wfrac
        xs.append(x + 12 + cw * acc)
    for c, cxp in zip(cols, xs):
        b.append(txt(cxp, y + 15, c, DIM, 7.5, family=MONO, spacing=0.6))
    b.append(line(x, y + 26, x + cw, y + 26, LINE))
    ry = y + 40
    for ri, row in enumerate(rows):
        for ci, cell in enumerate(row):
            cxp = xs[ci]
            if isinstance(cell, tuple) and cell[0] == "pill":
                fg, bgc = _pill_kind(cell[2])
                b.append(pill(cxp, ry - 7, len(cell[1]) * 5 + 14, cell[1], fg, bgc))
            else:
                col = TXT if ci == 0 else MUT
                fam = SANS if ci == 0 else MONO
                b.append(txt(cxp, ry, cell, col, 9 if ci == 0 else 8.3, family=fam))
        if ri == 0:
            anchors["row"] = (xs[0] + 2, ry)
        if ri == 1:
            anchors["row2"] = (xs[-1], ry)
        ry += 24
        if ri < len(rows) - 1:
            b.append(line(x + 10, ry - 12, x + cw - 10, ry - 12, "#2a2522"))
    # badges
    callouts = []
    for i, (key, text_) in enumerate(badges):
        ax, ay = anchors.get(key, (x, y))
        b.append(badge(str(i + 1), ax, ay))
        callouts.append(text_)
    return chrome(url, ry + 14, "".join(b)), callouts


def object_tab(url, active_tab, tabs, title, subtitle, entries, add_label, badges):
    """Per-object detail page showing one tab's content as a list of dated entries."""
    sb, _, _ = sidebar("Objects")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    anchors = {}
    b.append(txt(x, 46, title, TXT, 11))
    b.append(txt(x, 60, subtitle, DIM, 8.5))
    anchors["title"] = (x + 4, 46)
    tx = x
    ty = 78
    for t in tabs:
        wt = len(t) * 5.4 + 14
        on = t == active_tab
        if on:
            b.append(line(tx + 4, ty + 11, tx + wt - 4, ty + 11, AMBER, 2))
            anchors["tab"] = (tx + wt / 2, ty)
        b.append(txt(tx + wt / 2, ty, t, AMBERT if on else DIM, 9, anchor="middle", family=MONO))
        tx += wt
    b.append(line(x, ty + 11, x + cw, ty + 11, LINE))
    ry = ty + 26
    for i, (date, desc) in enumerate(entries):
        b.append(rect(x, ry, cw, 30, PANEL, rx=6, stroke=LINE))
        b.append(txt(x + 12, ry + 15, date, AMBERT, 8.5, family=MONO))
        b.append(txt(x + 86, ry + 15, desc, MUT, 8.7))
        if i == 0:
            anchors["row"] = (x + 4, ry + 15)
        ry += 36
    b.append(rect(x, ry, cw, 22, PANEL2, rx=6, stroke=LINE, dash="4 3"))
    b.append(txt(x + cw / 2, ry + 11, add_label, DIM, 8.5, anchor="middle"))
    anchors["add"] = (x + cw / 2, ry)
    callouts = []
    for i, (key, t_) in enumerate(badges):
        ax, ay = anchors.get(key, (x, ry))
        b.append(badge(str(i + 1), ax, ay))
        callouts.append(t_)
    return chrome(url, ry + 36, "".join(b)), callouts


# ── Group A: SPECTRUM procedure pages ─────────────────────────────────────────
def entry_register():
    return register_page(
        "vitrine.app/dashboard/entry", "Objects", "Object entry",
        ["ENTRY NO", "DEPOSITOR", "RECEIVED", "STATUS"], [0.26, 0.30, 0.22, 0.22],
        [["EN-2026-019", "Mrs A. Okafor", "12 Jun 2026", ("pill", "Awaiting promotion", "warn")],
         ["EN-2026-018", "Hartley estate", "9 Jun 2026", ("pill", "Promoted", "ok")],
         ["EN-2026-017", "Field collection", "2 Jun 2026", ("pill", "Returned", "neutral")]],
        [("extra", "Scan barcode — look up or pre-fill an entry from a printed barcode using your device camera."),
         ("add", "+ New entry — log an object the moment it arrives: depositor, GDPR consent, condition on entry, terms and receipt."),
         ("row", "Each entry gets an auto entry number (EN-YYYY-NNN). Open one and click Promote to turn it into a full catalogue object with an accession number."),
         ("stats", "See what's awaiting promotion and your intake over time at a glance.")],
        stats=[("Awaiting promotion", "6"), ("This month", "23"), ("Received YTD", "184")],
        add_label="+ New entry", extra="Scan barcode")


def accession_register():
    return register_page(
        "vitrine.app/dashboard/register", "Objects", "Accession register",
        ["ACCESSION NO", "OBJECT", "METHOD", "STATUS"], [0.24, 0.36, 0.20, 0.20],
        [["LCV-2026-044", "Spitalfields silk panel", "Donation", ("pill", "Confirmed", "ok")],
         ["LCV-2026-045", "Linen sampler", "Purchase", ("pill", "Unconfirmed", "warn")],
         ["LCV-2026-046", "Loom shuttle", "Bequest", ("pill", "Unconfirmed", "warn")]],
        [("stats", "The register shows how many accessions are formally confirmed versus still incomplete."),
         ("add", "Confirm selected — the register blocks confirmation until every required field is filled, keeping accessions complete."),
         ("row", "Unconfirmed rows flag missing data; open an object to complete it, then confirm it into the permanent register.")],
        stats=[("Unconfirmed", "14"), ("Confirmed", "2,833")],
        add_label="Confirm selected")


def locations_register():
    return register_page(
        "vitrine.app/dashboard/locations", "Objects", "Locations & movements",
        ["OBJECT", "FROM / TO", "MOVED", "TYPE"], [0.34, 0.30, 0.18, 0.18],
        [["Roman mosaic fragment", "Store A2 / Gallery 3", "10 Jun", ("pill", "Temporary", "warn")],
         ["Egyptian shabti", "Gallery 3 / Store B1", "4 Jun", ("pill", "Permanent", "neutral")],
         ["Linen sampler", "Conservation / Store A2", "1 Jun", ("pill", "Return", "ok")]],
        [("tabs", "Two views: a Movement register (every move, filterable) and Current locations (objects grouped by where they are now)."),
         ("add", "+ Record move — log a move with from/to location, mover, type and an expected return for temporary moves."),
         ("row", "Locations use structured codes (building / floor / room / unit / position) so anything can be found fast.")],
        tabs=["Movement register", "Current locations"],
        add_label="+ Record move", extra="Export CSV",
        alert="2 temporary moves overdue for return")


def loans_register():
    return register_page(
        "vitrine.app/dashboard/loans", "Objects", "Loans register",
        ["LOAN NO", "INSTITUTION", "DATES", "STATUS"], [0.22, 0.34, 0.24, 0.20],
        [["LN-2026-007", "Tate Britain (out)", "Mar–Sep 2026", ("pill", "Active", "ok")],
         ["LN-2026-006", "V&A (in)", "Jan–Jul 2026", ("pill", "Active", "ok")],
         ["LN-2026-005", "Hunterian (out)", "ended 30 May", ("pill", "Returned", "neutral")]],
        [("tabs", "Filter by Loans in, Loans out, or Overdue. Each loan tracks agreement, insurance value, conditions and dates."),
         ("add", "+ New loan — record a loan in or out with the institution, dates, purpose, insurance value and conditions."),
         ("row", "Loan numbers auto-generate (LN-YYYY-NNN); open a loan to add documents or run the return workflow."),
         ("stats", "Headline counts of active loans in/out and any due back soon.")],
        stats=[("Active in", "4"), ("Active out", "7"), ("Due soon", "3")],
        tabs=["Loans in", "Loans out", "Overdue"],
        add_label="+ New loan",
        alert="2 loans due back within 14 days")


def exits_register():
    return register_page(
        "vitrine.app/dashboard/exits", "Objects", "Object exits",
        ["EXIT NO", "OBJECT", "DESTINATION", "STATUS"], [0.22, 0.32, 0.26, 0.20],
        [["EX-2026-031", "Turner's Thames", "Tate Britain", ("pill", "Out (temp)", "warn")],
         ["EX-2026-030", "Bronze figurine", "Photographer", ("pill", "Overdue", "bad")],
         ["EX-2026-029", "Ceramic bowl", "Deaccession sale", ("pill", "Permanent", "neutral")]],
        [("add", "+ Record exit — log anything leaving the building (loan, conservation, photography, research, disposal) with recipient, transport and insurance check."),
         ("stats", "See what's out now and, crucially, what's overdue back."),
         ("row", "Temporary exits track an expected return date; overdue ones turn red so nothing is forgotten.")],
        stats=[("Out now", "12"), ("Overdue", "2"), ("This year", "45")],
        add_label="+ Record exit")


def audit_inventory():
    return register_page(
        "vitrine.app/dashboard/audit", "Objects", "Inventory & audit",
        ["AUDIT REF", "SCOPE", "CHECKED", "STATUS"], [0.22, 0.36, 0.20, 0.22],
        [["AUD-2026-002", "Gallery 3 textiles", "210 / 240", ("pill", "In progress", "warn")],
         ["AUD-2026-001", "Store A full count", "1,512 / 1,512", ("pill", "Completed", "ok")]],
        [("stats", "Surfaces the objects never inventoried and those overdue a check (>12 months), so you can prioritise."),
         ("add", "+ New audit — start a planned inventory exercise: scope, method, auditor, and record discrepancies as you go."),
         ("row", "Each exercise tracks objects checked vs. discrepancies and produces a governance-ready report."),
         ("extra", "Export the inventory to CSV for spreadsheets or trustees.")],
        stats=[("Never inventoried", "312"), ("Overdue >12mo", "148"), ("Checked YTD", "2,387")],
        add_label="+ New audit", extra="Export CSV")


def conservation_register():
    return register_page(
        "vitrine.app/dashboard/conservation", "Objects", "Conservation treatments",
        ["TREATMENT", "OBJECT", "CONSERVATOR", "STATUS"], [0.24, 0.32, 0.24, 0.20],
        [["CT-2026-012", "Egyptian shabti", "J. Reyes", ("pill", "Active", "warn")],
         ["CT-2026-011", "Oak chest", "M. Idris", ("pill", "Completed", "ok")],
         ["CT-2026-010", "Silk panel", "J. Reyes", ("pill", "Completed", "ok")]],
        [("stats", "Live counts of active treatments, completions this year and total treatment cost."),
         ("row", "Treatments (auto ref CT-YYYY-NNN) record type, materials, cost and before/after images. Created from an object's Conservation tab."),
         ("title", "The register collects every treatment across the collection; open one for full detail and documents.")],
        stats=[("Active", "8"), ("Completed (yr)", "34"), ("Total cost (yr)", "£12,480")],
        add_label=None)


def valuation_register():
    return register_page(
        "vitrine.app/dashboard/valuation", "Objects", "Valuations",
        ["OBJECT", "BASIS", "VALUE", "VALID TO"], [0.38, 0.22, 0.20, 0.20],
        [["Turner's Thames at Sunset", "Insurance", "£1,200,000", "2027"],
         ["Egyptian shabti", "Market", "£8,500", "2026"],
         ["Roman mosaic fragment", "Replacement", "£3,200", "2028"]],
        [("stats", "Aggregates the total collection value and counts how many objects still lack a valuation."),
         ("row", "Valuations record valuer, basis (insurance / market / replacement), amount, currency and an expiry date. Added from an object's Valuation tab."),
         ("title", "A central view of every current valuation, useful for insurance and board reporting.")],
        stats=[("Total collection value", "£4.2M"), ("Objects valued", "2,540"), ("Unvalued", "307")],
        add_label=None)


def insurance_page():
    return register_page(
        "vitrine.app/dashboard/insurance", "Objects", "Insurance policies",
        ["POLICY NO", "PROVIDER", "COVER", "STATUS"], [0.24, 0.30, 0.22, 0.24],
        [["POL-AXA-4471", "AXA Art", "£5,000,000", ("pill", "Active", "ok")],
         ["POL-HIS-2210", "Hiscox (transit)", "£500,000", ("pill", "Renewing soon", "warn")]],
        [("add", "+ Add policy — record provider, coverage amount, excess, dates and what it covers (loans, transit, exhibitions)."),
         ("stats", "Track active policies, total cover and any renewals coming up."),
         ("row", "Expand a policy to link the specific objects it covers, and attach the certificate as a document.")],
        stats=[("Active policies", "3"), ("Total cover", "£5.0M"), ("Renewing soon", "1")],
        add_label="+ Add policy")


def emergency_page():
    return register_page(
        "vitrine.app/dashboard/plan", "Objects", "Emergency plans",
        ["PLAN", "TYPE", "LAST TESTED", "STATUS"], [0.36, 0.20, 0.22, 0.22],
        [["Fire response — main store", "Fire", "Mar 2026", ("pill", "Active", "ok")],
         ["Flood plan — basement", "Flood", "not tested", ("pill", "Under review", "warn")],
         ["Theft & security", "Theft", "Jan 2026", ("pill", "Active", "ok")]],
        [("add", "+ New plan — write a response plan with contacts and the location of salvage equipment."),
         ("row", "Each plan holds a ranked salvage-priority list — which objects to rescue first if the worst happens."),
         ("title", "A companion Incident register (/emergency) logs real events and the objects they affected.")],
        add_label="+ New plan")


def damage_register():
    return register_page(
        "vitrine.app/dashboard/damage", "Objects", "Loss & damage reports",
        ["OBJECT", "TYPE", "SEVERITY", "STATUS"], [0.34, 0.22, 0.22, 0.22],
        [["Ceramic bowl", "Accidental", ("pill", "Significant", "bad"), ("pill", "Under investigation", "warn")],
         ["Bronze figurine", "Theft", ("pill", "Total loss", "bad"), ("pill", "Claimed", "neutral")],
         ["Oil portrait", "Accidental", ("pill", "Minor", "neutral"), ("pill", "Repaired", "ok")]],
        [("stats", "Open reports, critical cases and the running repair estimate at a glance."),
         ("row", "Reports capture incident/discovery dates, severity, police report reference and the insurance-claim outcome. Filed from an object's Damage tab."),
         ("title", "Damage and loss is tracked for governance — including whether the governing body was notified.")],
        stats=[("Open", "3"), ("Critical", "1"), ("Repair est.", "£3,200")],
        add_label=None)


def disposal_page():
    return register_page(
        "vitrine.app/dashboard/disposal", "Objects", "Disposal & deaccession",
        ["OBJECT", "METHOD", "AUTHORISED BY", "STATUS"], [0.32, 0.22, 0.24, 0.22],
        [["Duplicate print", "Transfer", "Board, May 2026", ("pill", "Completed", "ok")],
         ["Damaged frame", "Destruction", "Board, Jun 2026", ("pill", "Approved", "warn")],
         ["Surplus coin", "Sale", "pending", ("pill", "Proposed", "neutral")]],
        [("add", "+ Propose disposal — start the formal workflow: method, reason, justification and governing-body approval."),
         ("stats", "Watch items move through Proposed → Approved → Completed."),
         ("row", "Completing a disposal sets the object's status to Deaccessioned. A deaccession-protected flag guards against accidental disposal.")],
        stats=[("Proposed", "2"), ("Approved", "1"), ("Completed (yr)", "5")],
        add_label="+ Propose disposal")


def collections_use():
    return register_page(
        "vitrine.app/dashboard/collections-use", "Objects", "Use of collections",
        ["USE REF", "REQUESTER", "TYPE", "STATUS"], [0.22, 0.30, 0.24, 0.24],
        [["CU-2026-061", "Dr S. Patel", "Research", ("pill", "In use", "warn")],
         ["CU-2026-060", "City Museum", "Exhibition", ("pill", "Approved", "ok")],
         ["CU-2026-059", "BBC History", "Photography", ("pill", "Completed", "neutral")]],
        [("add", "+ New request — log a request to use an object for research, exhibition, education or photography."),
         ("stats", "See pending, in-use and completed requests at a glance."),
         ("row", "Each request runs an approval workflow (Pending → Approved → In use → Completed) and can link to a reproduction request.")],
        stats=[("Pending", "4"), ("In use", "2"), ("Completed (yr)", "61")],
        add_label="+ New request")


def collections_review():
    return register_page(
        "vitrine.app/dashboard/collections-review", "Objects", "Collections review",
        ["REVIEW REF", "SCOPE", "REVIEWER", "STATUS"], [0.22, 0.34, 0.22, 0.22],
        [["CR-2026-002", "Numismatics rationalisation", "Curatorial team", ("pill", "In progress", "warn")],
         ["CR-2026-001", "Textiles relevance review", "Dr R. Mensah", ("pill", "Completed", "ok")]],
        [("add", "+ New review — define scope and criteria for a formal collections review against your mission."),
         ("row", "Reviews record how many objects were assessed and how many are recommended for disposal, with governance reporting."),
         ("stats", "Track reviews in progress and completed.")],
        stats=[("In progress", "1"), ("Completed", "3")],
        add_label="+ New review")


def risk_register():
    return register_page(
        "vitrine.app/dashboard/risk", "Objects", "Risk register",
        ["RISK", "OBJECT / SCOPE", "SEVERITY", "STATUS"], [0.30, 0.28, 0.20, 0.22],
        [["Light damage to dyes", "Textiles gallery", ("pill", "High", "bad"), ("pill", "Open", "warn")],
         ["Pest activity", "Store A2", ("pill", "Medium", "warn"), ("pill", "Mitigated", "ok")],
         ["Mount fatigue", "Bronze figurine", ("pill", "Low", "neutral"), ("pill", "Open", "warn")]],
        [("stats", "Open risks, high-severity items and any risks due for review."),
         ("row", "Risks capture severity, mitigation and a review date; raise them against a specific object or the whole collection."),
         ("title", "The register keeps preventive-conservation and security risks visible and actively managed.")],
        stats=[("Open", "9"), ("High severity", "2"), ("Review due", "3")],
        add_label="+ New risk")


def condition_tab():
    return object_tab(
        "vitrine.app/dashboard/objects/…", "Condition",
        ["Details", "Condition", "Conservation", "Rights", "Documents"],
        "Egyptian shabti — Amenhotep II", "Faience · LCV-1923-041",
        [("2026", "Grade: Good. Minor surface abrasion to base; stable. Next check 2028."),
         ("2022", "Grade: Good. Hairline crack monitored; no change since 2019."),
         ("2019", "Grade: Fair. Cleaned and consolidated during conservation.")],
        "+ New condition assessment",
        [("tab", "The Condition tab holds dated technical assessments separate from active treatments."),
         ("row", "Each assessment records a grade (Excellent → Critical), specific issues, hazards and a next-check date."),
         ("add", "+ New condition assessment — log the current state so future staff can see how condition changes over time.")])


def reproduction_tab():
    return object_tab(
        "vitrine.app/dashboard/objects/…", "Reproduction",
        ["Details", "Rights", "Reproduction", "Documents"],
        "Turner's Thames at Sunset", "Oil on canvas · LCV-1947-003",
        [("Jun 2026", "BBC History — broadcast. Approved; terms issued, £150 fee."),
         ("Apr 2026", "Dr S. Patel — academic print. Approved; no fee (non-commercial)."),
         ("Feb 2026", "Greetings-card firm — commercial. Refused (in copyright).")],
        "+ New reproduction request",
        [("tab", "Reproduction requests sit alongside the object's Rights records."),
         ("row", "Each request tracks requester, intended use, the decision (Approved / Refused / Pending), terms and any fee."),
         ("add", "+ New reproduction request — decisions are checked against the object's recorded copyright status.")])


# ── Group B: everyday tools ───────────────────────────────────────────────────
def wishlist_page():
    return register_page(
        "vitrine.app/dashboard/wanted", "Objects", "Wishlist / wanted items",
        ["ITEM", "PERIOD", "PRIORITY", "STATUS"], [0.34, 0.22, 0.22, 0.22],
        [["Edward III gold noble", "1350s", ("pill", "High", "bad"), ("pill", "Wanted", "neutral")],
         ["Tudor silver groat", "1540s", ("pill", "Medium", "info"), ("pill", "Wanted", "neutral")],
         ["Celtic stater", "50 BCE", ("pill", "Low", "neutral"), ("pill", "Acquired", "ok")]],
        [("add", "+ Add item — note something you'd like to acquire, with a priority and free-text notes."),
         ("row", "When you get one, click Mark acquired and it converts straight into a new catalogue object."),
         ("title", "Optional: publish your wishlist on your public site so donors and sellers can see what you're seeking. (Community & Hobbyist.)")],
        add_label="+ Add item")


def share_links_page():
    return register_page(
        "vitrine.app/dashboard/share", "Objects", "Private share links",
        ["LABEL", "SCOPE", "EXPIRES", "STATUS"], [0.30, 0.26, 0.22, 0.22],
        [["Insurer review", "On Loan only", "in 28 days", ("pill", "Active", "ok")],
         ["Trustee preview", "All statuses", "in 5 days", ("pill", "Active", "ok")],
         ["Grant assessor", "On Display", "expired", ("pill", "Expired", "neutral")]],
        [("add", "+ Create link — generate a passcode-protected link to a private view of your collection without giving anyone a login."),
         ("row", "Set an expiry (1/7/30/90 days or never), an optional view limit, and scope it to certain object statuses. Revoke any link instantly."),
         ("title", "Great for insurers, trustees and grant assessors. Community includes 1 active link; paid plans, unlimited.")],
        add_label="+ Create link")


def trash_page():
    return register_page(
        "vitrine.app/dashboard/trash", "Objects", "Trash",
        ["OBJECT", "DELETED", "ACTION"], [0.50, 0.28, 0.22],
        [["Duplicate vase record", "2 days ago", ("pill", "Restore", "ok")],
         ["Test object", "6 days ago", ("pill", "Restore", "ok")],
         ["Mis-scanned coin", "11 days ago", ("pill", "Restore", "ok")]],
        [("row", "Deleted objects land here first. Click Restore to bring one back (subject to your plan's object limit)."),
         ("extra", "Empty trash — permanently delete everything here. Permanent deletion can't be undone."),
         ("title", "A safety net between hiding/deleting and losing a record for good.")],
        add_label=None, extra="Empty trash")


# ── Group C: power-user UX ─────────────────────────────────────────────────────
def _kbd(x, y, label, w=None):
    w = w or (len(label) * 6.5 + 12)
    return (rect(x, y, w, 16, "#1c1917", rx=4, stroke=LINE)
            + txt(x + w / 2, y + 8.5, label, TXT, 8.5, anchor="middle", family=MONO)), w


def command_palette():
    h = 300
    sb, _, _ = sidebar("Objects")
    # dimmed dashboard behind
    b = [sb]
    b.append(rect(SIDE_W + 1, 31, W - SIDE_W - 2, h - 32, "#0c0a09", op=0.55))
    # centered palette
    pw = 380
    px = (W - pw) / 2 + 30
    py = 70
    b.append(rect(px, py, pw, 168, "#26221f", rx=12, stroke="#4a4440", sw=1.5))
    # search row
    b.append(rect(px + 14, py + 14, pw - 28, 26, "#1c1917", rx=6, stroke=LINE))
    b.append(magnifier(px + 28, py + 27, 4.5))
    b.append(txt(px + 42, py + 27.5, "silver", TXT, 10))
    kb, kw = _kbd(px + pw - 52, py + 19, "⌘K")
    b.append(kb)
    b.append(txt(px + 20, py + 54, "OBJECTS", DIM, 7, family=MONO, spacing=1.5))
    res = [("Roman denarius — Hadrian", "117 CE"),
           ("Tudor shilling — Henry VIII", "1544")]
    ry = py + 66
    for i, (t, hint) in enumerate(res):
        if i == 0:
            b.append(rect(px + 12, ry - 9, pw - 24, 20, "#3a3531", rx=5))
        b.append(thumb(px + 18, ry - 7, 13))
        b.append(txt(px + 38, ry, t, TXT, 9))
        b.append(txt(px + pw - 20, ry, hint, DIM, 8, anchor="end", family=MONO))
        ry += 22
    b.append(txt(px + 20, ry + 4, "PAGES", DIM, 7, family=MONO, spacing=1.5))
    ry += 16
    for t in ["Site Builder", "Analytics"]:
        b.append(emoji(px + 20, ry, "◫", 9, fill=DIM))
        b.append(txt(px + 38, ry, t, MUT, 9))
        ry += 20
    b.append(line(px, py + 168 - 22, px + pw, py + 168 - 22, LINE))
    b.append(txt(px + 16, py + 168 - 11, "↵  open      ↑↓  navigate      esc  close", DIM, 7.5, family=MONO))
    b.append(badge("1", px + pw - 52 + kw / 2, py + 19))
    b.append(badge("2", px + 28, py + 27))
    b.append(badge("3", px + 12, py + 57))
    callouts = [
        "Open from anywhere with ⌘K (Mac) or Ctrl+K (Windows) — the fastest way to move around Vitrine.",
        "Type to search both your objects (by title, maker or accession number) and the dashboard's pages at once.",
        "Use ↑ ↓ to highlight a result and ↵ to jump straight to it; esc closes. No mouse needed.",
    ]
    return chrome("vitrine.app/dashboard", h, "".join(b)), callouts


def shortcuts_help():
    h = 250
    sb, _, _ = sidebar("Objects")
    b = [sb]
    b.append(rect(SIDE_W + 1, 31, W - SIDE_W - 2, h - 32, "#0c0a09", op=0.5))
    pw = 400
    px = (W - pw) / 2 + 30
    py = 56
    ph = 168
    b.append(rect(px, py, pw, ph, "#26221f", rx=12, stroke="#4a4440", sw=1.5))
    b.append(txt(px + 18, py + 20, "Keyboard shortcuts", TXT, 12, family=SERIF, italic=True))
    b.append(txt(px + pw - 18, py + 20, "?", DIM, 11, anchor="end", family=MONO))
    rows = [("⌘K", "Search / command palette"), ("?", "Show this help"),
            ("N", "New entry"), ("G O", "Go to Objects"),
            ("G E", "Go to Events"), ("G L", "Go to Loans"),
            ("G S", "Go to Site Builder"), ("G P", "Go to Plan")]
    colx = [px + 18, px + pw / 2 + 6]
    rowy = py + 42
    for i, (keys, desc) in enumerate(rows):
        cx = colx[i % 2]
        yy = rowy + (i // 2) * 30
        kx = cx
        for k in keys.split(" "):
            kb, kw = _kbd(kx, yy - 8, k)
            b.append(kb)
            kx += kw + 4
        b.append(txt(cx + 56, yy, desc, MUT, 8.7))
    b.append(badge("1", px + pw - 18, py + 20))
    b.append(badge("2", colx[0] + 14, rowy + 60))
    callouts = [
        "Press ? at any time to open this cheat-sheet of keyboard shortcuts.",
        "Two-key 'G then …' chords jump between sections (G O = Objects, G E = Events, and so on); N starts a new entry.",
    ]
    return chrome("vitrine.app/dashboard", h, "".join(b)), callouts


def barcode_scanner():
    h = 250
    sb, _, _ = sidebar("Objects")
    b = [sb]
    b.append(rect(SIDE_W + 1, 31, W - SIDE_W - 2, h - 32, "#0c0a09", op=0.5))
    pw = 320
    px = (W - pw) / 2 + 30
    py = 52
    b.append(rect(px, py, pw, 176, "#26221f", rx=12, stroke="#4a4440", sw=1.5))
    b.append(txt(px + pw / 2, py + 18, "Scan barcode", TXT, 11, anchor="middle", family=MONO))
    # camera viewport
    vx, vy, vw, vh = px + 24, py + 32, pw - 48, 88
    b.append(rect(vx, vy, vw, vh, "#0c0a09", rx=8, stroke=LINE))
    br = 14
    for cxn, cyn, dx, dy in [(vx, vy, 1, 1), (vx + vw, vy, -1, 1), (vx, vy + vh, 1, -1), (vx + vw, vy + vh, -1, -1)]:
        b.append(line(cxn, cyn, cxn + dx * br, cyn, AMBER, 2))
        b.append(line(cxn, cyn, cxn, cyn + dy * br, AMBER, 2))
    b.append(line(vx + 8, vy + vh / 2, vx + vw - 8, vy + vh / 2, AMBER, 1.5, dash="2 3"))
    b.append(txt(px + pw / 2, vy + vh + 14, "Point your camera at a barcode", DIM, 8.5, anchor="middle"))
    # manual entry
    b.append(rect(px + 24, py + 140, pw - 100, 20, "#1c1917", rx=5, stroke=LINE))
    b.append(txt(px + 32, py + 150, "…or type a code manually", DIM, 8.5))
    b.append(rect(px + pw - 70, py + 140, 46, 20, AMBER, rx=5))
    b.append(txt(px + pw - 47, py + 150.5, "Look up", "#1c1917", 8.5, anchor="middle", weight="bold", family=MONO))
    b.append(badge("1", vx + vw / 2, vy + 8))
    b.append(badge("2", px + 32, py + 150))
    callouts = [
        "From an entry record (or the Entry page) tap Scan barcode to use your phone or tablet camera — it auto-detects the format and looks the object up.",
        "No camera, or prefer typing? Enter the code by hand and click Look up. Either way it pre-fills or finds the matching record.",
    ]
    return chrome("vitrine.app/dashboard/entry", h, "".join(b)), callouts


def learn_mode():
    h = 236
    sb, _, _ = sidebar("Objects")
    x = cx0()
    cw = W - x - 18
    b = [sb]
    # learn-mode toggle in a settings strip
    b.append(txt(x, 48, "Add object", TXT, 11, family=MONO))
    b.append(rect(W - 18 - 118, 41, 118, 18, "#2a2110", rx=9, stroke="#5a4410"))
    b.append(f'<circle cx="{W-18-26}" cy="50" r="6" fill="{AMBER}"/>')
    b.append(rect(W - 18 - 38, 44, 24, 12, "#5a4410", rx=6))
    b.append(f'<circle cx="{W-18-20}" cy="50" r="5" fill="{AMBERT}"/>')
    b.append(txt(W - 18 - 44, 50.5, "Learn mode on", AMBERT, 8.5, anchor="end", family=MONO))
    # a field label being hovered
    fy = 92
    b.append(txt(x, fy, "Acquisition method", MUT, 9, family=MONO))
    b.append(rect(x, fy + 8, cw * 0.5, 18, PANEL, rx=4, stroke=AMBER))
    b.append(txt(x + 8, fy + 17, "Donation", TXT, 9))
    b.append(emoji(x + cw * 0.5 - 12, fy + 17, "▼", 6, "end", DIM))
    # tooltip bubble
    tx, ty, tw, thh = x + 6, fy + 36, cw * 0.7, 52
    b.append(rect(tx, ty, tw, thh, "#26221f", rx=8, stroke=AMBER, sw=1.2))
    b.append(f'<path d="M{tx+30} {ty} L{tx+38} {ty-7} L{tx+46} {ty} Z" fill="#26221f" stroke="{AMBER}"/>')
    b.append(txt(tx + 12, ty + 16, "Acquisition method", AMBERT, 8.5, weight="bold"))
    b.append(txt(tx + 12, ty + 30, "How the object entered the collection.", MUT, 8))
    b.append(txt(tx + 12, ty + 41, "Spectrum: Acquisition & Accessioning (Procedure 2).", DIM, 7.5, italic=True))
    b.append(badge("1", W - 18 - 100, 41))
    b.append(badge("2", x + 4, fy))
    b.append(badge("3", tx + 6, ty + 6))
    callouts = [
        "Turn on Learn mode from the sidebar (or with the toggle shown). Your preference is remembered.",
        "With it on, every form field label across the dashboard becomes interactive.",
        "Hover a label to see a plain-English explanation of the field and which SPECTRUM procedure it supports — like a built-in tutor while you catalogue.",
    ]
    return chrome("vitrine.app/dashboard/objects/new", h, "".join(b)), callouts


def discover_directory():
    h = 240
    b = [rect(1, 1, W - 2, h - 2, BG, rx=12, stroke=LINE, sw=1.5)]
    b.append(rect(1, 1, W - 2, 30, BAR, rx=12))
    b.append(rect(1, 16, W - 2, 15, BAR))
    b.append(rect(W / 2 - 110, 8, 220, 16, "#1c1917", rx=8, stroke=LINE))
    b.append(txt(W / 2, 16.5, "vitrinecms.com/discover", DIM, 9.5, anchor="middle", family=MONO))
    b.append(txt(40, 54, "Discover collections", TXT, 15, italic=True, family=SERIF))
    b.append(txt(40, 72, "Browse public museum collections on Vitrine", MUT, 9))
    # category chips
    chips = ["All", "Numismatics", "Textiles", "Fine art", "Natural history", "Social history"]
    cxp = 40
    for i, c in enumerate(chips):
        wc = len(c) * 5.2 + 16
        sel = i == 0
        b.append(rect(cxp, 84, wc, 16, AMBER if sel else PANEL, rx=8, stroke=None if sel else LINE))
        b.append(txt(cxp + wc / 2, 92, c, "#1c1917" if sel else MUT, 8, anchor="middle", family=MONO))
        cxp += wc + 6
    # museum cards
    cards = [("Victoria Hamlet Collection", "Textiles", "2,847 objects"),
             ("Matt's Coin Collection", "Numismatics", "342 objects"),
             ("The Old Brickworks", "Social history", "1,120 objects")]
    gw = (W - 80 - 2 * 10) / 3
    for i, (name, cat, count) in enumerate(cards):
        gx = 40 + i * (gw + 10)
        b.append(rect(gx, 112, gw, 96, PANEL, rx=8, stroke=LINE))
        b.append(rect(gx + 10, 122, gw - 20, 40, PANEL2, rx=5, stroke=LINE))
        b.append(photo_placeholder(gx + gw / 2, 142, 22))
        b.append(txt(gx + 10, 176, name, TXT, 8.7))
        b.append(pill(gx + 10, 184, len(cat) * 5 + 12, cat, AMBERT, "#3a2f15"))
        b.append(txt(gx + gw - 10, 191, count, DIM, 7.5, anchor="end", family=MONO))
    b.append(badge("1", 40 + 6, 84))
    b.append(badge("2", 40 + gw / 2, 112))
    callouts = [
        "Discover is Vitrine's public directory of opted-in collections. Turn it on from your dashboard (set a collection category) and your museum appears here for the public to find — a free way to reach new visitors.",
        "Visitors filter by category and click any collection to open its public site. Every plan, including Community, can opt in.",
    ]
    return wrap(h, "".join(b)), callouts
