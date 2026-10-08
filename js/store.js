/* =========================================================
   store.js — app statef persisted to localStorage
   ========================================================= */

const Store = (() => {
  const KEY = "stayverse1610";
  const defaults = {
    user: null,                 // { name, email, joined }
    wishlist: [],               // listing ids
    bookings: [],               // { id, listingId, checkIn, checkOut, guests, total, createdAt, split }
    compare: [],                // listing ids (max 3) — NEW FEATURE
    recent: [],                 // recently viewed listing ids — NEW FEATURE
    hosted: [],                 // listings created via "Airbnb your home"
    packing: {},                // bookingId -> { item: checked } — NEW FEATURE
    points: 0,                  // travel rewards — NEW FEATURE
    theme: "light",             // dark mode — NEW FEATURE
    showTotal: false            // "display total before taxes" toggle
  };

  let state;
  try {
    state = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {
    state = { ...defaults };
  }

  const listeners = [];
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
    listeners.forEach(fn => fn(state));
  }

  return {
    get: k => state[k],
    set(k, v) { state[k] = v; save(); },
    update(k, fn) { state[k] = fn(state[k]); save(); },
    subscribe: fn => listeners.push(fn),
    reset() { state = { ...defaults, theme: state.theme }; save(); }
  };
})();

/** All listings = built-in demo data + listings the user created as a host */
function allListings() {
  return BASE_LISTINGS.concat(Store.get("hosted"));
}
function getListing(id) {
  return allListings().find(l => l.id === Number(id));
}
