# Plan 2 — Memory & Performance

## Context

`createRoomManager` (`src/roomManager.js`) caches every visited room indefinitely
(`hubCache`, `categoryCache` line 25, `authorCache` line 26) and `swapRoom` (lines
201-210) only does `scene.remove(group)` — geometries, materials, and textures are never
disposed. The texture cache in `src/textureUtils.js:7` is likewise unbounded. With ~110
authors / ~995 paintings, a long session that visits many rooms grows GPU memory
monotonically.

The caching is **intentional** (instant revisit), so the fix is bounded caches with
disposal on eviction — not naive dispose-on-swap.

## Part A — Author-room LRU with disposal

**Changes (`src/roomManager.js`):**

1. Replace the plain `authorCache` Map with a bounded LRU (e.g. cap `MAX_AUTHOR_ROOMS = 6`).
   On `loadAuthor` cache hit, mark recently-used; on insert past the cap, evict the
   least-recently-used room **that is not the current room**.
2. Add `disposeRoom(cached)` helper: `cached.room.group.traverse(obj => { ... })`
   disposing `obj.geometry` and each material (`obj.material` may be an array). For
   painting canvas materials, dispose `material.map` too **only if it is a per-room
   placeholder/label CanvasTexture** — NOT the shared painting textures (those are owned
   by `textureUtils` and flagged `userData.shared = true`, set at `src/textureUtils.js:40`).
   Skip disposing any material/texture with `userData.shared === true` (shared wall/trim
   materials from `materials.js`).
3. Keep `hubCache` and `categoryCache` un-bounded — they are few (≤8) and cheap; bounding
   author rooms (which hold ~5-30 painting meshes each) captures the bulk of the savings.

## Part B — Texture cache eviction

**Changes (`src/textureUtils.js`):**

4. Add LRU bookkeeping to the `cache` Map (lines 7, 44-66): track insertion/use order,
   cap at e.g. `MAX_TEXTURES = 80`. On overflow, evict the LRU entry and call
   `texture.dispose()`.
5. **Refcount guard:** a texture for a painting in a currently-loaded (cached) room must
   not be evicted out from under a live mesh. Simplest robust approach: when Plan 2A
   disposes an author room, also signal `textureUtils` to decrement refs for that room's
   URLs; only evict textures with zero refs. If refcounting proves heavy, the conservative
   fallback is: only evict textures whose URL is not referenced by any room currently in
   `authorCache`. Document whichever is chosen at the top of the file.

## Part C — Quick wins (low risk, optional)

- `src/paintings.js:203` hardcodes label `tex.anisotropy = 4`; route through
  `getQualityProfile().anisotropy` for consistency with `configureTexture`.
- Procedural hub textures (`src/materials.js`) are regenerated per session; note as a
  future optimization (pre-bake to WebP) — not in this plan's scope.

## Files

- `src/roomManager.js` (LRU + `disposeRoom`) — primary
- `src/textureUtils.js` (bounded cache + refcount/eviction) — primary
- `src/paintings.js` (anisotropy quick win — optional)

## Verification

- `npm run dev`; open devtools → Performance/Memory. Record `renderer.info.memory`
  (geometries/textures) via a temporary console log in the animation loop.
- Walk through >10 author rooms in sequence; confirm `renderer.info.memory.geometries`
  and `.textures` plateau rather than climbing monotonically.
- Revisit a recently-seen room → confirm it still loads instantly (cache hit) and renders
  correctly (no disposed-texture black frames).
- Confirm walls/floor/trim still render in every room (shared materials not disposed).
- Build + preview: `npm run build && npm run preview`.

## Risks

- **Disposing a still-referenced texture** → black frame. Mitigated by the shared-flag
  skip and the refcount/room-reference guard. This is the critical test case.
