# Explainer Animation — Options Analysis (backlog)

[README](../../README.md) › [Docs](../README.md) › Design › **Animation Options**

> **Status:** backlog — **analysis only**, for future brainstorm + implementation.
> Captures the ways to turn [`../product/NARRATIVE.md`](../product/NARRATIVE.md) (esp. its
> §9 Animation Brief) into a short animated explainer, with tradeoffs, so a future session
> (or a downstream agent) can pick an approach and run. No decision made here.
>
> **The source of truth is the NARRATIVE**, which already provides: a scene list mapped to
> sections, tone, through-line (`esha`), five Mermaid diagrams, assets, and "do-not-say"
> honesty guardrails. The question this doc answers is only: *how do we render that into
> motion, simply?*

---

## Table of Contents
1. [Goal & constraints](#1-goal--constraints)
2. [The option landscape](#2-the-option-landscape)
3. [Comparison table](#3-comparison-table)
4. [Recommendation direction](#4-recommendation-direction-not-final)
5. [The pipeline, whichever tool](#5-the-pipeline-whichever-tool)
6. [Open questions](#6-open-questions)

---

## 1. Goal & constraints
- **Goal:** a **60–90s** explainer of the problem→solution→proof, per the NARRATIVE §9 brief.
- **Simple** to produce and to *re-produce* when the narrative changes (it's a living doc).
- **Agent-friendly:** favour **text/code-defined** animation (diffable, scriptable, no manual
  timeline dragging) so a downstream AI can generate/update it from the doc.
- **Honest:** must respect the NARRATIVE "do-not-say" list (no over-claiming prod-hardening).
- **Cheap / self-hostable-ish** preferred, matching the project's ethos; avoid lock-in where practical.

## 2. The option landscape

Grouped by *how the animation is authored*.

### A. Code-defined animation (best fit for an agent)
- **Motion Canvas** — TypeScript library purpose-built for **explainer videos**; animations
  are code, previewed in a browser editor, exported to video. Strong fit: readable code, a
  timeline API, good for diagrams/labels/arrows. *Pro:* agent can author/update from the
  narrative; versionable. *Con:* a learning curve; you script timing.
- **Manim** (Python) — the "3Blue1Brown" engine. Excellent for precise, math/diagram-style
  motion. *Pro:* powerful, scriptable, huge community. *Con:* heavier; aesthetic leans
  academic; Python toolchain.
- **Remotion** (React) — render video **from React components**; anything you can build in the
  web stack (incl. your existing SvelteKit-adjacent skills, though it's React) becomes frames.
  *Pro:* reuse web components, data-driven, programmatic; great for "UI comes alive." *Con:*
  React-specific; rendering setup (headless Chromium).
- **Reveal.js / Slidev + screen-record** — animated *slides* (Slidev is Markdown-based, very
  agent-friendly) recorded to video. *Pro:* dead simple, Markdown source = closest to the
  narrative; fast. *Con:* "animated slides," not true motion graphics — lower production feel.

### B. Diagram-native motion
- **Animated Mermaid / SVG** — the NARRATIVE already has Mermaid diagrams; render to SVG and
  animate (CSS/SMIL/JS: draw-on strokes, fades, highlights) then screen-record or frame-capture.
  *Pro:* reuses existing assets directly; minimal new authoring. *Con:* limited to
  diagram-style motion; stitching scenes + voiceover is manual-ish.
- **Excalidraw + export** — hand-drawn aesthetic; has animation/present modes and community
  tools to animate the draw-on. *Pro:* friendly, quick, good for "sketch explainer." *Con:*
  less programmatic; timing is manual.

### C. Timeline / GUI tools (least agent-friendly, most polish-per-hour for a human)
- **After Effects / Motion** — industry standard, maximum polish. *Con:* costly, manual, not
  scriptable by an agent, overkill for a POC.
- **Canva / Visme / Powtoon (template-based)** — drag-and-drop explainer templates + stock
  motion. *Pro:* fastest for a human to a "decent" result; built-in voiceover/captions. *Con:*
  subscription, template-samey, not reproducible-from-source, mild lock-in.

### D. AI text-to-video / avatar tools
- **Synthesia / HeyGen (avatar + script)** — paste a script, get a talking-head + slides.
  *Pro:* trivially fast; the NARRATIVE scene list *is* the script. *Con:* subscription; avatar
  vibe may not suit a technical explainer; less control of the *visual* proof (the diagrams).
- **Gen-AI video (Sora/Runway/Kling etc.)** — generative clips. *Pro:* novel visuals. *Con:*
  poor at precise technical diagrams/labels; unpredictable; not the right tool for "show the
  exact check request/response." Better for B-roll than the core explanation.

### E. Voiceover / audio (needed by most of the above)
- **TTS:** ElevenLabs (best quality, paid), Piper (open-source, self-hostable), OS built-in.
  The NARRATIVE §9 "voiceover seed" lines are the script. *Pro (open):* Piper keeps it
  self-hosted, matching project ethos. Captions from the same script for accessibility.

## 3. Comparison table

| Option | Simple? | Agent/text-defined? | Reproducible from narrative? | Cost | Production feel | Fit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slidev + record** | ★★★ | ★★★ (Markdown) | ★★★ | free | ★☆ | Fastest honest MVP |
| **Motion Canvas** | ★★ | ★★★ (TS) | ★★★ | free | ★★★ | Best true-motion + agent fit |
| **Remotion** | ★★ | ★★★ (React) | ★★★ | free | ★★★ | If reusing web/UI components |
| **Manim** | ★★ | ★★★ (Python) | ★★★ | free | ★★★ | Diagram/precision heavy |
| **Animated Mermaid/SVG** | ★★★ | ★★ | ★★★ | free | ★★ | Reuse existing diagrams |
| **Excalidraw** | ★★★ | ★ | ★ | free | ★★ | Sketch aesthetic |
| **Canva/Powtoon** | ★★★ | ✗ | ✗ | $ | ★★ | Human-fast, not agent |
| **Synthesia/HeyGen** | ★★★ | ★★ (script) | ★★ | $$ | ★★ | Avatar narration |
| **Gen-AI video** | ★★ | ★★ | ✗ | $$ | ?? | B-roll only, not core |

## 4. Recommendation direction (not final)

Two tiers, matching the maturity ladder:

- **Quick win (T-lite):** **Slidev (Markdown) + open TTS (Piper) + screen record.** The
  narrative is already sectioned; Slidev source is closest to it; an agent can generate the
  deck + script directly. Ships an honest explainer in the least time. Good enough to validate
  the *content* before investing in motion.
- **Proper version (T-standard):** **Motion Canvas** (or **Remotion** if we want to reuse the
  actual console UI/components) + Piper/ElevenLabs VO + captions. True motion graphics, fully
  code-defined so it regenerates when the NARRATIVE changes. This is the "real" explainer.

Rationale: both are **text/code-defined** (diffable, agent-drivable, reproducible), **free/
self-hostable**, and driven straight off the NARRATIVE — consistent with the project's ethos
and the "living doc → regenerate" model. Timeline GUIs and avatar/gen-AI tools are faster for a
one-off human but break the reproducible-from-source property we want.

## 5. The pipeline, whichever tool

The reusable shape (this is the transferable part):
```
NARRATIVE.md §9 (scenes + VO seeds + do-not-say)
   → script (VO lines + on-screen text)         ← agent generates
   → visuals (Mermaid/SVG → animated, or coded scenes)
   → voiceover (TTS) + captions (same script)
   → render/stitch to mp4 (+ music bed, optional)
   → review against the do-not-say list  ← honesty gate
```
Keep the **script and scene definitions in the repo** (text), so regenerating the video after a
narrative change is a re-run, not a redo.

## 6. Open questions
- Q1. Audience/venue — sales/client pitch, README embed, conference? (Sets length + polish tier.)
- Q2. Quick-win first (Slidev) to validate content, then invest in Motion Canvas/Remotion? Or go
  straight to the proper version?
- Q3. Self-hosted/open only (Piper TTS, code tools) or is paid (ElevenLabs, Synthesia) acceptable?
- Q4. Who drives production — the downstream animation agent from the NARRATIVE, or a human with a tool?
- Q5. Does the explainer cover **both epics** (standard + advanced RBAC) or start with Epic 1 only?
- Q6. Brand/visual identity — reuse the console's green-accent token palette for visual consistency?

> Related: [`../product/NARRATIVE.md`](../product/NARRATIVE.md) §9 (the brief this renders) ·
> the animation is produced by a **separate agent outside this environment** (per ADR-13 intent).
