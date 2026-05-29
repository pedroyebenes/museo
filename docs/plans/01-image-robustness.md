# Plan 1 — Image Robustness

## Context

Painting images are hot-linked from external CDNs (Wikimedia / Google Art Project) at
runtime via `src/textureUtils.js`. When a URL dies, the viewer sees an unexplained black
rectangle (`src/paintings.js:134`), and the only repair path is a human noticing, running
`npm run check:urls`, and hand-fixing one author's JSON.

This is the project's most recurring pain: the git log has 22+ commits fixing dead URLs
one author at a time, and `authors-needing-validation.txt` shows ~61/110 authors still
pending. This plan attacks the problem on two fronts: (a) make the **runtime** degrade
gracefully so a dead URL never looks like a bug, and (b) make the **tooling** produce a
machine-readable report so fixing is fast and trackable.

## Part A — Runtime graceful fallback (highest user-visible value)

**Problem:** `placePaintings` (`src/paintings.js:81-105`) already catches load failures
and calls `buildPaintingMesh(null, data)`, but the null branch (`src/paintings.js:132-134`)
just paints solid black `0x000000` — indistinguishable from a loading bug or a genuinely
dark painting.

**Changes (`src/paintings.js`):**

1. Add `buildPlaceholderTexture(data)` — a `CanvasTexture` (reuse the existing
   `buildLabel` canvas idiom, lines 169-208) rendered with the museum palette
   (bg `#1a1a1a`, gold `#c7a060`): a centered "🖼 Imagen no disponible" line plus the
   painting title, so the frame still reads as a labelled artwork, not an error.
2. In `buildPaintingMesh`, when `texture` is null, use the placeholder texture instead of
   the flat black material (lines 132-134). Keep the real-scale sizing from
   `data.dimensions` so the frame stays correctly proportioned.
3. Tag `group.userData.imageBroken = true` so the info card / report flow can note it.

**Changes (`src/textureUtils.js`):**

4. Add one bounded retry inside `loadPaintingTexture` (around `loader.loadAsync`, line 50):
   on failure wait ~600ms and retry once before rejecting. Network blips and transient
   429s are common with Wikimedia; a single retry recovers many without masking
   truly-dead URLs. Keep the `pending` dedup semantics intact.

**Changes (`src/ui.js`, optional polish):** in `createInfoOverlay.show` (line 34), if
`data` is flagged broken, append a subtle "(imagen no disponible)" note to the size line
so a visitor reporting via the existing **R** flow gives maintainers a precise signal.

## Part B — Tooling: machine-readable URL report

**Problem:** `scripts/check-urls.mjs` prints broken URLs to stdout only (lines 115-120) —
not consumable by other tooling and not diffable. `authors-needing-validation.txt` is a
hand-maintained checklist that drifts from reality.

**Changes (`scripts/check-urls.mjs`):**

1. Add a `--json <path>` flag (default `scripts/data/url-report.json`) that writes
   `{ generated, totalChecked, broken: [{authorId, paintingId, title, url, status}] }`.
   Reuse the existing `broken[]` array (already populated at line 105) — just serialize
   it. `new Date().toISOString()` for the timestamp is fine (this is a Node script).
2. Add `--authors-from <report.json>` so a follow-up run can re-check only previously
   broken URLs (fast convergence on the 429-throttled tail).

**New script `scripts/sync-validation-status.mjs` (small, optional):** regenerate
`authors-needing-validation.txt` from the JSON report so the checklist stops drifting —
an author is "complete" when it has zero broken URLs in the latest report.

## Files

- `src/paintings.js` (placeholder texture + null-branch swap) — primary
- `src/textureUtils.js` (single retry)
- `src/ui.js` (broken-image note — optional)
- `scripts/check-urls.mjs` (`--json`, `--authors-from`)
- `scripts/sync-validation-status.mjs` (new, optional)

## Verification

- `npm run dev`, edit one painting URL in an author JSON to a bogus value, enter that
  author's room → confirm a labelled "Imagen no disponible" placeholder (not black).
- Restore the URL, reload → confirm the real image loads.
- Throttle network in devtools to confirm the retry recovers a slow load.
- `node scripts/check-urls.mjs <author> --json /tmp/r.json` → confirm valid JSON report.
- `npm run validate:catalog` still passes (no schema change).

## Out of scope / non-goals

- Switching off hot-linking entirely (bundling/proxying images) — large infra change;
  the placeholder + retry addresses the user-facing symptom without it.
