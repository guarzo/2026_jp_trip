# Trip Gallery Page — Handover

**Branch:** `worktree-gallery-page`
**Status:** 4 of 6 implementation tasks complete and reviewed clean. Tasks 5 and 6 remain.
**Date:** 2026-07-29

## What this branch adds

A new `/gallery/` page for the Japan 2026 Jekyll site that displays the trip's
photos and videos, grouped by day, styled to match the existing site. Media is
optimized locally into committed web-sized derivatives (no originals, no LFS) so
it serves fast on GitHub Pages.

See the full design and plan:
- Design: `docs/superpowers/specs/2026-07-29-trip-gallery-design.md`
- Plan: `docs/superpowers/plans/2026-07-29-trip-gallery-page.md`

## Key facts a picker-upper needs

- **Source media lives OUTSIDE this branch:** `/home/tng/workspace/2026_jp_trip/media`
  (510 files: 421 JPG, 88 MOV, 1 WEBP, ~561 MB). It is untracked, local-only, in
  the MAIN checkout — NOT in this worktree. Originals are never committed.
- **All EXIF/QuickTime metadata is stripped** from the media. Filenames
  (`2026-07-DD_HHMMSS[_N].ext`) are the ONLY date source. They are internally
  consistent and map cleanly onto trip days.
- **Day mapping:** `day_number = date − 2026-07-17`. So 7/18=Day 1 … 7/29=Day 12.
  7/21 (Day 4) has zero media (shinkansen travel day) — expected.
- **GitHub Pages can't process images or serve LFS** — that's why we commit
  ready-to-serve derivatives (Option 3 from the design).

## Completed tasks (reviewed clean)

| Task | Commit(s) | What |
|------|-----------|------|
| 1 | `f635962`, fix `e374bf4` | `site/scripts/build_gallery.py` — local optimizer + manifest generator. (Fix: video thumbnail long edge now bounded to 400px for portrait video.) |
| 2 | `07c753e` | `site/gallery.md` + header nav link + home quick-link. Renders day sections from the manifest; day titles pulled from existing `_days/` front matter. Includes a **fixture** `site/_data/gallery.yml` (2 sample items) and placeholder derivatives so the page builds before real media exists. |
| 3 | `2a99268` | Gallery + lightbox CSS appended to `site/assets/css/style.css` (reuses existing design tokens). |
| 4 | `1c97104` | Vanilla-JS lightbox added inside the existing IIFE in `site/assets/js/app.js` — click thumb → full photo / playable video, prev/next within a day, Esc/backdrop to close. |

## Remaining work

### Task 5 — Service worker precache (small, mechanical)
File: `site/sw.js`. Add `'/gallery/',` to the `OFFLINE_URLS` array (after
`'/pokemon/',`) and bump `CACHE_NAME` from `japan-trip-v5` to `japan-trip-v6`.
**Do NOT** add any `/assets/gallery/` image URLs to the precache list — the
network-first fetch handler caches them opportunistically; force-caching ~500
files would bloat SW install. Full steps in the plan, Task 5.

### Task 6 — Real media run + verification (the big one)
1. **Remove the fixture placeholders** committed in Task 2:
   `site/assets/gallery/thumb/sample-*.jpg`, `site/assets/gallery/full/sample-*`.
2. **Run the real build** (transcodes 88 videos — several minutes):
   ```
   python3 site/scripts/build_gallery.py --source /home/tng/workspace/2026_jp_trip/media --regen-manifest
   ```
   `--regen-manifest` is required here because Task 2's fixture `gallery.yml`
   already exists and the script won't overwrite it otherwise.
3. **Verify** derivative counts (~510 thumbs, ~422 full jpgs, 88 mp4s), gallery
   dir ~120–150 MB, manifest day_numbers 1,2,3,5,6,7,8,9,10,11,12 (no Day 4).
4. **Build the site** (`bundle exec jekyll build`) and confirm `gallery-thumb`
   count ≈ 510, `is-video` count = 88.
5. **Browser check** (`bundle exec jekyll serve`, open `/gallery/`): day sections
   in order with itinerary titles, sticky day-jump chips, lazy-loaded grid,
   lightbox opens photos and plays videos, nav link + home quick-link work,
   clean mobile layout. (This is the first real visual render check — Task 3's
   review only did static CSS verification.)
6. **Commit** `site/assets/gallery/` + real `site/_data/gallery.yml`. Confirm no
   `media/` originals are staged and the tree is clean.

Full step-by-step (with exact commands and expected outputs) is in the plan,
Task 6.

## Deferred minor findings (from reviews — none blocking)

- Task 1: `yaml_escape` only escapes `"` not `\` (inert given fixed filenames).
- Task 1: ffmpeg subprocess `stderr=DEVNULL` swallows error detail — revisit if
  Task 6's real run hits failures (worth removing temporarily to debug if so).
- Task 2: generic thumbnail alt text (inherent — no per-item captions in v1).
- Task 3: `.gallery-thumb img` rule declared twice (harmless redundancy).
- Task 4: `render()` reads `img.alt` without optional-chaining (unreachable given
  current markup); video `autoplay` added beyond literal spec (reasonable UX).

## Not yet done

- No **final whole-branch review** yet (SDD does this after Task 6).
- The **fixture manifest + placeholder derivatives are still in the branch** —
  Task 6 replaces them with real data. Reviewers of the current PR should know
  the gallery currently shows only 2 sample tiles until Task 6 runs.

## Process artifacts (not committed)

SDD ledger + per-task briefs/reports/review-packages live under
`.superpowers/sdd/2026-07-29-trip-gallery-page/` in the worktree (git-ignored
scratch). The git history + this doc + the design/plan are the durable record.
