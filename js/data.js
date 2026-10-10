/* =========================================================
   data.js — static demo data (listings, categories, amenities)
   All listings are fictfional and live on Earth-1610.
   ========================================================= */

const PHOTO_IDS = [
  "1566073771259-6a8506099945", "1520250497591-112f2f40a3f4", "1502672260266-1c1ef2d93688", "1522708323590-d24dbb6b0267",
  "1505691938895-1758d7feb511", "1493809842364-78817add7ffb", "1512917774080-9991f1c4c750", "1564013799919-ab600027ffc6",
  "1580587771525-78b9dba3b914", "1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c", "1613490493576-7fde63acd811", "1499793983690-e29da59ef1c2", "1510798831971-661eb04b3739",
  "1449158743715-0a90ebb6d2d8", "1542718610-a1d656d1884c", "1518780664697-55e3ad937233", "1587061949409-02df41d5e562",
  "1586375300773-8384e3e4916f", "1571896349842-33c89424de2d", "1551882547-ff40c63fe5fa", "1582719508461-905c673771fd",
  "1540541338287-41700207dee6", "1596394516093-501ba68a0ba6", "1618773928121-c32242e63f39", "1631049307264-da0ec9d70304",
  "1560448204-e02f11c3d0e2", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136", "1556020685-ae41abfc9365",
  "1554995207-c18c203602cb", "1600210492486-724fe5c67fb0", "1600607687939-ce8a6c25118c", "1600566753190-17f0baa2a6c3",
  "1600047509807-ba8f99d2cdde", "1576941089067-2de3c901e126", "1523217582562-09d0def993a6", "1505843513577-22bb7d21e455",
  "1494526585095-c41746248156", "1475855581690-80accde3ae2b", "1470770841072-f978cf4d019e", "1501785888041-af3ef285b470",
  "1439066615861-d1af74d74000", "1507525428034-b723cf961d3e", "1519046904884-53103b34b206", "1544551763-46a013bb70d5",
  "1533104816931-20fa691ff6ca", "1564501049412-61c2a3083791", "1578683010236-d716f9a3f461", "1611892440504-42a792e24d32",
  "1590490360182-c33d57733427", "1595576508898-0ad5c879a061", "1584132967334-10e028bd69f7", "1602343168117-bb8ffe3e2e9f",
  "1597211833712-5e41faa202ea", "1505873242700-f289a29e1e0f", "1517840901100-8179e982acb7", "1445019980597-93fa8acb246c"
];

/** Builds an Unsplash URL from an index into PHOTO_IDS (or a full URL for host-uploaded photos). */
function photo(ref, w = 900) {
  if (typeof ref === "string") return ref;
  return `https://images.unsplash.com/photo-${PHOTO_IDS[ref]}?auto=format&fit=crop&w=${w}&q=55`;
}

// Interior shots that get mixed into every listing's gallery
const INTERIOR_POOL = [2, 3, 4, 5, 26, 27, 28, 29, 31, 32, 33, 34, 50, 51, 52, 53, 57];

const CATEGORIES = [
  { key: "trending",    label: "Trending",      icon: "fa-fire" },
  { key: "beach",       label: "Beachfront",    icon: "fa-umbrella-beach" },
  { key: "pools",       label: "Amazing pools", icon: "fa-water-ladder" },
  { key: "cabins",      label: "Cabins",        icon: "fa-tree" },
  { key: "iconic",      label: "Iconic cities", icon: "fa-city" },
  { key: "countryside", label: "Countryside",   icon: "fa-wheat-awn" },
  { key: "lake",        label: "Lakefront",     icon: "fa-sailboat" },
  { key: "views",       label: "Amazing views", icon: "fa-mountain-sun" },
  { key: "mansions",    label: "Mansions",      icon: "fa-landmark" },
  { key: "tiny",        label: "Tiny homes",    icon: "fa-house-chimney" },
  { key: "treehouse",   label: "Treehouses",    icon: "fa-tree-city" },
  { key: "tropical",    label: "Tropical",      icon: "fa-sun" },
  { key: "green",       label: "Green stays",   icon: "fa-leaf", isNew: true },
  { key: "work",        label: "Work-friendly", icon: "fa-laptop-house", isNew: true }
];

const AMENITIES = {
  wifi:      { label: "Wifi",                 icon: "fa-wifi" },
  kitchen:   { label: "Kitchen",              icon: "fa-kitchen-set" },
  pool:      { label: "Pool",                 icon: "fa-water-ladder" },
  ac:        { label: "Air conditioning",     icon: "fa-snowflake" },
  parking:   { label: "Free parking",         icon: "fa-square-parking" },
  workspace: { label: "Dedicated workspace",  icon: "fa-laptop" },
  tv:        { label: "TV",                   icon: "fa-tv" },
  washer:    { label: "Washer",               icon: "fa-shirt" },
  heating:   { label: "Heating",              icon: "fa-temperature-arrow-up" },
  hottub:    { label: "Hot tub",              icon: "fa-hot-tub-person" },
  fireplace: { label: "Indoor fireplace",     icon: "fa-fire" },
  bbq:       { label: "BBQ grill",            icon: "fa-fire-burner" },
  gym:       { label: "Gym",                  icon: "fa-dumbbell" },
  beach:     { label: "Beach access",         icon: "fa-umbrella-beach" },
  lake:      { label: "Lake access",          icon: "fa-person-swimming" },
  ev:        { label: "EV charger",           icon: "fa-charging-station" },
  solar:     { label: "Solar powered",        icon: "fa-solar-panel" },
  pets:      { label: "Pets allowed",         icon: "fa-paw" },
  breakfast: { label: "Breakfast",            icon: "fa-mug-saucer" },
  mountain:  { label: "Mountain view",        icon: "fa-mountain" },
  balcony:   { label: "Patio or balcony",     icon: "fa-chair" },
  garden:    { label: "Garden",               icon: "fa-seedling" },
  smoke:     { label: "Smoke alarm",          icon: "fa-bell" },
  firstaid:  { label: "First aid kit",        icon: "fa-kit-medical" }
};

const PLACE_TYPES = {
  entire:  "Entire home",
  private: "Private room",
  shared:  "Shared room",
  hotel:   "Hotel room"
};

/* ---------------------------------------------------------
   Listings. Compact rows, expanded by buildListing() below.
   vibe = [nightlife, calm, family, nature, food] on a 1–5 scale
   tags drive the Smart Stay Match quiz.
   --------------------------------------------------------- */
const RAW_LISTINGS = [
  { id: 1, title: "Palm-fringed villa steps from Vagator beach", city: "Goa", country: "India", lat: 15.6034, lng: 73.7340,
    kind: "Villa", place: "entire", cats: ["beach", "pools", "tropical", "trending"], price: 14500, rating: 4.94, reviews: 312,
    guests: 8, bedrooms: 4, beds: 5, baths: 4, hero: 7, host: ["Ananya", 6, true],
    amen: ["wifi", "kitchen", "pool", "ac", "parking", "tv", "beach", "bbq", "balcony", "smoke", "firstaid"],
    eco: 62, wifi: 95, desk: false, vibe: [5, 2, 4, 3, 5], tags: ["beach", "party", "family", "luxury"], instant: true,
    nearby: [["Vagator Beach", "beach", 0.4], ["Chapora Fort", "sight", 1.8], ["Anjuna Flea Market", "food", 3.2]] },

  { id: 2, title: "Snow-dusted log cabin with a wood fireplace", city: "Manali", country: "India", lat: 32.2432, lng: 77.1892,
    kind: "Cabin", place: "entire", cats: ["cabins", "views", "trending"], price: 6800, rating: 4.89, reviews: 201,
    guests: 4, bedrooms: 2, beds: 2, baths: 1, hero: 15, host: ["Tenzin", 4, true],
    amen: ["wifi", "kitchen", "heating", "fireplace", "parking", "mountain", "pets", "smoke", "firstaid"],
    eco: 78, wifi: 40, desk: true, vibe: [2, 5, 3, 5, 3], tags: ["mountain", "relax", "romantic", "adventure", "budget"], instant: true,
    nearby: [["Hadimba Temple", "sight", 2.1], ["Solang Valley", "nature", 13], ["Old Manali Cafés", "food", 1.5]] },

  { id: 3, title: "Jungle pool villa overlooking rice terraces", city: "Ubud, Bali", country: "Indonesia", lat: -8.5069, lng: 115.2625,
    kind: "Villa", place: "entire", cats: ["pools", "tropical", "trending", "views"], price: 11200, rating: 4.97, reviews: 488,
    guests: 4, bedrooms: 2, beds: 2, baths: 2, hero: 1, host: ["Made", 8, true],
    amen: ["wifi", "pool", "ac", "breakfast", "garden", "workspace", "balcony", "smoke", "firstaid"],
    eco: 81, wifi: 120, desk: true, vibe: [2, 5, 3, 5, 4], tags: ["relax", "romantic", "nature", "work", "luxury"], instant: false,
    nearby: [["Tegallalang Rice Terrace", "nature", 4.5], ["Monkey Forest", "nature", 2], ["Ubud Market", "food", 1.8]] },

  { id: 4, title: "Whitewashed cave house with caldera sunsets", city: "Oia, Santorini", country: "Greece", lat: 36.4618, lng: 25.3753,
    kind: "Cave house", place: "entire", cats: ["views", "iconic", "trending"], price: 27900, rating: 4.96, reviews: 640,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 48, host: ["Eleni", 9, true],
    amen: ["wifi", "ac", "hottub", "balcony", "breakfast", "smoke"],
    eco: 55, wifi: 60, desk: false, vibe: [3, 4, 1, 4, 5], tags: ["romantic", "luxury", "relax", "beach"], instant: false,
    nearby: [["Oia Castle Sunset Point", "sight", 0.3], ["Amoudi Bay", "beach", 1.2], ["Ammoudi Fish Tavern", "food", 1.2]] },

  { id: 5, title: "Glass-walled modern home with lap pool", city: "Malibu, California", country: "United States", lat: 34.0259, lng: -118.7798,
    kind: "Home", place: "entire", cats: ["pools", "mansions", "beach"], price: 45000, rating: 4.91, reviews: 98,
    guests: 10, bedrooms: 5, beds: 6, baths: 5, hero: 13, host: ["Jordan", 5, true],
    amen: ["wifi", "kitchen", "pool", "ac", "parking", "workspace", "tv", "washer", "gym", "ev", "solar", "beach", "smoke", "firstaid"],
    eco: 88, wifi: 500, desk: true, vibe: [3, 4, 4, 4, 4], tags: ["luxury", "beach", "family", "work"], instant: true,
    nearby: [["Zuma Beach", "beach", 1.1], ["Malibu Pier", "sight", 6], ["Nobu Malibu", "food", 5.4]] },

  { id: 6, title: "Historic boathouse on an emerald alpine lake", city: "Lago di Braies", country: "Italy", lat: 46.6943, lng: 12.0857,
    kind: "Boathouse", place: "entire", cats: ["lake", "views", "trending", "cabins"], price: 18900, rating: 4.98, reviews: 156,
    guests: 3, bedrooms: 1, beds: 2, baths: 1, hero: 42, host: ["Matteo", 7, true],
    amen: ["wifi", "kitchen", "heating", "lake", "mountain", "fireplace", "smoke", "firstaid"],
    eco: 84, wifi: 35, desk: false, vibe: [1, 5, 3, 5, 3], tags: ["mountain", "lake", "romantic", "relax", "adventure"], instant: false,
    nearby: [["Lake loop trail", "nature", 0.1], ["Prato Piazza", "nature", 12], ["Dolomites cable car", "sight", 18]] },

  { id: 7, title: "Hand-built forest cabin near turquoise lakes", city: "Banff, Alberta", country: "Canada", lat: 51.1784, lng: -115.5708,
    kind: "Cabin", place: "entire", cats: ["cabins", "countryside"], price: 15200, rating: 4.87, reviews: 233,
    guests: 6, bedrooms: 3, beds: 4, baths: 2, hero: 19, host: ["Liam", 3, false],
    amen: ["wifi", "kitchen", "heating", "fireplace", "hottub", "parking", "pets", "bbq", "mountain", "smoke"],
    eco: 73, wifi: 75, desk: true, vibe: [1, 5, 5, 5, 2], tags: ["mountain", "adventure", "family", "nature"], instant: true,
    nearby: [["Lake Louise", "nature", 22], ["Banff Gondola", "sight", 4], ["Banff Avenue", "food", 3]] },

  { id: 8, title: "Overwater beach bungalow with private deck", city: "Maafushi", country: "Maldives", lat: 3.9418, lng: 73.4890,
    kind: "Bungalow", place: "entire", cats: ["beach", "tropical", "trending"], price: 38500, rating: 4.95, reviews: 420,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 14, host: ["Aisha", 6, true],
    amen: ["wifi", "ac", "beach", "breakfast", "balcony", "tv", "smoke", "firstaid"],
    eco: 66, wifi: 50, desk: false, vibe: [2, 5, 2, 5, 4], tags: ["beach", "romantic", "luxury", "relax"], instant: true,
    nearby: [["House reef snorkelling", "nature", 0.05], ["Sandbank picnic", "beach", 3], ["Island café", "food", 0.4]] },

  { id: 9, title: "Tea-estate treehouse above the clouds", city: "Munnar, Kerala", country: "India", lat: 10.0889, lng: 77.0595,
    kind: "Treehouse", place: "entire", cats: ["treehouse", "countryside", "views", "trending"], price: 7400, rating: 4.93, reviews: 289,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 20, host: ["Joseph", 5, true],
    amen: ["wifi", "breakfast", "garden", "mountain", "balcony", "solar", "firstaid"],
    eco: 95, wifi: 25, desk: false, vibe: [1, 5, 2, 5, 4], tags: ["nature", "romantic", "relax", "adventure", "budget"], instant: false,
    nearby: [["Kolukkumalai tea estate", "nature", 7], ["Eravikulam National Park", "nature", 15], ["Tea Museum", "sight", 3]] },

  { id: 10, title: "Lakeside heritage palace suite", city: "Udaipur, Rajasthan", country: "India", lat: 24.5764, lng: 73.6835,
    kind: "Palace suite", place: "hotel", cats: ["mansions", "lake", "iconic"], price: 21000, rating: 4.9, reviews: 377,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 39, host: ["Rajveer", 10, true],
    amen: ["wifi", "ac", "pool", "breakfast", "tv", "gym", "lake", "parking", "smoke", "firstaid"],
    eco: 58, wifi: 80, desk: true, vibe: [3, 4, 3, 3, 5], tags: ["luxury", "romantic", "culture", "lake"], instant: true,
    nearby: [["City Palace", "sight", 0.9], ["Lake Pichola boat ride", "sight", 0.2], ["Ambrai Ghat", "food", 1.1]] },

  { id: 11, title: "Minimalist loft near Shibuya crossing", city: "Tokyo", country: "Japan", lat: 35.6595, lng: 139.7005,
    kind: "Loft", place: "entire", cats: ["iconic", "work"], price: 9800, rating: 4.86, reviews: 512,
    guests: 3, bedrooms: 1, beds: 2, baths: 1, hero: 34, host: ["Haruto", 4, true],
    amen: ["wifi", "kitchen", "ac", "workspace", "washer", "tv", "heating", "smoke", "firstaid"],
    eco: 70, wifi: 900, desk: true, vibe: [5, 2, 2, 1, 5], tags: ["city", "work", "party", "culture"], instant: true,
    nearby: [["Shibuya Crossing", "sight", 0.5], ["Yoyogi Park", "nature", 1.6], ["Ichiran Ramen", "food", 0.3]] },

  { id: 12, title: "Sunlit Haussmann flat with Eiffel views", city: "Paris", country: "France", lat: 48.8566, lng: 2.2922,
    kind: "Apartment", place: "entire", cats: ["iconic", "views", "work"], price: 16800, rating: 4.88, reviews: 341,
    guests: 4, bedrooms: 2, beds: 2, baths: 1, hero: 3, host: ["Camille", 7, false],
    amen: ["wifi", "kitchen", "heating", "workspace", "washer", "tv", "balcony", "smoke"],
    eco: 67, wifi: 300, desk: true, vibe: [4, 3, 3, 2, 5], tags: ["city", "romantic", "culture", "work"], instant: false,
    nearby: [["Eiffel Tower", "sight", 0.8], ["Rue Cler market", "food", 0.5], ["Seine river cruise", "sight", 1]] },

  { id: 13, title: "Industrial Brooklyn loft with exposed brick", city: "Brooklyn, New York", country: "United States", lat: 40.7081, lng: -73.9571,
    kind: "Loft", place: "entire", cats: ["iconic", "work"], price: 19500, rating: 4.79, reviews: 268,
    guests: 4, bedrooms: 2, beds: 2, baths: 2, hero: 57, host: ["Miles", 3, true],
    amen: ["wifi", "kitchen", "ac", "heating", "workspace", "washer", "tv", "gym", "smoke", "firstaid"],
    eco: 61, wifi: 600, desk: true, vibe: [5, 2, 2, 1, 5], tags: ["city", "party", "work", "culture"], instant: true,
    nearby: [["Williamsburg Bridge", "sight", 0.9], ["Smorgasburg", "food", 1.2], ["Domino Park", "nature", 0.7]] },

  { id: 14, title: "Tiny red hut on the Icelandic moors", city: "Vík", country: "Iceland", lat: 63.4186, lng: -19.0060,
    kind: "Tiny home", place: "entire", cats: ["tiny", "countryside", "views"], price: 8900, rating: 4.92, reviews: 175,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 18, host: ["Sigrún", 5, true],
    amen: ["wifi", "heating", "kitchen", "parking", "mountain", "solar", "smoke"],
    eco: 92, wifi: 30, desk: false, vibe: [1, 5, 2, 5, 2], tags: ["nature", "adventure", "romantic", "budget"], instant: true,
    nearby: [["Reynisfjara black sand beach", "beach", 6], ["Skógafoss", "nature", 32], ["Northern lights spot", "nature", 0.2]] },

  { id: 15, title: "Cliff-edge chalet with bed-to-Alps view", city: "Interlaken", country: "Switzerland", lat: 46.6863, lng: 7.8632,
    kind: "Chalet", place: "entire", cats: ["views", "cabins", "trending"], price: 24600, rating: 4.99, reviews: 143,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 25, host: ["Lukas", 6, true],
    amen: ["wifi", "heating", "kitchen", "mountain", "balcony", "hottub", "solar", "smoke"],
    eco: 86, wifi: 100, desk: false, vibe: [1, 5, 2, 5, 3], tags: ["mountain", "romantic", "adventure", "luxury"], instant: false,
    nearby: [["Harder Kulm", "sight", 2.4], ["Paragliding launch", "nature", 3], ["Lake Brienz", "nature", 4]] },

  { id: 16, title: "Infinity-pool resort studio facing the Andaman Sea", city: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923,
    kind: "Resort studio", place: "hotel", cats: ["pools", "tropical", "beach"], price: 8200, rating: 4.84, reviews: 702,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 24, host: ["Niran", 8, true],
    amen: ["wifi", "pool", "ac", "breakfast", "gym", "tv", "beach", "smoke", "firstaid"],
    eco: 52, wifi: 70, desk: false, vibe: [4, 3, 3, 4, 5], tags: ["beach", "party", "relax", "budget"], instant: true,
    nearby: [["Kata Noi Beach", "beach", 0.6], ["Big Buddha", "sight", 7], ["Patong night market", "food", 12]] },

  { id: 17, title: "Architect's home under Table Mountain", city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241,
    kind: "Home", place: "entire", cats: ["mansions", "views", "work"], price: 13400, rating: 4.9, reviews: 121,
    guests: 6, bedrooms: 3, beds: 3, baths: 3, hero: 12, host: ["Thandi", 4, true],
    amen: ["wifi", "kitchen", "pool", "parking", "workspace", "washer", "tv", "solar", "ev", "garden", "bbq", "smoke"],
    eco: 90, wifi: 200, desk: true, vibe: [3, 4, 4, 4, 4], tags: ["work", "family", "adventure", "luxury"], instant: true,
    nearby: [["Table Mountain cableway", "sight", 3], ["V&A Waterfront", "food", 5], ["Camps Bay", "beach", 6]] },

  { id: 18, title: "Red-roof farmhouse in the fjord villages", city: "Lofoten", country: "Norway", lat: 68.2342, lng: 13.6214,
    kind: "Farmhouse", place: "entire", cats: ["countryside", "views"], price: 12700, rating: 4.85, reviews: 88,
    guests: 6, bedrooms: 3, beds: 4, baths: 2, hero: 37, host: ["Ingrid", 2, false],
    amen: ["wifi", "kitchen", "heating", "fireplace", "parking", "washer", "garden", "pets", "smoke"],
    eco: 83, wifi: 45, desk: true, vibe: [1, 5, 5, 5, 3], tags: ["nature", "family", "adventure"], instant: false,
    nearby: [["Reine viewpoint", "sight", 4], ["Kayak rental", "nature", 1], ["Fish market", "food", 2]] },

  { id: 19, title: "Colonial coffee-estate bungalow", city: "Coorg, Karnataka", country: "India", lat: 12.3375, lng: 75.8069,
    kind: "Bungalow", place: "entire", cats: ["countryside", "trending"], price: 8600, rating: 4.88, reviews: 254,
    guests: 8, bedrooms: 4, beds: 4, baths: 3, hero: 10, host: ["Kavya", 6, true],
    amen: ["wifi", "kitchen", "parking", "garden", "breakfast", "bbq", "pets", "workspace", "smoke", "firstaid"],
    eco: 87, wifi: 60, desk: true, vibe: [1, 5, 5, 5, 4], tags: ["family", "nature", "relax", "work", "budget"], instant: true,
    nearby: [["Abbey Falls", "nature", 9], ["Raja's Seat", "sight", 7], ["Plantation walk", "nature", 0.1]] },

  { id: 20, title: "A-frame hideaway above the Ganges valley", city: "Rishikesh, Uttarakhand", country: "India", lat: 30.0869, lng: 78.2676,
    kind: "A-frame", place: "entire", cats: ["cabins", "views", "tiny"], price: 4900, rating: 4.82, reviews: 166,
    guests: 3, bedrooms: 1, beds: 2, baths: 1, hero: 17, host: ["Arjun", 3, false],
    amen: ["wifi", "kitchen", "mountain", "balcony", "solar", "parking", "smoke"],
    eco: 89, wifi: 55, desk: true, vibe: [2, 5, 3, 5, 3], tags: ["adventure", "mountain", "relax", "budget", "work"], instant: true,
    nearby: [["Laxman Jhula", "sight", 4], ["River rafting point", "nature", 8], ["Beatles Ashram", "sight", 5]] },

  { id: 21, title: "Sky-high glass villa with private pool", city: "Dubai", country: "United Arab Emirates", lat: 25.1124, lng: 55.1390,
    kind: "Villa", place: "entire", cats: ["mansions", "pools", "iconic"], price: 42000, rating: 4.83, reviews: 77,
    guests: 10, bedrooms: 5, beds: 6, baths: 6, hero: 8, host: ["Omar", 5, true],
    amen: ["wifi", "kitchen", "pool", "ac", "parking", "gym", "tv", "washer", "ev", "beach", "smoke", "firstaid"],
    eco: 41, wifi: 400, desk: true, vibe: [5, 3, 4, 2, 5], tags: ["luxury", "party", "family", "city"], instant: true,
    nearby: [["Palm Jumeirah", "sight", 2], ["Dubai Marina walk", "food", 3], ["Burj Khalifa", "sight", 24]] },

  { id: 22, title: "Pine-shaded cottage with a private dock", city: "Lake Tahoe, California", country: "United States", lat: 39.0968, lng: -120.0324,
    kind: "Cottage", place: "entire", cats: ["lake", "cabins", "countryside"], price: 17600, rating: 4.9, reviews: 190,
    guests: 6, bedrooms: 3, beds: 3, baths: 2, hero: 44, host: ["Ava", 5, true],
    amen: ["wifi", "kitchen", "heating", "fireplace", "lake", "hottub", "parking", "bbq", "pets", "workspace", "smoke"],
    eco: 76, wifi: 150, desk: true, vibe: [2, 5, 5, 5, 3], tags: ["lake", "family", "relax", "adventure", "work"], instant: false,
    nearby: [["Emerald Bay", "nature", 9], ["Heavenly ski resort", "sight", 14], ["Lakeside beach", "beach", 0.1]] },

  { id: 23, title: "Cycladic cube house by the windmills", city: "Mykonos", country: "Greece", lat: 37.4467, lng: 25.3289,
    kind: "Home", place: "entire", cats: ["beach", "iconic", "views"], price: 23400, rating: 4.86, reviews: 214,
    guests: 5, bedrooms: 2, beds: 3, baths: 2, hero: 38, host: ["Nikos", 6, false],
    amen: ["wifi", "kitchen", "ac", "balcony", "beach", "washer", "smoke"],
    eco: 64, wifi: 90, desk: false, vibe: [5, 2, 2, 3, 5], tags: ["party", "beach", "romantic", "culture"], instant: true,
    nearby: [["Little Venice", "sight", 0.6], ["Paradise Beach", "beach", 6], ["Kato Mili windmills", "sight", 0.4]] },

  { id: 24, title: "Royal haveli with courtyard pool", city: "Jaipur, Rajasthan", country: "India", lat: 26.9124, lng: 75.7873,
    kind: "Haveli", place: "private", cats: ["mansions", "pools", "iconic"], price: 9600, rating: 4.91, reviews: 330,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 49, host: ["Meera", 7, true],
    amen: ["wifi", "pool", "ac", "breakfast", "tv", "parking", "garden", "smoke", "firstaid"],
    eco: 60, wifi: 70, desk: false, vibe: [3, 4, 3, 2, 5], tags: ["culture", "luxury", "romantic", "city"], instant: true,
    nearby: [["Hawa Mahal", "sight", 2], ["Amber Fort", "sight", 11], ["Johari Bazaar", "food", 2.2]] },

  { id: 25, title: "Cozy family home in Forest Hills", city: "Queens, New York", country: "United States", lat: 40.7181, lng: -73.8448,
    kind: "Townhouse", place: "private", cats: ["iconic", "work"], price: 7200, rating: 4.95, reviews: 616,
    guests: 2, bedrooms: 1, beds: 1, baths: 1, hero: 40, host: ["May", 12, true],
    amen: ["wifi", "kitchen", "heating", "ac", "workspace", "washer", "tv", "breakfast", "smoke", "firstaid"],
    eco: 72, wifi: 300, desk: true, vibe: [3, 4, 5, 2, 4], tags: ["city", "family", "work", "budget"], instant: true,
    nearby: [["Forest Park", "nature", 0.6], ["Midtown High (famous alumni)", "sight", 0.9], ["Delmar's Deli", "food", 0.3]] },

  { id: 26, title: "Gaudí-inspired townhouse in Gràcia", city: "Barcelona", country: "Spain", lat: 41.4036, lng: 2.1744,
    kind: "Townhouse", place: "entire", cats: ["iconic", "work"], price: 14900, rating: 4.81, reviews: 259,
    guests: 6, bedrooms: 3, beds: 3, baths: 2, hero: 36, host: ["Lucía", 5, false],
    amen: ["wifi", "kitchen", "ac", "workspace", "washer", "tv", "balcony", "ev", "smoke"],
    eco: 74, wifi: 600, desk: true, vibe: [5, 3, 3, 2, 5], tags: ["city", "party", "culture", "work", "family"], instant: true,
    nearby: [["Sagrada Família", "sight", 1.4], ["Park Güell", "nature", 1.1], ["Mercat de la Llibertat", "food", 0.4]] },

  { id: 27, title: "Misty hill cottage among eucalyptus", city: "Ooty, Tamil Nadu", country: "India", lat: 11.4102, lng: 76.6950,
    kind: "Cottage", place: "entire", cats: ["cabins", "countryside", "views"], price: 5600, rating: 4.8, reviews: 140,
    guests: 5, bedrooms: 2, beds: 3, baths: 2, hero: 9, host: ["Priya", 4, true],
    amen: ["wifi", "kitchen", "heating", "fireplace", "parking", "garden", "mountain", "pets", "smoke"],
    eco: 80, wifi: 40, desk: true, vibe: [1, 5, 5, 5, 3], tags: ["mountain", "family", "relax", "budget"], instant: true,
    nearby: [["Nilgiri toy train", "sight", 3], ["Ooty Lake", "nature", 2.5], ["Botanical Garden", "nature", 3.1]] },

  { id: 28, title: "Harbourside villa with saltwater pool", city: "Sydney", country: "Australia", lat: -33.8568, lng: 151.2153,
    kind: "Villa", place: "entire", cats: ["pools", "iconic", "beach"], price: 31800, rating: 4.92, reviews: 104,
    guests: 8, bedrooms: 4, beds: 4, baths: 3, hero: 11, host: ["Chloe", 6, true],
    amen: ["wifi", "kitchen", "pool", "ac", "parking", "workspace", "tv", "washer", "solar", "bbq", "beach", "smoke", "firstaid"],
    eco: 85, wifi: 250, desk: true, vibe: [4, 3, 5, 3, 5], tags: ["luxury", "family", "beach", "city"], instant: false,
    nearby: [["Sydney Opera House", "sight", 2], ["Bondi to Coogee walk", "nature", 8], ["The Rocks markets", "food", 1.6]] },

  { id: 29, title: "Shared bunk in a backpackers' beach hostel", city: "Varkala, Kerala", country: "India", lat: 8.7379, lng: 76.7163,
    kind: "Hostel bunk", place: "shared", cats: ["beach", "tropical"], price: 1200, rating: 4.7, reviews: 890,
    guests: 1, bedrooms: 1, beds: 1, baths: 1, hero: 46, host: ["Rahul", 3, false],
    amen: ["wifi", "ac", "breakfast", "beach", "workspace", "smoke", "firstaid"],
    eco: 77, wifi: 80, desk: true, vibe: [5, 2, 1, 4, 4], tags: ["beach", "party", "budget", "adventure"], instant: true,
    nearby: [["Varkala Cliff", "sight", 0.3], ["Papanasam Beach", "beach", 0.5], ["Cliff-top cafés", "food", 0.2]] },

  { id: 30, title: "Desert-edge infinity pool retreat", city: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811,
    kind: "Riad", place: "entire", cats: ["pools", "views", "mansions"], price: 19900, rating: 4.89, reviews: 182,
    guests: 6, bedrooms: 3, beds: 3, baths: 3, hero: 59, host: ["Youssef", 8, true],
    amen: ["wifi", "pool", "ac", "breakfast", "garden", "mountain", "parking", "solar", "smoke"],
    eco: 79, wifi: 50, desk: false, vibe: [2, 5, 4, 4, 5], tags: ["relax", "luxury", "culture", "romantic"], instant: true,
    nearby: [["Jemaa el-Fnaa", "food", 9], ["Atlas Mountains trek", "nature", 30], ["Majorelle Garden", "nature", 10]] }
];

const HOST_BIOS = [
  "I love meeting travellers from all over Earth-1610 and sharing my favourite local spots.",
  "Designer by day, host by heart. Every corner of this place was put together by hand.",
  "Born and raised here — ask me anything about the best food within walking distance.",
  "Retired teacher who now spends her days gardening and welcoming guests.",
  "Outdoor junkie. Happy to lend you hiking maps, kayaks or a good book."
];

const REVIEW_TEXTS = [
  "Absolutely stunning place — even better than the photos. Check-in was seamless.",
  "Spotless, comfortable and the host's recommendations were spot on. Would book again!",
  "The view alone is worth the trip. Woke up to sunrise every morning.",
  "Great location, quiet nights and super fast responses from the host.",
  "Perfect for our family. Kids loved it and the kitchen had everything we needed.",
  "Cozy, stylish and very well thought out. Small touches made a big difference.",
  "Worked remotely for a week here — Wi-Fi was rock solid and the desk was ideal.",
  "A little hard to find at night but the host guided us by phone. Lovely stay.",
  "Felt like home. Beds were incredibly comfortable and the shower was amazing.",
  "Our anniversary trip was magical thanks to this place. Highly recommend."
];

const GUEST_NAMES = ["Rohan", "Sara", "Ethan", "Fatima", "Kenji", "Isabella", "Vikram", "Noah", "Zara", "Diego",
  "Aditi", "Gwen", "Leo", "Mira", "Samuel", "Nina", "Kabir", "Olivia", "Ravi", "Emma"];

/* Expand compact rows into full listing objects */
function buildListing(r) {
  const rnd = seeded(r.id * 97);
  const gallery = [r.hero];
  while (gallery.length < 5) {
    const pick = INTERIOR_POOL[Math.floor(rnd() * INTERIOR_POOL.length)];
    if (!gallery.includes(pick)) gallery.push(pick);
  }
  const vibeKeys = ["nightlife", "calm", "family", "nature", "food"];
  const vibe = {};
  vibeKeys.forEach((k, i) => (vibe[k] = r.vibe[i]));

  const reviewList = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(rnd() * 300) - 5);
    return {
      name: GUEST_NAMES[(r.id * 3 + i * 7) % GUEST_NAMES.length],
      date: d.toISOString(),
      rating: rnd() > 0.15 ? 5 : 4,
      text: REVIEW_TEXTS[(r.id + i * 3) % REVIEW_TEXTS.length]
    };
  });

  const sub = n => Math.min(5, Math.max(4.4, r.rating + (rnd() - 0.5) * 0.3)).toFixed(1);

  return {
    id: r.id,
    title: r.title,
    city: r.city,
    country: r.country,
    location: `${r.city}, ${r.country}`,
    lat: r.lat, lng: r.lng,
    kind: r.kind,
    place: r.place,
    categories: r.cats,
    price: r.price,
    rating: r.rating,
    reviewCount: r.reviews,
    guests: r.guests, bedrooms: r.bedrooms, beds: r.beds, baths: r.baths,
    images: gallery,
    host: { name: r.host[0], years: r.host[1], superhost: r.host[2], bio: HOST_BIOS[r.id % HOST_BIOS.length], responseRate: 95 + (r.id % 5) },
    amenities: r.amen,
    eco: r.eco,
    wifi: r.wifi,
    desk: r.desk,
    vibe,
    tags: r.tags,
    instant: r.instant,
    nearby: r.nearby.map(([name, type, km]) => ({ name, type, km })),
    reviews: reviewList,
    subRatings: { Cleanliness: sub(), Accuracy: sub(), "Check-in": sub(), Communication: sub(), Location: sub(), Value: sub() },
    cleaningFee: Math.round(r.price * 0.12 / 50) * 50,
    description: `Welcome to our ${r.kind.toLowerCase()} in ${r.city}. ${r.title} — a calm, thoughtfully designed space for up to ${r.guests} guest${r.guests > 1 ? "s" : ""}. ` +
      `Wake up to natural light, unwind after a day of exploring, and enjoy everything the neighbourhood has to offer. ` +
      `The home is professionally cleaned between every stay and stocked with essentials so you can just arrive and relax.`
  };
}

/** Tiny deterministic PRNG so generated data is stable between reloads */
function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next(); next(); // warm up: the first outputs of small seeds are nearly identical
  return next;
}

/** Integer hash → [0, 1). Good spread even for neighbouring inputs (used for daily prices). */
function hash01(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}

const BASE_LISTINGS = RAW_LISTINGS.map(buildListing);
