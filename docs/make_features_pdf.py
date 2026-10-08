"""
Generates New_Features.pdf in the project root.

    pip install reportlab pillow
    python docs/make_features_pdf.py

Edit PROJECT_INFO below to add your name, roll number, college, etc.
"""
import os
import tempfile
from datetime import date

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "docs", "screenshots")
OUT = os.path.join(ROOT, "New_Features.pdf")
TMP = tempfile.mkdtemp(prefix="pdf_crops_")

PROJECT_INFO = [
    ("Project", "Airbnb Clone - Earth-1610 Edition"),
    ("Type", "Educational college project (front-end web application)"),
    ("Built with", "HTML5, CSS3, vanilla JavaScript, Leaflet + OpenStreetMap, Font Awesome"),
    ("Data storage", "Browser localStorage (no server or database needed)"),
    ("How to run", "Open index.html in Chrome, Edge or Firefox (internet needed for photos and maps)"),
    ("Universe", "Earth-1610"),
    ("Date", date.today().strftime("%d %B %Y")),
]

DISCLAIMER = "Student project for LC26MCA F107, LEAD College of Management. Not affiliated with Airbnb, Inc."

BRAND = colors.HexColor("#FF385C")
DARK = colors.HexColor("#222222")
MUTED = colors.HexColor("#6A6A6A")
SOFT = colors.HexColor("#F7F7F7")
LINE = colors.HexColor("#DDDDDD")

# ---------- fonts (Segoe UI on Windows, Helvetica elsewhere) ----------
BODY, BOLD = "Helvetica", "Helvetica-Bold"
win_fonts = "C:/Windows/Fonts"
if os.path.exists(os.path.join(win_fonts, "segoeui.ttf")):
    pdfmetrics.registerFont(TTFont("Segoe", os.path.join(win_fonts, "segoeui.ttf")))
    pdfmetrics.registerFont(TTFont("Segoe-Bold", os.path.join(win_fonts, "segoeuib.ttf")))
    BODY, BOLD = "Segoe", "Segoe-Bold"

S = {
    "title": ParagraphStyle("title", fontName=BOLD, fontSize=30, leading=36, textColor=DARK, spaceAfter=6),
    "subtitle": ParagraphStyle("subtitle", fontName=BODY, fontSize=15, leading=20, textColor=BRAND, spaceAfter=18),
    "h1": ParagraphStyle("h1", fontName=BOLD, fontSize=20, leading=26, textColor=DARK, spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName=BOLD, fontSize=14.5, leading=19, textColor=DARK, spaceBefore=4, spaceAfter=4),
    "label": ParagraphStyle("label", fontName=BOLD, fontSize=9, leading=12, textColor=BRAND, spaceBefore=6, spaceAfter=1),
    "body": ParagraphStyle("body", fontName=BODY, fontSize=10.2, leading=14.6, textColor=DARK, spaceAfter=4),
    "small": ParagraphStyle("small", fontName=BODY, fontSize=8.6, leading=11.5, textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName=BODY, fontSize=8.6, leading=11, textColor=DARK),
    "cellb": ParagraphStyle("cellb", fontName=BOLD, fontSize=8.6, leading=11, textColor=DARK),
    "cellh": ParagraphStyle("cellh", fontName=BOLD, fontSize=8.8, leading=11.6, textColor=colors.white),
    "caption": ParagraphStyle("caption", fontName=BODY, fontSize=8.4, leading=11, textColor=MUTED, alignment=TA_CENTER, spaceAfter=8),
}

# ---------- the features ----------
FEATURES = [
    {
        "name": "Smart Stay Match",
        "short": "5-question quiz that ranks every stay by match % with reasons.",
        "where": "Home page banner, the Match tab, footer > Clone extras",
        "what": "A five-question quiz (trip vibe, scenery, who is coming, nightly budget, must-haves) that ranks every listing "
                "with a match percentage and shows the reasons it fits, such as \"Within budget\" or \"Fits your couple\".",
        "how": "matchScore() in js/features.js gives each answer a weight (vibe 30, scenery 25, group 15, budget 20, "
               "must-haves 10). Vibe uses the listing's tags and its neighbourhood ratings, so results are ranked, not just filtered. "
               "Highly rated stays get a small tie-break bonus. The top three matches can be sent straight to Compare.",
        "why": "Guests who don't have a destination yet get a ranked shortlist instead of scrolling through every listing.",
        "img": ("match-results.png", None, "Match results with percentage scores and reasons"),
    },
    {
        "name": "Compare Stays (side by side)",
        "short": "Up to 3 stays in one table with the best value highlighted.",
        "where": "\"Compare\" tick box on every listing card, Compare button on listing pages, floating compare bar",
        "what": "Pick up to three stays and see them in one table: price, cleaning fee, estimated 5-night total, rating, space, "
                "Eco Score, Wi-Fi speed, work score, vibe and every amenity. The best value in each row is highlighted in green.",
        "how": "The selected IDs are saved in localStorage, so the selection survives page changes. renderCompare() builds rows from "
               "small getter functions and marks the min or max value as \"Best\".",
        "why": "Saves opening several browser tabs and memorising prices when you're down to a few options.",
        "img": ("compare.png", 0.42, "Compare table - best values highlighted"),
    },
    {
        "name": "Price Heatmap Calendar",
        "short": "Calendar coloured by each night's price, from cheap (green) to pricey (red).",
        "where": "Listing page > calendar > \"Price heatmap\" switch; also when editing dates at checkout",
        "what": "Turns the availability calendar into a colour-coded price map. Every available night shows its own price, coloured "
                "from green (cheaper) to red (pricier), with booked nights struck through.",
        "how": "nightlyPrice() models dynamic pricing: a weekend premium, peak and off-season months, and a small deterministic daily "
               "variation from a hash function. The DatePicker component scales the colours to the visible months.",
        "why": "Guests see straight away that moving a trip by a day or two can save money.",
        "img": ("heatmap.png", None, "Heatmap calendar with the cheapest-window suggestion below it"),
    },
    {
        "name": "Cheapest-Dates Finder",
        "short": "Finds the cheapest available window for your trip length.",
        "where": "Listing page, under the calendar",
        "what": "Scans the next 60 days for the cheapest available window that matches your trip length (3 nights by default) and shows "
                "the saving compared with peak dates. \"Use these dates\" fills in the booking card in one click.",
        "how": "cheapestWindow() slides a window across the next 60 days, skips any window that overlaps a booked night, "
               "and keeps the lowest total.",
        "why": "Budget travellers don't have to check every date combination themselves.",
        "img": None,
    },
    {
        "name": "Split the Bill",
        "short": "Split the total equally or by custom amounts and copy payment requests.",
        "where": "Booking card (per-person estimate) and the Confirm and pay page",
        "what": "Split the trip total between 1-12 people, either equally or by custom amounts. A live check warns if the shares don't "
                "add up, and \"Copy payment requests\" copies a ready-to-paste summary for the group chat. The split is saved with the trip.",
        "how": "The SplitBill component recalculates when the total changes (for example when dates change or reward points are applied). "
               "Equal mode gives any rounding remainder to the first person, so the shares always add up to the exact total.",
        "why": "Groups of friends usually book on one card and then work out who owes what by hand.",
        "img": ("split.png", None, "Split between three people"),
    },
    {
        "name": "Eco Score and Green Stays",
        "short": "0-100 sustainability score, green badge, category and filter.",
        "where": "Leaf badge on cards, \"Stay insights\" on listing pages, Green stays category, Eco Score 80+ filter, host form",
        "what": "Every stay has a 0-100 sustainability score with the reasons behind it (solar power, EV charging, natural ventilation, "
                "gardens, recycling). Stays scoring 80+ get a green badge, appear under Green stays and earn double reward points. "
                "Hosts see an estimated score while they create a listing.",
        "how": "Scores are stored per listing, and ecoReasons() turns the amenities into short explanations. For new host listings, "
               "the score is estimated from the amenities and categories they choose.",
        "why": "Encourages greener travel and rewards hosts who invest in sustainability.",
        "img": ("insights.png", None, "Stay insights: Eco Score, Work-from-stay and Neighbourhood vibe"),
    },
    {
        "name": "Work-from-Stay Score",
        "short": "Wi-Fi speed, desk and quietness combined into one score, plus Wi-Fi filters.",
        "where": "Stay insights panel, Work-friendly category, Wi-Fi 100+ quick filter, minimum Wi-Fi filter",
        "what": "Combines Wi-Fi speed, whether there's a dedicated desk, the workspace amenity and how quiet the area is into one "
                "score out of 100, plus a plain-English rating such as \"Smooth HD video calls\".",
        "how": "workScore() uses a log scale for Wi-Fi speed (going from 10 to 100 Mbps matters more than 500 to 900) and adds points "
               "for a desk, a workspace and a calm area.",
        "why": "Remote workers can find a place that actually works for video calls.",
        "img": ("filters.png", (0.5, 1.0), "New Sustainability and remote work filters"),
    },
    {
        "name": "Neighbourhood Vibe Meter",
        "short": "Ratings for nightlife, quiet, family, nature and food.",
        "where": "Stay insights panel on every listing; also used by Smart Stay Match and Compare",
        "what": "Five bars that rate the area for nightlife, peace and quiet, families, nature and food.",
        "how": "Each listing stores five 1-5 ratings. The same numbers feed the match quiz, so choosing \"Nightlife\" in the quiz favours "
               "lively areas.",
        "why": "Party-goers and families want very different neighbourhoods, and listing photos don't show you the street outside.",
        "img": None,
    },
    {
        "name": "Explore Nearby with travel times",
        "short": "Nearby sights and food with distance and walk/drive time.",
        "where": "Listing page > Where you'll be",
        "what": "A list of nearby beaches, sights and places to eat, each with its distance and an estimated walk or drive time.",
        "how": "Places under 2 km are shown as walking time and longer ones as driving time.",
        "why": "Answers \"what's close by?\" without leaving the listing.",
        "img": None,
    },
    {
        "name": "Voice Search",
        "short": "Search by speaking, e.g. \"cabins in Manali\".",
        "where": "Microphone button inside the Where field of the search bar",
        "what": "Say something like \"beach stays in Goa\" or \"cabins in Manali\". The place goes into the search box and the "
                "category is picked automatically.",
        "how": "Uses the browser's Web Speech API (SpeechRecognition, en-IN). parseVoice() finds words like \"in/near/at <place>\" "
               "and category words such as beach, cabin, lake or eco.",
        "why": "Hands-free and more accessible, especially on mobile.",
        "img": None,
    },
    {
        "name": "Smart Packing List",
        "short": "Checklist generated from destination, season and amenities.",
        "where": "Trips page > Packing list, and the booking confirmation pop-up",
        "what": "Creates a checklist for each trip from the destination, season, trip length and amenities, for example thermals for "
                "Manali in winter, swimwear for beach stays, an umbrella during the Indian monsoon, or a laptop for work-friendly stays. "
                "Ticks are saved and a progress bar shows how much is packed.",
        "how": "packingList() combines rules about climate, category and amenities. The checked items are saved in localStorage "
               "for each booking.",
        "why": "Stops guests forgetting important items and makes the app useful after booking too.",
        "img": ("packing.png", 0.55, "Auto-generated packing list for a mountain trip"),
    },
    {
        "name": "Add Trip to Calendar (.ics)",
        "short": "One-click calendar file with a reminder the day before.",
        "where": "Trips page and booking confirmation",
        "what": "One click downloads a standard calendar file with the stay dates, location, host and confirmation code, plus a "
                "reminder the day before.",
        "how": "downloadICS() writes an iCalendar (RFC 5545) VEVENT with all-day dates, a GEO field and a VALARM reminder, "
               "and downloads it as a Blob.",
        "why": "Works with Google Calendar, Outlook and Apple Calendar.",
        "img": None,
    },
    {
        "name": "Travel Rewards: points, tiers and badges",
        "short": "Earn and redeem points, climb tiers, unlock badges.",
        "where": "Profile page, checkout (Use reward points), user menu",
        "what": "Earn 1 point per INR 100 spent (2x on green stays) and 250 points for publishing a listing. Move up through four tiers "
                "(Explorer, Voyager, Nomad, Legend), unlock eight badges, and spend points at checkout (1 point = INR 1, up to 20% "
                "of the total). Cancelling a trip removes the points it earned and returns any points you spent.",
        "how": "travelStats() works out trips, nights, countries and other stats from your bookings; each badge is a small test "
               "function based on them.",
        "why": "Airbnb has no guest loyalty programme. Rewards encourage return visits and greener choices.",
        "img": ("rewards-card.png", None, "Points card with tier progress"),
        "img2": ("badges.png", 0.72, "Badges, unlocked as you travel"),
    },
    {
        "name": "Surprise Me",
        "short": "Suggests a random stay from your results or wishlist.",
        "where": "Home page banner and chips, Wishlists (Pick one for me)",
        "what": "Spins the globe and suggests a random stay from your current search results or your wishlist. You can spin again "
                "or open the listing.",
        "how": "Picks a random item from the current filtered list, with a short loading animation.",
        "why": "A fun option when you can't decide.",
        "img": None,
    },
    {
        "name": "Dark Mode",
        "short": "Full dark theme across the site, remembered between visits.",
        "where": "Moon icon in the header, Profile > Settings",
        "what": "A complete dark theme for every page, pop-up, calendar and map control, remembered between visits.",
        "how": "All colours are CSS custom properties; setting data-theme=\"dark\" on the <html> element switches the whole set "
               "at once.",
        "why": "Easier on the eyes at night. The Airbnb website only has a light theme.",
        "img": ("dark.png", None, "Listing page in dark mode"),
    },
]

CLONED = [
    "Header with logo, full search bar (Where / Check in / Check out / Who) that shrinks into a pill when you scroll",
    "Destination suggestions, search by region (including I'm flexible), a two-month date-range picker and a guest picker",
    "Scrollable category bar (Beachfront, Cabins, Amazing pools, Iconic cities, Treehouses...)",
    "Filters pop-up: type of place, price range with histogram, rooms and beds, amenities, Instant Book, Superhost, Guest favourite",
    "Display total before taxes switch",
    "Listing cards with photo carousel, wishlist heart, Guest favourite badge, rating and price",
    "Map view with price pins and pop-up cards (Leaflet + OpenStreetMap)",
    "Listing page: photo grid and photo tour, host summary, highlights, description, amenities, availability calendar, "
    "booking card with price breakdown, reviews with category ratings, map, Meet your host, Things to know",
    "Message host (with simulated host replies)",
    "Confirm and pay page with editable dates and guests and a payment method choice (demo only, no card data collected)",
    "Trips (upcoming / past / cancelled) with cancellation, Wishlists, and \"Airbnb your home\" listing creation with live preview",
    "Log in / sign up (demo), user menu, responsive mobile layout with bottom tab bar, recently viewed stays",
]


# ---------- helpers ----------
def crop(name, frac):
    """frac is the kept bottom edge (0-1) or a (top, bottom) pair."""
    os.makedirs(TMP, exist_ok=True)
    top, bottom = frac if isinstance(frac, tuple) else (0, frac)
    im = PILImage.open(os.path.join(SHOTS, name))
    out = os.path.join(TMP, name)
    im.crop((0, int(im.height * top), im.width, int(im.height * bottom))).save(out)
    return out


def picture(name, frac=None, max_w=16.5 * cm, max_h=8.2 * cm):
    path = crop(name, frac) if frac else os.path.join(SHOTS, name)
    if not os.path.exists(path):
        return None
    w, h = PILImage.open(path).size
    scale = min(max_w / w, max_h / h)
    img = Image(path, width=w * scale, height=h * scale)
    t = Table([[img]], style=TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(BRAND)
    canvas.rect(0, h - 6, w, 6, stroke=0, fill=1)
    if doc.page > 1:
        canvas.setFont(BODY, 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(2 * cm, 1.2 * cm, "Airbnb Clone - Earth-1610 Edition  |  New Features Report")
        canvas.drawRightString(w - 2 * cm, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=2 * cm,
                            title="Airbnb Clone - New Features", author="Airbnb Clone (Earth-1610) project team",
                            subject="Features added beyond the original Airbnb")
    st = []

    # ----- cover -----
    disclaimer = Table([[Paragraph(DISCLAIMER, ParagraphStyle("disc", parent=S["cellb"], fontSize=9.5, leading=13, alignment=TA_CENTER))]], colWidths=[17 * cm])
    disclaimer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT), ("BOX", (0, 0), (-1, -1), 0.8, BRAND),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    st.append(disclaimer)
    st.append(Spacer(1, 0.8 * cm))
    st.append(Paragraph("Airbnb Clone", S["title"]))
    st.append(Paragraph("Earth-1610 Edition  -  New Features Report", S["subtitle"]))
    st.append(Paragraph(
        "This project recreates the main Airbnb experience as a web app: searching, filtering, browsing on a map, listing pages, "
        "booking, trips, wishlists and hosting. It then adds <b>15 features that the original Airbnb website does not have</b>. "
        "This report lists those features, explains how each one works and where to find it in the app.", S["body"]))
    st.append(Spacer(1, 10))
    info = Table([[Paragraph(k, S["cellb"]), Paragraph(v, S["cell"])] for k, v in PROJECT_INFO], colWidths=[3.4 * cm, 13.6 * cm])
    info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), SOFT), ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    st.append(info)
    st.append(Spacer(1, 14))
    pic = picture("home.png", max_h=10 * cm)
    if pic:
        st.append(pic)
        st.append(Paragraph("Home page of the clone", S["caption"]))
    st.append(Paragraph("Educational use only. Not affiliated with, endorsed by or connected to Airbnb, Inc. All listings, hosts and "
                        "reviews are made up, and no real payments are processed.", S["small"]))
    st.append(PageBreak())

    # ----- at a glance -----
    st.append(Paragraph("1. New features at a glance", S["h1"]))
    st.append(Paragraph("Features that are <b>not</b> on the original Airbnb website. Inside the app they are marked with a pink "
                        "<font color='#FF385C'><b>NEW</b></font> label.", S["body"]))
    rows = [[Paragraph("#", S["cellh"]), Paragraph("Feature", S["cellh"]), Paragraph("What it does", S["cellh"]), Paragraph("Where", S["cellh"])]]
    for i, f in enumerate(FEATURES, 1):
        short = f["short"]
        rows.append([Paragraph(str(i), S["cell"]), Paragraph(f["name"], S["cellb"]), Paragraph(short, S["cell"]),
                     Paragraph(f["where"].split(",")[0], S["cell"])])
    t = Table(rows, colWidths=[0.8 * cm, 4.4 * cm, 7.6 * cm, 4.2 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    st.append(t)
    st.append(Spacer(1, 8))
    st.append(Paragraph("The comparison is with the public Airbnb website at the time of writing. Airbnb's own features may change "
                        "over time.", S["small"]))
    st.append(PageBreak())

    # ----- details -----
    st.append(Paragraph("2. Feature details", S["h1"]))
    for i, f in enumerate(FEATURES, 1):
        block = [Paragraph(f"2.{i}  {f['name']}", S["h2"]),
                 Paragraph("WHERE TO FIND IT", S["label"]), Paragraph(f["where"], S["body"]),
                 Paragraph("WHAT IT DOES", S["label"]), Paragraph(f["what"], S["body"]),
                 Paragraph("HOW IT WORKS", S["label"]), Paragraph(f["how"], S["body"]),
                 Paragraph("WHY IT HELPS", S["label"]), Paragraph(f["why"], S["body"])]
        for key in ("img", "img2"):
            if f.get(key):
                name, frac, cap = f[key]
                p = picture(name, frac, max_h=6.2 * cm if f.get("img2") else 8.2 * cm)
                if p:
                    block += [Spacer(1, 4), p, Paragraph(cap, S["caption"])]
        st.append(KeepTogether(block))
        st.append(Spacer(1, 10))

    # ----- cloned features -----
    st.append(PageBreak())
    st.append(Paragraph("3. Original Airbnb features recreated", S["h1"]))
    st.append(Paragraph("These are the core Airbnb features rebuilt in this clone. Together they are the base that the new "
                        "features build on.", S["body"]))
    for c in CLONED:
        st.append(Paragraph(f"<font color='#FF385C'>&#8226;</font>  {c}", S["body"]))

    st.append(Spacer(1, 14))
    st.append(Paragraph("4. Project structure", S["h1"]))
    files = [
        ("index.html", "App shell: header, search bar, categories, footer, mobile tab bar"),
        ("css/styles.css", "All styling, including light and dark themes and responsive breakpoints"),
        ("js/data.js", "Demo listings, categories, amenities and listing builder"),
        ("js/store.js", "State saved in localStorage (user, wishlist, bookings, points...)"),
        ("js/utils.js", "Dates, dynamic pricing, price breakdown, pop-ups, notifications"),
        ("js/components.js", "Listing card, date-range picker with heatmap, guest picker, compare bar"),
        ("js/features.js", "New features: match scoring, split bill, packing list, .ics, voice search, rewards"),
        ("js/pages.js", "Page views: home, listing, checkout, trips, wishlists, compare, match, host, profile"),
        ("js/app.js", "Search bar, filters pop-up, user menu, login, theme and hash-based page routing"),
        ("docs/", "This report's generator script and screenshots"),
    ]
    ft = Table([[Paragraph(a, S["cellb"]), Paragraph(b, S["cell"])] for a, b in files], colWidths=[4 * cm, 13 * cm])
    ft.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, LINE), ("BACKGROUND", (0, 0), (0, -1), SOFT),
                            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    st.append(ft)
    st.append(Spacer(1, 14))
    run = [Paragraph("5. How to run", S["h1"])]
    for line in [
        "Open <b>index.html</b> in Chrome, Edge or Firefox by double-clicking it. There's no build step or server.",
        "Optional: run a local server with <font face='Courier'>python -m http.server 8000</font> and open http://localhost:8000.",
        "Photos (Unsplash), icons (Font Awesome) and maps (OpenStreetMap) need an internet connection.",
        "Voice search works best in Chrome or Edge. Everything you do is saved in your browser. "
        "To clear it, use Profile > Reset demo data.",
    ]:
        run.append(Paragraph(f"<font color='#FF385C'>&#8226;</font>  {line}", S["body"]))
    st.append(KeepTogether(run))

    doc.build(st, onFirstPage=on_page, onLaterPages=on_page)
    print("Wrote", OUT)


if __name__ == "__main__":
    build()
