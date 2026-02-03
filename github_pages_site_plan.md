# Japan Trip GitHub Pages Site — Implementation Plan

## Overview

Create a family-friendly GitHub Pages site that serves three purposes:
1. **Pre-trip planning** — Coordinate decisions, preferences, and reservations
2. **Feedback collection** — Allow family members to vote, comment, and suggest changes
3. **Living trip document** — Mobile-first reference during the trip with offline support

---

## Site Architecture

```
japan-trip-2026/
├── index.html                 # Landing page with countdown + quick links
├── _config.yml                # Jekyll configuration
├── _layouts/
│   └── default.html           # Base layout
├── _includes/
│   ├── header.html
│   ├── footer.html
│   └── day-card.html          # Reusable day component
├── assets/
│   ├── css/
│   │   └── style.css          # Mobile-first responsive styles
│   ├── js/
│   │   ├── checklist.js       # Interactive packing/todo lists
│   │   ├── countdown.js       # Trip countdown timer
│   │   └── offline.js         # Service worker registration
│   └── images/
│       └── maps/              # Neighborhood maps for offline use
├── pages/
│   ├── itinerary.md           # Full day-by-day breakdown
│   ├── reservations.md        # Booking tracker with status
│   ├── packing.md             # Interactive packing list
│   ├── pokemon-targets.md     # Card shopping target list
│   ├── food-wishlist.md       # Restaurant/food goals
│   ├── emergency.md           # Contacts, addresses, phrases
│   └── feedback.md            # Family input hub
├── days/
│   ├── day-01.md → day-15.md  # Individual day pages with detail
├── manifest.json              # PWA manifest for mobile
└── sw.js                      # Service worker for offline access
```

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Static site generator | **Jekyll** | Native GitHub Pages support, no build step needed |
| Theme | **Minima** (customized) or **Just the Docs** | Clean, mobile-friendly, easy to navigate |
| Comments/Feedback | **Giscus** | Uses GitHub Discussions, free, no external accounts |
| Polls/Voting | **Embedded Strawpoll** or **GitHub Issues with reactions** | Simple voting on decisions |
| Maps | **Static images** + **Google Maps links** | Works offline with static images |
| Offline support | **Service Worker** | Critical pages cached for in-trip use |

---

## Feature Breakdown

### Phase 1: Pre-Trip Planning Features

#### 1. Interactive Reservation Tracker
A table showing all bookings with status indicators:

| Reservation | Date to Book | Trip Date | Status | Owner | Link |
|-------------|--------------|-----------|--------|-------|------|
| PokéPark KANTO | Late May 2026 | Mon 7/27 | ⏳ Pending | Dad | [Book](#) |
| Ghibli Museum | TBD | Thu 7/16 | ⏳ Pending | Mom | [Book](#) |
| Pokémon Cafe Tokyo | Jun 14 | Wed 7/15 | ⏳ Pending | — | [Book](#) |

**Implementation:** Markdown table with emoji status, manually updated via PR or direct edit.

#### 2. Family Voting System
For decisions that need group input:
- Which Pokémon Cafe? (Tokyo vs Osaka vs Both)
- USJ: Must-do or skip?
- Sumidagawa Fireworks swap?
- Restaurant picks

**Implementation options:**
- **GitHub Issues with 👍/👎 reactions** — Family reacts to vote
- **Embedded polls** — Simple external poll widgets
- **Giscus comments** — Discussion threads per decision

#### 3. Packing List (Collaborative)
Interactive checklist saved to localStorage:
```
Family Shared
[ ] JR Pass (if purchased)
[ ] Yen cash
[ ] Portable WiFi / SIM pickup info
[ ] Power adapters (Type A)

Personal - Teen 1
[ ] DS/Switch + charger
[ ] Card sleeves/toploaders (for purchases)
[ ] ...

Personal - Teen 2
[ ] ...
```

**Implementation:** JavaScript-powered checkboxes that persist in browser localStorage.

#### 4. Pokémon Target List
Structured shopping goals:

```markdown
## Singles Target List
| Card | Priority | Max Price (¥) | Found? | Where/Price |
|------|----------|---------------|--------|-------------|
| [Card Name] | High | 5000 | ☐ | — |

## Sealed Products
| Product | Priority | Notes |
|---------|----------|-------|
| [Set Name] Box | Medium | Compare PC vs card shops |
```

#### 5. Food & Experience Wishlist
Each family member adds their "must-try" items:
- Specific restaurants
- Foods to try (takoyaki, specific ramen shops, etc.)
- Experiences (specific arcade games, etc.)

---

### Phase 2: During-Trip Features

#### 1. Quick Reference Cards (Mobile-Optimized)
Swipeable cards for each day showing:
- Date + Day number
- Morning/Afternoon/Evening activities
- Key addresses (tap to open in Maps)
- Reservation confirmation numbers
- Neighborhood map thumbnail

#### 2. Emergency Information Page
Always accessible, works offline:
- Hotel addresses (in Japanese for taxi drivers)
- Emergency numbers (Police: 110, Ambulance: 119)
- Embassy contact
- Family member phone numbers
- Basic Japanese phrases
- Allergy/medical info in Japanese

#### 3. Offline Mode (PWA)
Service worker caches:
- All day pages
- Emergency info
- Maps/images
- Core CSS/JS

**Critical for:** Subway with no signal, rural areas, data limits

#### 4. Photo/Memory Log
Simple dated entries for adding trip memories:
- Could link to shared Google Photos album
- Or use GitHub Issues as a trip journal (one issue per day)

#### 5. Expense Tracker Link
Link to shared Google Sheet or Splitwise for tracking spending.

---

## Page Designs

### Homepage (index.html)
```
┌─────────────────────────────────────┐
│     🇯🇵 Japan 2026                  │
│     Family Adventure                │
│                                     │
│     ┌─────────────────────┐         │
│     │   42 days to go!    │         │
│     │   Jul 14 - Jul 28   │         │
│     └─────────────────────┘         │
│                                     │
│  [📅 Itinerary]  [✅ Reservations] │
│  [🎒 Packing]    [🃏 Pokémon List] │
│  [🍜 Food]       [🆘 Emergency]    │
│                                     │
│  ─── Upcoming Bookings ───          │
│  ⚠️ Pokémon Cafe: Book Jun 14!     │
│                                     │
│  ─── Open Decisions ───             │
│  🗳️ USJ: Yes or Skip? [Vote]       │
└─────────────────────────────────────┘
```

### Day Page (days/day-05.md)
```
┌─────────────────────────────────────┐
│ ← Day 4    Day 5: Sat 7/18   Day 6 →│
├─────────────────────────────────────┤
│ FUSHIMI INARI + HIGASHIYAMA         │
│                                     │
│ 🌅 EARLY MORNING                    │
│ ┌─────────────────────────────────┐ │
│ │ Fushimi Inari Shrine            │ │
│ │ Beat the heat — arrive by 6:30am│ │
│ │ 📍 Tap for directions           │ │
│ │ ⏱️ 2-3 hours for main gates     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🌞 AFTERNOON (indoor when hot)      │
│ ┌─────────────────────────────────┐ │
│ │ Kiyomizu-dera Area              │ │
│ │ Traditional streets, shops      │ │
│ │ 📍 Tap for directions           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🌙 EVENING                          │
│ ┌─────────────────────────────────┐ │
│ │ Gion / Pontocho                 │ │
│ │ Dinner walk, atmosphere         │ │
│ │ 📍 Tap for directions           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💬 Family Notes                     │
│ [Giscus comment section]            │
└─────────────────────────────────────┘
```

---

## Family Onboarding

### For Non-Technical Family Members
1. **View only** — Anyone can access the site URL
2. **Comment/Vote** — Requires free GitHub account (one-time setup)
3. **Edit content** — Can use GitHub's web editor (or submit via family chat)

### Suggested Workflow
- **Parents** have GitHub accounts and can edit directly
- **Teens** can comment/vote with their own GitHub accounts
- **Major changes** discussed in family chat, then updated on site

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize GitHub repository
- [ ] Set up Jekyll with chosen theme
- [ ] Create basic page structure
- [ ] Migrate itinerary content to day pages
- [ ] Deploy to GitHub Pages

### Phase 2: Planning Features (Week 2)
- [ ] Build reservation tracker page
- [ ] Set up Giscus for comments
- [ ] Create voting issues for open decisions
- [ ] Build interactive packing list
- [ ] Create Pokémon target list template

### Phase 3: Mobile & Offline (Week 3)
- [ ] Mobile-first CSS refinements
- [ ] Add PWA manifest
- [ ] Implement service worker for offline
- [ ] Create static map images
- [ ] Test on actual phones

### Phase 4: Polish (Week 4)
- [ ] Add countdown timer
- [ ] Emergency page with Japanese text
- [ ] Family onboarding + test run
- [ ] Bookmark/home screen setup guide

---

## Content Migration Plan

Transform the existing itinerary into site pages:

| Source Section | Target Page(s) |
|----------------|----------------|
| Snapshot + Dates | Homepage + Itinerary overview |
| Advance reservations | `/reservations` with tracker table |
| Hotel shortlists | `/accommodations` (or section in itinerary) |
| Pokémon shopping guide | `/pokemon-targets` |
| Day-by-day itinerary | Individual `/days/day-XX.md` pages |
| Logistics notes | `/tips` or integrated into relevant pages |
| Reservation checklist | `/reservations` with calendar reminders |

---

## Optional Enhancements

### If Time Permits
- **Weather widget** — Embed 14-day forecast closer to trip
- **Currency converter** — Quick JPY reference
- **Transit app links** — Deep links to Google Maps transit
- **QR codes** — For confirmation numbers (scannable at venues)
- **Dark mode** — Easier on eyes at night

### Future Trip Reuse
Structure the site so it can be forked/templated for future family trips.

---

## Technical Notes

### GitHub Pages Setup
```yaml
# _config.yml
title: Japan 2026
description: Family trip coordination
theme: minima
plugins:
  - jekyll-seo-tag
  - jekyll-sitemap

# Custom variables
trip_start: 2026-07-14
trip_end: 2026-07-28
family_members:
  - name: Dad
  - name: Mom
  - name: Teen 1
  - name: Teen 2
```

### Giscus Setup
1. Enable GitHub Discussions on the repo
2. Install Giscus app
3. Configure in `_includes/comments.html`
4. Add to day page layouts

### Service Worker Strategy
```javascript
// Cache essential pages on install
const CACHE_NAME = 'japan-trip-v1';
const OFFLINE_PAGES = [
  '/',
  '/emergency/',
  '/days/day-01/', // ... through day-15
  '/assets/css/style.css',
  '/assets/images/maps/tokyo-map.png',
  // etc.
];
```

---

## Success Criteria

The site is successful if:
1. **All family members** can easily view the itinerary on their phones
2. **Booking deadlines** are clearly visible and tracked
3. **Decisions** are made collaboratively with everyone's input
4. **During the trip**, key info is accessible without internet
5. **The teens** actually use it (ultimate test!)

---

## Next Steps

1. **Create GitHub repository** — `japan-trip-2026` or similar
2. **Choose theme** — Recommend testing Minima vs Just the Docs
3. **Set up basic structure** — Homepage + one sample day page
4. **Invite family** — Create GitHub accounts if needed
5. **Iterate** — Add features based on what family actually uses

---

## Questions to Decide

Before building, the family should weigh in on:

1. **Site name/URL preference?**
   - `familyname.github.io/japan-2026`
   - Custom domain?

2. **Comment system preference?**
   - Giscus (requires GitHub accounts)
   - Alternative (Google Forms, just use group chat)

3. **Who will maintain/update?**
   - Single person edits
   - Everyone can edit

4. **Privacy level?**
   - Public repo (anyone can view)
   - Private repo (family only, requires GitHub Pro or use alternative)

5. **What features matter most?**
   - Rank: Itinerary, Packing, Voting, Offline, Photos, etc.
