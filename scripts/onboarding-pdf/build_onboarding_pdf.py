# -*- coding: utf-8 -*-
"""
Builds the Vitrine onboarding & user guide PDF.

Usage:  python3 build_onboarding_pdf.py [output.pdf]

Generates a self-contained HTML document (Vitrine brand styling + custom
annotated SVG diagrams from vitrine_diagrams.py) and renders it to PDF with
WeasyPrint.

Note: chapter bodies are assembled as lists of parts rather than nested
f-strings, because Python < 3.12 forbids backslashes inside f-string
expressions (and the prose uses apostrophes/quotes freely).
"""
import sys
import datetime
import vitrine_diagrams as D

OUT = sys.argv[1] if len(sys.argv) > 1 else "Vitrine-Onboarding-Guide.pdf"
TODAY = datetime.date.today().strftime("%B %Y")

# ── helpers ───────────────────────────────────────────────────────────────────
_fig_n = [0]


def figure(diagram_fn, caption):
    _fig_n[0] += 1
    n = _fig_n[0]
    svg, callouts = diagram_fn()
    items = "".join(
        '<li><span class="cnum">{}</span><span class="ctext">{}</span></li>'.format(i + 1, c)
        for i, c in enumerate(callouts))
    return ('<figure class="fig"><div class="figframe">' + svg + "</div>"
            '<figcaption><span class="figlabel">Fig. ' + str(n) + "</span> " + caption + "</figcaption>"
            '<ol class="legend">' + items + "</ol></figure>")


def steps(items):
    return '<ol class="steps">' + "".join("<li>" + s + "</li>" for s in items) + "</ol>"


def callout(kind, html):
    icons = {"tip": "★", "warn": "▲", "info": "●", "note": "◆"}
    labels = {"tip": "Tip", "warn": "Important", "info": "Good to know", "note": "Note"}
    return ('<div class="cb cb-' + kind + '"><span class="cb-ic">' + icons[kind] + "</span>"
            "<div><strong>" + labels[kind] + ".</strong> " + html + "</div></div>")


def h2(id_, title):
    return '<h2 id="' + id_ + '">' + title + "</h2>"


def kicker(t):
    return '<div class="kicker">' + t + "</div>"


def h3(t, tight=False):
    return '<h3 class="tight">' + t + "</h3>" if tight else "<h3>" + t + "</h3>"


def p(t, cls=None):
    return ('<p class="' + cls + '">' if cls else "<p>") + t + "</p>"


def plan_tag(t):
    return ' <span class="mono">' + t + "</span>"


def chapter(parts):
    return '<section class="chapter">' + "".join(parts) + "</section>"


def table(rows, header):
    out = ["<table><tr>"]
    for h in header:
        out.append(h)
    out.append("</tr>")
    for r in rows:
        out.append("<tr>" + "".join(r) + "</tr>")
    out.append("</table>")
    return "".join(out)


# ── CSS ───────────────────────────────────────────────────────────────────────
CSS = r"""
@page {
  size: A4;
  margin: 20mm 17mm 18mm 17mm;
  @top-left  { content: "Vitrine"; font-family: "Liberation Serif"; font-style: italic;
               font-size: 9pt; color: #b8b2ab; }
  @top-right { content: "Onboarding & User Guide"; font-family: "Liberation Sans";
               font-size: 7.5pt; letter-spacing: 1px; text-transform: uppercase; color: #c4beb6; }
  @bottom-left  { content: "vitrinecms.com"; font-family: "DejaVu Sans Mono";
                  font-size: 7.5pt; color: #c4beb6; }
  @bottom-right { content: counter(page) " / " counter(pages); font-family: "DejaVu Sans Mono";
                  font-size: 8pt; color: #78716c; }
}
@page cover  { margin: 0; @top-left{content:""} @top-right{content:""}
               @bottom-left{content:""} @bottom-right{content:""} }
@page nochrome { @top-left{content:""} @top-right{content:""} @bottom-right{content:counter(page)} }

* { box-sizing: border-box; }
html { -weasy-hyphens: auto; }
body {
  font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
  font-size: 9.6pt; line-height: 1.5; color: #292524; margin: 0;
}
h1, h2, h3 { font-family: "Liberation Serif", serif; color: #1c1917; font-weight: normal; }
em, .it { font-style: italic; }

/* ── cover ── */
.cover { page: cover; height: 297mm; width: 210mm; position: relative;
  background: #1c1917; color: #f5f2ec; overflow: hidden; }
.cover .grid { position: absolute; inset: 0;
  background-image: linear-gradient(#ffffff0a 1px, transparent 1px),
                    linear-gradient(90deg, #ffffff0a 1px, transparent 1px);
  background-size: 26px 26px; }
.cover .glow { position: absolute; width: 460px; height: 460px; border-radius: 50%;
  background: radial-gradient(circle, #f59e0b33, transparent 70%);
  top: -120px; right: -120px; }
.cover .inner { position: relative; padding: 34mm 26mm; height: 100%;
  display: flex; flex-direction: column; }
.cover .wm { font-family: "Liberation Serif"; font-style: italic; font-size: 30pt; color: #fbbf24; }
.cover .wm span { color: #f5f2ec; }
.cover .eyebrow { margin-top: 60mm; font-family: "DejaVu Sans Mono"; font-size: 9pt;
  letter-spacing: 3px; text-transform: uppercase; color: #a8a29e; }
.cover h1 { font-size: 40pt; line-height: 1.06; color: #f5f2ec; margin: 8mm 0 0; }
.cover h1 em { color: #fbbf24; }
.cover .sub { margin-top: 8mm; font-size: 12pt; color: #d6d3d1; max-width: 130mm; line-height: 1.55; }
.cover .meta { margin-top: auto; display: flex; justify-content: space-between;
  align-items: flex-end; font-family: "DejaVu Sans Mono"; font-size: 8.5pt; color: #a8a29e;
  border-top: 1px solid #ffffff1f; padding-top: 6mm; }
.cover .meta .big { font-size: 10pt; color: #f5f2ec; }
.cover .chips { margin-top: 7mm; display: flex; flex-wrap: wrap; gap: 6px; max-width: 150mm; }
.cover .chip { font-family: "DejaVu Sans Mono"; font-size: 7.5pt; color: #e7e5e4;
  border: 1px solid #ffffff26; border-radius: 20px; padding: 3px 10px; }

/* ── table of contents ── */
.toc { page: nochrome; }
.toc h2 { font-size: 20pt; margin: 0 0 2mm; border: 0; }
.toc .lead { color: #78716c; margin: 0 0 7mm; font-size: 9.5pt; }
.toc ol { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
.toc > ol > li { counter-increment: toc; margin: 0; padding: 2.6mm 0;
  border-bottom: 1px solid #ececea; display: flex; align-items: baseline; }
.toc > ol > li::before { content: counter(toc, decimal-leading-zero);
  font-family: "DejaVu Sans Mono"; font-size: 9pt; color: #f59e0b; width: 12mm; flex: none; }
.toc .t { font-family: "Liberation Serif"; font-size: 12pt; color: #1c1917; }
.toc .d { color: #a8a29e; font-size: 8.6pt; margin-left: 3mm; }

/* ── sections ── */
.chapter { break-before: page; }
.kicker { font-family: "DejaVu Sans Mono"; font-size: 7.5pt; letter-spacing: 2.5px;
  text-transform: uppercase; color: #f59e0b; margin: 0 0 1mm; }
h2 { font-size: 18pt; margin: 0 0 3mm; padding-bottom: 2mm; border-bottom: 2px solid #1c1917;
  line-height: 1.1; }
h2 .mono { vertical-align: middle; }
h3 { font-size: 12.2pt; margin: 6mm 0 2mm; color: #1c1917; }
h3.tight { margin-top: 4mm; }
p { margin: 0 0 2.6mm; }
.lead { font-size: 10.4pt; color: #44403c; margin-bottom: 4mm; }
a { color: #b45309; text-decoration: none; }
strong { color: #1c1917; }
code, .mono { font-family: "DejaVu Sans Mono"; font-size: 8.4pt;
  background: #f4f2ef; border: 1px solid #e7e5e4; border-radius: 3px; padding: 0.5px 4px; color: #44403c; }

/* ── steps ── */
ol.steps { counter-reset: st; list-style: none; margin: 2mm 0 3mm; padding: 0; }
ol.steps li { counter-increment: st; position: relative; padding: 1mm 0 1mm 9mm;
  margin: 0 0 1mm; min-height: 6mm; break-inside: avoid; }
ol.steps li::before { content: counter(st); position: absolute; left: 0; top: 0.3mm;
  width: 5.4mm; height: 5.4mm; background: #1c1917; color: #fff; border-radius: 50%;
  font-family: "DejaVu Sans Mono"; font-size: 8pt; text-align: center; line-height: 5.4mm; }

/* ── callout boxes ── */
.cb { display: flex; gap: 3mm; align-items: flex-start; border-radius: 7px;
  padding: 3mm 3.6mm; margin: 3mm 0; font-size: 9.2pt; break-inside: avoid; line-height: 1.45; }
.cb-ic { font-family: "DejaVu Sans"; font-size: 10pt; line-height: 1.35; flex: none; }
.cb-tip  { background: #fffbeb; border: 1px solid #fde68a; }
.cb-tip  .cb-ic { color: #d97706; }
.cb-warn { background: #fef2f2; border: 1px solid #fecaca; }
.cb-warn .cb-ic { color: #dc2626; }
.cb-info { background: #eff6ff; border: 1px solid #bfdbfe; }
.cb-info .cb-ic { color: #2563eb; }
.cb-note { background: #f5f5f4; border: 1px solid #e7e5e4; }
.cb-note .cb-ic { color: #57534e; }

/* ── figures ── */
figure.fig { margin: 4mm 0 4mm; break-inside: avoid; }
.figframe { background: #0c0a09; border-radius: 12px; padding: 5mm; }
figcaption { font-size: 8.4pt; color: #57534e; margin: 2mm 0 0; }
.figlabel { font-family: "DejaVu Sans Mono"; font-size: 7.5pt; color: #b45309;
  background: #fff7ed; border: 1px solid #fed7aa; border-radius: 4px; padding: 1px 5px; margin-right: 4px; }
ol.legend { counter-reset: lg; list-style: none; margin: 3mm 0 0; padding: 0;
  column-count: 2; column-gap: 7mm; }
ol.legend li { position: relative; padding: 0 0 0 7mm; margin: 0 0 2mm; font-size: 8.5pt;
  line-height: 1.4; color: #44403c; break-inside: avoid; }
.cnum { position: absolute; left: 0; top: 0; width: 4.8mm; height: 4.8mm; background: #f59e0b;
  color: #1c1917; border-radius: 50%; font-family: "DejaVu Sans Mono"; font-size: 7.5pt;
  font-weight: bold; text-align: center; line-height: 4.8mm; }

/* ── tables ── */
table { width: 100%; border-collapse: collapse; margin: 3mm 0 4mm; font-size: 8.8pt;
  break-inside: avoid; }
th { background: #1c1917; color: #f5f2ec; font-weight: normal; text-align: left;
  padding: 2.2mm 2.6mm; font-size: 8pt; letter-spacing: 0.3px; }
th:first-child { border-top-left-radius: 6px; }
th:last-child { border-top-right-radius: 6px; }
td { padding: 2mm 2.6mm; border-bottom: 1px solid #ececea; vertical-align: top; }
tr:nth-child(even) td { background: #faf9f8; }
td.c, th.c { text-align: center; }
.yes { color: #059669; font-weight: bold; }
.no { color: #d1d0cd; }
.tag { font-family: "DejaVu Sans Mono"; font-size: 7.4pt; padding: 1px 6px; border-radius: 20px;
  white-space: nowrap; }
.t-disp { background: #ecfdf5; color: #047857; }
.t-hide { background: #f5f5f4; color: #78716c; }
.t-loan { background: #fffbeb; color: #b45309; }
.t-rest { background: #fef2f2; color: #dc2626; }

/* ── feature cards ── */
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 3mm 0; }
.card { border: 1px solid #e7e5e4; border-radius: 8px; padding: 3mm 3.4mm; background: #fff;
  break-inside: avoid; }
.card .ic { font-family: "DejaVu Sans"; font-size: 14pt; color: #d97706; line-height: 1; }
.card .ti { font-family: "Liberation Serif"; font-size: 10.5pt; color: #1c1917; margin: 1mm 0 1mm; }
.card .bd { font-size: 8.7pt; color: #57534e; line-height: 1.42; }

.endnote { margin-top: 4mm; padding: 3mm 4mm; background: #1c1917; color: #d6d3d1;
  border-radius: 8px; font-size: 8.8pt; break-inside: avoid; }
.endnote strong { color: #fbbf24; }
.faqq { font-weight: bold; color: #1c1917; margin: 3mm 0 0.5mm; font-size: 9.4pt; }
.faqa { margin: 0 0 2mm; color: #44403c; }
"""


# ── cover & TOC ───────────────────────────────────────────────────────────────
def cover():
    chips = ["Collection catalogue", "Public website", "Site Builder", "Analytics",
             "Event ticketing", "Staff & roles", "SPECTRUM compliance", "CSV import",
             "QR labels", "Document storage"]
    chiphtml = "".join('<span class="chip">' + c + "</span>" for c in chips)
    return (
        '<section class="cover"><div class="grid"></div><div class="glow"></div>'
        '<div class="inner">'
        '<div class="wm">Vitrine<span>.</span></div>'
        '<div class="eyebrow">Onboarding &amp; User Guide</div>'
        "<h1>Everything you need to run<br>your museum, <em>online</em>.</h1>"
        '<div class="sub">A complete, step-by-step walkthrough of Vitrine — from creating your '
        "account to cataloguing objects, publishing your public website, selling event tickets, "
        "managing staff, and meeting collections-documentation standards.</div>"
        '<div class="chips">' + chiphtml + "</div>"
        '<div class="meta">'
        '<div><div class="big">The all-in-one Collection Management System</div>'
        "for museums &amp; heritage collections of every size</div>"
        "<div>Edition · " + TODAY + "<br>vitrinecms.com</div>"
        "</div></div></section>")


def toc():
    rows = [
        ("Orientation", "What Vitrine is and how the dashboard is laid out"),
        ("Getting started", "Create your account and set up your museum"),
        ("Your collection", "Add, edit, import and organise objects"),
        ("Your public website", "Publish your collection online"),
        ("Customisation &amp; Site Builder", "Make the site look like yours"),
        ("Analytics", "Understand who visits your site"),
        ("Ticketing &amp; events", "Create events and sell tickets online"),
        ("Staff &amp; roles", "Invite your team and control access"),
        ("Compliance", "Provenance, rights, conservation &amp; loans"),
        ("Settings, plans &amp; billing", "Account, subscription and storage"),
        ("Quick reference", "Statuses, checklist, FAQ &amp; support"),
    ]
    li = "".join('<li><span class="t">' + t + '</span><span class="d">— ' + d + "</span></li>"
                 for t, d in rows)
    return ('<section class="toc"><h2>Contents</h2>'
            '<p class="lead">This guide is a concise, task-oriented reference. Each chapter pairs '
            "numbered how-to steps with an annotated diagram of the real interface.</p>"
            "<ol>" + li + "</ol></section>")


# ── chapters ──────────────────────────────────────────────────────────────────
def ch_orientation():
    cards = [
        ("⬡", "Collection", "A rich catalogue record for every object — metadata, photos, documents, status, provenance, conservation and rights."),
        ("◉", "Public website", "A fast, searchable, mobile-ready site at <code>yourslug.vitrine.app</code>, live from day one."),
        ("◫", "Site Builder", "Logo, colours, templates, homepage text, About &amp; Visit pages — no code, no designer."),
        ("▦", "Analytics", "First-party visitor stats: page views, top objects and traffic sources. No cookie banner."),
        ("★", "Ticketing", "Create events, set capacity and take bookings (free or paid via Stripe) on your own site."),
        ("◆", "Compliance", "Track documentation across the collection with a live, SPECTRUM-aligned score."),
    ]
    cardhtml = "".join('<div class="card"><div class="ic">' + i + '</div><div class="ti">' + t
                       + '</div><div class="bd">' + b + "</div></div>" for i, t, b in cards)
    plan_rows = [
        ["<td><strong>Community</strong></td>", '<td class="c">Free</td>', '<td class="c">100</td>',
         '<td class="c">1</td>', '<td class="c">1</td>', "<td>Public site, QR codes, wishlist, value tracking</td>"],
        ["<td><strong>Hobbyist</strong></td>", '<td class="c">£5/mo</td>', '<td class="c">1,000</td>',
         '<td class="c">5</td>', '<td class="c">1</td>', "<td>+ Analytics, CSV import/export, all templates, 100&nbsp;MB docs</td>"],
        ["<td><strong>Professional</strong></td>", '<td class="c">£79/mo</td>', '<td class="c">5,000</td>',
         '<td class="c">10</td>', '<td class="c">10</td>', "<td>+ 21 SPECTRUM procedures, ticketing, Visit/About pages, 1&nbsp;GB docs</td>"],
        ["<td><strong>Institution</strong></td>", '<td class="c">£349/mo</td>', '<td class="c">100,000</td>',
         '<td class="c">10</td>', '<td class="c">∞</td>', "<td>+ Unlimited staff, 10&nbsp;GB document storage</td>"],
        ["<td><strong>Enterprise</strong></td>", '<td class="c">Contact</td>', '<td class="c">∞</td>',
         '<td class="c">10</td>', '<td class="c">∞</td>', "<td>+ SSO, dedicated support &amp; SLA, unlimited storage</td>"],
    ]
    plan_hdr = ["<th>Plan</th>", '<th class="c">Price</th>', '<th class="c">Objects</th>',
                '<th class="c">Images / object</th>', '<th class="c">Staff</th>', "<th>Headline features</th>"]
    return chapter([
        kicker("Chapter 1"), h2("orientation", "Orientation"),
        p("Vitrine is an all-in-one Collection Management System (CMS) and public platform for "
          "museums and heritage collections of every size. It joins three jobs that usually need "
          "three separate tools — cataloguing your collection, running your website, and selling "
          "event tickets — into one place. No technical knowledge is required.", "lead"),
        h3("The six things Vitrine does", tight=True),
        '<div class="cards">' + cardhtml + "</div>",
        h3("The dashboard at a glance"),
        p("When you sign in you land on the dashboard. The left sidebar is your main navigation; the "
          "main panel shows a live summary of your collection and the full objects list. The exact "
          "sidebar items you see depend on your plan."),
        figure(D.dashboard_overview, "The dashboard — your home base. Counts update live and the sidebar takes you everywhere."),
        callout("info", "Vitrine adapts to your plan. Community and Hobbyist run a streamlined interface "
                "focused on objects and your website; Professional and above reveal the full toolkit — "
                "analytics, events, compliance and staff. Everything in this guide is labelled with the plan it needs."),
        h3("Plans at a glance"),
        table(plan_rows, plan_hdr),
        callout("tip", "Start free on Community and upgrade only when you bump into a limit. Every object, "
                "image and setting carries over automatically when you upgrade — nothing is re-entered."),
    ])


def ch_getting_started():
    nav_rows = [
        ["<td><strong>Objects</strong></td>", "<td>Your collection catalogue — add, edit, search, import</td>", '<td class="c">All</td>'],
        ["<td><strong>Site Builder</strong></td>", "<td>Your public website's look and content</td>", '<td class="c">All</td>'],
        ["<td><strong>Analytics</strong></td>", "<td>Visitor statistics for your public site</td>", '<td class="c">Hobbyist+</td>'],
        ["<td><strong>Events</strong></td>", "<td>Create events and manage ticket bookings</td>", '<td class="c">Professional+</td>'],
        ["<td><strong>Compliance</strong></td>", "<td>Documentation score across the collection</td>", '<td class="c">Professional+</td>'],
        ["<td><strong>Staff</strong></td>", "<td>Invite team members and set their roles</td>", '<td class="c">Professional+</td>'],
        ["<td><strong>Settings</strong></td>", "<td>Profile, plan, billing and museum details</td>", '<td class="c">All</td>'],
    ]
    return chapter([
        kicker("Chapter 2"), h2("getting-started", "Getting started"),
        p("Two short tasks stand between you and a live museum site: create an account, then run the "
          "three-step setup wizard.", "lead"),
        h3("Create your account", tight=True),
        steps([
            "Go to <code>vitrinecms.com/signup</code>. Enter your name and email and choose a password, then click <strong>Create account</strong>.",
            "Open the verification email from Vitrine and click the confirmation link. (Check spam if it hasn't arrived within a minute.)",
            "You're taken straight into the setup wizard.",
        ]),
        h3("Set up your museum (the wizard)"),
        figure(D.onboarding_flow, "The three-step setup wizard — name & URL, a starting template, then your plan."),
        steps([
            "<strong>Your museum.</strong> Type your museum name, pick a logo emoji, and choose your public URL (slug). Vitrine checks the slug live and offers an alternative if it's taken.",
            "<strong>Template.</strong> Choose a starting look — Minimal, Dramatic or Archival. You can change everything later in the Site Builder.",
            "<strong>Plan.</strong> Pick Community (free) or a paid tier. Paid plans go to secure Stripe checkout; on success you land on your dashboard, ready to add objects.",
        ]),
        callout("warn", "Your URL slug is your permanent public address (e.g. <code>mattscoins.vitrine.app</code>). "
                "On Community it can't be changed afterwards, so pick something short and recognisable that will "
                "still fit as your collection grows. (Paid plans can change it later in Settings; or email "
                "<a>hello@vitrine.app</a>.)"),
        h3("Find your way around"),
        p("The sidebar is always visible on desktop; on mobile, tap the menu icon (three lines) top-left. "
          "The items, top to bottom:"),
        table(nav_rows, ["<th>Sidebar item</th>", "<th>What it's for</th>", '<th class="c">Plan</th>']),
    ])


def ch_collection():
    status_rows = [
        ['<td><span class="tag t-disp">On Display</span></td>', "<td>Currently shown and live on your public site</td>", '<td class="c"><span class="yes">Visible</span></td>'],
        ['<td><span class="tag t-hide">In Storage</span></td>', "<td>In the collection but not shown publicly</td>", '<td class="c">Hidden</td>'],
        ['<td><span class="tag t-loan">On Loan</span></td>', "<td>Lent to another institution</td>", '<td class="c">Hidden</td>'],
        ['<td><span class="tag t-rest">Restoration</span></td>', "<td>Undergoing conservation work</td>", '<td class="c">Hidden</td>'],
        ['<td><span class="tag t-hide">Deaccessioned</span></td>', "<td>Permanently left the collection; kept in your archive view</td>", '<td class="c">Hidden</td>'],
    ]
    return chapter([
        kicker("Chapter 3"), h2("collection", "Your collection"),
        p("The Objects section is the heart of Vitrine. Every physical item gets its own record; the "
          "more detail you add, the richer your public pages become. Capacity ranges from 100 objects "
          "on Community to unlimited on Enterprise.", "lead"),
        h3("Add an object", tight=True),
        figure(D.add_object_form, "The new-object form. Only Title is required — add what you have and refine later."),
        steps([
            "Click <strong>Objects</strong>, then <strong>+ Add object</strong> (top-right).",
            "Type the <strong>Title</strong> (the only required field).",
            "Fill in any of: date/year, medium, dimensions, accession number and a free-text description.",
            "Add photos in the image panel — drag &amp; drop or click to upload (JPG/PNG/WebP). Drag to reorder; the first image is the primary one shown in your catalogue and site.",
            "Set the <strong>Status</strong> (see the table below), then click <strong>Save</strong>.",
        ]),
        callout("tip", "Don't let perfect be the enemy of good. A record with just a title and a photo now "
                "beats a blank you keep meaning to fill in. You can edit any object at any time."),
        h3("Object statuses"),
        p("An object's status controls both how it's organised and whether the public can see it. "
          '<strong>Only <span class="tag t-disp">On Display</span> objects appear on your website</strong> — '
          "there is no separate publish button."),
        table(status_rows, ["<th>Status</th>", "<th>Meaning</th>", '<th class="c">Public?</th>']),
        h3("Edit, find &amp; organise"),
        figure(D.object_detail_tabs, "An object's detail page. Tabs group the record; compliance tabs appear on Professional+."),
        steps([
            "<strong>Edit:</strong> click an object's title in the list to open its detail page, change any field or image, then <strong>Save changes</strong>. Updates to On Display objects are live instantly.",
            "<strong>Search:</strong> type in the search bar — Vitrine matches titles, descriptions and medium as you type. Clear with the × in the bar.",
            "<strong>Filter:</strong> use the <strong>Status</strong> dropdown beside the search bar to show, say, only objects On Loan.",
            "<strong>Hide vs. delete:</strong> change status away from On Display to hide an object while keeping the record. To delete permanently, scroll to the bottom of the detail page and click <strong>Delete object</strong>.",
        ]),
        callout("warn", "Deletion is permanent — the record and its images are removed for good. If there's any "
                'chance you\'ll want it again, use <span class="tag t-hide">Deaccessioned</span> instead.'),
        h3("Bulk import from a spreadsheet" + plan_tag("Professional+")),
        steps([
            "Click <strong>Objects → Import</strong> (the upward-arrow icon in the toolbar).",
            "Click <strong>Download CSV template</strong> and fill it in — only the <strong>Title</strong> column is required.",
            "Save as CSV and drag it onto the import drawer (or click to upload).",
            "Review the validation preview — rows with errors are highlighted in red with an explanation.",
            "Fix and re-upload, or dismiss bad rows, then click <strong>Confirm import</strong>.",
        ]),
        callout("tip", "Import in batches of 500–1,000 rows — errors are easier to spot, and you can review each "
                "batch before the next. Import creates new records; it doesn't update existing ones."),
        h3("Documents, depositors &amp; QR labels" + plan_tag("Professional+")),
        steps([
            "<strong>Attach a document:</strong> open an object → <strong>Documents</strong> tab → <strong>+ Attach document</strong>, choose the file, add a short label (e.g. &ldquo;Acquisition receipt 1962&rdquo;), then <strong>Upload</strong>. Storage counts toward your plan quota.",
            "<strong>Record a depositor/acquisition:</strong> on the <strong>Acquisition</strong> tab, enter depositor details, acquisition method (Purchase, Donation, Bequest, Transfer, Field collection, Unknown), date, GDPR-consent and receipt-issued toggles.",
            "<strong>Print a QR label:</strong> click the <strong>QR label</strong> icon (top-right of the detail page), choose a format (tag, card or A5 sheet), then <strong>Print</strong> or <strong>Download PDF</strong>. Scanning it opens the object's page.",
        ]),
    ])


def ch_public():
    page_rows = [
        ["<td><strong>Home</strong></td>", "<td>Museum name, tagline, description and featured objects</td>", '<td class="c">All</td>'],
        ["<td><strong>Collection</strong></td>", "<td>Searchable, filterable browser of every On Display object, with per-object detail pages</td>", '<td class="c">All</td>'],
        ["<td><strong>About</strong></td>", "<td>Your story, mission, team and facilities</td>", '<td class="c">Professional+</td>'],
        ["<td><strong>Visit</strong></td>", "<td>Opening hours, admission, address, accessibility, directions</td>", '<td class="c">Professional+</td>'],
        ["<td><strong>Events</strong></td>", "<td>Upcoming events with online booking</td>", '<td class="c">Professional+</td>'],
    ]
    return chapter([
        kicker("Chapter 4"), h2("public", "Your public website"),
        p("Every account has a live public site at <code>yourslug.vitrine.app</code> from the moment you "
          "sign up — nothing to switch on. It's fast, mobile-optimised and accessible out of the box.", "lead"),
        figure(D.public_site, "Your public site. On Professional+ it's a full multi-page website with About, Visit and Events."),
        h3("What visitors see", tight=True),
        table(page_rows, ["<th>Page</th>", "<th>Contents</th>", '<th class="c">Plan</th>']),
        h3("Publishing &amp; visibility"),
        p('An object\'s <strong>Status</strong> is the single switch that controls public visibility — set it '
          'to <span class="tag t-disp">On Display</span> and save, and it\'s live immediately; set it to anything '
          "else and it vanishes from the site at once. There's no cache to wait for."),
        steps([
            "<strong>Show an object:</strong> open it, set Status to <strong>On Display</strong>, <strong>Save changes</strong>.",
            "<strong>Hide an object:</strong> set Status to anything else (e.g. In Storage) and save.",
            "<strong>View your live site:</strong> click <strong>Site Builder → View live site</strong> to open it in a new tab — exactly what visitors see. Bookmark and share the URL anywhere.",
        ]),
        callout("tip", "Your public URL works for anyone, no account needed. Put it on printed labels, email "
                "signatures and social media to drive people to your collection."),
    ])


def ch_customisation():
    return chapter([
        kicker("Chapter 5"), h2("customisation", "Customisation &amp; Site Builder"),
        p("The Site Builder is where your site becomes yours — logo, colours, template, homepage text, "
          "featured objects and (on Professional+) full About and Visit pages. No design skill or code "
          "needed. Changes preview live and go public only when you click <strong>Publish</strong>.", "lead"),
        figure(D.site_builder, "The Site Builder. Tabs organise the controls; the live preview shows changes before you publish."),
        h3("Appearance — template, colour, logo", tight=True),
        steps([
            "<strong>Template:</strong> Site Builder → <strong>Appearance</strong>, click a template preview (Minimal, Dramatic, Archival; premium templates on paid plans).",
            "<strong>Accent colour:</strong> click the swatch and pick a colour, or type a hex code (e.g. <code>#1a3c6e</code>). It styles buttons, links and highlights.",
            "<strong>Logo:</strong> upload a PNG or SVG (200px wide or larger; transparent background recommended) in the Logo area.",
            "Click <strong>Publish</strong> to push changes live.",
        ]),
        h3("Content — tagline, featured objects, social"),
        steps([
            "<strong>Tagline &amp; description:</strong> Site Builder → <strong>Content</strong>. Write a one-line tagline and an optional short description shown beneath it.",
            "<strong>Featured objects:</strong> in the Featured objects section, click <strong>+ Add featured object</strong> and start typing a title to add it. Feature up to 6; drag the ⠿ handle to reorder, click × to remove (this doesn't affect the catalogue record).",
            "<strong>Social links:</strong> paste full profile URLs for Instagram, Facebook, X and YouTube; icons appear in your site footer.",
            "Click <strong>Publish</strong>.",
        ]),
        h3("About &amp; Visit pages" + plan_tag("Professional+")),
        steps([
            "<strong>About:</strong> Site Builder → Content → <strong>About</strong>. Write your story (headings, bold, italic and lists supported) and an optional Facilities list (café, shop, accessible toilets, hearing loop…).",
            "<strong>Visit:</strong> Site Builder → <strong>Visit info</strong>. Fill in opening hours, admission, full address, an honest accessibility note, and a &ldquo;Getting here&rdquo; travel/parking note.",
            "<strong>Temporary notices:</strong> use the Special notices field for closures (e.g. &ldquo;Closed 24–26 Dec&rdquo;); it shows prominently atop the Visit page. Clear it and publish when over.",
        ]),
        callout("tip", "Out-of-date visit information is the most common complaint on museum websites. Set a "
                "calendar reminder to review hours around holidays and temporary closures."),
        h3("SEO — being found on Google" + plan_tag("Professional+")),
        steps([
            "Site Builder → Content → <strong>SEO</strong>.",
            "Set a <strong>Meta title</strong> — format &ldquo;Museum Name | Short description&rdquo; (shown as the headline in search results).",
            "Set a <strong>Meta description</strong> — 1–2 sentences, under 160 characters.",
            "Click <strong>Publish</strong>. Search engines may take a few days to re-index.",
        ]),
    ])


def ch_analytics():
    return chapter([
        kicker("Chapter 6"), h2("analytics", "Analytics" + plan_tag("Hobbyist+")),
        p("Analytics shows how people find and use your public site. All data is collected first-party by "
          "Vitrine — no third-party cookies, no Google Analytics, no consent banner on your site.", "lead"),
        figure(D.analytics, "The Analytics page. Headline numbers, a daily chart, your top objects and traffic sources."),
        steps([
            "<strong>Read the headline numbers:</strong> page views, unique visitors and average time on site, each with the change vs. the previous period.",
            "<strong>Change the range:</strong> use the selector (top-right) — Last 7 / 30 / 90 days, or a custom range via the calendar, then <strong>Apply</strong>. Everything updates.",
            "<strong>Find popular objects:</strong> scroll to <strong>Top objects</strong>; click any title to jump to its detail page and improve it.",
            "<strong>See where visitors come from:</strong> the <strong>Traffic sources</strong> breakdown splits Direct, Search and Social — low Search suggests improving SEO; low Social suggests sharing object pages.",
            "<strong>Export:</strong> click the download icon by the date selector and choose <strong>CSV</strong>.",
        ]),
        callout("tip", "Your top-objects list is the most actionable data here. Invest in those records — better "
                "photos, fuller descriptions, deeper provenance — and your whole collection looks stronger."),
    ])


def ch_ticketing():
    return chapter([
        kicker("Chapter 7"), h2("ticketing", "Ticketing &amp; events" + plan_tag("Professional+")),
        p("Create events, manage capacity and take bookings directly on your own site — no Eventbrite. "
          "Free events work instantly; paid events use Stripe and pay out to your bank.", "lead"),
        h3("How it works, end to end", tight=True),
        p("You create an event → it appears on your public Events page → visitors book with name &amp; email "
          "(paid events are charged via Stripe) → both sides get an automatic confirmation email → you track "
          "attendance on the day from the dashboard."),
        callout("info", "Vitrine charges a <strong>2% platform fee</strong> on paid ticket sales; standard Stripe "
                "processing fees (typically 1.4% + 25p for UK cards) also apply. Free events are entirely free."),
        h3("One-time payment setup (paid events only)"),
        steps([
            "Click <strong>Events → Payouts</strong> tab.",
            "Click <strong>Connect with Stripe</strong> and complete the Stripe-hosted form (legal name, address, organisation type, UK bank sort code &amp; account number).",
            "When verified, you return to Vitrine showing a green <strong>Connected</strong> status. You can now create paid events.",
        ]),
        callout("tip", "Free-entry events need no Stripe connection — you can start taking bookings for them right away."),
        h3("Create an event"),
        figure(D.new_event, "The new-event form. Enter 0 for the ticket price to make an event free."),
        steps([
            "Click <strong>Events → + New event</strong>.",
            "Enter a clear <strong>title</strong> and a <strong>description</strong> (shown on the booking page and in the confirmation email).",
            "Set <strong>date &amp; time</strong> with the picker (optional end time).",
            "Set <strong>capacity</strong> — the form closes automatically when it's reached.",
            "Set the <strong>ticket price</strong> (<code>0</code> = free; otherwise price per person in pounds).",
            "Click <strong>Publish event</strong> — it goes live on your Events page immediately.",
        ]),
        h3("Manage bookings, attendance &amp; refunds"),
        steps([
            "<strong>See bookings:</strong> open the event → <strong>Bookings</strong> tab (name, email, time, payment status; capacity bar at the top).",
            "<strong>Check people in:</strong> on the day, use the <strong>Attendance</strong> tab — tick names as they arrive (rows turn green), or tap <strong>Scan tickets</strong> to read each attendee's QR code.",
            "<strong>Refund one booking:</strong> Bookings tab → <strong>Refund</strong> on that row → <strong>Confirm</strong>. The attendee is emailed automatically; money returns in 5–10 business days.",
            "<strong>Cancel the whole event:</strong> open it → <strong>Cancel event</strong>. All paid bookings are auto-refunded and everyone is emailed.",
            "<strong>Edit an event:</strong> <strong>Edit event</strong> → change details (you can't cut capacity below current bookings) → <strong>Save changes</strong>.",
        ]),
        callout("warn", "Refunds don't return Stripe's processing fee — the customer receives the net amount you "
                "were paid. Also, editing an event does <em>not</em> auto-email existing attendees; if you change the "
                "date or time, message them from the Bookings tab."),
    ])


def ch_staff():
    perm = [
        ("View objects", "✓", "✓", "✓", "✓"),
        ("Add &amp; edit objects", "✓", "✓", "✓", "—"),
        ("Manage compliance data", "✓", "✓", "✓", "—"),
        ("Attach documents", "✓", "✓", "✓", "—"),
        ("Edit site content", "✓", "✓", "—", "—"),
        ("Manage events &amp; bookings", "✓", "✓", "—", "—"),
        ("View analytics", "✓", "✓", "—", "—"),
        ("Invite &amp; remove staff", "✓", "—", "—", "—"),
        ("Access billing &amp; plan", "✓", "—", "—", "—"),
    ]

    def cell(v):
        cls = "yes" if v == "✓" else "no"
        return '<td class="c ' + cls + '">' + v + "</td>"

    perm_rows = [["<td>" + r[0] + "</td>"] + [cell(r[i]) for i in range(1, 5)] for r in perm]
    perm_hdr = ["<th>Capability</th>", '<th class="c">Admin</th>', '<th class="c">Curator</th>',
                '<th class="c">Registrar</th>', '<th class="c">Volunteer</th>']
    return chapter([
        kicker("Chapter 8"), h2("staff", "Staff &amp; roles" + plan_tag("Professional+")),
        p("Give each team member their own login with a role that precisely controls what they can see "
          "and do. Professional supports 10 staff; Institution and Enterprise are unlimited.", "lead"),
        figure(D.staff, "The Staff page. Each person has an individual login, a role, and an active/pending status."),
        h3("Invite &amp; manage", tight=True),
        steps([
            "<strong>Invite:</strong> Staff → <strong>+ Invite</strong> → enter their email → choose a role → <strong>Send invitation</strong>. The link is valid 7 days; they show as &ldquo;Invite pending&rdquo; until they accept.",
            "<strong>Resend:</strong> click a pending person's name → <strong>Resend invitation</strong>.",
            "<strong>Change role:</strong> click their name → pick a new <strong>Role</strong> → <strong>Save changes</strong> (takes effect immediately).",
            "<strong>Remove:</strong> click their name → <strong>Remove from museum</strong> → confirm. Access ends at once; their Vitrine account itself isn't deleted.",
        ]),
        h3("Roles &amp; permissions"),
        table(perm_rows, perm_hdr),
        callout("tip", "Use <strong>Volunteer</strong> (read-only) for researchers and temporary helpers — they can "
                "look anything up with zero risk of accidental edits. Reserve <strong>Admin</strong> for the few who "
                "manage the account itself."),
    ])


def ch_compliance():
    area_rows = [
        ["<td><strong>Provenance</strong></td>", "<td>Provenance</td>", "<td><strong>+ Add provenance entry</strong> for each stage: date/range, description, and the person or institution. Build a chain from origin to today.</td>"],
        ["<td><strong>Acquisition</strong></td>", "<td>Acquisition</td>", "<td>Method (Purchase, Donation, Bequest, Transfer, Field collection, Unknown), date, and notes (vendor, donor, funding).</td>"],
        ["<td><strong>Conservation</strong></td>", "<td>Conservation</td>", "<td>Condition rating (Excellent → Critical), descriptive notes, and assessment date. Attach a formal report in Documents.</td>"],
        ["<td><strong>Rights</strong></td>", "<td>Rights</td>", "<td>Copyright status (In copyright, Public domain, Unknown, Orphan work), rights holder, licence terms and restrictions.</td>"],
        ["<td><strong>Loans</strong></td>", "<td>Loans</td>", "<td><strong>+ Add loan record</strong>: type (Loan in/out), institution, start/end dates, conditions. Also set Status to <strong>On Loan</strong>.</td>"],
    ]
    return chapter([
        kicker("Chapter 9"), h2("compliance", "Compliance" + plan_tag("Professional+")),
        p("The Compliance section helps you build and keep the documentation responsible museum practice "
          "requires. Vitrine tracks five areas across the whole collection and gives a live score — the "
          "share of objects with complete documentation.", "lead"),
        figure(D.compliance, "The compliance dashboard. A live score, a progress bar, and a per-category breakdown with gaps flagged."),
        callout("info", "Vitrine's compliance tools are built around the UK's SPECTRUM collections-management "
                "standard and align with the documentation requirements for Arts Council England accreditation."),
        h3("Check your score", tight=True),
        steps([
            "Click <strong>Compliance</strong>. The overview shows your overall percentage and a progress bar.",
            "Each of the five categories shows its own completion (e.g. &ldquo;Provenance documented: 131/142&rdquo;). A green ✓ means complete; an amber ! flags gaps.",
            "Click a category to list the exact objects missing that data; click an object title to jump in and fill it.",
        ]),
        h3("Record each area (on the object's tabs)"),
        figure(D.object_detail_tabs, "Compliance data lives on the object's own tabs: Provenance, Acquisition, Conservation, Rights and Loans."),
        table(area_rows, ["<th>Area</th>", "<th>Tab</th>", "<th>What to record</th>"]),
        callout("tip", "Even partial provenance beats none. Record what you know confidently and flag gaps explicitly "
                "(e.g. &ldquo;Ownership 1910–1962 unverified&rdquo;) — a documented acknowledgement of uncertainty is "
                "more credible than a blank."),
        callout("warn", "When a loan ends, update <em>both</em> the object's status (back to On Display or In Storage) "
                "and the loan record's end date, so your compliance dashboard stays accurate."),
    ])


def ch_settings():
    return chapter([
        kicker("Chapter 10"), h2("settings", "Settings, plans &amp; billing"),
        p("Settings holds your profile, security, plan, billing history, document storage and museum "
          "details. Reach it via <strong>Settings</strong> at the bottom of the sidebar.", "lead"),
        figure(D.settings_plan, "The Plan tab. Your tier, usage bars, and the buttons to upgrade, downgrade or cancel."),
        h3("Account &amp; security", tight=True),
        steps([
            "<strong>Profile:</strong> Settings opens to Profile — edit Name or Email, then <strong>Save changes</strong>. Changing email sends a verification link to the new address; the old one stays active until you click it.",
            "<strong>Password:</strong> Settings → <strong>Security</strong> → <strong>Change password</strong>; enter current then new (min 8 characters). Other sessions are signed out.",
            "<strong>Museum details:</strong> Settings → <strong>Museum</strong> — the name here appears on your site and in every automated email.",
        ]),
        h3("Plan, usage &amp; billing"),
        steps([
            "<strong>See plan &amp; usage:</strong> Settings → <strong>Plan</strong> — current tier, price, next billing date, and usage bars for objects, staff and document storage.",
            "<strong>Upgrade/downgrade:</strong> click <strong>Upgrade</strong>, choose a plan (you're billed pro-rata for the rest of the period). Enterprise opens a contact prompt instead of a payment form.",
            "<strong>Invoices:</strong> Settings → <strong>Billing</strong> — click <strong>Download</strong> beside any charge for a PDF.",
            "<strong>Document storage:</strong> the Plan tab shows usage vs. allowance (1&nbsp;GB Professional, 10&nbsp;GB Institution, unlimited Enterprise). Free space by deleting files from an object's Documents tab, or upgrade.",
        ]),
        h3("Cancelling &amp; deleting"),
        steps([
            "<strong>Cancel subscription:</strong> Settings → Plan → <strong>Cancel subscription</strong> → confirm. You keep paid access until the period ends, then revert to free Community. Nothing is deleted.",
            "<strong>Delete account:</strong> Settings → Account → bottom of page → <strong>Delete account</strong>, type your museum name to confirm, then <strong>Confirm deletion</strong>.",
        ]),
        callout("warn", "Two reversions to know: dropping below a plan that supports fewer objects lets you keep all "
                "existing records but blocks <em>new</em> ones until you're under the limit; and reverting to Community "
                "(single account) signs out extra staff until you re-upgrade. <strong>Account deletion is "
                "irreversible</strong> — everything is erased permanently."),
    ])


def ch_reference():
    status_rows = [
        ['<td><span class="tag t-disp">On Display</span></td>', '<td class="c"><span class="yes">Yes</span></td>', "<td>Anything you want the public to browse</td>"],
        ['<td><span class="tag t-hide">In Storage</span></td>', '<td class="c">No</td>', "<td>Catalogued but not currently shown</td>"],
        ['<td><span class="tag t-loan">On Loan</span></td>', '<td class="c">No</td>', "<td>At another institution (pair with a Loan record)</td>"],
        ['<td><span class="tag t-rest">Restoration</span></td>', '<td class="c">No</td>', "<td>Undergoing conservation work</td>"],
        ['<td><span class="tag t-hide">Deaccessioned</span></td>', '<td class="c">No</td>', "<td>Left the collection; kept in your archive</td>"],
    ]
    where_rows = [
        ["<td>Add or edit an object</td>", "<td>Objects → + Add object / click a title</td>"],
        ["<td>Change my site's look</td>", "<td>Site Builder → Appearance</td>"],
        ["<td>Edit homepage text &amp; featured objects</td>", "<td>Site Builder → Content</td>"],
        ["<td>Set opening hours &amp; admission</td>", "<td>Site Builder → Visit info</td>"],
        ["<td>See visitor stats</td>", "<td>Analytics</td>"],
        ["<td>Create an event / take bookings</td>", "<td>Events → + New event</td>"],
        ["<td>Invite a colleague</td>", "<td>Staff → + Invite</td>"],
        ["<td>Check documentation gaps</td>", "<td>Compliance</td>"],
        ["<td>Change plan or download invoices</td>", "<td>Settings → Plan / Billing</td>"],
    ]
    faqs = [
        ("Is my data backed up?", "Yes — Vitrine runs on managed cloud infrastructure with regular backups. Your records and images are stored securely; deleting an object or account, however, is permanent and not recoverable by support."),
        ("Can visitors see objects that aren't On Display?", "No. Only objects with the On Display status appear publicly. Everything else is private to you and your staff."),
        ("Do I need a website or domain already?", "No. Every account includes a free, fast public site at yourslug.vitrine.app the moment you sign up. Custom domains are on the roadmap."),
        ("How do paid ticket payouts reach me?", "Through Stripe Connect, straight to your bank account. Vitrine takes a 2% platform fee; standard Stripe fees also apply. Free events are free."),
        ("What happens to my data if I downgrade?", "Nothing is deleted. You keep all records and images but lose access to higher-tier features and can't add new objects beyond the lower plan's limit until you're back under it."),
        ("How do I get help?", "Email hello@vitrine.app, or browse the in-app guides at vitrinecms.com/guide (Essentials and Professional editions)."),
    ]
    faqhtml = "".join('<div class="faqq">' + q + '</div><div class="faqa">' + a + "</div>" for q, a in faqs)
    return chapter([
        kicker("Chapter 11"), h2("reference", "Quick reference"),
        h3("Status &amp; public visibility", tight=True),
        table(status_rows, ["<th>Status</th>", '<th class="c">On public site?</th>', "<th>Typical use</th>"]),
        h3("A sensible first-week checklist"),
        steps([
            "Create your account and choose a memorable URL slug.",
            "Add 5–10 of your best objects with a good photo each, set to On Display.",
            "In Site Builder: upload your logo, set your accent colour and write a tagline.",
            "Feature your 3–6 strongest objects on the homepage.",
            "Open your live site, check it on your phone, and share the URL.",
            "(Professional+) Fill in your Visit page, invite staff, and start your compliance records.",
        ]),
        h3("Where things live"),
        table(where_rows, ["<th>I want to…</th>", "<th>Go to</th>"]),
        h3("Frequently asked questions"),
        faqhtml,
        '<div class="endnote"><strong>Need a hand?</strong> Email <span class="mono">hello@vitrine.app</span> '
        'or read the in-app guides at <span class="mono">vitrinecms.com/guide</span>. Welcome aboard — '
        "we can't wait to see your collection online.</div>",
    ])


# ── assemble ──────────────────────────────────────────────────────────────────
def build_html():
    body = "".join([
        cover(), toc(),
        ch_orientation(), ch_getting_started(), ch_collection(), ch_public(),
        ch_customisation(), ch_analytics(), ch_ticketing(), ch_staff(),
        ch_compliance(), ch_settings(), ch_reference(),
    ])
    return ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<title>Vitrine — Onboarding &amp; User Guide</title>"
            "<style>" + CSS + "</style></head><body>" + body + "</body></html>")


def main():
    html = build_html()
    with open("onboarding.html", "w", encoding="utf-8") as f:
        f.write(html)
    from weasyprint import HTML
    HTML(string=html, base_url=".").write_pdf(OUT)
    print("Wrote " + OUT)


if __name__ == "__main__":
    main()
