# Japan Family Trip 2026

A GitHub Pages site for coordinating our family trip to Japan (July 14-28, 2026).

## Quick Links

- **Live Site:** [jp.dpao.la](https://jp.dpao.la)
- **Itinerary:** Tokyo → Kyoto → Osaka
- **Duration:** 14 nights

## Features

- **Day-by-day itinerary** with detailed activity cards
- **Reservation tracker** with booking deadlines
- **Interactive packing list** (saves progress in browser)
- **Pokemon shopping guide** with target lists
- **Food wishlist** for the family
- **Emergency info** with Japanese phrases and contacts
- **Offline support** — works without internet during the trip
- **Family feedback** via GitHub Discussions (Giscus)

## Setup

### Option 1: GitHub Pages (Recommended)

1. Fork or clone this repository
2. Go to Settings → Pages
3. Set Source to "Deploy from a branch" → `main` / `root`
4. Your site will be live at `https://your-username.github.io/repo-name`

### Option 2: Local Development

```bash
# Install dependencies
bundle install

# Run locally
bundle exec jekyll serve

# Open http://localhost:4000
```

## Customization

### Update Giscus Comments

1. Enable Discussions on your repository
2. Install the [Giscus app](https://github.com/apps/giscus)
3. Update `_layouts/default.html` and `_layouts/day.html` with your repo info

### Add Your Hotel Info

Edit `emergency.md` to add actual hotel addresses in Japanese.

### Personalize Packing/Food Lists

Edit `packing.md` and `food.md` to add family-specific items.

## Structure

```
site/
├── _config.yml          # Site configuration
├── _layouts/            # Page templates
├── _includes/           # Reusable components
├── _days/               # Individual day pages
├── assets/
│   ├── css/style.css    # Styles
│   └── js/app.js        # Interactive features
├── index.md             # Homepage
├── itinerary.md         # Overview
├── reservations.md      # Booking tracker
├── packing.md           # Packing checklist
├── pokemon.md           # Card shopping guide
├── food.md              # Food wishlist
├── emergency.md         # Emergency contacts
├── feedback.md          # Family discussion
├── manifest.json        # PWA config
└── sw.js                # Offline support
```

## Contributing

Family members can:
- **Comment** on day pages (requires GitHub account)
- **Edit** pages directly via GitHub's web editor
- **Submit suggestions** via Issues

## Tech Stack

- [Jekyll](https://jekyllrb.com/) — Static site generator
- [GitHub Pages](https://pages.github.com/) — Free hosting
- [Giscus](https://giscus.app/) — Comments via GitHub Discussions
- Service Worker — Offline capability

---

Built with love for an epic family adventure!
