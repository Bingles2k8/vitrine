# Vitrine Onboarding Guide — PDF generator

Generates `public/vitrine-onboarding-guide.pdf`: a comprehensive,
concise-reference onboarding & user guide covering every feature across all
plans, with custom annotated UI diagrams that mirror the real interface.

Because it lives under `public/`, the site serves it at
`/vitrine-onboarding-guide.pdf`. It's linked from the guide pages
(`/guide/essentials`, `/guide/professional`), the dashboard sidebar (Help),
the onboarding wizard, and the FAQ page.

## Files

| File | Purpose |
|------|---------|
| `build_onboarding_pdf.py` | Builds the HTML document (cover, TOC, 11 chapters, tables, callouts) and renders it to PDF. |
| `vitrine_diagrams.py` | Hand-built SVG mockups of the real UI (dark dashboard, amber accent, serif-italic wordmark) with numbered amber callout badges. |

The content is kept in sync with the in-app guides under
`content/guide/{essentials,professional}` and the brand styling in
`lib/templates.ts` / `lib/plans.ts`.

## Regenerating

Requires Python 3 and [WeasyPrint](https://weasyprint.org) (which needs the
system Pango/Cairo/GDK-Pixbuf libraries):

```bash
pip install weasyprint
cd scripts/onboarding-pdf
bash setup-fonts.sh                     # one-time: install the brand fonts (see below)
python3 build_onboarding_pdf.py        # writes ../../public/vitrine-onboarding-guide.pdf
# or pass an explicit output path:
python3 build_onboarding_pdf.py /tmp/preview.pdf
```

## Brand fonts

The PDF uses the same fonts as the website:

| Role | Font | Site source |
|------|------|-------------|
| Body / sans | **Geist** | `--font-geist-sans` |
| Labels (the app's "mono") | **DM Sans** | `--font-geist-mono` |
| Serif headings & wordmark | **Gelasio** | OFL twin of Georgia, which `font-serif` resolves to |

`setup-fonts.sh` downloads these (all SIL Open Font License) and instantiates the
static weights/italics WeasyPrint needs. The committed PDF already has them
embedded, so this step is only required to **regenerate** the file. The build
prints a warning if the fonts aren't found rather than silently substituting.

Decorative UI glyphs in the diagrams (e.g. `⬡ ◫ ▦ ★ ◆`) come from DejaVu Sans,
since the brand text fonts don't include those symbols.

## Notes

- Diagrams are SVG, so the PDF stays crisp at any zoom and the file is small.
- WeasyPrint cannot rasterise colour-emoji fonts, so all icons use either
  drawn SVG (thumbnails, magnifier, QR) or monochrome geometric glyphs
  (`⬡ ◫ ▦ ★ ◆ ◉`) that render reliably.
- To preview while editing, the build also writes an intermediate
  `onboarding.html` in the working directory (gitignored).
