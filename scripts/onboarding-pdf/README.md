# Vitrine Onboarding Guide — PDF generator

Generates `Vitrine-Onboarding-Guide.pdf` (committed at the repo root): a
comprehensive, concise-reference onboarding & user guide covering every feature
across all plans, with custom annotated UI diagrams that mirror the real
interface.

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
python3 build_onboarding_pdf.py ../../Vitrine-Onboarding-Guide.pdf
```

## Notes

- Diagrams are SVG, so the PDF stays crisp at any zoom and the file is small.
- WeasyPrint cannot rasterise colour-emoji fonts, so all icons use either
  drawn SVG (thumbnails, magnifier, QR) or monochrome geometric glyphs
  (`⬡ ◫ ▦ ★ ◆ ◉`) that render reliably.
- To preview while editing, the build also writes an intermediate
  `onboarding.html` in the working directory (gitignored).
