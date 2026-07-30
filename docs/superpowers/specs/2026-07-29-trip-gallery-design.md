# Trip Gallery Page — Design

**Date:** 2026-07-29
**Status:** Approved (design), pending implementation plan
**Site:** Jekyll on GitHub Pages, `https://jp.dpao.la`

## Goal

Add a new `/gallery/` page to the existing Japan 2026 Jekyll site that displays
the trip's photos and videos, grouped by day, styled to match the existing site.
Source media lives in the repo-root `media/` directory (510 files: 421 JPG,
88 MOV, 1 WEBP; ~561 MB).

## Key constraints (discovered)

- **GitHub Pages cannot process images** (no custom plugins) and **does not serve
  Git LFS content** (serves pointer stubs instead). All media optimization must
  happen locally and be committed as ready-to-serve static files.
- **All embedded metadata is stripped.** 0/421 JPGs have EXIF `DateTimeOriginal`;
  all 88 MOVs have zeroed QuickTime dates. File mtimes are all the download date
  (2026-07-29). **Filenames are the only date source.**
- **Filenames are reliable enough to group by day.** Uniform format
  `2026-07-DD_HHMMSS[_N].ext` (all 510 match, zero malformed). Per-day
  time-of-day ranges are plausible waking hours → consistent with Japan-local
  capture times. Caveat: no ground truth, so photos near midnight *could*
  occasionally land in an adjacent day; the manifest is hand-editable to fix
  these. `7/21` has zero files (shinkansen travel day — expected).
- **`media/` is untracked local-only data** at
  `/home/tng/workspace/2026_jp_trip/media`. It is NOT present in the worktree and
  will NOT be committed. Only optimized derivatives get committed.

## Chosen approach: Option 3 — commit web-optimized derivatives only

Originals stay on the local machine. A local build script produces web-sized
derivatives + a manifest, which are the only media artifacts committed.
Expected repo footprint: ~120–150 MB.

Rejected alternatives:
- LFS + full-res: **broken on GitHub Pages** (serves pointer stubs); would
  require switching hosts.
- External bucket (R2/S3): more moving parts than needed; keeps repo lean but
  adds an external dependency and setup.

## Component 1: Media build pipeline

A local script (`site/scripts/build_gallery.py`, Python 3 + Pillow + ffmpeg +
ffprobe) run manually by the maintainer. Reads originals from an absolute source
path (default `/home/tng/workspace/2026_jp_trip/media`, overridable via arg/env)
and writes into the worktree.

For each source file:

- **Photos (JPG/WEBP → JPG):**
  - Full view: resize to max 1600px long edge, JPEG quality 80 (~200–300 KB) →
    `site/assets/gallery/full/<basename>.jpg`
  - Thumbnail: resize to ~400px, JPEG quality 78 (~25–40 KB) →
    `site/assets/gallery/thumb/<basename>.jpg`
- **Videos (MOV → MP4):**
  - Transcode H.264 + AAC, downscale to max 720p, faststart flag →
    `site/assets/gallery/full/<basename>.mp4`
  - Poster frame (first ~1s frame) as JPEG thumbnail →
    `site/assets/gallery/thumb/<basename>.jpg`

Behavior:
- **Idempotent** — skip a derivative if it already exists and is newer than the
  source (so re-runs are cheap). `--force` to rebuild.
- **Preserve capture order** — sort by filename within each day.
- **Fail loudly** if ffmpeg/ffprobe/Pillow missing, with the install command.
- **Emit the manifest** (`site/_data/gallery.yml`) after processing.

### Manifest: `site/_data/gallery.yml`

Generated from filenames, but human-editable (reorder, move a photo to the
correct day, or omit a file). Shape:

```yaml
days:
  - date: "2026-07-18"
    day_number: 1
    items:
      - { file: "2026-07-18_182634", type: photo }
      - { file: "2026-07-19_065602", type: video }
```

- `day_number` derived by mapping date → trip day (7/18 = Day 1 … 7/29 = Day 12;
  7/21 = Day 4 has no media).
- Day title/location are NOT duplicated here — the page cross-references the
  existing `_days/day-NN.md` front matter by `day_number` so titles stay DRY and
  single-sourced.
- Regeneration: script overwrites only auto-managed entries; a manual re-run
  after edits should not clobber hand fixes. **Simplest safe rule for v1:** the
  script writes `gallery.yml` only if it does not already exist (or with
  `--regen-manifest`), so hand edits are never silently lost. Documented in the
  script header.

## Component 2: Gallery page

- **`site/gallery.md`** — `layout: default`, `permalink: /gallery/`, `title:
  Gallery`.
- Added to **header nav** (`_includes/header.html`) with a 📷 icon, and to the
  home page **quick-links** grid for discoverability.
- Renders by looping `site.data.gallery.days`; for each day, looks up the
  matching `_days` entry (via `day_number`) to show
  "Day N · Jul DD — <title>" and location as the section heading.
- **Sticky day-jump bar** at top: small horizontal scroll row of day chips
  linking to each day section anchor.
- **Per-day responsive grid** of square thumbnails (CSS grid,
  `auto-fill minmax(~110px, 1fr)`), site card styling (rounded corners, subtle
  shadow), using existing `--space-*` / `--color-*` tokens.
  - Photos: `<img loading="lazy">` thumbnail.
  - Videos: poster-frame thumbnail with a ▶ play badge overlay.
- Each thumbnail is a button/link carrying data attributes (full-res URL, type,
  day index, position) for the lightbox.

## Component 3: Lightbox (vanilla JS in existing `app.js`)

- Tap thumbnail → full-screen overlay showing the 1600px photo or a playable
  `<video controls>` mp4.
- Prev/next within the current day (arrow keys, on-screen arrows, swipe on
  touch). Esc / tap-outside / close button dismisses.
- No external library — keeps it fast, offline-capable, consistent with the
  existing hand-rolled `app.js` and the site's PWA/service-worker setup.
- `loading="lazy"` on thumbnails ensures only visible images load (critical with
  ~500 items on mobile).

## Styling

All new CSS appended to `site/assets/css/style.css` using existing design
tokens (`--color-primary` torii red, `--space-*`, `--container-max`, card
shadows). Mobile-first, matching the rest of the site. No new fonts or colors.

## Service worker note

`site/sw.js` caches pages for offline use. The gallery's ~500 images should NOT
be force-cached (would bloat the cache and slow install). v1: leave gallery
media out of the precache list; images load on demand and are opportunistically
cached by the browser. Confirm the sw precache list is static and unaffected.

## Out of scope (v1)

- Captions, favorites/marking, albums, tagging.
- EXIF-based date correction (no EXIF exists).
- External media hosting / originals on the live site (kept local only).
- Filtering by city or media type (day-jump bar only).

## Verification

- Run `build_gallery.py` against the real `media/`; confirm derivative counts
  (should produce ~422 photo derivatives + 88 video mp4s + 88 posters), spot-check
  a few thumbnails/fulls/mp4s open correctly.
- Confirm repo size after commit is in the ~120–150 MB range.
- Build the site locally (`bundle exec jekyll serve`) and verify: gallery page
  renders, day sections match itinerary, thumbnails lazy-load, lightbox opens
  photos and plays videos, nav link works, mobile layout is clean.
- Confirm no LFS is involved and derivatives are plain committed files.
