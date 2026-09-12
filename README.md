# ◇ MATRIX CLIENT 2.0

### MathPRIME Edition · MineFun.io

**A visual client layer built around one idea: the repository is the client.**

Matrix is distributed as a Tampermonkey loader plus a GitHub-hosted implementation. The loader stays deliberately small; the feature code, original artwork and shader presets live in this repository.

## Identity

**MATRIX**  ·  **PRIME**  ·  **OWNER**  ·  **DEV**  ·  **MOD**

The repository includes original Matrix badge artwork, crosshair presets and GLSL shader presets. The public source tree of the referenced Celestar project was reviewed for compatibility-oriented ideas and repository organization; the Matrix implementation is independently authored and does not redistribute its proprietary source. The referenced project explicitly states that its source is proprietary and requires permission for reuse. citeturn18file0L11-L17

## Modules

**HUD:** FPS, CPS, keystrokes, direction, action-bar helpers, scoreboard/armor/KD frameworks.

**Visuals:** custom crosshair, Matrix shader overlays, no-fog adapter, clouds/particles/nametags controls, arm controls, hurt-cam/damage vignette, block-outline adapter.

**Identity:** custom Matrix badges with repository-hosted SVG assets.

**Quality of life:** zoom, toggle crouch, clear-screen, chat emoji helpers, optional Auto GG and performance mode.

**Assets:** badges, crosshairs, shader presets, texture-pack manifest and font extension point.

## Release surface

`use.js` is the install point. It points at:

`https://github.com/francamatheus165-prog/matrix-client-2.0`

and loads `matrix-mod-menu.js` from the `main` branch with `@require`.

## Project note

Matrix is an independent third-party client-side project. MineFun and third-party project names, marks, code, artwork and services remain owned by their respective holders.

> **MATRIX // PRIME**
>
> Built for MineFun. Built to evolve. Built from GitHub.

---

### Repository structure

`use.js` · loader  |  `matrix-mod-menu.js` · client core  |  `assets/` · original project assets  |  `modules/` · registries and extension metadata
