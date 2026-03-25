---
description: Write a Vitrine blog post. Pass a topic brief including the target keyword, angle, and any internal pages to link to.
argument-hint: <topic brief>
allowed-tools: [Read, Write, Glob]
---

Write a complete Vitrine blog post as a ready-to-save MDX file based on this brief:

$ARGUMENTS

---

## Brand voice

- Direct and knowledgeable — written by someone who understands collecting, not a content agency
- Collector-first: assume the reader collects something and has a real problem to solve
- No filler openers ("In today's world...", "Whether you're a...", "If you've ever wondered...")
- Use "you" and "your collection" throughout — never "one's collection" or passive voice
- Honest about competitors: fair, specific, and accurate, not dismissive
- British English spelling throughout: organise, catalogue, colour, recognise, centre, analyse

---

## Post structure (follow this order exactly)

**1. Answer capsule (first paragraph — no heading)**
40–60 words. Self-contained. Answers the post's core question without needing surrounding context. Written so an AI system could extract it verbatim as a definition. Put the target keyword naturally in the first sentence.

**2. Body sections**
H2-headed sections. One idea per section. 100–250 words each. Front-load the key point in the first sentence of every section — don't build to it.

**3. Comparison table (where relevant)**
Use a Markdown table to compare tools, options, or approaches. Include a column for Vitrine where relevant. Be fair — include real limitations alongside strengths.

**4. Internal links**
Include 3–5 contextual links using Markdown link syntax to relevant pages:
- Segment pages: `/for/coin-collection-app`, `/for/trading-card-collection-app`, `/for/vinyl-record-collection-app`, `/for/book-collection-app`, `/for/lego-toy-collection-app`, `/for/comic-book-collection-app`, `/for/wine-collection-app`, `/for/watch-collection-app`, `/for/stamp-collection-app`, `/for/art-collection-app`
- Comparison pages: `/compare/delicious-library-alternative`, `/compare/catalogit-alternative`, `/compare/sortly-alternative`, `/compare/clz-alternative`, `/compare/spreadsheet-alternative`, `/compare/icollect-everything-alternative`, `/compare/collectify-alternative`
- Core pages: `/`, `/#pricing`, `/faq`, `/about`

Link naturally within body copy — not as a list at the end.

**5. FAQ section (always last)**
H2 heading: `## Frequently asked questions`
4–6 questions. Each question in bold (`**Question?**`), followed immediately by the answer as a plain paragraph. Answers 30–60 words each. Questions should reflect real search queries. This section is parsed automatically for FAQPage JSON-LD schema.

---

## MDX frontmatter (always include at the top)

```
---
title: ""
description: ""
publishedAt: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
keywords:
  - primary keyword
  - secondary keyword
  - tertiary keyword
---
```

- **title**: 50–60 characters. Must contain the primary target keyword.
- **description**: 140–160 characters. Complete sentence. Includes the primary keyword. Entices clicks.
- **publishedAt / updatedAt**: Use today's date (2026-03-25).
- **keywords**: 3–6 terms, primary keyword first.

---

## SEO rules

- Do NOT add an H1 in the body — the title in frontmatter becomes the H1
- H2s should contain secondary keywords naturally
- Answer the target keyword in the first 50 words of the body (the answer capsule)
- Use specific numbers wherever possible ("up to 500 items", "£5/month", "17 consecutive years of vinyl sales growth") — specificity makes content more citable by AI systems
- Aim for 1,200–2,000 words total

---

## Output format

Output the complete MDX file content only — starting with the `---` frontmatter block and ending with the last line of the FAQ section. Do not add any commentary before or after. The output should be ready to paste directly into the `.mdx` file.
