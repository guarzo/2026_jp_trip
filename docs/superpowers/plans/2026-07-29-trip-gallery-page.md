# Trip Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/gallery/` page to the Japan 2026 Jekyll site that displays the trip's photos and videos grouped by day, styled to match the existing site.

**Architecture:** A local Python script optimizes originals from the repo-root `media/` into committed web-sized derivatives (`site/assets/gallery/{thumb,full}/`) and emits an editable `site/_data/gallery.yml` manifest. The `gallery.md` page renders day sections from that manifest (pulling day titles from existing `_days/` front matter), with a vanilla-JS lightbox added to the existing `app.js`.

**Tech Stack:** Jekyll (GitHub Pages), Python 3 + Pillow + ffmpeg/ffprobe (local build only), vanilla JS, hand-written CSS.

## Global Constraints

- **No test framework exists** — this is a static site. "Tests" are runnable verification commands (script output, `bundle exec jekyll build`, grep checks) and explicit browser checks. Adapt the TDD rhythm accordingly.
- **Originals in `media/` are NEVER committed.** Only derivatives under `site/assets/gallery/` and the manifest are committed.
- **Source media path:** `/home/tng/workspace/2026_jp_trip/media` (untracked, in the MAIN checkout — NOT present in this worktree). Script must accept it as an argument/env var, defaulting to that absolute path.
- **GitHub Pages serves plain static files only** — no LFS, no image plugins. Derivatives must be ready-to-serve.
- **Filenames are the only date source** (all EXIF/QuickTime metadata is stripped). Format: `2026-07-DD_HHMMSS[_N].ext`.
- **Day mapping:** 7/18=Day 1, 7/19=Day 2, 7/20=Day 3, 7/21=Day 4 (no media), 7/22=Day 5, 7/23=Day 6, 7/24=Day 7, 7/25=Day 8, 7/26=Day 9, 7/27=Day 10, 7/28=Day 11, 7/29=Day 12. (day_number = date − 7/17.)
- **Design tokens:** reuse existing CSS vars (`--color-primary` #dc2626, `--space-*`, `--container-max` 800px, `--color-surface`, `--color-border`). No new fonts/colors.
- Work happens in worktree `/home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page`. All paths below are relative to that worktree root.

---

### Task 1: Media build script + manifest generation

**Files:**
- Create: `site/scripts/build_gallery.py`
- Output (gitignored intermediates none; committed later in Task 6): `site/assets/gallery/thumb/*.jpg`, `site/assets/gallery/full/*.{jpg,mp4}`, `site/_data/gallery.yml`
- Create: `site/assets/gallery/.gitkeep` is NOT needed (real files land here in Task 6)

**Interfaces:**
- Produces: `site/_data/gallery.yml` with shape:
  ```yaml
  days:
    - date: "2026-07-18"
      day_number: 1
      items:
        - { file: "2026-07-18_182634", type: photo }
        - { file: "2026-07-19_065602", type: video }
  ```
  where `file` is the basename WITHOUT extension; thumb is always `<file>.jpg`, full is `<file>.jpg` (photo) or `<file>.mp4` (video).
- Produces derivative filename convention consumed by Task 2's rendering.

- [ ] **Step 1: Write the script**

Create `site/scripts/build_gallery.py`:

```python
#!/usr/bin/env python3
"""Build web-optimized gallery derivatives + manifest from trip originals.

Reads originals from SOURCE (default /home/tng/workspace/2026_jp_trip/media),
writes thumbnails and full-size derivatives into site/assets/gallery/, and
generates site/_data/gallery.yml grouped by trip day (from filenames).

Requires: Pillow, ffmpeg, ffprobe. Originals are never modified or copied.

Usage:
  python3 site/scripts/build_gallery.py [--source PATH] [--force] [--regen-manifest]
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
from datetime import date

from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)                      # .../site
THUMB_DIR = os.path.join(SITE, "assets", "gallery", "thumb")
FULL_DIR = os.path.join(SITE, "assets", "gallery", "full")
DATA_DIR = os.path.join(SITE, "_data")
MANIFEST = os.path.join(DATA_DIR, "gallery.yml")
DEFAULT_SOURCE = "/home/tng/workspace/2026_jp_trip/media"

NAME_RE = re.compile(r"^(2026-07-(\d{2})_\d{6}(?:_\d+)?)\.(jpg|jpeg|webp|mov)$", re.I)
PHOTO_EXT = {"jpg", "jpeg", "webp"}
VIDEO_EXT = {"mov"}
TRIP_START = date(2026, 7, 17)  # day_number = date - TRIP_START

THUMB_MAX = 400
FULL_MAX = 1600
VIDEO_MAX_H = 720


def require_tools():
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            sys.exit(f"ERROR: '{tool}' not found. Install with: sudo apt-get install -y ffmpeg")


def newer(src, dst):
    """True if dst is missing or older than src."""
    return not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)


def build_photo(src, base, force):
    thumb = os.path.join(THUMB_DIR, base + ".jpg")
    full = os.path.join(FULL_DIR, base + ".jpg")
    for dst, size, q in ((thumb, THUMB_MAX, 78), (full, FULL_MAX, 80)):
        if not force and not newer(src, dst):
            continue
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((size, size), Image.LANCZOS)
            im.save(dst, "JPEG", quality=q, optimize=True, progressive=True)


def build_video(src, base, force):
    full = os.path.join(FULL_DIR, base + ".mp4")
    thumb = os.path.join(THUMB_DIR, base + ".jpg")
    if force or newer(src, full):
        subprocess.run(
            ["ffmpeg", "-y", "-i", src, "-vf", f"scale=-2:'min({VIDEO_MAX_H},ih)'",
             "-c:v", "libx264", "-preset", "medium", "-crf", "23",
             "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", full],
            check=True, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    if force or newer(src, thumb):
        subprocess.run(
            ["ffmpeg", "-y", "-i", src, "-vf",
             f"thumbnail,scale='min({THUMB_MAX},iw)':-2", "-frames:v", "1", thumb],
            check=True, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )


def yaml_escape(s):
    return '"' + s.replace('"', '\\"') + '"'


def write_manifest(days):
    """days: dict[date_str] -> list[(base, type)] already sorted."""
    lines = ["# Auto-generated by build_gallery.py. Hand edits are preserved",
             "# unless run with --regen-manifest. 'file' is basename without extension.",
             "days:"]
    for dstr in sorted(days):
        d = date.fromisoformat(dstr)
        lines.append(f"  - date: {yaml_escape(dstr)}")
        lines.append(f"    day_number: {(d - TRIP_START).days}")
        lines.append("    items:")
        for base, typ in days[dstr]:
            lines.append(f"      - {{ file: {yaml_escape(base)}, type: {typ} }}")
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(MANIFEST, "w") as f:
        f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.environ.get("GALLERY_SOURCE", DEFAULT_SOURCE))
    ap.add_argument("--force", action="store_true", help="rebuild derivatives even if up-to-date")
    ap.add_argument("--regen-manifest", action="store_true", help="overwrite existing gallery.yml")
    args = ap.parse_args()

    if not os.path.isdir(args.source):
        sys.exit(f"ERROR: source dir not found: {args.source}")
    require_tools()
    os.makedirs(THUMB_DIR, exist_ok=True)
    os.makedirs(FULL_DIR, exist_ok=True)

    days = {}
    files = sorted(os.listdir(args.source))
    total = 0
    for name in files:
        m = NAME_RE.match(name)
        if not m:
            continue
        base, dd, ext = m.group(1), m.group(2), m.group(3).lower()
        src = os.path.join(args.source, name)
        dstr = f"2026-07-{dd}"
        if ext in PHOTO_EXT:
            build_photo(src, base, args.force)
            days.setdefault(dstr, []).append((base, "photo"))
        elif ext in VIDEO_EXT:
            build_video(src, base, args.force)
            days.setdefault(dstr, []).append((base, "video"))
        total += 1
        print(f"[{total}] {name}")

    for dstr in days:
        days[dstr].sort(key=lambda t: t[0])

    if args.regen_manifest or not os.path.exists(MANIFEST):
        write_manifest(days)
        print(f"Wrote manifest: {MANIFEST}")
    else:
        print(f"Manifest exists, kept as-is (use --regen-manifest to overwrite): {MANIFEST}")

    print(f"Done. Processed {total} files across {len(days)} days.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Smoke-test the script on a 2-file subset (fast, no full run)**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
mkdir -p /tmp/gtest
cp /home/tng/workspace/2026_jp_trip/media/2026-07-18_182634.jpg /tmp/gtest/
cp /home/tng/workspace/2026_jp_trip/media/2026-07-19_065602.mov /tmp/gtest/
python3 site/scripts/build_gallery.py --source /tmp/gtest --regen-manifest
```
Expected: prints 2 processed files; creates `site/assets/gallery/thumb/2026-07-18_182634.jpg`, `.../full/2026-07-18_182634.jpg`, `.../thumb/2026-07-19_065602.jpg`, `.../full/2026-07-19_065602.mp4`, and `site/_data/gallery.yml`.

- [ ] **Step 3: Verify outputs are valid and correctly sized**

```bash
python3 - <<'PY'
from PIL import Image
for p in ["site/assets/gallery/thumb/2026-07-18_182634.jpg",
          "site/assets/gallery/full/2026-07-18_182634.jpg",
          "site/assets/gallery/thumb/2026-07-19_065602.jpg"]:
    print(p, Image.open(p).size)
PY
ffprobe -v error -show_entries stream=codec_name,height -of csv=p=0 site/assets/gallery/full/2026-07-19_065602.mp4
cat site/_data/gallery.yml
```
Expected: thumb long-edge ≤400, full long-edge ≤1600; mp4 shows `h264` and height ≤720; manifest lists Day 1 photo + Day 2 video with correct `day_number` (1 and 2).

- [ ] **Step 4: Clean up smoke-test derivatives (real run happens in Task 6)**

```bash
rm -rf site/assets/gallery/thumb/* site/assets/gallery/full/* site/_data/gallery.yml /tmp/gtest
```

- [ ] **Step 5: Commit the script**

```bash
git add site/scripts/build_gallery.py
git commit -m "feat: add gallery media build script"
```

---

### Task 2: Gallery page + navigation + manifest-driven rendering

**Files:**
- Create: `site/gallery.md`
- Modify: `site/_includes/header.html` (add nav link)
- Modify: `site/index.md` (add quick-link)
- Create (temporary fixture for build-testing): `site/_data/gallery.yml` — a tiny hand-written 2-item manifest so the page renders before the real media exists. Overwritten by the real run in Task 6.

**Interfaces:**
- Consumes: `site.data.gallery.days` (from Task 1's manifest shape).
- Consumes: derivative URLs `/assets/gallery/thumb/<file>.jpg` and `/assets/gallery/full/<file>.{jpg,mp4}`.
- Produces: DOM with `.gallery-day` sections and `.gallery-thumb` buttons carrying `data-full`, `data-type`, `data-day`, `data-index` — consumed by Task 4's lightbox.

- [ ] **Step 1: Create a temporary fixture manifest so the page can be built/tested**

Create `site/_data/gallery.yml`:
```yaml
days:
  - date: "2026-07-18"
    day_number: 1
    items:
      - { file: "sample-photo", type: photo }
  - date: "2026-07-19"
    day_number: 2
    items:
      - { file: "sample-video", type: video }
```

Also drop placeholder derivative files so image tags resolve locally (1x1 is fine):
```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
mkdir -p site/assets/gallery/thumb site/assets/gallery/full
python3 - <<'PY'
from PIL import Image
for p in ["site/assets/gallery/thumb/sample-photo.jpg",
          "site/assets/gallery/full/sample-photo.jpg",
          "site/assets/gallery/thumb/sample-video.jpg"]:
    Image.new("RGB",(10,10),(200,50,50)).save(p)
open("site/assets/gallery/full/sample-video.mp4","wb").close()
PY
```

- [ ] **Step 2: Create the gallery page**

Create `site/gallery.md`:
```liquid
---
layout: default
title: Gallery
permalink: /gallery/
---

# Trip Gallery

<p class="gallery-intro">Photos and videos from all 12 days, in order.</p>

{% assign day_pages = site.days | sort: "day_number" %}

<nav class="gallery-jump" aria-label="Jump to day">
  {% for day in site.data.gallery.days %}
  <a href="#day-{{ day.day_number }}" class="gallery-jump-chip">Day {{ day.day_number }}</a>
  {% endfor %}
</nav>

{% for day in site.data.gallery.days %}
  {% assign match = day_pages | where: "day_number", day.day_number | first %}
  <section class="gallery-day" id="day-{{ day.day_number }}">
    <h2 class="gallery-day-heading">
      Day {{ day.day_number }}
      <span class="gallery-day-date">{{ day.date | date: "%b %-d" }}</span>
      {% if match %}<span class="gallery-day-title">{{ match.title }}</span>{% endif %}
    </h2>
    <div class="gallery-grid">
      {% for item in day.items %}
      <button type="button" class="gallery-thumb{% if item.type == 'video' %} is-video{% endif %}"
        data-full="{{ '/assets/gallery/full/' | append: item.file | append: (item.type == 'video' | ternary: '.mp4', '.jpg') | relative_url }}"
        data-type="{{ item.type }}"
        data-day="{{ day.day_number }}"
        data-index="{{ forloop.index0 }}">
        <img src="{{ '/assets/gallery/thumb/' | append: item.file | append: '.jpg' | relative_url }}"
             loading="lazy" alt="Day {{ day.day_number }} {{ item.type }}">
        {% if item.type == 'video' %}<span class="gallery-play" aria-hidden="true">▶</span>{% endif %}
      </button>
      {% endfor %}
    </div>
  </section>
{% endfor %}

<div class="lightbox" id="lightbox" hidden>
  <button class="lightbox-close" aria-label="Close">&times;</button>
  <button class="lightbox-prev" aria-label="Previous">&larr;</button>
  <div class="lightbox-stage" id="lightbox-stage"></div>
  <button class="lightbox-next" aria-label="Next">&rarr;</button>
</div>
```

Note: Liquid has no `ternary` filter. Replace the `data-full` line with explicit branching:
```liquid
        {% if item.type == 'video' %}data-full="{{ '/assets/gallery/full/' | append: item.file | append: '.mp4' | relative_url }}"{% else %}data-full="{{ '/assets/gallery/full/' | append: item.file | append: '.jpg' | relative_url }}"{% endif %}
```
Use this branching form in the actual file (remove the `ternary` version above).

- [ ] **Step 3: Add nav link in header**

In `site/_includes/header.html`, after the `pokemon` nav `<a>` and before `emergency`, add:
```liquid
      <a href="{{ '/gallery/' | relative_url }}" {% if page.url contains 'gallery' %}class="active"{% endif %}>Gallery</a>
```

- [ ] **Step 4: Add quick-link on home page**

In `site/index.md`, inside `<nav class="quick-links">`, after the Food quick-link and before Emergency, add:
```html
  <a href="{{ '/gallery/' | relative_url }}" class="quick-link">
    <span class="quick-link-icon">📷</span>
    <span class="quick-link-label">Gallery</span>
  </a>
```

- [ ] **Step 5: Build the site and verify it compiles + renders the page**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page/site
bundle install --quiet 2>/dev/null; bundle exec jekyll build 2>&1 | tail -5
grep -c 'gallery-thumb' _site/gallery/index.html
grep -c 'gallery-jump-chip' _site/gallery/index.html
grep -o 'href="/gallery/"' _site/index.html | head -1
```
Expected: build succeeds ("done in Xs"), `gallery-thumb` count = 2, jump chips = 2, home page contains the gallery link. If `bundle` is unavailable, note it and rely on the browser check after the real run (Task 6).

- [ ] **Step 6: Commit page + nav (keep fixture manifest for now; Task 6 replaces it)**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
git add site/gallery.md site/_includes/header.html site/index.md site/_data/gallery.yml
git commit -m "feat: add gallery page, nav link, and home quick-link"
```

---

### Task 3: Gallery + lightbox CSS

**Files:**
- Modify: `site/assets/css/style.css` (append at end)

**Interfaces:**
- Consumes: class names emitted by Task 2 (`.gallery-jump`, `.gallery-jump-chip`, `.gallery-day`, `.gallery-day-heading`, `.gallery-day-date`, `.gallery-day-title`, `.gallery-grid`, `.gallery-thumb`, `.gallery-play`) and Task 4 (`.lightbox`, `.lightbox-stage`, `.lightbox-close/prev/next`, body `.lightbox-open`).

- [ ] **Step 1: Append gallery styles**

Append to `site/assets/css/style.css`:
```css
/* ============================================
   Gallery
   ============================================ */
.gallery-intro { color: var(--color-text-light); margin-top: calc(-1 * var(--space-sm)); }

.gallery-jump {
  position: sticky; top: var(--header-height); z-index: 50;
  display: flex; gap: var(--space-sm); overflow-x: auto;
  padding: var(--space-sm) 0; margin-bottom: var(--space-lg);
  background: var(--color-bg);
  -webkit-overflow-scrolling: touch;
}
.gallery-jump-chip {
  flex: 0 0 auto; padding: var(--space-xs) var(--space-md);
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 999px; font-size: 0.85rem; text-decoration: none;
  color: var(--color-secondary); white-space: nowrap;
}
.gallery-jump-chip:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.gallery-day { margin-bottom: var(--space-2xl); scroll-margin-top: calc(var(--header-height) + 3rem); }
.gallery-day-heading {
  display: flex; align-items: baseline; gap: var(--space-sm); flex-wrap: wrap;
  border-bottom: 2px solid var(--color-primary); padding-bottom: var(--space-xs);
}
.gallery-day-date { color: var(--color-primary); font-size: 0.9rem; font-weight: 600; }
.gallery-day-title { color: var(--color-text-light); font-size: 0.95rem; font-weight: 400; }

.gallery-grid {
  display: grid; gap: var(--space-xs); margin-top: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
@media (min-width: 600px) {
  .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-sm); }
}
.gallery-thumb {
  position: relative; padding: 0; border: none; cursor: pointer;
  aspect-ratio: 1 / 1; border-radius: 8px; overflow: hidden;
  background: var(--color-border); box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gallery-thumb:hover img { transform: scale(1.05); }
.gallery-thumb img { transition: transform 0.2s ease; }
.gallery-play {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.6rem; text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  background: rgba(0,0,0,0.15); pointer-events: none;
}

/* Lightbox */
.lightbox {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.92); padding: var(--space-md);
}
.lightbox[hidden] { display: none; }
.lightbox-stage { max-width: 100%; max-height: 100%; display: flex; }
.lightbox-stage img, .lightbox-stage video { max-width: 100%; max-height: 90vh; border-radius: 6px; }
.lightbox-close, .lightbox-prev, .lightbox-next {
  position: absolute; background: rgba(255,255,255,0.12); color: #fff;
  border: none; cursor: pointer; font-size: 1.5rem; line-height: 1;
  width: 44px; height: 44px; border-radius: 50%;
}
.lightbox-close { top: var(--space-md); right: var(--space-md); }
.lightbox-prev { left: var(--space-sm); top: 50%; transform: translateY(-50%); }
.lightbox-next { right: var(--space-sm); top: 50%; transform: translateY(-50%); }
.lightbox-close:hover, .lightbox-prev:hover, .lightbox-next:hover { background: var(--color-primary); }
body.lightbox-open { overflow: hidden; }
```

- [ ] **Step 2: Verify CSS is syntactically valid (balanced braces)**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
python3 -c "s=open('site/assets/css/style.css').read(); assert s.count('{')==s.count('}'), (s.count('{'),s.count('}')); print('braces balanced:', s.count('{'))"
```
Expected: prints balanced count, no assertion error.

- [ ] **Step 3: Commit**

```bash
git add site/assets/css/style.css
git commit -m "feat: add gallery and lightbox styles"
```

---

### Task 4: Lightbox JavaScript

**Files:**
- Modify: `site/assets/js/app.js` (add a new block before the closing `})();`)

**Interfaces:**
- Consumes: `.gallery-thumb` buttons with `data-full`, `data-type`, `data-day`, `data-index`; the `#lightbox`, `#lightbox-stage`, `.lightbox-close/prev/next` elements from Task 2.
- Produces: no exports (self-contained behavior).

- [ ] **Step 1: Add the lightbox module**

In `site/assets/js/app.js`, immediately before the final `})();`, insert:
```javascript
  // ============================================
  // Gallery Lightbox
  // ============================================
  (function initGallery() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const stage = document.getElementById('lightbox-stage');
    const thumbs = Array.from(document.querySelectorAll('.gallery-thumb'));
    if (!thumbs.length) return;

    // Group thumbs by day so prev/next stays within a day.
    const byDay = {};
    thumbs.forEach(function(t) {
      const d = t.dataset.day;
      (byDay[d] = byDay[d] || []).push(t);
    });

    let currentDay = null;
    let currentIndex = 0;

    function render(thumb) {
      stage.innerHTML = '';
      const type = thumb.dataset.type;
      const src = thumb.dataset.full;
      if (type === 'video') {
        const v = document.createElement('video');
        v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
        stage.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = src; img.alt = thumb.querySelector('img').alt;
        stage.appendChild(img);
      }
    }

    function open(thumb) {
      currentDay = thumb.dataset.day;
      currentIndex = byDay[currentDay].indexOf(thumb);
      render(thumb);
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');
    }

    function close() {
      lightbox.hidden = true;
      stage.innerHTML = '';
      document.body.classList.remove('lightbox-open');
    }

    function step(delta) {
      const group = byDay[currentDay];
      currentIndex = (currentIndex + delta + group.length) % group.length;
      render(group[currentIndex]);
    }

    thumbs.forEach(function(t) {
      t.addEventListener('click', function() { open(t); });
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function() { step(-1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function() { step(1); });
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function(e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  })();

```

- [ ] **Step 2: Verify JS is syntactically valid**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
node --check site/assets/js/app.js && echo "JS OK"
```
Expected: `JS OK` (no syntax errors). If `node` unavailable, verify balanced parens/braces via a quick python brace check instead.

- [ ] **Step 3: Commit**

```bash
git add site/assets/js/app.js
git commit -m "feat: add gallery lightbox interaction"
```

---

### Task 5: Service worker precache entry

**Files:**
- Modify: `site/sw.js` (add `/gallery/` to `OFFLINE_URLS`; bump `CACHE_NAME`)

**Interfaces:** none (SW config only).

- [ ] **Step 1: Add gallery page to precache and bump cache version**

In `site/sw.js`:
- Change `const CACHE_NAME = 'japan-trip-v5';` to `const CACHE_NAME = 'japan-trip-v6';`
- In `OFFLINE_URLS`, add `'/gallery/',` after the `'/pokemon/',` line.

Do NOT add any `/assets/gallery/` image URLs — the network-first fetch handler caches them opportunistically as browsed; force-caching 500 files would bloat the install.

- [ ] **Step 2: Verify the edit**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
grep -n "japan-trip-v6" site/sw.js
grep -n "'/gallery/'," site/sw.js
grep -c "assets/gallery" site/sw.js  # expect 0
```
Expected: v6 present, `/gallery/` present, 0 gallery-asset precache entries.

- [ ] **Step 3: Commit**

```bash
git add site/sw.js
git commit -m "feat: precache gallery page in service worker"
```

---

### Task 6: Real media run + full verification + commit derivatives

**Files:**
- Create (committed): `site/assets/gallery/thumb/*.jpg`, `site/assets/gallery/full/*.{jpg,mp4}`, real `site/_data/gallery.yml`
- Delete: fixture placeholder derivatives from Task 2

**Interfaces:** none — final integration.

- [ ] **Step 1: Remove fixture placeholders**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
rm -f site/assets/gallery/thumb/sample-*.jpg site/assets/gallery/full/sample-*.jpg site/assets/gallery/full/sample-*.mp4
```

- [ ] **Step 2: Run the real build (this transcodes 88 videos — expect several minutes)**

```bash
python3 site/scripts/build_gallery.py --source /home/tng/workspace/2026_jp_trip/media --regen-manifest
```
Expected: processes ~510 files; prints "Done."

- [ ] **Step 3: Verify derivative counts and manifest**

```bash
echo "thumbs: $(ls site/assets/gallery/thumb | wc -l)  (expect ~510)"
echo "full jpg: $(ls site/assets/gallery/full/*.jpg | wc -l)  (expect ~422)"
echo "full mp4: $(ls site/assets/gallery/full/*.mp4 | wc -l)  (expect 88)"
echo "gallery size: $(du -sh site/assets/gallery | cut -f1)"
grep -c 'file:' site/_data/gallery.yml   # expect ~510
grep 'day_number:' site/_data/gallery.yml
```
Expected: thumbs ≈ 510, full jpgs ≈ 422, mp4s = 88, gallery size roughly 120–150 MB, day_numbers 1,2,3,5,6,7,8,9,10,11,12 (no Day 4).

- [ ] **Step 4: Build the site and confirm the gallery renders with real data**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page/site
bundle exec jekyll build 2>&1 | tail -3
grep -c 'gallery-thumb' _site/gallery/index.html   # expect ~510
grep -c 'is-video' _site/gallery/index.html        # expect 88
```
Expected: build succeeds; thumb count ≈ 510; video count = 88.

- [ ] **Step 5: Browser check (manual, use the `run` skill or `bundle exec jekyll serve`)**

Serve locally and open `/gallery/`. Confirm:
- Day sections appear in order with titles from the itinerary.
- Sticky day-jump chips scroll to sections.
- Thumbnails lazy-load; grid looks clean on a narrow (mobile) viewport.
- Clicking a photo opens the lightbox; arrows/Esc work; clicking a video plays it.
- Header "Gallery" nav link and home quick-link both work and highlight.

- [ ] **Step 6: Commit the derivatives + real manifest**

```bash
cd /home/tng/workspace/2026_jp_trip/.claude/worktrees/gallery-page
git add site/assets/gallery site/_data/gallery.yml
git commit -m "feat: add optimized trip media and generated gallery manifest"
git status  # confirm clean; confirm media/ originals are NOT staged
```
Expected: derivatives committed; no `media/` originals staged; working tree clean.

---

## Self-Review Notes

- **Spec coverage:** pipeline (Task 1), manifest (Task 1), page+nav+quick-link (Task 2), day-title cross-reference from `_days` (Task 2), grid+lazy-load (Task 2/3), lightbox photo+video (Task 4), SW precache note — don't cache images (Task 5), verification incl. repo size (Task 6). All spec sections mapped.
- **Manifest regen rule:** script keeps existing `gallery.yml` unless `--regen-manifest` (matches spec's "never silently lose hand edits"). Task 6 uses `--regen-manifest` for the first real generation.
- **Liquid caveat flagged:** no `ternary` filter — Task 2 Step 2 explicitly replaces it with `if/else`.
- **Type consistency:** manifest fields (`date`, `day_number`, `items[].file`, `items[].type`) identical across Tasks 1→2; derivative path convention (`thumb/<file>.jpg`, `full/<file>.{jpg,mp4}`) identical across Tasks 1→2→4.
- **No test framework:** verification steps are runnable commands + one explicit manual browser check, consistent with a static site.
