/* =========================================================
   components.js — reusable UI: listing card, date picker,
   guest picker, image fallback
   ========================================================= */

/* ---------- listing cfard ---------- */
// keep in sync with the LCP preload in index.html
const CARD_SIZES = "(min-width: 1281px) calc(25vw - 58px), (min-width: 951px) calc(33vw - 40px), (min-width: 641px) 50vw, 100vw";

function listingCard(l, search = {}, eager = false) {
  const liked = Store.get("wishlist").includes(l.id);
  const comparing = Store.get("compare").includes(l.id);
  const p = cardPrice(l, search);
  const favourite = l.rating >= 4.9 && l.reviewCount > 100;
  const sub = search.checkIn && search.checkOut ? fmtRange(search.checkIn, search.checkOut) : `${l.bedrooms} bedroom${l.bedrooms > 1 ? "s" : ""} · ${l.beds} bed${l.beds > 1 ? "s" : ""}`;
  return `
  <article class="card" data-id="${l.id}">
    <div class="card-media">
      <div class="track">${l.images.map((im, i) => {
        const srcset = `${photo(im, 320)} 320w, ${photo(im, 480)} 480w, ${photo(im, 720)} 720w`;
        const alt = `${esc(l.title)} photo ${i + 1}`;
        // only the first photo loads up front; the rest wait until the carousel is used
        if (i > 0) return `<img data-src="${photo(im, 480)}" data-srcset="${srcset}" sizes="${CARD_SIZES}" alt="${alt}" decoding="async">`;
        return `<img src="${photo(im, 480)}" srcset="${srcset}" sizes="${CARD_SIZES}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
      }).join("")}</div>
      <button class="car-btn prev" aria-label="Previous photo"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="car-btn next" aria-label="Next photo"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="dots">${l.images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>
      <button class="heart ${liked ? "on" : ""}" data-heart="${l.id}" aria-label="Save to wishlist"><i class="fa-solid fa-heart"></i></button>
      ${favourite ? `<span class="badge-fav">Guest favourite</span>` : ""}
      ${l.eco >= 80 ? `<span class="badge-eco" title="Eco Score ${l.eco}/100"><i class="fa-solid fa-leaf"></i> ${l.eco}</span>` : ""}
    </div>
    <div class="card-body">
      <div class="card-row"><h3>${esc(l.location)}</h3><span class="rating">${ratingLine(l, false)}</span></div>
      <p class="muted">${esc(l.kind)} · ${esc(l.title)}</p>
      <p class="muted">${sub}</p>
      <p class="price"><b>${p.main}</b> ${p.sub}</p>
      <label class="compare-toggle" data-compare="${l.id}">
        <input type="checkbox" ${comparing ? "checked" : ""}> Compare
      </label>
    </div>
  </article>`;
}

/** Wires carousel, heart, compare and navigation for every .card inside root */
function bindCards(root, search = {}) {
  $$(".card", root).forEach(card => {
    const id = Number(card.dataset.id);
    const track = $(".track", card);
    const dots = $$(".dots span", card);
    let idx = 0;
    const go = n => {
      $$("img[data-src]", track).forEach(img => {
        img.srcset = img.dataset.srcset; img.src = img.dataset.src;
        img.removeAttribute("data-src"); img.removeAttribute("data-srcset");
      });
      idx = (n + dots.length) % dots.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    };
    $(".prev", card).addEventListener("click", e => { e.stopPropagation(); go(idx - 1); });
    $(".next", card).addEventListener("click", e => { e.stopPropagation(); go(idx + 1); });

    $(".heart", card).addEventListener("click", e => { e.stopPropagation(); toggleWishlist(id, e.currentTarget); });

    const cmp = $(".compare-toggle", card);
    cmp.addEventListener("click", e => e.stopPropagation());
    $("input", cmp).addEventListener("change", e => toggleCompare(id, e.target));

    card.addEventListener("click", () => {
      location.hash = `#/rooms/${id}` + buildQuery({ checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests });
    });
  });
  attachImgFallback(root);
}

function toggleWishlist(id, btn) {
  const list = Store.get("wishlist");
  const on = !list.includes(id);
  Store.set("wishlist", on ? [...list, id] : list.filter(x => x !== id));
  if (btn) btn.classList.toggle("on", on);
  toast(on ? "Saved to your wishlist" : "Removed from wishlist", on ? "fa-heart" : "fa-heart-crack");
}

function toggleCompare(id, input) {
  const list = Store.get("compare");
  if (list.includes(id)) {
    Store.set("compare", list.filter(x => x !== id));
  } else if (list.length >= 3) {
    if (input) input.checked = false;
    toast("You can compare up to 3 stays", "fa-circle-info");
    return;
  } else {
    Store.set("compare", [...list, id]);
  }
  renderCompareBar();
}

/* Show a soft gradient if an image can't load (e.g. offline) */
function attachImgFallback(root) {
  $$("img", root).forEach(img => {
    img.addEventListener("error", () => img.classList.add("img-broken"), { once: true });
  });
}

/* ---------- date range picker (with optional price heatmap) ---------- */
function DatePicker(container, opts) {
  const state = {
    start: opts.start || null,
    end: opts.end || null,
    offset: 0,
    heat: !!opts.heatmap
  };
  const blocked = opts.blocked || new Set();
  const today = todayISO();
  const monthsToShow = window.innerWidth < 760 ? 1 : (opts.months || 2);

  function validEnd(d) {
    if (!state.start || d <= state.start) return false;
    return datesInRange(state.start, d).every(x => !blocked.has(x));
  }

  function heatColor(price, min, max) {
    const t = max === min ? 0.5 : (price - min) / (max - min);
    // green (cheap) → amber → red (expensive)
    const hue = 140 - t * 140;
    return `hsl(${hue} 70% ${document.documentElement.dataset.theme === "dark" ? 28 : 88}%)`;
  }

  function render() {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + state.offset);
    let html = `<div class="dp-head">
        <button class="icon-btn dp-prev" ${state.offset === 0 ? "disabled" : ""} aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button>
        <span></span>
        <button class="icon-btn dp-next" ${state.offset >= 10 ? "disabled" : ""} aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>
      </div><div class="dp-months">`;

    // gather prices of visible days for heat scale
    let prices = [];
    const monthsData = [];
    for (let m = 0; m < monthsToShow; m++) {
      const first = new Date(base.getFullYear(), base.getMonth() + m, 1);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < first.getDay(); i++) cells.push(null);
      for (let d = 1; d <= days; d++) {
        const iso = toISO(new Date(first.getFullYear(), first.getMonth(), d));
        const price = opts.priceFor && iso >= today && !blocked.has(iso) ? opts.priceFor(iso) : null;
        if (price) prices.push(price);
        cells.push({ d, iso, price });
      }
      monthsData.push({ first, cells });
    }
    const min = Math.min(...prices), max = Math.max(...prices);

    monthsData.forEach(({ first, cells }) => {
      html += `<div class="dp-month"><h4>${MONTHS[first.getMonth()]} ${first.getFullYear()}</h4>
        <div class="dp-grid">${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(x => `<span class="dp-dow">${x}</span>`).join("")}`;
      cells.forEach(c => {
        if (!c) { html += `<span></span>`; return; }
        const past = c.iso < today;
        const isBlocked = blocked.has(c.iso);
        const selectableEnd = state.start && !state.end && validEnd(c.iso);
        const disabled = past || (isBlocked && !selectableEnd);
        const cls = ["dp-day"];
        if (disabled) cls.push("disabled");
        if (isBlocked && !past) cls.push("booked");
        if (c.iso === state.start) cls.push("start");
        if (c.iso === state.end) cls.push("end");
        if (state.start && state.end && c.iso > state.start && c.iso < state.end) cls.push("between");
        if (c.iso === today) cls.push("today");
        const style = state.heat && c.price && !disabled ? `style="--heat:${heatColor(c.price, min, max)}"` : "";
        if (style) cls.push("heat");
        html += `<button class="${cls.join(" ")}" data-iso="${c.iso}" ${disabled ? "disabled" : ""} ${style}
            title="${c.price ? inr(c.price) + " / night" : isBlocked ? "Unavailable" : ""}">
            <span>${c.d}</span>${state.heat && c.price && !disabled ? `<small>${c.price >= 10000 ? (c.price / 1000).toFixed(0) + "k" : (c.price / 1000).toFixed(1) + "k"}</small>` : ""}
          </button>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
    if (state.heat && prices.length) {
      html += `<div class="heat-legend"><span>Cheaper</span><i></i><span>Pricier</span></div>`;
    }
    html += `<div class="dp-foot">
      ${opts.heatToggle ? `<label class="switch-row"><input type="checkbox" class="dp-heat" ${state.heat ? "checked" : ""}><span class="switch"></span> Price heatmap <span class="new-pill">NEW</span></label>` : "<span></span>"}
      <button class="link-btn dp-clear">Clear dates</button></div>`;
    container.innerHTML = html;

    $(".dp-prev", container).onclick = e => { e.stopPropagation(); state.offset--; render(); };
    $(".dp-next", container).onclick = e => { e.stopPropagation(); state.offset++; render(); };
    $(".dp-clear", container).onclick = e => { e.stopPropagation(); state.start = state.end = null; render(); emit(); };
    const heatBox = $(".dp-heat", container);
    if (heatBox) heatBox.onchange = () => { state.heat = heatBox.checked; render(); };
    $$(".dp-day:not([disabled])", container).forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      const iso = btn.dataset.iso;
      if (!state.start || state.end || iso <= state.start || !validEnd(iso)) {
        if (blocked.has(iso)) return;
        state.start = iso; state.end = null;
      } else {
        state.end = iso;
      }
      render(); emit();
    });
  }
  function emit() { opts.onChange && opts.onChange(state.start, state.end); }

  render();
  return {
    set(start, end) { state.start = start; state.end = end; render(); },
    get: () => ({ start: state.start, end: state.end })
  };
}

/* ---------- guest picker ---------- */
function GuestPicker(container, initial, onChange, max = 16) {
  const g = Object.assign({ adults: 0, children: 0, infants: 0, pets: 0 }, initial);
  const rows = [
    ["adults", "Adults", "Ages 13 or above"],
    ["children", "Children", "Ages 2–12"],
    ["infants", "Infants", "Under 2"],
    ["pets", "Pets", "Bringing a service animal?"]
  ];
  function render() {
    container.innerHTML = rows.map(([k, label, hint]) => `
      <div class="guest-row">
        <div><b>${label}</b><p class="muted small">${hint}</p></div>
        <div class="stepper">
          <button class="step" data-k="${k}" data-d="-1" ${g[k] <= 0 ? "disabled" : ""} aria-label="Fewer ${label}">−</button>
          <span>${g[k]}</span>
          <button class="step" data-k="${k}" data-d="1" ${(k === "adults" || k === "children") && g.adults + g.children >= max ? "disabled" : ""} aria-label="More ${label}">+</button>
        </div>
      </div>`).join("");
    $$(".step", container).forEach(b => b.onclick = e => {
      e.stopPropagation();
      const k = b.dataset.k;
      g[k] = Math.max(0, g[k] + Number(b.dataset.d));
      if (k !== "adults" && g[k] > 0 && g.adults === 0) g.adults = 1;
      render();
      onChange({ ...g });
    });
  }
  render();
  return { get: () => ({ ...g }) };
}

function guestLabel(g) {
  const total = (g.adults || 0) + (g.children || 0);
  if (!total) return "";
  let s = `${total} guest${total > 1 ? "s" : ""}`;
  if (g.infants) s += `, ${g.infants} infant${g.infants > 1 ? "s" : ""}`;
  if (g.pets) s += `, ${g.pets} pet${g.pets > 1 ? "s" : ""}`;
  return s;
}

/* ---------- compare floating bar (NEW FEATURE) ---------- */
function renderCompareBar() {
  const bar = $("#compare-bar");
  const ids = Store.get("compare");
  document.body.classList.toggle("has-compare", ids.length > 0);
  if (!ids.length) { bar.classList.remove("show"); return; }
  const items = ids.map(getListing).filter(Boolean);
  bar.innerHTML = `
    <div class="cb-thumbs">${items.map(l => `<img src="${photo(l.images[0], 120)}" alt="" title="${esc(l.title)}">`).join("")}
      ${Array.from({ length: 3 - items.length }, () => `<span class="cb-empty"><i class="fa-solid fa-plus"></i></span>`).join("")}</div>
    <span class="cb-text"><b>${items.length}/3</b> selected to compare</span>
    <button class="link-btn cb-clear">Clear</button>
    <a class="btn btn-dark" href="#/compare">Compare</a>`;
  bar.classList.add("show");
  $(".cb-clear", bar).onclick = () => {
    Store.set("compare", []);
    $$(".compare-toggle input").forEach(i => (i.checked = false));
    renderCompareBar();
  };
}
