# Airbnb Clone · Earth-1610 Edition

An educational Airbnb clone built for a college project. It recreates the core Airbnb experience and adds **15 features the original Airbnb website does not have**. These are explained in detail in [New_Features.pdf](New_Features.pdf).

> Educational use only. This project is not affiliated with Airbnb, Inc. All listings, hosts and reviews are made up, and no real payments are processed.

## How to run

The project has no build step and no dependencies to install.

1. Double-click `index.html` to open it in Chrome, Edge or Firefox.
2. Optional: serve the folder locally instead:
   ```bash
   python -m http.server 8000
   # then open http://localhost:8000
   ```

You need an internet connection for photos (Unsplash), icons (Font Awesome), the font (Google Fonts) and maps (Leaflet + OpenStreetMap). Your data (account, trips, wishlists, points) is saved in your browser's `localStorage`. To clear it, go to **Profile → Reset demo data**.

## Features

### Recreated from Airbnb
- Search bar with destination suggestions, region picker, a two-month date-range picker and a guest picker
- Category bar, filters pop-up (place type, price histogram, rooms and beds, amenities, booking options) and a "Display total before taxes" switch
- Listing cards with a photo carousel, wishlist heart and Guest favourite badge
- Map view with price pins
- Listing page: photo grid and photo tour, highlights, amenities, availability calendar, booking card with price breakdown, reviews, map, host profile, things to know
- Message host, Confirm and pay (demo), Trips with cancellation, Wishlists, "Airbnb your home" (create a listing), log in and sign up, mobile layout with a bottom tab bar

### New (marked with a pink **NEW** label in the app)
| # | Feature | Where to find it |
|---|---------|------------------|
| 1 | Smart Stay Match quiz with match % | Home banner, Match tab |
| 2 | Compare up to 3 stays side by side | "Compare" tick box on cards |
| 3 | Price heatmap calendar | Listing page calendar |
| 4 | Cheapest-dates finder | Under the listing calendar |
| 5 | Split the bill | Booking card, checkout |
| 6 | Eco Score and Green stays | Card badge, Stay insights, filters |
| 7 | Work-from-stay score and Wi-Fi filters | Stay insights, filters |
| 8 | Neighbourhood vibe meter | Stay insights |
| 9 | Explore nearby with travel times | Listing page, Where you'll be |
| 10 | Voice search | Mic in the search bar |
| 11 | Smart packing list | Trips page |
| 12 | Add trip to calendar (.ics) | Trips page |
| 13 | Travel rewards: points, tiers, badges | Profile, checkout |
| 14 | Surprise me | Home page, Wishlists |
| 15 | Dark mode | Moon icon, Profile settings |

## Project structure

```
index.html              App shell (header, search, categories, footer)
css/styles.css          Styling, light and dark themes, responsive layout
js/data.js              Demo listings, categories, amenities
js/store.js             localStorage state
js/utils.js             Dates, dynamic pricing, pop-ups, notifications
js/components.js        Listing card, date picker with heatmap, guest picker, compare bar
js/features.js          New features (match, split bill, packing, .ics, voice, rewards...)
js/pages.js             Page views (home, listing, checkout, trips, compare, match, host, profile)
js/app.js               Search bar, filters, user menu, login, theme, page routing
New_Features.pdf        New features report
docs/make_features_pdf.py  Script that generates the PDF
docs/screenshots/       Screenshots used in the PDF
```

## Regenerating the PDF

To add your name, roll number or college, edit `PROJECT_INFO` in `docs/make_features_pdf.py`, then run:

```bash
pip install reportlab pillow
python docs/make_features_pdf.py
```

## Credits
- Photos: [Unsplash](https://unsplash.com)
- Maps: [Leaflet](https://leafletjs.com) and [OpenStreetMap](https://www.openstreetmap.org) contributors
- Icons: [Font Awesome](https://fontawesome.com) (free)
- Font: Inter (Google Fonts)
"# airbnbclone" 

# Earth-1610 • Airbnb • DOOMSDAY PROTOCOL

**Campaign HQ site:** https://airbnbclonee.vercel.app

## Roles today (Day 1)
| Role | Name |
|---|---|
| Captain | Devnarayan |
| Stark | Balachandru |
| Banner | Abhishek |
| Romanoff | Jain |
| Strange | Amenda |
| Watcher | Joshua |

## Integrity pact
We will only claim evidence we can show. We will verify every AI claim.

I, Amenda, will only claim evidence I can show

## Day log
| Day | Stone | What we built | Evidence link |
|---|---|---|---|
| 1 | Space | Earth HQ site, touchpoint inventory | |
