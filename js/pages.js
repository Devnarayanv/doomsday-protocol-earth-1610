/* =========================================================
   pages.js — one render function per route
   ========================================================= */

const app = () => $("#app");

/* ---------- search + filter logic ---------- */
const DEFAULT_FILTERS = {
  minPrice: 0, maxPrice: 50000, place: "any", bedrooms: 0, beds: 0, baths: 0, amenities: [],
  instant: false, superhost: false, favourite: false, minEco: 0, minWifi: 0
};

function activeFilterCount(f) {
  let n = 0;
  if (f.minPrice > 0 || f.maxPrice < 50000) n++;
  if (f.place !== "any") n++;
  n += ["bedrooms", "beds", "baths"].filter(k => f[k] > 0).length;
  n += f.amenities.length;
  n += ["instant", "superhost", "favourite"].filter(k => f[k]).length;
  if (f.minEco) n++;
  if (f.minWifi) n++;
  return n;
}

function filterListings() {
  const { search, cat, filters: f } = App;
  const q = search.where.trim().toLowerCase();
  const guests = (search.guests.adults || 0) + (search.guests.children || 0);
  const region = REGIONS.find(r => r.label.toLowerCase() === q);
  return allListings().filter(l => {
    if (region) { if (region.countries.length && !region.countries.includes(l.country)) return false; }
    else if (q && !`${l.city} ${l.country} ${l.title} ${l.kind}`.toLowerCase().includes(q)) return false;
    if (cat === "trending" && !(l.categories.includes("trending") || l.rating >= 4.95)) return false;
    if (cat === "green" && l.eco < 80) return false;
    if (cat === "work" && workScore(l) < 80) return false;
    if (cat && !["trending", "green", "work"].includes(cat) && !l.categories.includes(cat)) return false;
    if (guests && l.guests < guests) return false;
    if (search.guests.pets && !l.amenities.includes("pets")) return false;
    if (search.checkIn && search.checkOut) {
      const blocked = bookedDates(l);
      if (datesInRange(search.checkIn, search.checkOut).some(d => blocked.has(d))) return false;
    }
    if (l.price < f.minPrice || (f.maxPrice < 50000 && l.price > f.maxPrice)) return false;
    if (f.place !== "any" && l.place !== f.place) return false;
    if (l.bedrooms < f.bedrooms || l.beds < f.beds || l.baths < f.baths) return false;
    if (f.amenities.some(a => !l.amenities.includes(a))) return false;
    if (f.instant && !l.instant) return false;
    if (f.superhost && !l.host.superhost) return false;
    if (f.favourite && !(l.rating >= 4.9 && l.reviewCount > 100)) return false;
    if (l.eco < f.minEco) return false;
    if (l.wifi < f.minWifi) return false;
    return true;
  });
}

/* =========================================================
   HOME
   ========================================================= */
function renderHome() {
  const results = filterListings();
  const s = App.search;
  const recent = Store.get("recent").map(getListing).filter(Boolean).slice(0, 8);
  const pristine = !s.where && !s.checkIn && !App.cat && !activeFilterCount(App.filters);

  app().innerHTML = `
  <div class="home container">
    ${recent.length && pristine ? `
      <div class="section-title"><h2>Recently viewed</h2><button class="link-btn" id="clear-recent">Clear</button></div>
      <div class="recent-strip">${recent.map(l => `
        <a class="recent-item" href="#/rooms/${l.id}"><img src="${photo(l.images[0], 160)}" alt="">
          <div><b>${esc(l.city.split(",")[0])}</b><span>${inr(l.price)} night · ★ ${l.rating}</span></div></a>`).join("")}
      </div>` : ""}
    ${pristine ? `
      <div class="match-banner">
        <i class="fa-solid fa-wand-magic-sparkles big-ic"></i>
        <div><h3>Not sure where to go? Try Smart Stay Match <span class="new-pill">NEW</span></h3>
          <p>Answer 5 quick questions and we'll rank every stay on Earth-1610 by how well it fits your trip.</p></div>
        <div class="actions">
          <button class="btn btn-outline" data-surprise><i class="fa-solid fa-shuffle"></i> Surprise me</button>
          <a class="btn btn-brand" href="#/match">Find my match</a>
        </div>
      </div>` : ""}
    <div class="home-tools">
      ${s.where ? `<span class="chip on">${esc(s.where)} <i class="fa-solid fa-xmark" data-clear="where"></i></span>` : ""}
      ${s.checkIn ? `<span class="chip on">${fmtRange(s.checkIn, s.checkOut)} <i class="fa-solid fa-xmark" data-clear="dates"></i></span>` : ""}
      ${guestLabel(s.guests) ? `<span class="chip on">${guestLabel(s.guests)} <i class="fa-solid fa-xmark" data-clear="guests"></i></span>` : ""}
      ${!pristine ? `<button class="chip" data-surprise><i class="fa-solid fa-shuffle"></i> Surprise me</button>` : ""}
      <button class="chip ${App.filters.minEco >= 80 ? "on" : ""}" data-quick="eco"><i class="fa-solid fa-leaf"></i> Eco Score 80+</button>
      <button class="chip ${App.filters.minWifi >= 100 ? "on" : ""}" data-quick="wifi"><i class="fa-solid fa-wifi"></i> Wi-Fi 100+ Mbps</button>
      <button class="chip ${App.filters.instant ? "on" : ""}" data-quick="instant"><i class="fa-solid fa-bolt"></i> Instant Book</button>
      <span class="results-info">${results.length} stay${results.length !== 1 ? "s" : ""}${App.cat ? " · " + CATEGORIES.find(c => c.key === App.cat).label : ""}</span>
    </div>
    <div id="results"></div>
  </div>
  <button class="map-toggle" id="map-toggle">${App.mapMode ? `Show list <i class="fa-solid fa-list-ul"></i>` : `Show map <i class="fa-solid fa-map"></i>`}</button>`;

  const box = $("#results");
  if (!results.length) {
    box.innerHTML = `<div class="empty"><i class="fa-solid fa-magnifying-glass-location"></i><h2>No exact matches</h2>
      <p>Try changing or removing some of your filters or adjusting your search area.</p>
      <button class="btn btn-outline" id="reset-all">Remove all filters</button></div>`;
    $("#reset-all").onclick = resetSearch;
  } else if (App.mapMode) {
    box.innerHTML = `<div class="map-view" id="map"></div>`;
    renderResultsMap(results);
  } else {
    box.innerHTML = `<div class="grid">${results.map(l => listingCard(l, s)).join("")}</div>`;
    bindCards(box, s);
  }

  $("#map-toggle").onclick = () => { App.mapMode = !App.mapMode; renderHome(); window.scrollTo(0, 0); };
  $$("[data-surprise]").forEach(b => b.onclick = () => surpriseMe(results));
  const cr = $("#clear-recent");
  if (cr) cr.onclick = () => { Store.set("recent", []); renderHome(); };
  $$("[data-clear]").forEach(x => x.onclick = () => {
    const k = x.dataset.clear;
    if (k === "where") s.where = "";
    if (k === "dates") s.checkIn = s.checkOut = null;
    if (k === "guests") s.guests = { adults: 0, children: 0, infants: 0, pets: 0 };
    syncSearchUI(); renderHome();
  });
  $$("[data-quick]").forEach(b => b.onclick = () => {
    const f = App.filters;
    if (b.dataset.quick === "eco") f.minEco = f.minEco >= 80 ? 0 : 80;
    if (b.dataset.quick === "wifi") f.minWifi = f.minWifi >= 100 ? 0 : 100;
    if (b.dataset.quick === "instant") f.instant = !f.instant;
    updateFilterCount(); renderHome();
  });
}

function resetSearch() {
  App.search = { where: "", checkIn: null, checkOut: null, guests: { adults: 0, children: 0, infants: 0, pets: 0 } };
  App.cat = "";
  App.filters = JSON.parse(JSON.stringify(DEFAULT_FILTERS));
  syncSearchUI(); renderCategories(); updateFilterCount(); renderHome();
}

function renderResultsMap(results) {
  if (!window.L) {
    $("#map").innerHTML = `<div class="empty"><i class="fa-solid fa-map"></i><h2>Map unavailable</h2><p>The map library needs an internet connection.</p></div>`;
    return;
  }
  const map = L.map("map", { scrollWheelZoom: true, worldCopyJump: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(map);
  const s = App.search;
  const markers = results.map(l => {
    const p = cardPrice(l, s);
    const icon = L.divIcon({ className: "", html: `<span class="price-marker">${p.main}</span>`, iconSize: [90, 30], iconAnchor: [45, 15] });
    const mk = L.marker([l.lat, l.lng], { icon }).addTo(map);
    mk.bindPopup(`<div class="map-pop" data-go="${l.id}"><img src="${photo(l.images[0], 400)}" alt="">
        <b>${esc(l.location)}</b> <span style="float:right">★ ${l.rating}</span><br>
        <span style="color:#6a6a6a">${esc(l.kind)}</span><br><b>${p.main}</b> ${p.sub}</div>`);
    return mk;
  });
  map.on("popupopen", e => {
    const el = e.popup.getElement().querySelector("[data-go]");
    el.onclick = () => (location.hash = `#/rooms/${el.dataset.go}` + buildQuery({ checkIn: s.checkIn, checkOut: s.checkOut }));
  });
  const group = L.featureGroup(markers);
  if (results.length === 1) map.setView([results[0].lat, results[0].lng], 10);
  else map.fitBounds(group.getBounds().pad(0.15));
}

/* =========================================================
   LISTING DETAIL
   ========================================================= */
function renderRoom(id, query) {
  const l = getListing(id);
  if (!l) return renderNotFound();
  Store.update("recent", r => [l.id, ...r.filter(x => x !== l.id)].slice(0, 10));

  const st = {
    checkIn: query.checkIn || App.search.checkIn || null,
    checkOut: query.checkOut || App.search.checkOut || null,
    guests: { adults: Number(query.adults) || App.search.guests.adults || 1, children: Number(query.children) || App.search.guests.children || 0,
      infants: Number(query.infants) || 0, pets: Number(query.pets) || 0 }
  };
  const blocked = bookedDates(l);
  if (st.checkIn && st.checkOut && datesInRange(st.checkIn, st.checkOut).some(d => blocked.has(d))) st.checkIn = st.checkOut = null;

  const liked = Store.get("wishlist").includes(l.id);
  const favourite = l.rating >= 4.9 && l.reviewCount > 100;
  const [ecoTxt, ecoCls] = ecoLabel(l.eco);
  const ws = workScore(l);
  const [wsTxt, wsCls] = ecoLabel(ws);
  const amenShown = l.amenities.slice(0, 10);
  const vibeNames = { nightlife: "Nightlife", calm: "Peace & quiet", family: "Family-friendly", nature: "Nature", food: "Food scene" };
  const nearIcon = { beach: "fa-umbrella-beach", sight: "fa-camera", food: "fa-utensils", nature: "fa-tree" };

  app().innerHTML = `
  <div class="room container narrow">
    <div class="room-head">
      <h1>${esc(l.title)}</h1>
      <div class="room-actions">
        <button id="share-btn"><i class="fa-solid fa-arrow-up-from-bracket"></i> Share</button>
        <button id="save-btn" class="${liked ? "on" : ""}"><i class="fa-${liked ? "solid" : "regular"} fa-heart"></i> ${liked ? "Saved" : "Save"}</button>
        <button id="cmp-btn"><i class="fa-solid fa-code-compare"></i> ${Store.get("compare").includes(l.id) ? "Comparing" : "Compare"}</button>
      </div>
    </div>

    <div class="gallery">
      ${l.images.map((im, i) => `<img src="${photo(im, i === 0 ? 1200 : 600)}" alt="Photo ${i + 1} of ${esc(l.title)}" data-photos>`).join("")}
      <button class="show-photos" data-photos><i class="fa-solid fa-grip"></i> Show all photos</button>
    </div>

    <div class="room-body">
      <div>
        <div class="room-section">
          <h2>${esc(l.kind)} in ${esc(l.location)}</h2>
          <p class="room-sub">${l.guests} guest${l.guests > 1 ? "s" : ""} · ${l.bedrooms} bedroom${l.bedrooms > 1 ? "s" : ""} · ${l.beds} bed${l.beds > 1 ? "s" : ""} · ${l.baths} bath${l.baths > 1 ? "s" : ""}</p>
          ${favourite ? `
          <div class="fav-box">
            <div class="laurel"><i class="fa-solid fa-award"></i> Guest<br>favourite</div>
            <div class="fb-txt"><b>One of the most loved homes on Airbnb</b>, according to guests</div>
            <div class="fb-num"><b>${l.rating}</b><span class="small">★★★★★</span></div>
            <div class="fb-num"><b>${l.reviewCount}</b><span class="small">Reviews</span></div>
          </div>` : `<p style="margin-top:6px"><b>${ratingLine(l)}</b></p>`}
        </div>

        <div class="room-section host-row">
          ${avatar(l.host.name, 44)}
          <div><b>Hosted by ${esc(l.host.name)}</b><p class="muted small">${l.host.superhost ? "Superhost · " : ""}${l.host.years} years hosting</p></div>
        </div>

        <div class="room-section highlights">
          ${l.instant ? `<div class="highlight"><i class="fa-solid fa-door-open"></i><div><b>Self check-in</b><p>Check yourself in with the keypad.</p></div></div>` : ""}
          ${l.host.superhost ? `<div class="highlight"><i class="fa-solid fa-medal"></i><div><b>${esc(l.host.name)} is a Superhost</b><p>Superhosts are experienced, highly rated hosts.</p></div></div>` : ""}
          <div class="highlight"><i class="fa-regular fa-calendar"></i><div><b>Free cancellation for 48 hours</b><p>Get a full refund if you change your mind.</p></div></div>
          ${l.eco >= 80 ? `<div class="highlight"><i class="fa-solid fa-leaf" style="color:var(--eco)"></i><div><b>Green stay <span class="new-pill">NEW</span></b><p>Eco Score ${l.eco}/100 — earns double travel reward points.</p></div></div>` : ""}
        </div>

        <div class="room-section"><p class="desc">${esc(l.description)}</p></div>

        <div class="room-section">
          <h2>What this place offers</h2>
          <div class="amen-grid">${amenShown.map(a => `<div class="amen ${["solar", "ev"].includes(a) ? "eco" : ""}"><i class="fa-solid ${AMENITIES[a].icon}"></i>${AMENITIES[a].label}</div>`).join("")}</div>
          ${l.amenities.length > 10 ? `<button class="btn btn-outline" id="all-amen">Show all ${l.amenities.length} amenities</button>` : ""}
        </div>

        <div class="room-section">
          <h2>Stay insights <span class="new-pill">NEW</span></h2>
          <div class="insights">
            <div class="insight">
              <h4><i class="fa-solid fa-leaf" style="color:var(--eco)"></i> Eco Score</h4>
              <div class="ring" style="--v:${l.eco}"><span>${l.eco}</span></div>
              <p style="text-align:center;margin-bottom:10px"><span class="score-pill ${ecoCls}">${ecoTxt}</span></p>
              <ul>${ecoReasons(l).map(([ic, t]) => `<li><i class="fa-solid ${ic}"></i> ${t}</li>`).join("")}</ul>
            </div>
            <div class="insight">
              <h4><i class="fa-solid fa-laptop-house"></i> Work-from-stay</h4>
              <div class="wifi-big">${l.wifi} <small>Mbps Wi-Fi</small></div>
              <p style="text-align:center;margin-bottom:10px"><span class="score-pill ${wsCls}">Score ${ws}/100 · ${wsTxt}</span></p>
              <ul>
                <li><i class="fa-solid fa-${l.desk ? "check" : "xmark"}"></i> ${l.desk ? "Dedicated desk & chair" : "No dedicated desk"}</li>
                <li><i class="fa-solid fa-video"></i> ${l.wifi >= 50 ? "Smooth HD video calls" : l.wifi >= 25 ? "OK for audio calls" : "Best for light browsing"}</li>
                <li><i class="fa-solid fa-volume-low"></i> Quietness ${l.vibe.calm}/5</li>
              </ul>
            </div>
            <div class="insight">
              <h4><i class="fa-solid fa-chart-simple"></i> Neighbourhood vibe</h4>
              ${Object.entries(l.vibe).map(([k, v]) => `<div class="vibe-row"><span>${vibeNames[k]}</span><div class="bar"><i style="width:${v * 20}%"></i></div></div>`).join("")}
            </div>
          </div>
        </div>

        <div class="room-section" id="cal-section">
          <h2 id="cal-title"></h2>
          <p class="muted" id="cal-sub"></p>
          <div id="room-cal" style="margin-top:20px"></div>
          <div id="cheap-tip"></div>
        </div>
      </div>

      <aside class="reserve"><div class="reserve-card" id="reserve-card"></div>
        <div class="rare"><i class="fa-regular fa-gem"></i><div><b>This is a rare find.</b><br>${esc(l.host.name)}'s place is usually fully booked.</div></div>
      </aside>
    </div>

    <div class="room-section" style="border-top:1px solid var(--line)">
      <h2>${l.reviewCount ? ratingLine(l) : "No reviews (yet)"}</h2>
      <div class="rev-summary ${l.reviewCount ? "" : "hidden"}">${Object.entries(l.subRatings).map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join("")}</div>
      <div class="rev-grid">${l.reviews.map(r => `
        <div class="review">
          <div class="who">${avatar(r.name, 42)}<div><b>${esc(r.name)}</b><p class="muted small">${MONTHS[new Date(r.date).getMonth()]} ${new Date(r.date).getFullYear()}</p></div></div>
          <div class="stars">${"★".repeat(r.rating)}</div>
          <p>${esc(r.text)}</p>
        </div>`).join("")}</div>
    </div>

    <div class="room-section">
      <h2>Where you'll be</h2>
      <p>${esc(l.location)}</p>
      <div class="room-map" id="room-map"></div>
      <h3 style="margin-top:24px">Explore nearby <span class="new-pill">NEW</span></h3>
      <div class="nearby">${l.nearby.map(n => `<div class="nearby-item"><i class="fa-solid ${nearIcon[n.type] || "fa-location-dot"}"></i><div><b>${esc(n.name)}</b><p class="muted small">${n.km < 1 ? Math.round(n.km * 1000) + " m" : n.km + " km"} away · ~${Math.max(1, Math.round(n.km * (n.km < 2 ? 12 : 2.5)))} min ${n.km < 2 ? "walk" : "drive"}</p></div></div>`).join("")}</div>
    </div>

    <div class="room-section">
      <h2>Meet your host</h2>
      <div class="host-card">
        <div class="host-profile">
          <div class="hp-left">${avatar(l.host.name, 104)}<h3>${esc(l.host.name)}</h3><p class="small">${l.host.superhost ? '<i class="fa-solid fa-medal"></i> Superhost' : "Host"}</p></div>
          <div class="hp-stats">
            <div><b>${l.reviewCount}</b><span>Reviews</span></div>
            <div><b>${l.rating}★</b><span>Rating</span></div>
            <div style="border:0"><b>${l.host.years}</b><span>Years hosting</span></div>
          </div>
        </div>
        <div>
          <p style="margin-bottom:16px">${esc(l.host.bio)}</p>
          <p><b>Host details</b></p>
          <p class="muted">Response rate: ${l.host.responseRate}%<br>Responds within an hour</p>
          <button class="btn btn-dark" id="msg-host" style="margin-top:18px">Message host</button>
        </div>
      </div>
    </div>

    <div class="room-section" style="border:0">
      <h2>Things to know</h2>
      <div class="know">
        <div><h4>House rules</h4><p>Check-in after 3:00 pm</p><p>Checkout before 11:00 am</p><p>${l.guests} guests maximum</p>${l.amenities.includes("pets") ? "<p>Pets allowed</p>" : "<p>No pets</p>"}</div>
        <div><h4>Safety & property</h4>${l.amenities.includes("smoke") ? "<p>Smoke alarm</p>" : "<p>No smoke alarm reported</p>"}${l.amenities.includes("firstaid") ? "<p>First aid kit</p>" : ""}${l.amenities.includes("pool") ? "<p>Pool/hot tub without a gate or lock</p>" : ""}<p>Security camera on exterior</p></div>
        <div><h4>Cancellation policy</h4><p>Free cancellation for 48 hours. Cancel before check-in for a partial refund.</p><p>Review the host's full policy for details.</p></div>
      </div>
    </div>
  </div>`;
  attachImgFallback(app());

  /* gallery */
  $$("[data-photos]").forEach(el => el.onclick = () => openModal(`<div class="modal-head">Photo tour</div>
    <div class="all-photos">${l.images.map(im => `<img src="${photo(im, 1200)}" alt="">`).join("")}</div>`, { full: true }));

  /* actions */
  $("#save-btn").onclick = e => {
    toggleWishlist(l.id);
    const on = Store.get("wishlist").includes(l.id);
    e.currentTarget.classList.toggle("on", on);
    e.currentTarget.innerHTML = `<i class="fa-${on ? "solid" : "regular"} fa-heart"></i> ${on ? "Saved" : "Save"}`;
  };
  $("#cmp-btn").onclick = e => {
    toggleCompare(l.id);
    e.currentTarget.innerHTML = `<i class="fa-solid fa-code-compare"></i> ${Store.get("compare").includes(l.id) ? "Comparing" : "Compare"}`;
  };
  $("#share-btn").onclick = () => {
    const url = location.href;
    if (navigator.share) navigator.share({ title: l.title, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copied to clipboard", "fa-link"));
  };
  const allAmen = $("#all-amen");
  if (allAmen) allAmen.onclick = () => openModal(`<div class="modal-head">What this place offers</div>
    ${l.amenities.map(a => `<div class="amen" style="padding:14px 0;border-bottom:1px solid var(--line-soft)"><i class="fa-solid ${AMENITIES[a].icon}"></i>${AMENITIES[a].label}</div>`).join("")}`);
  $("#msg-host").onclick = () => openHostChat(l);

  /* calendar + reserve card */
  const cal = DatePicker($("#room-cal"), {
    start: st.checkIn, end: st.checkOut, blocked, heatToggle: true, heatmap: false,
    priceFor: iso => nightlyPrice(l, iso),
    onChange(a, b) { st.checkIn = a; st.checkOut = b; refresh(); }
  });

  function currentQuery() {
    return { checkIn: st.checkIn, checkOut: st.checkOut, adults: st.guests.adults, children: st.guests.children, infants: st.guests.infants, pets: st.guests.pets };
  }

  function refresh() {
    history.replaceState(null, "", `#/rooms/${l.id}` + buildQuery(currentQuery()));
    const n = st.checkIn && st.checkOut ? nightsBetween(st.checkIn, st.checkOut) : 0;
    $("#cal-title").textContent = n ? `${n} night${n > 1 ? "s" : ""} in ${l.city.split(",")[0]}` : st.checkIn ? "Select checkout date" : "Select check-in date";
    $("#cal-sub").textContent = n ? fmtRange(st.checkIn, st.checkOut) + `, ${fromISO(st.checkOut).getFullYear()}` : "Add your travel dates for exact pricing. Toggle the heatmap to spot the cheapest nights.";

    const win = cheapestWindow(l, n || 3);
    $("#cheap-tip").innerHTML = win ? `<div class="cheap-tip"><i class="fa-solid fa-piggy-bank"></i>
      <div><b>Cheapest ${n || 3}-night window: ${fmtRange(win.start, win.end)}</b><br><span class="muted">${inr(win.total)} before fees${win.saving > 0 ? ` · save about ${inr(win.saving)} vs. peak dates` : ""}</span></div>
      <button class="btn btn-outline" id="use-cheap">Use these dates</button></div>` : "";
    const uc = $("#use-cheap");
    if (uc) uc.onclick = () => { st.checkIn = win.start; st.checkOut = win.end; cal.set(win.start, win.end); refresh(); };

    renderReserveCard(l, st, refresh);
  }
  refresh();

  /* map */
  if (window.L) {
    const map = L.map("room-map", { scrollWheelZoom: false }).setView([l.lat, l.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
    L.circle([l.lat, l.lng], { radius: 600, color: "#FF385C", fillColor: "#FF385C", fillOpacity: 0.15, weight: 1 }).addTo(map);
    L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<span class="price-marker" style="background:#FF385C;color:#fff"><i class="fa-solid fa-house"></i></span>`, iconSize: [40, 30], iconAnchor: [20, 15] }) }).addTo(map);
  } else {
    $("#room-map").innerHTML = `<div class="empty"><p>Map needs an internet connection.</p></div>`;
  }
}

function renderReserveCard(l, st, refresh) {
  const box = $("#reserve-card");
  const has = st.checkIn && st.checkOut;
  const b = has ? priceBreakdown(l, st.checkIn, st.checkOut) : null;
  const gCount = st.guests.adults + st.guests.children;
  box.innerHTML = `
    <div class="reserve-price">
      <div>${has ? `<b>${inr(b.avg)}</b> night` : `<b>${inr(l.price)}</b> night <span class="muted small">avg</span>`}</div>
      <span class="small">${ratingLine(l)}</span>
    </div>
    <div class="res-box">
      <div class="res-dates">
        <button data-scroll-cal><label>Check-in</label><span>${st.checkIn ? fmtShort(st.checkIn) : "Add date"}</span></button>
        <button data-scroll-cal><label>Checkout</label><span>${st.checkOut ? fmtShort(st.checkOut) : "Add date"}</span></button>
      </div>
      <div class="res-guest" id="res-guest"><label>Guests</label><span>${guestLabel(st.guests) || "1 guest"}</span>
        <i class="fa-solid fa-chevron-down" style="position:absolute;right:14px;top:18px"></i></div>
    </div>
    <button class="btn btn-brand btn-block" id="reserve-btn">${has ? "Reserve" : "Check availability"}</button>
    ${has ? `
      <p class="reserve-note">You won't be charged yet</p>
      <div class="breakdown">
        <div class="row"><span>${inr(b.avg)} × ${b.nights} night${b.nights > 1 ? "s" : ""}</span><span>${inr(b.subtotal)}</span></div>
        ${b.weeklyDiscount ? `<div class="row discount"><span>Weekly stay discount</span><span>−${inr(b.weeklyDiscount)}</span></div>` : ""}
        <div class="row"><span>Cleaning fee</span><span>${inr(b.cleaning)}</span></div>
        <div class="row"><span>Airbnb service fee</span><span>${inr(b.service)}</span></div>
        <div class="row"><span>Taxes</span><span>${inr(b.taxes)}</span></div>
        <div class="row total"><span style="text-decoration:none">Total</span><span>${inr(b.total)}</span></div>
      </div>
      <div class="split-mini">
        <div class="row"><span><i class="fa-solid fa-people-arrows"></i> <b>Split it</b> <span class="new-pill">NEW</span></span>
        <span>${inr(b.total / Math.max(1, gCount))} <span class="muted">/ person</span></span></div>
        <p class="muted small" style="margin-top:4px">Shared across ${Math.max(1, gCount)} guest${gCount > 1 ? "s" : ""} · customise at checkout</p>
      </div>` : ""}`;

  $$("[data-scroll-cal]", box).forEach(x => x.onclick = () => $("#cal-section").scrollIntoView({ behavior: "smooth", block: "center" }));
  const gWrap = $("#res-guest", box);
  gWrap.onclick = e => {
    if ($(".res-guest-pop", gWrap)) return;
    const pop = document.createElement("div");
    pop.className = "res-guest-pop";
    gWrap.appendChild(pop);
    GuestPicker(pop, st.guests, g => { st.guests = g; $("span", gWrap).textContent = guestLabel(g) || "1 guest"; }, l.guests);
    pop.insertAdjacentHTML("beforeend", `<p class="muted small" style="padding:6px 0">This place has a maximum of ${l.guests} guests, not including infants.</p><div style="text-align:right;padding-bottom:10px"><button class="link-btn" id="close-g">Close</button></div>`);
    $("#close-g", pop).onclick = ev => { ev.stopPropagation(); pop.remove(); refresh(); };
  };
  $("#reserve-btn", box).onclick = () => {
    if (!has) { $("#cal-section").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    location.hash = `#/book/${l.id}` + buildQuery({ checkIn: st.checkIn, checkOut: st.checkOut, adults: st.guests.adults || 1, children: st.guests.children, infants: st.guests.infants, pets: st.guests.pets });
  };
}

/* =========================================================
   BOOKING / CHECKOUT
   ========================================================= */
function renderBook(id, q) {
  const l = getListing(id);
  if (!l) return renderNotFound();
  if (!q.checkIn || !q.checkOut) { location.hash = `#/rooms/${id}`; return; }
  const st = {
    checkIn: q.checkIn, checkOut: q.checkOut,
    guests: { adults: Number(q.adults) || 1, children: Number(q.children) || 0, infants: Number(q.infants) || 0, pets: Number(q.pets) || 0 },
    pay: "upi", redeem: false, split: []
  };

  app().innerHTML = `
  <div class="book container narrow">
    <div class="book-head"><button class="icon-btn" onclick="history.back()" aria-label="Back"><i class="fa-solid fa-chevron-left"></i></button><h1>Confirm and pay</h1></div>
    <div class="book-grid">
      <div>
        <div class="book-section">
          <h2>Your trip</h2>
          <div class="trip-line"><div><b>Dates</b><p id="bk-dates"></p></div><button class="link-btn" id="edit-dates">Edit</button></div>
          <div class="trip-line"><div><b>Guests</b><p id="bk-guests"></p></div><button class="link-btn" id="edit-guests">Edit</button></div>
        </div>
        <div class="book-section">
          <h2>Pay with</h2>
          ${[["upi", "fa-indian-rupee-sign", "UPI"], ["card", "fa-credit-card", "Credit or debit card"], ["netbank", "fa-building-columns", "Net banking"], ["later", "fa-clock", "Pay part now, part later"]]
            .map(([v, ic, t], i) => `<label class="pay-option"><input type="radio" name="pay" value="${v}" ${i === 0 ? "checked" : ""}><i class="fa-solid ${ic}"></i><span>${t}</span></label>`).join("")}
          <p class="demo-note"><i class="fa-solid fa-circle-info"></i> Demo checkout — no real payment is taken and no card details are collected.</p>
        </div>
        <div class="book-section">
          <h2>Split the bill <span class="new-pill">NEW</span></h2>
          <p class="muted" style="margin-bottom:14px">Travelling with friends? Divide the total equally or by custom amounts, then copy ready-made payment requests for your group chat.</p>
          <div id="split-box"></div>
        </div>
        <div class="book-section" id="redeem-section"></div>
        <div class="book-section">
          <h2>Required for your trip</h2>
          <div class="trip-line"><div><b>Message the host</b><p class="muted">Share why you're travelling, who's coming with you, and what you love about the space.</p></div></div>
          <textarea class="input" rows="3" id="bk-msg" placeholder="Hi ${esc(l.host.name)}! …"></textarea>
        </div>
        <div class="book-section">
          <h2>Cancellation policy</h2>
          <p><b>Free cancellation for 48 hours.</b> Cancel before ${fmtShort(addDays(q.checkIn, -7))} for a partial refund.</p>
        </div>
        <div class="book-section" style="border:0">
          <h2>Ground rules</h2>
          <p>We ask every guest to remember a few simple things about what makes a great guest.</p>
          <ul style="margin:10px 0 0 20px"><li>Follow the house rules</li><li>Treat your Host's home like your own</li></ul>
          <p class="small muted" style="margin:22px 0">By selecting the button below, I agree to the Host's House Rules, Ground rules for guests, and the Rebooking and Refund Policy.</p>
          <button class="btn btn-brand" id="confirm-btn" style="padding:16px 28px;font-size:16px">Confirm and pay</button>
        </div>
      </div>
      <aside><div class="summary-card" id="summary"></div></aside>
    </div>
  </div>`;

  let splitter;
  function update() {
    const b = priceBreakdown(l, st.checkIn, st.checkOut);
    const pts = Store.get("points");
    const redeemValue = st.redeem ? Math.min(pts, Math.round(b.total * 0.2)) : 0;
    const total = b.total - redeemValue;
    st.total = total; st.redeemValue = redeemValue;

    $("#bk-dates").textContent = fmtRange(st.checkIn, st.checkOut) + `, ${fromISO(st.checkIn).getFullYear()}`;
    $("#bk-guests").textContent = guestLabel(st.guests) || "1 guest";
    $("#summary").innerHTML = `
      <div class="summary-top"><img src="${photo(l.images[0], 300)}" alt="">
        <div><p>${esc(l.kind)}</p><b>${esc(l.title)}</b><p style="margin-top:6px">${ratingLine(l, false)}${l.reviewCount ? ` (${l.reviewCount})` : ""}${l.host.superhost ? " · Superhost" : ""}</p></div></div>
      <h2 style="margin-bottom:18px">Price details</h2>
      <div class="breakdown" style="margin:0">
        <div class="row"><span>${inr(b.avg)} × ${b.nights} nights</span><span>${inr(b.subtotal)}</span></div>
        ${b.weeklyDiscount ? `<div class="row discount"><span>Weekly stay discount</span><span>−${inr(b.weeklyDiscount)}</span></div>` : ""}
        <div class="row"><span>Cleaning fee</span><span>${inr(b.cleaning)}</span></div>
        <div class="row"><span>Airbnb service fee</span><span>${inr(b.service)}</span></div>
        <div class="row"><span>Taxes</span><span>${inr(b.taxes)}</span></div>
        ${redeemValue ? `<div class="row discount"><span>Reward points</span><span>−${inr(redeemValue)}</span></div>` : ""}
        <div class="row total"><span style="text-decoration:none">Total (INR)</span><span>${inr(total)}</span></div>
      </div>
      <p class="small muted" style="margin-top:12px"><i class="fa-solid fa-star" style="color:var(--brand)"></i> You'll earn <b>${pointsFor(l, total)}</b> reward points${l.eco >= 80 ? " (2× for a green stay)" : ""}.</p>`;

    $("#redeem-section").innerHTML = pts > 0 ? `
      <h2>Use reward points <span class="new-pill">NEW</span></h2>
      <div class="redeem"><div><b>${pts.toLocaleString("en-IN")} points available</b><p class="muted small">1 point = ₹1 · up to 20% of the total</p></div>
        <label class="switch-row"><input type="checkbox" id="redeem-toggle" ${st.redeem ? "checked" : ""}><span class="switch"></span></label></div>` :
      `<h2>Reward points <span class="new-pill">NEW</span></h2><p class="muted">You'll earn points on this trip that you can spend on your next one.</p>`;
    const rt = $("#redeem-toggle");
    if (rt) rt.onchange = () => { st.redeem = rt.checked; update(); };

    if (!splitter) splitter = SplitBill($("#split-box"), total, st.guests.adults + st.guests.children, rows => (st.split = rows));
    else splitter.setTotal(total);
  }
  update();

  $("#edit-dates").onclick = () => {
    const m = openModal(`<div class="modal-head">Change dates</div><div id="bk-cal"></div>
      <div class="modal-foot"><span class="muted small" id="bk-cal-info"></span><button class="btn btn-dark" id="bk-cal-save">Save</button></div>`, { wide: true });
    let tmp = { a: st.checkIn, b: st.checkOut };
    DatePicker($("#bk-cal", m), { start: st.checkIn, end: st.checkOut, blocked: bookedDates(l), priceFor: iso => nightlyPrice(l, iso), heatToggle: true,
      onChange(a, b) { tmp = { a, b }; $("#bk-cal-info", m).textContent = a && b ? `${nightsBetween(a, b)} nights` : "Select dates"; } });
    $("#bk-cal-save", m).onclick = () => {
      if (!tmp.a || !tmp.b) return toast("Select both dates", "fa-circle-info");
      st.checkIn = tmp.a; st.checkOut = tmp.b; closeModal(); update();
      history.replaceState(null, "", `#/book/${l.id}` + buildQuery({ checkIn: st.checkIn, checkOut: st.checkOut, ...st.guests }));
    };
  };
  $("#edit-guests").onclick = () => {
    const m = openModal(`<div class="modal-head">Guests</div><div id="bk-g"></div>
      <div class="modal-foot"><span></span><button class="btn btn-dark" id="bk-g-save">Save</button></div>`);
    let tmp = { ...st.guests };
    GuestPicker($("#bk-g", m), st.guests, g => (tmp = g), l.guests);
    $("#bk-g-save", m).onclick = () => { st.guests = tmp; st.guests.adults = Math.max(1, st.guests.adults); closeModal(); update(); };
  };
  $$("input[name=pay]").forEach(r => r.onchange = () => (st.pay = r.value));

  $("#confirm-btn").onclick = () => requireLogin(() => {
    const blocked = bookedDates(l);
    if (datesInRange(st.checkIn, st.checkOut).some(d => blocked.has(d))) return toast("Those dates were just booked — please pick others", "fa-triangle-exclamation");
    const earned = pointsFor(l, st.total);
    const booking = {
      id: "HM" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      listingId: l.id, checkIn: st.checkIn, checkOut: st.checkOut, guests: st.guests,
      total: st.total, pay: st.pay, split: st.split, earned, redeemed: st.redeemValue || 0,
      message: $("#bk-msg").value, createdAt: new Date().toISOString(), status: "confirmed"
    };
    Store.update("bookings", b => [booking, ...b]);
    Store.set("points", Store.get("points") - booking.redeemed + earned);
    confetti();
    location.hash = "#/trips";
    setTimeout(() => {
      const m = openModal(`
        <div style="text-align:center">
          <i class="fa-solid fa-circle-check" style="font-size:54px;color:var(--green)"></i>
          <h2 style="margin:12px 0 6px">You're going to ${esc(l.city.split(",")[0])}!</h2>
          <p class="muted">Confirmation code <b>${booking.id}</b> · ${fmtRange(booking.checkIn, booking.checkOut)}</p>
          <p style="margin-top:12px"><span class="score-pill good">+${earned} reward points</span></p>
          <div style="display:grid;gap:10px;margin-top:24px">
            <button class="btn btn-outline" id="ok-ics"><i class="fa-solid fa-calendar-plus"></i> Add to calendar</button>
            <button class="btn btn-outline" id="ok-pack"><i class="fa-solid fa-suitcase-rolling"></i> Open packing list</button>
            <button class="btn btn-dark" id="ok-close">View my trips</button>
          </div>
        </div>`);
      $("#ok-ics", m).onclick = () => downloadICS(booking);
      $("#ok-pack", m).onclick = () => openPackingList(booking);
      $("#ok-close", m).onclick = closeModal;
    }, 200);
  });
}

/* =========================================================
   TRIPS
   ========================================================= */
let tripTab = "upcoming";
function renderTrips() {
  if (!Store.get("user")) return renderLoginPrompt("Trips", "fa-suitcase-rolling", "Log in to see your trips and bookings.");
  const today = todayISO();
  const all = Store.get("bookings");
  const groups = {
    upcoming: all.filter(b => b.status !== "cancelled" && b.checkOut >= today),
    past: all.filter(b => b.status !== "cancelled" && b.checkOut < today),
    cancelled: all.filter(b => b.status === "cancelled")
  };
  const list = groups[tripTab];
  app().innerHTML = `
  <div class="page container narrow">
    <h1>Trips</h1>
    <div class="tabs">${Object.keys(groups).map(k => `<button data-tab="${k}" class="${k === tripTab ? "on" : ""}">${k[0].toUpperCase() + k.slice(1)} (${groups[k].length})</button>`).join("")}</div>
    ${!list.length ? `<div class="empty"><i class="fa-solid fa-suitcase-rolling"></i><h2>No ${tripTab} trips</h2>
      <p>Time to dust off your bags and start planning your next adventure.</p><a class="btn btn-dark" href="#/">Start searching</a></div>` :
      list.map(b => {
        const l = getListing(b.listingId);
        if (!l) return "";
        const daysTo = nightsBetween(today, b.checkIn);
        const status = b.status === "cancelled" ? "cancelled" : b.checkOut < today ? "past" : "";
        return `
        <div class="trip-card">
          <img src="${photo(l.images[0], 500)}" alt="">
          <div class="trip-info">
            <span class="status ${status}">${status === "cancelled" ? "Cancelled" : status === "past" ? "Completed" : "Confirmed"}</span>
            <h3 style="margin-top:8px">${esc(l.location)}</h3>
            <p class="muted">${esc(l.title)}</p>
            <div class="trip-meta">
              <span><i class="fa-regular fa-calendar"></i>${fmtRange(b.checkIn, b.checkOut)}, ${fromISO(b.checkIn).getFullYear()}</span>
              <span><i class="fa-solid fa-user-group"></i>${guestLabel(b.guests) || "1 guest"}</span>
              <span><i class="fa-solid fa-receipt"></i>${inr(b.total)}</span>
              <span><i class="fa-solid fa-hashtag"></i>${b.id}</span>
              ${b.earned ? `<span><i class="fa-solid fa-star"></i>+${b.earned} pts</span>` : ""}
            </div>
            ${!status ? `<p class="countdown"><i class="fa-solid fa-hourglass-half"></i> ${daysTo > 0 ? `${daysTo} day${daysTo > 1 ? "s" : ""} to go` : "Happening now — enjoy!"}</p>` : ""}
            ${b.split && b.split.length > 1 ? `<p class="small muted" style="margin-top:6px"><i class="fa-solid fa-people-arrows"></i> Split: ${b.split.map(s => `${esc(s.name)} ${inr(s.share)}`).join(" · ")}</p>` : ""}
          </div>
          <div class="trip-actions">
            <a class="btn btn-outline" href="#/rooms/${l.id}"><i class="fa-solid fa-house"></i> View listing</a>
            ${!status ? `
              <button class="btn btn-outline" data-ics="${b.id}"><i class="fa-solid fa-calendar-plus"></i> Add to calendar</button>
              <button class="btn btn-outline" data-pack="${b.id}"><i class="fa-solid fa-suitcase-rolling"></i> Packing list</button>
              <button class="btn btn-outline" data-msg="${l.id}"><i class="fa-regular fa-message"></i> Message host</button>
              <button class="btn btn-outline" data-cancel="${b.id}" style="color:#c4142d"><i class="fa-solid fa-ban"></i> Cancel</button>` : ""}
          </div>
        </div>`;
      }).join("")}
  </div>`;
  attachImgFallback(app());
  const byId = id => Store.get("bookings").find(b => b.id === id);
  $$("[data-tab]").forEach(t => t.onclick = () => { tripTab = t.dataset.tab; renderTrips(); });
  $$("[data-ics]").forEach(b => b.onclick = () => downloadICS(byId(b.dataset.ics)));
  $$("[data-pack]").forEach(b => b.onclick = () => openPackingList(byId(b.dataset.pack)));
  $$("[data-msg]").forEach(b => b.onclick = () => openHostChat(getListing(b.dataset.msg)));
  $$("[data-cancel]").forEach(btn => btn.onclick = () => {
    const bk = byId(btn.dataset.cancel);
    const m = openModal(`<div class="modal-head">Cancel reservation</div>
      <p>Are you sure you want to cancel your trip to <b>${esc(getListing(bk.listingId).city)}</b>? The ${bk.earned} points earned will be removed${bk.redeemed ? ` and ${bk.redeemed} redeemed points returned` : ""}.</p>
      <div class="modal-foot"><button class="link-btn" id="keep">Keep trip</button><button class="btn btn-dark" id="do-cancel">Cancel reservation</button></div>`);
    $("#keep", m).onclick = closeModal;
    $("#do-cancel", m).onclick = () => {
      Store.update("bookings", list => list.map(x => x.id === bk.id ? { ...x, status: "cancelled" } : x));
      Store.set("points", Math.max(0, Store.get("points") - bk.earned + (bk.redeemed || 0)));
      closeModal(); toast("Reservation cancelled", "fa-ban"); renderTrips();
    };
  });
}

/* =========================================================
   WISHLISTS
   ========================================================= */
function renderWishlists() {
  const items = Store.get("wishlist").map(getListing).filter(Boolean);
  app().innerHTML = `
  <div class="page container">
    <h1>Wishlists</h1>
    ${!items.length ? `<div class="empty"><i class="fa-regular fa-heart"></i><h2>Create your first wishlist</h2>
      <p>As you search, tap the heart icon to save your favourite places to stay.</p><a class="btn btn-dark" href="#/">Start exploring</a></div>` : `
      <div class="home-tools">
        <button class="chip" id="cmp-saved"><i class="fa-solid fa-code-compare"></i> Compare top 3 saved <span class="new-pill">NEW</span></button>
        <button class="chip" data-surprise><i class="fa-solid fa-shuffle"></i> Pick one for me</button>
        <span class="results-info">${items.length} saved · avg ${inr(items.reduce((s, l) => s + l.price, 0) / items.length)} / night</span>
      </div>
      <div class="grid" id="wl-grid">${items.map(l => listingCard(l)).join("")}</div>`}
  </div>`;
  if (!items.length) return;
  bindCards($("#wl-grid"));
  $$(".heart", app()).forEach(h => h.addEventListener("click", () => setTimeout(renderWishlists, 50)));
  $("#cmp-saved").onclick = () => { Store.set("compare", items.slice(0, 3).map(l => l.id)); location.hash = "#/compare"; };
  $("[data-surprise]").onclick = () => surpriseMe(items);
}

/* =========================================================
   COMPARE (NEW FEATURE)
   ========================================================= */
function renderCompare() {
  const items = Store.get("compare").map(getListing).filter(Boolean);
  if (items.length < 2) {
    app().innerHTML = `<div class="page container narrow"><h1>Compare stays <span class="new-pill">NEW</span></h1>
      <div class="empty"><i class="fa-solid fa-code-compare"></i><h2>Pick at least 2 stays to compare</h2>
      <p>Tick “Compare” under any listing (up to 3). You'll see prices, scores and amenities side by side, with the best value highlighted.</p>
      <a class="btn btn-dark" href="#/">Browse stays</a></div></div>`;
    return;
  }
  const s = App.search;
  const rows = [
    ["group", "Price & value"],
    ["Price per night", l => l.price, "min", v => inr(v)],
    ["Cleaning fee", l => l.cleaningFee, "min", v => inr(v)],
    ["Est. 5-night total", l => { const a = addDays(todayISO(), 30); return priceBreakdown(l, s.checkIn || a, s.checkOut || addDays(a, 5)).total; }, "min", v => inr(v)],
    ["group", "Ratings"],
    ["Rating", l => l.rating, "max", v => "★ " + v],
    ["Reviews", l => l.reviewCount, "max", v => v],
    ["Superhost", l => l.host.superhost ? 1 : 0, "bool"],
    ["group", "Space"],
    ["Guests", l => l.guests, "max", v => v],
    ["Bedrooms", l => l.bedrooms, "max", v => v],
    ["Beds", l => l.beds, "max", v => v],
    ["Bathrooms", l => l.baths, "max", v => v],
    ["Type", l => `${l.kind} · ${PLACE_TYPES[l.place]}`, "text"],
    ["group", "Insights"],
    ["Eco Score", l => l.eco, "max", v => v + "/100"],
    ["Wi-Fi speed", l => l.wifi, "max", v => v + " Mbps"],
    ["Work-from-stay", l => workScore(l), "max", v => v + "/100"],
    ["Nightlife", l => l.vibe.nightlife, "text", v => "●".repeat(v) + "○".repeat(5 - v)],
    ["Peace & quiet", l => l.vibe.calm, "text", v => "●".repeat(v) + "○".repeat(5 - v)],
    ["Instant Book", l => l.instant ? 1 : 0, "bool"],
    ["group", "Amenities"]
  ];
  const amenUnion = [...new Set(items.flatMap(l => l.amenities))];
  amenUnion.forEach(a => rows.push([AMENITIES[a].label, l => l.amenities.includes(a) ? 1 : 0, "bool"]));

  const body = rows.map(r => {
    if (r[0] === "group") return `<tr class="group"><th colspan="${items.length + 1}">${r[1]}</th></tr>`;
    const [label, fn, mode, fmt] = r;
    const vals = items.map(fn);
    const best = mode === "min" ? Math.min(...vals) : mode === "max" ? Math.max(...vals) : null;
    const allSame = vals.every(v => v === vals[0]);
    return `<tr><th>${label}</th>${vals.map(v => {
      if (mode === "bool") return `<td class="${v ? "yes" : "no"}"><i class="fa-solid fa-${v ? "check" : "minus"}"></i></td>`;
      const cls = best !== null && v === best && !allSame ? "best" : "";
      return `<td class="${cls}">${fmt ? fmt(v) : esc(v)}</td>`;
    }).join("")}</tr>`;
  }).join("");

  app().innerHTML = `
  <div class="page container">
    <h1>Compare stays <span class="new-pill">NEW</span></h1>
    <div class="compare-table-wrap"><table class="compare-table">
      <tr><th></th>${items.map(l => `<td class="cmp-head"><a href="#/rooms/${l.id}"><img src="${photo(l.images[0], 500)}" alt=""></a>
        <b>${esc(l.location)}</b><p class="muted small">${esc(l.title)}</p>
        <div style="display:flex;gap:8px;margin-top:10px"><a class="btn btn-brand" style="padding:8px 14px;font-size:13px" href="#/rooms/${l.id}">View</a>
        <button class="btn btn-outline" style="padding:8px 14px;font-size:13px" data-remove="${l.id}">Remove</button></div></td>`).join("")}</tr>
      ${body}
    </table></div>
  </div>`;
  attachImgFallback(app());
  $$("[data-remove]").forEach(b => b.onclick = () => { toggleCompare(Number(b.dataset.remove)); renderCompare(); });
}

/* =========================================================
   SMART STAY MATCH (NEW FEATURE)
   ========================================================= */
const matchState = { step: 0, answers: { vibe: [], scenery: [], who: "", budget: 15000, must: [] } };
function renderMatch() {
  const { step, answers } = matchState;
  if (step >= MATCH_QUESTIONS.length) return renderMatchResults();
  const q = MATCH_QUESTIONS[step];
  app().innerHTML = `
  <div class="page container">
    <div class="match-wrap">
      <p class="muted small" style="margin-bottom:10px"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--brand)"></i> Smart Stay Match <span class="new-pill">NEW</span> · Question ${step + 1} of ${MATCH_QUESTIONS.length}</p>
      <div class="match-progress">${MATCH_QUESTIONS.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <h2 class="q-title">${q.title}</h2><p class="muted">${q.sub}</p>
      ${q.type === "budget" ? `
        <div style="margin:40px 0">
          <div style="font-size:40px;font-weight:800;text-align:center" id="budget-val">${inr(answers.budget)}</div>
          <p class="muted" style="text-align:center;margin-bottom:20px">per night</p>
          <input type="range" class="slider" min="1000" max="50000" step="500" value="${answers.budget}" id="budget" aria-label="Nightly budget">
          <div style="display:flex;justify-content:space-between" class="muted small"><span>₹1,000</span><span>₹50,000+</span></div>
        </div>` : `
        <div class="q-options">${q.options.map(([v, label, ic]) => {
          const on = q.multi ? answers[q.key].includes(v) : answers[q.key] === v;
          return `<button class="q-opt ${on ? "on" : ""}" data-v="${v}"><i class="fa-solid ${ic}"></i><b>${label}</b></button>`;
        }).join("")}</div>`}
      <div class="q-nav">
        <button class="link-btn" id="q-back" ${step === 0 ? 'style="visibility:hidden"' : ""}>Back</button>
        <button class="btn btn-dark" id="q-next">${step === MATCH_QUESTIONS.length - 1 ? "Show my matches" : "Next"}</button>
      </div>
    </div>
  </div>`;
  $$(".q-opt").forEach(b => b.onclick = () => {
    const v = b.dataset.v;
    if (q.multi) answers[q.key] = answers[q.key].includes(v) ? answers[q.key].filter(x => x !== v) : [...answers[q.key], v];
    else answers[q.key] = v;
    renderMatch();
  });
  const bud = $("#budget");
  if (bud) bud.oninput = () => { answers.budget = Number(bud.value); $("#budget-val").textContent = inr(answers.budget) + (answers.budget >= 50000 ? "+" : ""); };
  $("#q-back").onclick = () => { matchState.step--; renderMatch(); };
  $("#q-next").onclick = () => { matchState.step++; renderMatch(); window.scrollTo(0, 0); };
}

function renderMatchResults() {
  const a = matchState.answers;
  const ranked = allListings().map(l => ({ l, m: matchScore(l, a) })).sort((x, y) => y.m.pct - x.m.pct).slice(0, 8);
  app().innerHTML = `
  <div class="page container">
    <h1 style="margin-bottom:6px">Your top matches <span class="new-pill">NEW</span></h1>
    <p class="muted" style="margin-bottom:26px">Ranked by how well each stay fits your vibe, scenery, group, budget and must-haves.</p>
    <div class="home-tools"><button class="chip" id="redo"><i class="fa-solid fa-rotate-left"></i> Retake quiz</button>
      <button class="chip" id="cmp-top"><i class="fa-solid fa-code-compare"></i> Compare top 3</button></div>
    <div class="grid" id="match-grid">${ranked.map(({ l, m }) => `
      <div class="match-card-wrap"><span class="match-score">${m.pct}% match</span>${listingCard(l)}
        <div class="match-reasons">${m.reasons.map(r => `<span><i class="fa-solid fa-check"></i> ${esc(r)}</span>`).join("")}</div></div>`).join("")}
    </div>
  </div>`;
  bindCards($("#match-grid"));
  $("#redo").onclick = () => { matchState.step = 0; renderMatch(); };
  $("#cmp-top").onclick = () => { Store.set("compare", ranked.slice(0, 3).map(x => x.l.id)); location.hash = "#/compare"; };
}

/* =========================================================
   HOST — "Airbnb your home"
   ========================================================= */
function renderHost() {
  const heroChoices = [6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18, 19, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45];
  const draft = {
    title: "", kind: "Apartment", place: "entire", city: "", country: "India", price: 5000, guests: 2, bedrooms: 1, beds: 1, baths: 1,
    cats: ["iconic"], amen: ["wifi", "kitchen"], hero: 6, lat: 28.6139, lng: 77.2090, wifi: 50, desk: false
  };
  app().innerHTML = `
  <div class="page container narrow">
    <h1>Airbnb your home</h1>
    <div class="host-grid">
      <form class="host-form" id="host-form">
        <h2>Tell guests about your place</h2>
        <label class="field"><span>Listing title</span><input name="title" required maxlength="70" placeholder="e.g. Sunny balcony flat near the old city"></label>
        <div class="field-row">
          <label class="field"><span>Property kind</span><select name="kind">${["Apartment", "Home", "Villa", "Cabin", "Cottage", "Loft", "Bungalow", "Tiny home", "Treehouse", "Farmhouse"].map(k => `<option>${k}</option>`).join("")}</select></label>
          <label class="field"><span>Type of place</span><select name="place">${Object.entries(PLACE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
        </div>
        <div class="field-row">
          <label class="field"><span>City</span><input name="city" required placeholder="e.g. Pune, Maharashtra"></label>
          <label class="field"><span>Country</span><input name="country" required value="India"></label>
        </div>
        <div class="field-row">
          <label class="field"><span>Latitude</span><input name="lat" type="number" step="any" value="${draft.lat}"></label>
          <label class="field"><span>Longitude</span><input name="lng" type="number" step="any" value="${draft.lng}"></label>
        </div>
        <button type="button" class="btn btn-outline" id="use-loc" style="margin-bottom:6px"><i class="fa-solid fa-location-crosshairs"></i> Use my current location</button>

        <h2>Basics</h2>
        <div class="field-row">
          <label class="field"><span>Price per night (₹)</span><input name="price" type="number" min="500" max="200000" value="${draft.price}" required></label>
          <label class="field"><span>Max guests</span><input name="guests" type="number" min="1" max="16" value="${draft.guests}"></label>
        </div>
        <div class="field-row">
          <label class="field"><span>Bedrooms</span><input name="bedrooms" type="number" min="1" max="20" value="1"></label>
          <label class="field"><span>Beds</span><input name="beds" type="number" min="1" max="30" value="1"></label>
        </div>
        <div class="field-row">
          <label class="field"><span>Bathrooms</span><input name="baths" type="number" min="1" max="20" value="1"></label>
          <label class="field"><span>Wi-Fi speed (Mbps) <span class="new-pill">NEW</span></span><input name="wifi" type="number" min="0" max="2000" value="50"></label>
        </div>

        <h2>Category</h2>
        <div class="check-grid">${CATEGORIES.filter(c => !["trending", "green", "work"].includes(c.key)).map(c =>
          `<label class="check"><input type="checkbox" name="cats" value="${c.key}" ${draft.cats.includes(c.key) ? "checked" : ""}> <i class="fa-solid ${c.icon}"></i> ${c.label}</label>`).join("")}</div>

        <h2>Amenities</h2>
        <div class="check-grid">${Object.entries(AMENITIES).map(([k, a]) =>
          `<label class="check"><input type="checkbox" name="amen" value="${k}" ${draft.amen.includes(k) ? "checked" : ""}> <i class="fa-solid ${a.icon}"></i> ${a.label}</label>`).join("")}</div>
        <label class="check" style="margin-top:12px"><input type="checkbox" name="desk"> Has a dedicated desk for remote work</label>

        <h2>Cover photo</h2>
        <div class="photo-pick">${heroChoices.map(i => `<img src="${photo(i, 200)}" data-hero="${i}" class="${i === draft.hero ? "on" : ""}" alt="Cover option">`).join("")}</div>
        <label class="field" style="margin-top:12px"><span>…or paste an image URL</span><input name="heroUrl" type="url" placeholder="https://"></label>

        <h2>Description</h2>
        <label class="field"><textarea name="desc" rows="4" placeholder="What makes your place special?"></textarea></label>
        <button class="btn btn-brand" style="margin-top:10px">Publish listing</button>
      </form>
      <div class="preview-col"><p class="muted small" style="margin-bottom:10px">Live preview</p><div id="host-preview"></div>
        <div class="help-card" style="margin-top:20px"><i class="fa-solid fa-leaf"></i><h3>Your Eco Score <span class="new-pill">NEW</span></h3><p id="eco-preview"></p></div>
      </div>
    </div>
  </div>`;

  const form = $("#host-form");
  const read = () => {
    const fd = new FormData(form);
    const url = (fd.get("heroUrl") || "").trim();
    return {
      ...draft,
      title: fd.get("title") || "Your listing title",
      kind: fd.get("kind"), place: fd.get("place"),
      city: fd.get("city") || "Your city", country: fd.get("country") || "Country",
      lat: Number(fd.get("lat")) || 0, lng: Number(fd.get("lng")) || 0,
      price: Number(fd.get("price")) || 500, guests: Number(fd.get("guests")) || 1,
      bedrooms: Number(fd.get("bedrooms")) || 1, beds: Number(fd.get("beds")) || 1, baths: Number(fd.get("baths")) || 1,
      wifi: Number(fd.get("wifi")) || 0, desk: !!fd.get("desk"),
      cats: fd.getAll("cats"), amen: fd.getAll("amen"),
      hero: url || draft.hero, desc: fd.get("desc")
    };
  };
  const estimateEco = d => Math.min(98, 45 + (d.amen.includes("solar") ? 20 : 0) + (d.amen.includes("ev") ? 10 : 0) + (d.amen.includes("garden") ? 8 : 0) + (!d.amen.includes("ac") ? 8 : 0) + (d.cats.some(c => ["countryside", "treehouse", "cabins"].includes(c)) ? 7 : 0));
  const toListing = (d, id) => {
    const l = buildListing({
      id, title: d.title, city: d.city, country: d.country, lat: d.lat, lng: d.lng, kind: d.kind, place: d.place,
      cats: d.cats.length ? d.cats : ["iconic"], price: d.price, rating: 5, reviews: 0, guests: d.guests, bedrooms: d.bedrooms, beds: d.beds, baths: d.baths,
      hero: d.hero, host: [Store.get("user")?.name || "You", 0, false], amen: d.amen, eco: estimateEco(d), wifi: d.wifi, desk: d.desk,
      vibe: [3, 3, 3, 3, 3], tags: [], instant: true, nearby: []
    });
    if (d.desc) l.description = d.desc;
    l.reviews = []; l.isHosted = true;
    return l;
  };
  const preview = () => {
    const d = read();
    $("#host-preview").innerHTML = listingCard(toListing(d, 0));
    attachImgFallback($("#host-preview"));
    $("#eco-preview").textContent = `Estimated ${estimateEco(d)}/100. Add solar power, EV charging or a garden to raise it — green stays get a badge and appear under “Green stays”.`;
  };
  form.addEventListener("input", preview);
  $$("[data-hero]").forEach(img => img.onclick = () => {
    draft.hero = Number(img.dataset.hero);
    form.heroUrl.value = "";
    $$("[data-hero]").forEach(x => x.classList.toggle("on", x === img));
    preview();
  });
  $("#use-loc").onclick = () => {
    if (!navigator.geolocation) return toast("Geolocation not available", "fa-location-dot");
    navigator.geolocation.getCurrentPosition(p => {
      form.lat.value = p.coords.latitude.toFixed(4); form.lng.value = p.coords.longitude.toFixed(4);
      toast("Location filled in", "fa-location-dot");
    }, () => toast("Couldn't get your location", "fa-location-dot"));
  };
  form.onsubmit = e => {
    e.preventDefault();
    requireLogin(() => {
      const d = read();
      const l = toListing(d, 1000 + Date.now() % 1000000);
      Store.update("hosted", h => [...h, l]);
      Store.set("points", Store.get("points") + 250);
      toast("Your listing is live! +250 reward points", "fa-house-circle-check");
      location.hash = `#/rooms/${l.id}`;
    });
  };
  preview();
}

/* =========================================================
   ACCOUNT + REWARDS
   ========================================================= */
function renderAccount() {
  const user = Store.get("user");
  if (!user) return renderLoginPrompt("Profile", "fa-circle-user", "Log in to see your profile, travel rewards and badges.");
  const stats = travelStats();
  const pts = Store.get("points");
  const tier = tierFor(pts);
  const hosted = Store.get("hosted");
  app().innerHTML = `
  <div class="page container narrow">
    <h1>Profile</h1>
    <div class="account-grid">
      <div class="profile-card">
        ${avatar(user.name, 110)}
        <h2>${esc(user.name)}</h2><p class="muted">${esc(user.email)}</p>
        <p class="small muted">Member since ${MONTHS[new Date(user.joined).getMonth()]} ${new Date(user.joined).getFullYear()} · Earth-1610</p>
        <div class="stat-row"><div><b>${stats.trips}</b><span>Trips</span></div><div><b>${stats.nights}</b><span>Nights</span></div><div><b>${stats.countries}</b><span>Countries</span></div></div>
      </div>
      <div>
        <div class="points-card">
          <i class="fa-solid fa-star" style="font-size:40px"></i>
          <div><div class="pts">${pts.toLocaleString("en-IN")}</div><div>reward points <span class="new-pill" style="background:#fff;color:#D70466">NEW</span></div></div>
          <div class="tier"><span>Current tier</span><b>${tier.name}</b>
            ${tier.next ? `<div class="tier-bar"><i style="width:${tier.progress * 100}%"></i></div><span class="small">${(tier.next[1] - pts).toLocaleString("en-IN")} pts to ${tier.next[0]}</span>` : `<span class="small">Top tier reached!</span>`}</div>
        </div>
        <p class="muted small" style="margin:-14px 0 24px">Earn 1 point per ₹100 spent (2× on green stays) and 250 for publishing a listing. Redeem at checkout: 1 point = ₹1.</p>
        <h2 style="margin-bottom:14px">Badges</h2>
        <div class="badges">${BADGES.map(b => {
          const got = b.test(stats);
          return `<div class="badge ${got ? "" : "locked"}"><i class="fa-solid ${b.icon}"></i><b>${b.name}</b><span class="muted">${b.desc}</span>${got ? `<p class="small" style="color:var(--green);margin-top:6px"><i class="fa-solid fa-check"></i> Unlocked</p>` : ""}</div>`;
        }).join("")}</div>

        <h2 style="margin:34px 0 6px">Settings</h2>
        <div class="settings-list">
          <div class="counter-row"><div><b>Dark mode</b> <span class="new-pill">NEW</span><p class="muted small">Easier on the eyes at night</p></div>
            <label class="switch-row"><input type="checkbox" id="set-dark" ${Store.get("theme") === "dark" ? "checked" : ""}><span class="switch"></span></label></div>
          <div class="counter-row"><div><b>Display total before taxes</b><p class="muted small">Show total trip prices on search results</p></div>
            <label class="switch-row"><input type="checkbox" id="set-total" ${Store.get("showTotal") ? "checked" : ""}><span class="switch"></span></label></div>
        </div>

        ${hosted.length ? `<h2 style="margin:34px 0 14px">Your listings</h2>
          ${hosted.map(l => `<div class="counter-row" style="border-bottom:1px solid var(--line-soft)"><a href="#/rooms/${l.id}" style="display:flex;gap:12px;align-items:center">
            <img src="${photo(l.images[0], 120)}" alt="" style="width:60px;height:60px;border-radius:8px;object-fit:cover"><div><b>${esc(l.title)}</b><p class="muted small">${esc(l.location)} · ${inr(l.price)}/night</p></div></a>
            <button class="btn btn-outline" style="padding:8px 14px" data-unlist="${l.id}">Remove</button></div>`).join("")}` : ""}

        <div style="display:flex;gap:10px;margin-top:34px;flex-wrap:wrap">
          <button class="btn btn-outline" id="logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</button>
          <button class="btn btn-outline" id="reset-demo" style="color:#c4142d"><i class="fa-solid fa-trash"></i> Reset demo data</button>
        </div>
      </div>
    </div>
  </div>`;
  $("#set-dark").onchange = e => setTheme(e.target.checked ? "dark" : "light");
  $("#set-total").onchange = e => { Store.set("showTotal", e.target.checked); $("#total-toggle").checked = e.target.checked; };
  $("#logout").onclick = logout;
  $("#reset-demo").onclick = () => {
    const m = openModal(`<div class="modal-head">Reset demo data</div><p>This clears your account, trips, wishlists, points and hosted listings from this browser.</p>
      <div class="modal-foot"><button class="link-btn" id="no">Keep data</button><button class="btn btn-dark" id="yes">Reset everything</button></div>`);
    $("#no", m).onclick = closeModal;
    $("#yes", m).onclick = () => { Store.reset(); closeModal(); renderHeaderUser(); renderCompareBar(); location.hash = "#/"; toast("Demo data reset", "fa-rotate"); };
  };
  $$("[data-unlist]").forEach(b => b.onclick = () => {
    const id = Number(b.dataset.unlist);
    Store.update("hosted", h => h.filter(x => x.id !== id));
    Store.update("wishlist", w => w.filter(x => x !== id));
    Store.update("compare", c => c.filter(x => x !== id));
    renderAccount(); renderCompareBar();
  });
}

function renderLoginPrompt(title, icon, text) {
  app().innerHTML = `<div class="page container narrow"><h1>${title}</h1>
    <div class="empty"><i class="fa-solid ${icon}"></i><h2>Log in to continue</h2><p>${text}</p>
    <button class="btn btn-brand" id="lp-login">Log in or sign up</button></div></div>`;
  $("#lp-login").onclick = () => openLogin(() => router());
}

/* =========================================================
   HELP / ABOUT
   ========================================================= */
function renderHelp() {
  const feats = [
    ["fa-wand-magic-sparkles", "Smart Stay Match", "A 5-question quiz ranks every stay with a match percentage and reasons.", "#/match"],
    ["fa-code-compare", "Compare stays", "Tick up to 3 listings and compare price, scores and amenities side by side.", "#/compare"],
    ["fa-calendar-days", "Price heatmap calendar", "Colour-coded calendar showing the price of every night.", "#/rooms/6"],
    ["fa-piggy-bank", "Cheapest-dates finder", "Finds the cheapest available window for your trip length in one click.", "#/rooms/6"],
    ["fa-people-arrows", "Split the bill", "Split the total equally or by custom amounts and copy payment requests.", "#/rooms/3"],
    ["fa-leaf", "Eco Score & Green stays", "Every listing has a sustainability score, badge, category and filter.", "#/"],
    ["fa-laptop-house", "Work-from-stay score", "Wi-Fi speed, desk and quietness combined into one score, with a Wi-Fi filter.", "#/rooms/11"],
    ["fa-chart-simple", "Neighbourhood vibe meter", "Nightlife, quiet, family, nature and food ratings for the area.", "#/rooms/13"],
    ["fa-map-location-dot", "Explore nearby", "Nearby sights, beaches and food with distance and walk/drive time.", "#/rooms/4"],
    ["fa-microphone", "Voice search", "Say “cabins in Manali” to search hands-free.", "#/"],
    ["fa-suitcase-rolling", "Smart packing list", "Auto-generated checklist from destination, season and amenities.", "#/trips"],
    ["fa-calendar-plus", "Add to calendar", "Download a .ics file for any trip, with a reminder the day before.", "#/trips"],
    ["fa-star", "Travel rewards", "Earn points, climb tiers, unlock badges and redeem points at checkout.", "#/account"],
    ["fa-shuffle", "Surprise me", "Spin the globe for a random stay.", "#/"],
    ["fa-moon", "Dark mode", "Full dark theme, remembered between visits.", "#/account"]
  ];
  app().innerHTML = `
  <div class="page container narrow">
    <h1>About this clone</h1>
    <p style="max-width:760px;margin-bottom:12px">This is an <b>educational Airbnb clone</b> built for a college project — <b>Earth-1610 Edition</b>. It recreates the core Airbnb experience (search, categories, filters, map, listing pages, booking, trips, wishlists and hosting) using plain HTML, CSS and JavaScript, with data stored in your browser.</p>
    <p class="muted" style="max-width:760px;margin-bottom:30px">It is not affiliated with Airbnb, Inc. All listings, hosts and reviews are fictional, and no real payments are processed. A full write-up of the new features is in <a class="link-btn" href="New_Features.pdf" target="_blank">New_Features.pdf</a>.</p>
    <h2 style="margin-bottom:16px">Features not in the original Airbnb</h2>
    <div class="help-grid">${feats.map(([ic, t, d, href]) => `<a class="help-card" href="${href}"><i class="fa-solid ${ic}"></i><h3>${t}</h3><p>${d}</p></a>`).join("")}</div>
  </div>`;
}

function renderNotFound() {
  app().innerHTML = `<div class="page container narrow"><div class="empty"><i class="fa-solid fa-map-location-dot"></i>
    <h2>We can't seem to find that page</h2><p>It might have moved to another universe.</p><a class="btn btn-dark" href="#/">Go home</a></div></div>`;
}
