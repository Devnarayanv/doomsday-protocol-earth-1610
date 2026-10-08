/* =========================================================
   app.js — global state, header (search bar, categories,
   filters, user menu), login, theme and the hash router
   ========================================================= */

const App = {
  search: { where: "", checkIn: null, checkOut: null, guests: { adults: 0, children: 0, infants: 0, pets: 0 } },
  cat: "",
  filters: JSON.parse(JSON.stringify(DEFAULT_FILTERS)),
  mapMode: false
};

const REGIONS = [
  { label: "I'm flexible", countries: [], img: 45 },
  { label: "India", countries: ["India"], img: 49 },
  { label: "Europe", countries: ["Greece", "Italy", "France", "Iceland", "Switzerland", "Norway", "Spain"], img: 42 },
  { label: "United States", countries: ["United States"], img: 44 },
  { label: "Southeast Asia", countries: ["Indonesia", "Thailand", "Maldives"], img: 1 },
  { label: "Middle East & Africa", countries: ["United Arab Emirates", "South Africa", "Morocco"], img: 59 }
];

/* =========================================================
   SEARCH BAR
   ========================================================= */
const sbPanel = () => $("#sb-panel");
let panelOpen = null;

function openPanel(kind) {
  const panel = sbPanel();
  panelOpen = kind;
  $("#search-bar").classList.add("active");
  $$(".sb-field").forEach(f => f.classList.toggle("focus", f.dataset.panel === kind));
  panel.className = `sb-panel open ${kind}`;

  if (kind === "where") renderWherePanel();
  if (kind === "dates") {
    panel.innerHTML = `<div id="sb-cal"></div>`;
    DatePicker($("#sb-cal"), {
      start: App.search.checkIn, end: App.search.checkOut,
      onChange(a, b) {
        App.search.checkIn = a; App.search.checkOut = b;
        syncSearchUI();
        if (a && b) setTimeout(() => openPanel("who"), 250);
      }
    });
  }
  if (kind === "who") {
    panel.innerHTML = `<div id="sb-guests-picker"></div>`;
    GuestPicker($("#sb-guests-picker"), App.search.guests, g => { App.search.guests = g; syncSearchUI(); });
  }
}

function renderWherePanel() {
  const q = $("#sb-where-input").value.trim().toLowerCase();
  const panel = sbPanel();
  if (!q) {
    panel.innerHTML = `<b>Search by region</b>
      <div class="region-grid">${REGIONS.map(r => `<button type="button" class="region" data-region="${esc(r.label)}">
        <div class="tile"><img src="${photo(r.img, 240)}" alt=""></div>${esc(r.label)}</button>`).join("")}</div>
      <p class="muted small" style="margin-top:18px"><i class="fa-solid fa-microphone" style="color:var(--brand)"></i> Tip: tap the mic and say “beach stays in Goa” <span class="new-pill">NEW</span></p>`;
    $$("[data-region]", panel).forEach(b => b.onclick = e => {
      e.stopPropagation();
      const label = b.dataset.region;
      $("#sb-where-input").value = label === "I'm flexible" ? "" : label;
      App.search.where = $("#sb-where-input").value;
      openPanel("dates");
    });
    return;
  }
  const seen = new Set();
  const matches = allListings().filter(l => `${l.city} ${l.country}`.toLowerCase().includes(q))
    .filter(l => !seen.has(l.location) && seen.add(l.location)).slice(0, 6);
  panel.innerHTML = matches.length ? matches.map(l => `
      <button type="button" class="suggest" data-place="${esc(l.city.split(",")[0])}">
        <span class="ic"><i class="fa-solid fa-location-dot"></i></span><span>${esc(l.location)}</span></button>`).join("")
    : `<p class="muted">No destinations match “${esc(q)}” yet — press Search to look through listing titles.</p>`;
  $$("[data-place]", panel).forEach(b => b.onclick = e => {
    e.stopPropagation();
    $("#sb-where-input").value = b.dataset.place;
    App.search.where = b.dataset.place;
    openPanel("dates");
  });
}

function closePanel() {
  panelOpen = null;
  sbPanel().className = "sb-panel";
  $("#search-bar").classList.remove("active");
  $$(".sb-field").forEach(f => f.classList.remove("focus"));
}

function syncSearchUI() {
  const s = App.search;
  $("#sb-where-input").value = s.where;
  const ci = $("#sb-checkin"), co = $("#sb-checkout"), gu = $("#sb-guests");
  ci.textContent = s.checkIn ? fmtShort(s.checkIn) : "Add dates";
  co.textContent = s.checkOut ? fmtShort(s.checkOut) : "Add dates";
  gu.textContent = guestLabel(s.guests) || "Add guests";
  ci.classList.toggle("set", !!s.checkIn);
  co.classList.toggle("set", !!s.checkOut);
  gu.classList.toggle("set", !!guestLabel(s.guests));
  $("#pill-where").textContent = s.where || "Start your search";
  $("#pill-sub").textContent = `${s.checkIn ? fmtRange(s.checkIn, s.checkOut) : "Any week"} · ${guestLabel(s.guests) || "Add guests"}`;
}

function submitSearch() {
  App.search.where = $("#sb-where-input").value.trim();
  closePanel();
  $("#search-wrap").classList.remove("mobile-open");
  $(".mobile-search-close")?.remove();
  if (parseHash().path !== "/") location.hash = "#/";
  else renderHome();
  window.scrollTo({ top: 0 });
}

function initSearchBar() {
  const bar = $("#search-bar");
  $$(".sb-field", bar).forEach(f => f.addEventListener("click", e => {
    if (e.target.closest(".sb-submit") || e.target.closest(".mic-btn")) return;
    openPanel(f.dataset.panel);
    if (f.dataset.panel === "where") $("#sb-where-input").focus();
  }));
  $("#sb-where-input").addEventListener("input", () => { if (panelOpen !== "where") openPanel("where"); else renderWherePanel(); });
  bar.addEventListener("submit", e => { e.preventDefault(); submitSearch(); });
  document.addEventListener("click", e => {
    if (panelOpen && !e.target.closest("#search-bar")) closePanel();
    if (!e.target.closest(".user-menu-wrap")) $("#user-dropdown").classList.remove("open");
  });

  // Voice search (NEW)
  $("#mic-btn").addEventListener("click", e => {
    e.stopPropagation();
    startVoiceSearch(text => {
      const { where, cat } = parseVoice(text);
      $("#sb-where-input").value = where;
      if (cat) { App.cat = cat; renderCategories(); }
      toast(`Heard: “${esc(text)}”`, "fa-microphone");
      submitSearch();
    });
  });

  // compact pill: desktop expands the bar, mobile opens a full-screen search
  $("#search-pill").addEventListener("click", e => {
    e.stopPropagation();
    const header = $("#site-header");
    if (window.innerWidth > 950) {
      header.classList.remove("compact");
      window.scrollTo({ top: 0 });
      setTimeout(() => openPanel("where"), 50);
      return;
    }
    $("#search-wrap").classList.add("mobile-open");
    const close = document.createElement("button");
    close.className = "icon-btn mobile-search-close";
    close.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    close.setAttribute("aria-label", "Close search");
    close.onclick = () => { $("#search-wrap").classList.remove("mobile-open"); close.remove(); closePanel(); };
    document.body.appendChild(close);
    openPanel("where");
  });
}

/* =========================================================
   CATEGORIES
   ========================================================= */
function renderCategories() {
  const box = $("#categories");
  box.innerHTML = CATEGORIES.map(c => `
    <button class="cat ${App.cat === c.key ? "active" : ""}" data-cat="${c.key}" title="${c.isNew ? "New in this clone" : ""}">
      <i class="fa-solid ${c.icon}"></i>${c.label}${c.isNew ? `<span class="new-dot"></span>` : ""}</button>`).join("");
  $$(".cat", box).forEach(b => b.onclick = () => {
    App.cat = App.cat === b.dataset.cat ? "" : b.dataset.cat;
    renderCategories();
    if (parseHash().path !== "/") location.hash = "#/"; else renderHome();
  });
}
function initCategories() {
  renderCategories();
  const box = $("#categories");
  $(".cat-scroll.left").onclick = () => box.scrollBy({ left: -400 });
  $(".cat-scroll.right").onclick = () => box.scrollBy({ left: 400 });
  $("#filter-btn").onclick = openFilters;
  const tt = $("#total-toggle");
  tt.checked = Store.get("showTotal");
  tt.onchange = () => { Store.set("showTotal", tt.checked); if (parseHash().path === "/") renderHome(); };
}

/* =========================================================
   FILTERS MODAL
   ========================================================= */
function updateFilterCount() {
  const n = activeFilterCount(App.filters);
  $("#filter-count").textContent = n || "";
}

function openFilters() {
  const f = JSON.parse(JSON.stringify(App.filters));
  const prices = allListings().map(l => l.price);
  const bins = Array.from({ length: 30 }, (_, i) => prices.filter(p => p >= i * 1700 && p < (i + 1) * 1700).length);
  const maxBin = Math.max(...bins);

  const m = openModal(`
    <div class="modal-head">Filters</div>
    <div id="filter-body"></div>
    <div class="modal-foot"><button class="link-btn" id="f-clear">Clear all</button><button class="btn btn-dark" id="f-apply"></button></div>`, { wide: true });

  function count() {
    const saved = App.filters;
    App.filters = f;
    const n = filterListings().length;
    App.filters = saved;
    $("#f-apply", m).textContent = n ? `Show ${n} place${n > 1 ? "s" : ""}` : "No exact matches";
  }

  function render() {
    const counter = (k, label) => `
      <div class="counter-row"><span>${label}</span><div class="stepper">
        <button class="step" data-k="${k}" data-d="-1" ${f[k] <= 0 ? "disabled" : ""}>−</button>
        <span>${f[k] || "Any"}</span>
        <button class="step" data-k="${k}" data-d="1">+</button></div></div>`;
    $("#filter-body", m).innerHTML = `
      <div class="filter-section"><h3>Type of place</h3><p class="muted small">Search rooms, entire homes, or any type of place</p>
        <div class="seg">${[["any", "Any type"], ["entire", "Entire home"], ["private", "Room"], ["shared", "Shared"], ["hotel", "Hotel"]].map(([v, t]) =>
          `<button type="button" data-place="${v}" class="${f.place === v ? "on" : ""}">${t}</button>`).join("")}</div></div>

      <div class="filter-section"><h3>Price range</h3><p class="muted small">Nightly prices before fees and taxes</p>
        <div class="histogram">${bins.map((b, i) => `<i class="${i * 1700 >= f.minPrice && i * 1700 <= f.maxPrice ? "in" : ""}" style="height:${maxBin ? (b / maxBin) * 100 : 0}%"></i>`).join("")}</div>
        <div class="range-dual"><div class="rail"></div>
          <input type="range" min="0" max="50000" step="500" value="${f.minPrice}" id="f-min" aria-label="Minimum price">
          <input type="range" min="0" max="50000" step="500" value="${f.maxPrice}" id="f-max" aria-label="Maximum price"></div>
        <div class="price-inputs"><label><small>Minimum</small><b>${inr(f.minPrice)}</b></label><label><small>Maximum</small><b>${inr(f.maxPrice)}${f.maxPrice >= 50000 ? "+" : ""}</b></label></div></div>

      <div class="filter-section"><h3>Rooms and beds</h3>
        ${counter("bedrooms", "Bedrooms")}${counter("beds", "Beds")}${counter("baths", "Bathrooms")}</div>

      <div class="filter-section"><h3>Amenities</h3>
        <div class="check-grid" style="margin-top:12px">${["wifi", "kitchen", "pool", "ac", "parking", "workspace", "hottub", "fireplace", "washer", "gym", "beach", "pets", "ev", "solar"].map(a =>
          `<label class="check"><input type="checkbox" data-amen="${a}" ${f.amenities.includes(a) ? "checked" : ""}> ${AMENITIES[a].label}</label>`).join("")}</div></div>

      <div class="filter-section"><h3>Booking options</h3>
        ${[["instant", "Instant Book", "Listings you can book without waiting for host approval"], ["superhost", "Superhost", "Stay with recognised hosts"], ["favourite", "Guest favourite", "The most loved homes on Airbnb"]].map(([k, t, d]) => `
          <div class="counter-row"><div><b>${t}</b><p class="muted small">${d}</p></div>
            <label class="switch-row"><input type="checkbox" data-bool="${k}" ${f[k] ? "checked" : ""}><span class="switch"></span></label></div>`).join("")}</div>

      <div class="filter-section"><h3>Sustainability & remote work <span class="new-pill">NEW</span></h3>
        <div class="counter-row"><div><b>Minimum Eco Score: ${f.minEco || "Any"}</b><p class="muted small">Solar power, EV charging, gardens and more</p></div></div>
        <input type="range" class="slider" min="0" max="95" step="5" value="${f.minEco}" id="f-eco" aria-label="Minimum eco score">
        <div class="counter-row" style="margin-top:12px"><div><b>Minimum Wi-Fi speed: ${f.minWifi ? f.minWifi + " Mbps" : "Any"}</b><p class="muted small">Measured speed reported by hosts</p></div></div>
        <div class="seg">${[0, 25, 50, 100, 300].map(v => `<button type="button" data-wifi="${v}" class="${f.minWifi === v ? "on" : ""}">${v ? v + "+" : "Any"}</button>`).join("")}</div>
      </div>`;

    const body = $("#filter-body", m);
    $$("[data-place]", body).forEach(b => b.onclick = () => { f.place = b.dataset.place; render(); });
    $$(".step", body).forEach(b => b.onclick = () => { const k = b.dataset.k; f[k] = Math.max(0, f[k] + Number(b.dataset.d)); render(); });
    $$("[data-amen]", body).forEach(c => c.onchange = () => {
      f.amenities = c.checked ? [...f.amenities, c.dataset.amen] : f.amenities.filter(a => a !== c.dataset.amen); count();
    });
    $$("[data-bool]", body).forEach(c => c.onchange = () => { f[c.dataset.bool] = c.checked; count(); });
    $$("[data-wifi]", body).forEach(b => b.onclick = () => { f.minWifi = Number(b.dataset.wifi); render(); });
    const min = $("#f-min", body), max = $("#f-max", body);
    min.oninput = () => { f.minPrice = Math.min(Number(min.value), f.maxPrice - 500); };
    max.oninput = () => { f.maxPrice = Math.max(Number(max.value), f.minPrice + 500); };
    min.onchange = max.onchange = render;
    $("#f-eco", body).onchange = e => { f.minEco = Number(e.target.value); render(); };
    count();
  }
  render();

  $("#f-clear", m).onclick = () => { Object.assign(f, JSON.parse(JSON.stringify(DEFAULT_FILTERS))); render(); };
  $("#f-apply", m).onclick = () => {
    App.filters = f;
    closeModal(); updateFilterCount();
    if (parseHash().path !== "/") location.hash = "#/"; else renderHome();
  };
}

/* =========================================================
   USER MENU / LOGIN / THEME
   ========================================================= */
function renderHeaderUser() {
  const user = Store.get("user");
  $("#user-avatar").innerHTML = user ? avatar(user.name, 30) : `<i class="fa-solid fa-circle-user fa-2x"></i>`;
  const dd = $("#user-dropdown");
  dd.innerHTML = user ? `
      <a href="#/trips" class="bold">Trips</a>
      <a href="#/wishlists" class="bold">Wishlists</a>
      <a href="#/compare" class="bold">Compare <span class="new-pill">NEW</span></a>
      <hr>
      <a href="#/match"><i class="fa-solid fa-wand-magic-sparkles"></i> Smart Stay Match</a>
      <a href="#/account"><i class="fa-solid fa-star"></i> Profile & rewards (${Store.get("points").toLocaleString("en-IN")} pts)</a>
      <a href="#/host">Airbnb your home</a>
      <hr>
      <a href="#/help">Help & about</a>
      <button id="dd-logout">Log out</button>` : `
      <button class="bold" id="dd-signup">Sign up</button>
      <button id="dd-login">Log in</button>
      <hr>
      <a href="#/match"><i class="fa-solid fa-wand-magic-sparkles"></i> Smart Stay Match</a>
      <a href="#/compare">Compare stays</a>
      <a href="#/host">Airbnb your home</a>
      <a href="#/help">Help & about</a>`;
  $$("a", dd).forEach(a => a.addEventListener("click", () => dd.classList.remove("open")));
  const lo = $("#dd-logout", dd); if (lo) lo.onclick = logout;
  const li = $("#dd-login", dd); if (li) li.onclick = () => { dd.classList.remove("open"); openLogin(); };
  const su = $("#dd-signup", dd); if (su) su.onclick = () => { dd.classList.remove("open"); openLogin(); };
}

function openLogin(after) {
  const m = openModal(`
    <div class="modal-head">Log in or sign up</div>
    <h2 style="margin-bottom:6px">Welcome to Airbnb</h2>
    <p class="muted small" style="margin-bottom:20px">Earth-1610 Edition — demo accounts live only in this browser.</p>
    <form id="login-form">
      <label class="field"><span>Full name</span><input name="name" required minlength="2" placeholder="e.g. Peter Parker" autocomplete="name"></label>
      <label class="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label>
      <button class="btn btn-brand btn-block" style="margin-top:6px">Continue</button>
    </form>
    <p class="muted small" style="margin-top:16px;text-align:center">No password needed — this is a demo with no real accounts.</p>`);
  $("#login-form", m).onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    Store.set("user", { name: fd.get("name").trim(), email: fd.get("email").trim(), joined: new Date().toISOString() });
    closeModal();
    renderHeaderUser();
    toast(`Welcome, ${esc(fd.get("name").trim().split(" ")[0])}!`, "fa-hand");
    after && after();
  };
}

function requireLogin(fn) {
  if (Store.get("user")) fn();
  else openLogin(fn);
}

function logout() {
  Store.set("user", null);
  renderHeaderUser();
  $("#user-dropdown").classList.remove("open");
  toast("You've been logged out", "fa-arrow-right-from-bracket");
  location.hash = "#/";
}

function setTheme(t) {
  Store.set("theme", t);
  document.documentElement.dataset.theme = t;
  $("#theme-btn").innerHTML = `<i class="fa-solid fa-${t === "dark" ? "sun" : "moon"}"></i>`;
}

/* =========================================================
   ROUTER
   ========================================================= */
const routes = {
  "": () => renderHome(),
  rooms: (p, q) => renderRoom(p[1], q),
  book: (p, q) => renderBook(p[1], q),
  trips: () => renderTrips(),
  wishlists: () => renderWishlists(),
  compare: () => renderCompare(),
  match: () => renderMatch(),
  host: () => renderHost(),
  account: () => renderAccount(),
  help: () => renderHelp()
};

function router() {
  const { parts, query } = parseHash();
  const key = parts[0] || "";
  closeModal();
  closePanel();
  const isHome = key === "";
  $("#cat-row").classList.toggle("hidden", !isHome);
  $("#search-wrap").classList.toggle("hidden", key === "book");
  $$("#bottom-nav a").forEach(a => a.classList.toggle("on", (a.dataset.nav === "home" && isHome) || a.dataset.nav === key));
  (routes[key] || renderNotFound)(parts, query);
  window.scrollTo(0, 0);
  updateHeaderHeight();
}

function updateHeaderHeight() {
  document.documentElement.style.setProperty("--header-h", $("#site-header").offsetHeight + "px");
}

/* =========================================================
   INIT
   ========================================================= */
function init() {
  setTheme(Store.get("theme"));
  $("#theme-btn").onclick = () => setTheme(Store.get("theme") === "dark" ? "light" : "dark");
  $("#user-menu-btn").onclick = e => { e.stopPropagation(); $("#user-dropdown").classList.toggle("open"); };
  renderHeaderUser();
  initSearchBar();
  initCategories();
  syncSearchUI();
  updateFilterCount();
  renderCompareBar();

  // collapse the big search bar into a pill while scrolling (with hysteresis to avoid jitter)
  const header = $("#site-header");
  window.addEventListener("scroll", () => {
    if (panelOpen) return;
    if (window.scrollY > 140 && !header.classList.contains("compact")) { header.classList.add("compact"); updateHeaderHeight(); }
    else if (window.scrollY < 10 && header.classList.contains("compact")) { header.classList.remove("compact"); updateHeaderHeight(); }
  }, { passive: true });
  window.addEventListener("resize", updateHeaderHeight);

  window.addEventListener("hashchange", router);
  router();
}
document.addEventListener("DOMContentLoaded", init);
