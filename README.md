# Kiarash Jalali — Portfolio Glow-up

A rebuilt version of `kiarashjalali.net` that keeps the visual/interaction DNA of the Qwen concept while moving the project into a maintainable structure.

## What this version intentionally keeps

- custom cursor dot + delayed ring on desktop
- gradient scrollbar and top scroll-progress line
- animated grid / gradient blobs / grain backdrop
- glassy sticky navigation + scrollspy
- typing role line
- 3D portrait card with floating badges
- skill marquee
- reveal-on-scroll choreography
- pointer-follow card glow
- magnetic controls
- animated skill bars
- project filters and case-study modal
- smooth long-form portfolio flow
- light/dark theme
- English/Persian switching

## What was added / improved

- Rootine is the featured project and has an interactive sample preview
- English/Persian content is separated from the markup
- real `lang` + `dir` switching and RTL-aware CSS
- skill bars describe real usage instead of fake percentages
- skill-to-project evidence interaction
- transparent AI workflow: Prompt → Inspect → Refactor → Verify
- interactive rough-prompt → refined-prompt demo
- short interaction Lab section
- accessibility basics and `prefers-reduced-motion`
- code split by responsibility instead of one HTML file
- dependency-free local development/build scripts

## Run locally

You only need Node.js 20+.

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

There is no `npm install` step because the portfolio has no runtime or build dependencies.

## Verify + build

```bash
npm run verify
```

or:

```bash
npm run build
```

The static output is written to `dist/`.

Preview the build:

```bash
npm run preview
```

Then open `http://localhost:4173/`.

## Structure

```text
public/
  images/                 project + portrait images
src/
  js/
    main.js               app bootstrap
    content.js            bilingual/data content
    i18n.js               language + direction handling
    render.js             dynamic section rendering
    effects.js            cursor, scroll, reveal, tilt, magnetic effects
    hero.js               typing interaction
    projects.js           filters, evidence, Rootine demo, modal
    ai.js                 AI workflow + prompt demo
    lab.js                micro-interaction lab
    contact.js            email/copy behaviour
    ui.js                 toast helpers
  styles/
    app.css               stylesheet entry
    tokens.css            design tokens/themes
    base.css              global primitives
    effects.css           background/cursor/glow effects
    layout.css            nav/hero/marquee/footer
    sections.css          content sections
    projects.css          work/Rootine/modal
    responsive.css        responsive rules
scripts/
  dev-server.mjs          tiny Node dev server
  build.mjs               static build copier
  verify.mjs              basic project checks + build
```

## Personalisation still worth doing later

- add the exact Computer Engineering institution / expected year
- add LinkedIn once the preferred URL is confirmed
- replace/retouch project imagery if newer screenshots become available
- tune copy after seeing the site live
- choose final deployment workflow for the custom domain
