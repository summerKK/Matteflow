# Matteflow Design

**Date:** 2026-03-29

## Goal
Build a standalone browser demo in the current directory that lets the user choose a local video file and shows a magazine-style page where body text wraps around a centered moving subject area, visually similar to the reference screenshot.

## Scope
- Standalone demo, not integrated into the upstream `pretext` repo.
- User selects a local video file in the page.
- White editorial/magazine layout.
- Text wraps around a centered subject-shaped silhouette approximation.
- Use `pretext` for line layout instead of relying on DOM text flow.

## Non-goals
- Automatic subject segmentation from arbitrary video frames.
- Production-ready editor/export workflow.
- Precise contour extraction from alpha masks in v1.

## Recommended Approach
Use a manually defined wrap profile per vertical slice of the page. The video is rendered in a floating centered stage. Text is laid out line-by-line with `pretext`, and each line receives a computed left/right available width based on whether its vertical position intersects the profile. This creates the illusion of text wrapping around the subject rather than around a plain rectangle.

## Alternatives Considered
1. Rectangular exclusion only: simpler, but does not match the desired visual.
2. Automatic contour extraction from video frames: more dynamic, but much more complex and brittle for a first version.
3. Separate mask upload: good quality, but worse UX than a single-file demo.

## UX
- Top toolbar:
  - file picker for local video
  - play/pause button
  - range controls for video scale, horizontal position, vertical offset, wrap strength
- Main page:
  - off-white editorial paper card
  - drop cap at the start of the article
  - two-column-ish wrap feel created by dynamic per-line widths
  - floating video centered in the article body
- Fallback state before video selection:
  - visible placeholder with instructions to choose a file

## Layout Model
1. Prepare the article text with `pretext`.
2. Define a vertical wrap profile describing how much space to reserve around the video at each normalized Y band.
3. For each line:
   - compute current y position
   - map y to a wrap band
   - derive available left and right text regions around the floating stage
   - lay out the next line in the wider suitable region or split naturally between left/right flow bands according to the chosen page algorithm
4. Render lines as absolutely positioned spans/divs inside the article canvas.

## v1 Simplification
To keep the demo reliable, v1 uses a symmetric centered silhouette profile shaped like:
- narrow at head/top
- widest around torso/skirt middle
- narrower again near legs/bottom

This is enough to visually match the provided example without requiring per-video analysis.

## File Plan
- `index.html` — page shell and controls
- `src/main.ts` — app bootstrap and event wiring
- `src/demo.ts` — demo state, rendering loop, file loading
- `src/layout.ts` — `pretext`-based line layout and wrap calculations
- `src/profile.ts` — silhouette profile definition and interpolation
- `src/styles.css` — editorial styling
- `src/sampleText.ts` — built-in article content
- `package.json` — minimal dev server/build scripts
- `tsconfig.json` — TypeScript config

## Testing Strategy
- Start with small layout tests for profile interpolation and available-width calculations.
- Then add a rendering-level smoke test for line placement invariants if the chosen toolchain makes it practical.
- Manual verification in browser:
  - select local video
  - confirm playback
  - confirm text avoids the central silhouette zone
  - confirm controls update layout responsively

## Risks
- True magazine-quality balancing is tricky without overengineering.
- Browser autoplay/file handling varies, so the UX should rely on explicit user interaction.
- Exact screenshot matching depends heavily on the selected video asset.

## Success Criteria
- User can open the demo locally with the provided dev command.
- User can choose a local video file.
- Video appears in the middle of the article.
- Text visibly wraps around a subject-like central shape, not a plain rectangle.
- The page feels editorial and close in spirit to the reference image.
