# HFC piling 3D

Real-time 3D of a bored-piling site for Hindustan Foundation & Constructions.
React 18 + React Three Fiber 8 + drei + postprocessing, three r169, Vite 5 (same stack and pinned versions
as the Comfort Builders reference site). Everything is procedural: no model files, one logo image.

It ships in two forms from one codebase:

| Output | What it is |
| --- | --- |
| `piling/embed.js` | **The main site's scroll story.** The hero background, plus three chapters: rotary boring, cage + tremie concreting, static load testing. No camera controls: the page scroll drives everything. |
| `piling/index.html` | A standalone explorer with a free-look camera, step buttons, a Tour and an Underground view. Not linked from the main page. |

## Run it

```bash
npm install
npm run dev        # http://localhost:5174   (standalone explorer)
                   # http://localhost:5174/story-dev.html   scroll story harness with a slider for p
npm run dev:site   # http://127.0.0.1:5190   the real main site, using the built piling/embed.js
npm run build      # writes ../piling  (commit it; the main site loads piling/embed.js)
```

## How the main site uses it

`index.html` has a sticky stage (`#story-stage`) behind the hero and three chapter articles.
`js/story.js` (an ES module) imports `piling/embed.js` after the page has loaded, calls `mount(el)`, and on every scroll calls
`setProgress(p)`:

| p | what is on screen |
| --- | --- |
| 0 to 1 | hero: whole site, everything running |
| 1 to 2 | rotary boring: camera follows the auger down through a glass core sample of the ground |
| 2 to 3 | cage lowered into the bore, tremie pipe placed, concrete poured from the bottom |
| 3 to 4 | static load test: crane stacks the kentledge, jack loads the pile in six steps, live load-settlement chart |

If WebGL or the module is unavailable the photo behind the hero stays. Rendering pauses when the story is off screen.
Quality drops on small or low-memory devices (smaller shadow map, no ambient occlusion).

## Where things are

```
src/embed.jsx              mount(el) / setProgress(p) / setVisible(v)  (the entry the site imports)
src/StoryHud.jsx           depth gauge, cage + concrete meters, load-settlement chart (DOM overlay)
src/three/scene.js         builds the whole site and drives it: the 48 s loop, and the scroll story
                           (focus*() = camera framing per chapter, all timing lives here)
src/three/StoryStage.jsx   canvas + camera that follows scene.state.focus (no user controls)
src/three/Atmosphere.jsx   sky, baked reflections, sun and shadows, post effects
src/three/core.js          the glass underground core sample + the ground lid that hides it
src/three/testStation.js   kentledge frame, jack, gauges, pump, blocks, load-path arrows, loadCurve()
src/three/rig.js           SANY SR140 rotary rig (poseAt(u) so scroll can scrub it)
src/three/crane.js         SANY SCC450 crawler crane      excavator.js   EX200 / U30
src/three/trucks.js        tipper, transit mixer           site.js        ground, bores, dressing
```

## Tuning

- Chapter camera: `focusHero / focusBore / focusCage / focusTest` in `scene.js`.
- Chapter timing inside a chapter: the `u` ranges in `update()` (cage 0 to 0.4, tremie 0.4 to 0.78, pour 0.78 to 0.96; stack blocks 0 to 0.5, load 0.5 to 0.97).
- Scroll length per chapter: `.step-c { height }` in `css/story.css`.
- Load test numbers (illustrative): `DESIGN_MT`, `TEST_MT`, `loadCurve()` in `testStation.js`.
- Debug in the console: `window.__piling` (standalone only).
