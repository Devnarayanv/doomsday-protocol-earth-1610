/* =========================================================
   features.js — features that the original Airbnb does NOT have
   (each one is listed in New_Features.pdf)
   ========================================================= */

/* ---------- 1. Smart Stay Match: score a listing against quiz answers ---------- */
const MATCH_QUESTIONS = [
  { key: "vibe", title: "What's the vibe of this trip?", sub: "Pick as many as you like.", multi: true, options: [
    ["relax", "Relax & recharge", "fa-spa"], ["adventure", "Adventure", "fa-person-hiking"], ["party", "Nightlife", "fa-champagne-glasses"],
    ["romantic", "Romantic", "fa-heart"], ["culture", "Culture & food", "fa-landmark"], ["work", "Work remotely", "fa-laptop"]] },
  { key: "scenery", title: "Which scenery calls you?", sub: "Pick as many as you like.", multi: true, options: [
    ["beach", "Beach", "fa-umbrella-beach"], ["mountain", "Mountains", "fa-mountain"], ["city", "Big city", "fa-city"],
    ["lake", "Lakes", "fa-water"], ["nature", "Forest & countryside", "fa-tree"]] },
  { key: "who", title: "Who's coming along?", sub: "We'll match the size of the place.", multi: false, options: [
    ["solo", "Just me", "fa-user"], ["couple", "Couple", "fa-user-group"], ["family", "Family", "fa-people-roof"], ["friends", "Group of friends", "fa-users"]] },
  { key: "budget", title: "What's your nightly budget?", sub: "Drag the slider — we'll lean towards stays under it.", type: "budget" },
  { key: "must", title: "Any must-haves?", sub: "Optional — skip if you're flexible.", multi: true, options: [
    ["pool", "Pool", "fa-water-ladder"], ["wifi", "Fast Wi-Fi", "fa-wifi"], ["pets", "Pet friendly", "fa-paw"],
    ["eco", "Eco-friendly", "fa-leaf"], ["kitchen", "Kitchen", "fa-kitchen-set"], ["instant", "Instant Book", "fa-bolt"]] }
];

function matchScore(l, a) {
  let score = 0, max = 0;
  const reasons = [];
  // vibe (weight 30): half from the listing's tags, half from its neighbourhood vibe ratings
  if (a.vibe && a.vibe.length) {
    max += 30;
    const v = l.vibe;
    const metric = {
      relax: v.calm / 5, adventure: v.nature / 5, party: v.nightlife / 5,
      romantic: (v.calm + v.nature) / 10, culture: v.food / 5, work: workScore(l) / 100
    };
    let sum = 0;
    a.vibe.forEach(key => {
      const tagHit = l.tags.includes(key) ? 1 : 0;
      sum += 0.5 * tagHit + 0.5 * metric[key];
      if (tagHit && metric[key] >= 0.7 && reasons.length < 2) reasons.push(MATCH_QUESTIONS[0].options.find(o => o[0] === key)[1]);
    });
    score += 30 * sum / a.vibe.length;
  }
  // scenery (weight 25)
  if (a.scenery && a.scenery.length) {
    max += 25;
    const sceneryMap = { beach: ["beach"], mountain: ["mountain", "views", "cabins"], city: ["city", "iconic"], lake: ["lake"], nature: ["nature", "countryside", "treehouse"] };
    const hits = a.scenery.filter(s => sceneryMap[s].some(t => l.tags.includes(t) || l.categories.includes(t)));
    score += 25 * Math.min(1, hits.length / Math.max(1, Math.min(a.scenery.length, 2)));
    hits.slice(0, 1).forEach(h => reasons.push(MATCH_QUESTIONS[1].options.find(o => o[0] === h)[1]));
  }
  // group size (weight 15)
  if (a.who) {
    max += 15;
    const need = { solo: 1, couple: 2, family: 4, friends: 5 }[a.who];
    if (l.guests >= need) {
      const tooBig = l.guests > need * 3;
      const familyFit = a.who === "family" || a.who === "friends" ? l.vibe.family / 5 : 1;
      score += (tooBig ? 8 : 15) * (0.6 + 0.4 * familyFit);
      if (!tooBig) reasons.push(`Fits ${a.who === "solo" ? "you" : "your " + a.who}`);
    }
  }
  // budget (weight 20): full marks for using 40–100% of the budget, less for far cheaper or pricier
  if (a.budget) {
    max += 20;
    const ratio = l.price / a.budget;
    if (ratio <= 1) { score += ratio >= 0.4 ? 20 : 14 + ratio * 15; reasons.push("Within budget"); }
    else score += Math.max(0, 20 - (ratio - 1) * 40);
  }
  // must-haves (weight 10)
  if (a.must && a.must.length) {
    max += 10;
    const ok = a.must.filter(m =>
      m === "eco" ? l.eco >= 75 : m === "wifi" ? l.wifi >= 100 : m === "instant" ? l.instant : l.amenities.includes(m));
    score += 10 * ok.length / a.must.length;
    if (ok.length === a.must.length) reasons.push("Has all must-haves");
  }
  // small nudge for highly rated stays so ties break sensibly
  const pct = max ? Math.round((score / max) * 95 + (l.rating - 4.7) * 15) : 0;
  return { pct: Math.max(1, Math.min(99, pct)), reasons: reasons.slice(0, 3) };
}

/* ---------- 2. Cheapest window finder (used with the price heatmap) ---------- */
function cheapestWindow(listing, nights = 3, horizon = 60) {
  const blocked = bookedDates(listing);
  let best = null;
  for (let i = 1; i < horizon; i++) {
    const start = addDays(todayISO(), i);
    const days = Array.from({ length: nights }, (_, k) => addDays(start, k));
    if (days.some(d => blocked.has(d))) continue;
    const total = days.reduce((s, d) => s + nightlyPrice(listing, d), 0);
    if (!best || total < best.total) best = { start, end: addDays(start, nights), total };
  }
  if (!best) return null;
  best.saving = listing.price * nights * 1.1 - best.total;
  return best;
}

/* ---------- 3. Eco Score + Work-from-Stay score helpers ---------- */
function ecoLabel(score) {
  return score >= 80 ? ["Excellent", "good"] : score >= 60 ? ["Good", "ok"] : ["Basic", "low"];
}
function workScore(l) {
  let s = Math.min(60, Math.round(Math.log2(Math.max(1, l.wifi)) * 6.3));
  if (l.desk) s += 25;
  if (l.amenities.includes("workspace")) s += 10;
  if (l.vibe.calm >= 4) s += 5;
  return Math.min(100, s);
}
function ecoReasons(l) {
  const r = [];
  if (l.amenities.includes("solar")) r.push(["fa-solar-panel", "Runs on solar power"]);
  if (l.amenities.includes("ev")) r.push(["fa-charging-station", "EV charging on site"]);
  if (l.amenities.includes("garden")) r.push(["fa-seedling", "Organic kitchen garden"]);
  if (l.vibe.nature >= 4) r.push(["fa-tree", "Low-density natural area"]);
  if (!l.amenities.includes("ac")) r.push(["fa-wind", "Naturally ventilated, no AC"]);
  if (l.amenities.includes("pool")) r.push(["fa-droplet", "Pool uses water-saving filter"]);
  r.push(["fa-recycle", "Recycling & refill stations"]);
  return r.slice(0, 4);
}

/* ---------- 4. Split the bill ---------- */
function SplitBill(container, total, people, onChange) {
  let rows = Array.from({ length: Math.max(1, people) }, (_, i) => ({ name: i === 0 ? (Store.get("user")?.name || "You") : `Guest ${i + 1}`, share: 0 }));
  let mode = "equal";
  function equalize() {
    const each = Math.floor(total / rows.length);
    rows.forEach((r, i) => (r.share = i === 0 ? total - each * (rows.length - 1) : each));
  }
  equalize();
  function render() {
    const sum = rows.reduce((s, r) => s + Number(r.share || 0), 0);
    container.innerHTML = `
      <div class="split-box">
        <div class="counter-row" style="padding-top:0">
          <div><b>Split between</b><p class="muted small">${mode === "equal" ? "Equal shares" : "Custom amounts"}</p></div>
          <div class="stepper">
            <button class="step" data-d="-1" ${rows.length <= 1 ? "disabled" : ""} aria-label="Fewer people">−</button>
            <span>${rows.length}</span>
            <button class="step" data-d="1" ${rows.length >= 12 ? "disabled" : ""} aria-label="More people">+</button>
          </div>
        </div>
        <div class="seg" style="margin:6px 0 4px">
          <button type="button" data-mode="equal" class="${mode === "equal" ? "on" : ""}">Split equally</button>
          <button type="button" data-mode="custom" class="${mode === "custom" ? "on" : ""}">Custom amounts</button>
        </div>
        <div class="split-people">
          ${rows.map((r, i) => `
            <div class="split-person">
              <input value="${esc(r.name)}" data-name="${i}" aria-label="Name of person ${i + 1}">
              <input type="number" min="0" value="${r.share}" data-share="${i}" ${mode === "equal" ? "readonly" : ""} aria-label="Share of person ${i + 1}">
              <b>${inr(r.share)}</b>
            </div>`).join("")}
        </div>
        <div class="split-total ${sum !== total ? "warn" : ""}">
          <span>${sum !== total ? `<i class="fa-solid fa-triangle-exclamation"></i> Shares add up to ${inr(sum)} — ${sum > total ? "over" : "short"} by ${inr(Math.abs(total - sum))}` : `<i class="fa-solid fa-circle-check"></i> Shares add up to the total`}</span>
          <span>Total ${inr(total)}</span>
        </div>
        <button type="button" class="btn btn-outline btn-block split-copy" style="margin-top:14px"><i class="fa-regular fa-copy"></i> Copy payment requests</button>
      </div>`;
    $$(".step", container).forEach(b => b.onclick = () => {
      const d = Number(b.dataset.d);
      if (d > 0) rows.push({ name: `Guest ${rows.length + 1}`, share: 0 }); else rows.pop();
      if (mode === "equal") equalize();
      render(); emit();
    });
    $$(".seg button", container).forEach(b => b.onclick = () => { mode = b.dataset.mode; if (mode === "equal") equalize(); render(); emit(); });
    $$("[data-name]", container).forEach(inp => inp.oninput = () => { rows[inp.dataset.name].name = inp.value; emit(); });
    $$("[data-share]", container).forEach(inp => inp.onchange = () => { rows[inp.dataset.share].share = Math.max(0, Number(inp.value) || 0); render(); emit(); });
    $(".split-copy", container).onclick = () => {
      const text = summary();
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => toast("Payment requests copied — paste them in your group chat", "fa-copy"),
        () => openModal(`<div class="modal-head">Payment requests</div><textarea class="input" rows="10">${esc(text)}</textarea>`)
      );
    };
  }
  function summary() {
    return `Trip cost split (${inr(total)} total):\n` + rows.map(r => `• ${r.name}: ${inr(r.share)}`).join("\n");
  }
  function emit() { onChange && onChange(rows.map(r => ({ ...r }))); }
  render(); emit();
  return { setTotal(t) { total = t; if (mode === "equal") equalize(); render(); emit(); } };
}

/* ---------- 5. Smart packing list ---------- */
function packingList(listing, booking) {
  const month = fromISO(booking.checkIn).getMonth();
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const cold = listing.categories.some(c => ["cabins"].includes(c)) || /Iceland|Norway|Canada|Switzerland|Manali|Italy/.test(listing.location) || [11, 0, 1].includes(month) && listing.lat > 25;
  const beachy = listing.categories.some(c => ["beach", "tropical", "pools"].includes(c));
  const outdoorsy = listing.vibe.nature >= 4;
  const city = listing.categories.includes("iconic");
  const monsoon = listing.country === "India" && [5, 6, 7, 8].includes(month);
  const g = (booking.guests && booking.guests.adults) || 1;
  const clothes = Math.min(nights + 1, 7);

  const list = {
    "Essentials": ["ID / passport", "Phone + charger", "Booking confirmation", "Cards & some cash", "Medicines", "Reusable water bottle"],
    "Clothing": [`${clothes} sets of daywear`, "Sleepwear", "Comfortable walking shoes"],
    "Toiletries": ["Toothbrush & paste", "Sunscreen", "Deodorant", "Personal care items"],
    "Extras": []
  };
  if (cold) list["Clothing"].push("Thermal layers", "Warm jacket", "Woolen socks & gloves", "Beanie");
  if (beachy) { list["Clothing"].push("Swimwear", "Flip-flops", "Sunhat"); list["Extras"].push("Beach towel", "Sunglasses", "Waterproof phone pouch"); }
  if (outdoorsy) list["Extras"].push("Daypack", "Torch / headlamp", "Insect repellent", "Hiking shoes");
  if (city) list["Extras"].push("Power bank", "Metro card / transit app", "Smart-casual outfit for dinner");
  if (monsoon) list["Extras"].push("Umbrella", "Rain jacket", "Quick-dry clothes");
  if (listing.desk || listing.amenities.includes("workspace")) list["Extras"].push("Laptop & charger", "Headphones");
  if (listing.amenities.includes("pets") && booking.guests && booking.guests.pets) list["Extras"].push("Pet food & bowl", "Leash");
  if (g > 2) list["Extras"].push("Board games / cards");
  if (!listing.amenities.includes("kitchen")) list["Extras"].push("Snacks for late nights");
  if (!list["Extras"].length) list["Extras"].push("A good book");
  return list;
}

function openPackingList(booking) {
  const l = getListing(booking.listingId);
  const lists = packingList(l, booking);
  const saved = Store.get("packing")[booking.id] || {};
  const icons = { Essentials: "fa-passport", Clothing: "fa-shirt", Toiletries: "fa-pump-soap", Extras: "fa-suitcase-rolling" };
  const total = Object.values(lists).flat().length;
  const m = openModal(`
    <div class="modal-head">Smart packing list <span class="new-pill">NEW</span></div>
    <p class="muted small">Generated for <b>${esc(l.city)}</b> · ${fmtRange(booking.checkIn, booking.checkOut)} · ${nightsBetween(booking.checkIn, booking.checkOut)} nights. Based on destination climate, season and amenities.</p>
    <div class="progress"><i id="pk-bar"></i></div>
    ${Object.entries(lists).map(([cat, items]) => `
      <div class="packing-cat"><h4><i class="fa-solid ${icons[cat]}"></i> ${cat}</h4>
        ${items.map(it => `<label class="check"><input type="checkbox" data-item="${esc(it)}" ${saved[it] ? "checked" : ""}><span>${esc(it)}</span></label>`).join("")}
      </div>`).join("")}
  `);
  const bar = $("#pk-bar", m);
  const upd = () => {
    const state = {};
    $$("[data-item]", m).forEach(c => { if (c.checked) state[c.dataset.item] = true; });
    Store.update("packing", p => ({ ...p, [booking.id]: state }));
    bar.style.width = (Object.keys(state).length / total * 100) + "%";
  };
  $$("[data-item]", m).forEach(c => c.onchange = upd);
  bar.style.width = (Object.keys(saved).length / total * 100) + "%";
}

/* ---------- 6. Add to calendar (.ics) ---------- */
function downloadICS(booking) {
  const l = getListing(booking.listingId);
  const d = s => s.replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Airbnb Clone Earth-1610//Trips//EN", "BEGIN:VEVENT",
    `UID:${booking.id}@airbnb-clone-1610`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;VALUE=DATE:${d(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${d(booking.checkOut)}`,
    `SUMMARY:Stay at ${l.title}`,
    `LOCATION:${l.location}`,
    `DESCRIPTION:Host: ${l.host.name}\\nConfirmation: ${booking.id}\\nTotal paid: INR ${booking.total}`,
    `GEO:${l.lat};${l.lng}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Trip tomorrow — check your packing list!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `trip-${l.city.split(",")[0].toLowerCase().replace(/\s+/g, "-")}-${booking.checkIn}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Calendar file downloaded — open it to add the trip", "fa-calendar-plus");
}

/* ---------- 7. Voice search ---------- */
function startVoiceSearch(onResult) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Voice search isn't supported in this browser (try Chrome or Edge)", "fa-microphone-slash"); return; }
  const rec = new SR();
  rec.lang = "en-IN";
  rec.interimResults = false;
  const btn = $("#mic-btn");
  btn.classList.add("listening");
  toast("Listening… say a place, like “beach stays in Goa”", "fa-microphone");
  rec.onresult = e => onResult(e.results[0][0].transcript);
  rec.onerror = () => toast("Couldn't hear that — please try again", "fa-microphone-slash");
  rec.onend = () => btn.classList.remove("listening");
  rec.start();
}

/** Turns a spoken phrase into a destination + optional category */
function parseVoice(text) {
  const t = text.toLowerCase().replace(/[.?!]/g, "");
  let cat = "";
  const catWords = { beach: "beach", pool: "pools", cabin: "cabins", city: "iconic", lake: "lake", treehouse: "treehouse", mansion: "mansions", tiny: "tiny", countryside: "countryside", view: "views", eco: "green", green: "green", work: "work" };
  Object.entries(catWords).forEach(([w, c]) => { if (t.includes(w)) cat = c; });
  const m = t.match(/\b(?:in|at|near|to)\s+([a-z\s]+)$/);
  let where = m ? m[1].trim() : "";
  if (!where) {
    const known = allListings().find(l => t.includes(l.city.split(",")[0].toLowerCase()) || t.includes(l.country.toLowerCase()));
    if (known) where = t.includes(known.country.toLowerCase()) ? known.country : known.city.split(",")[0];
  }
  return { where, cat };
}

/* ---------- 8. Travel rewards: points + badges ---------- */
const BADGES = [
  { key: "first", icon: "fa-plane-departure", name: "First Trip", desc: "Book your first stay", test: s => s.trips >= 1 },
  { key: "globe", icon: "fa-earth-asia", name: "Globetrotter", desc: "Book stays in 3 countries", test: s => s.countries >= 3 },
  { key: "eco", icon: "fa-leaf", name: "Eco Warrior", desc: "Book a stay with Eco Score 80+", test: s => s.eco },
  { key: "work", icon: "fa-laptop-house", name: "Digital Nomad", desc: "Book a Work-friendly stay", test: s => s.work },
  { key: "curator", icon: "fa-heart", name: "Curator", desc: "Save 5 stays to your wishlist", test: s => s.saved >= 5 },
  { key: "long", icon: "fa-moon", name: "Long Hauler", desc: "Book a 7+ night stay", test: s => s.longest >= 7 },
  { key: "split", icon: "fa-people-arrows", name: "Fair Splitter", desc: "Split a bill with friends", test: s => s.split },
  { key: "lux", icon: "fa-gem", name: "High Roller", desc: "Book a stay over ₹1,00,000", test: s => s.maxTotal >= 100000 }
];
const TIERS = [["Explorer", 0], ["Voyager", 2000], ["Nomad", 6000], ["Legend", 15000]];

function travelStats() {
  const bookings = Store.get("bookings").filter(b => b.status !== "cancelled");
  const ls = bookings.map(b => getListing(b.listingId)).filter(Boolean);
  return {
    trips: bookings.length,
    nights: bookings.reduce((s, b) => s + nightsBetween(b.checkIn, b.checkOut), 0),
    countries: new Set(ls.map(l => l.country)).size,
    eco: ls.some(l => l.eco >= 80),
    work: ls.some(l => workScore(l) >= 80),
    saved: Store.get("wishlist").length,
    longest: Math.max(0, ...bookings.map(b => nightsBetween(b.checkIn, b.checkOut))),
    split: bookings.some(b => b.split && b.split.length > 1),
    maxTotal: Math.max(0, ...bookings.map(b => b.total))
  };
}
function tierFor(points) {
  let cur = TIERS[0], next = null;
  TIERS.forEach((t, i) => { if (points >= t[1]) { cur = t; next = TIERS[i + 1] || null; } });
  return { name: cur[0], next, progress: next ? (points - cur[1]) / (next[1] - cur[1]) : 1 };
}
/** 1 point per ₹100 spent, ×2 for green stays */
function pointsFor(listing, total) {
  return Math.round(total / 100) * (listing.eco >= 80 ? 2 : 1);
}

/* ---------- 9. Surprise me ---------- */
function surpriseMe(pool) {
  const list = pool && pool.length ? pool : allListings();
  const pick = list[Math.floor(Math.random() * list.length)];
  const m = openModal(`
    <div style="text-align:center">
      <div class="spin-globe"><i class="fa-solid fa-earth-americas"></i></div>
      <h2>Spinning the globe of Earth-1610…</h2>
      <p class="muted">Finding you a random stay</p>
    </div>`);
  setTimeout(() => {
    if (!document.body.contains(m)) return;
    m.innerHTML = `
      <button class="icon-btn modal-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="modal-head">Your surprise destination <span class="new-pill">NEW</span></div>
      <img src="${photo(pick.images[0])}" alt="" style="border-radius:14px;width:100%;height:260px;object-fit:cover">
      <h2 style="margin-top:16px">${esc(pick.location)}</h2>
      <p class="muted">${esc(pick.title)}</p>
      <p style="margin-top:8px"><b>${inr(pick.price)}</b> night · ${stars(pick.rating)}</p>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-outline" id="spin-again"><i class="fa-solid fa-shuffle"></i> Spin again</button>
        <a class="btn btn-brand" style="flex:1" href="#/rooms/${pick.id}">View this stay</a>
      </div>`;
    $(".modal-close", m).onclick = closeModal;
    $("#spin-again", m).onclick = () => surpriseMe(pool);
    $("a", m).onclick = closeModal;
  }, 1300);
}

/* ---------- 10. Celebrate a booking ---------- */
function confetti() {
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#FF385C", "#FFB400", "#00A699", "#7b2ff7", "#3b82c4"];
  for (let i = 0; i < 120; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    p.style.animationDelay = Math.random() * 0.5 + "s";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

/* ---------- 11. Message host with simulated replies ---------- */
function openHostChat(l) {
  const m = openModal(`
    <div class="modal-head">Message ${esc(l.host.name)}</div>
    <div class="chat">
      <div class="chat-log" id="chat-log">
        <div class="msg them">Hi! I'm ${esc(l.host.name)} 👋 Thanks for your interest in my place in ${esc(l.city)}. Ask me anything — check-in, parking, things to do…</div>
      </div>
      <form id="chat-form"><input class="input" placeholder="Type a message" required aria-label="Message"><button class="btn btn-dark">Send</button></form>
    </div>`);
  const log = $("#chat-log", m);
  $("#chat-form", m).onsubmit = e => {
    e.preventDefault();
    const input = $("input", e.target);
    const text = input.value.trim();
    if (!text) return;
    log.insertAdjacentHTML("beforeend", `<div class="msg me">${esc(text)}</div><div class="msg them typing">${esc(l.host.name)} is typing…</div>`);
    input.value = "";
    log.scrollTop = log.scrollHeight;
    setTimeout(() => {
      const t = $(".typing", log);
      if (!t) return;
      t.classList.remove("typing");
      t.textContent = hostReply(text, l);
      log.scrollTop = log.scrollHeight;
    }, 1200);
  };
}
function hostReply(q, l) {
  q = q.toLowerCase();
  if (/check.?in|arrive|time|key/.test(q)) return "Check-in is from 3 PM with a self check-in keypad. I'll send the code the day before you arrive.";
  if (/park|car/.test(q)) return l.amenities.includes("parking") ? "Yes, there's free parking right on the premises." : "There's no private parking, but a public lot is about 5 minutes away.";
  if (/wifi|internet|work/.test(q)) return `Wi-Fi runs at about ${l.wifi} Mbps${l.desk ? " and there's a proper desk" : ""} — good for video calls.`;
  if (/pet|dog|cat/.test(q)) return l.amenities.includes("pets") ? "Pets are welcome! Please keep them off the beds 🐾" : "Sorry, pets aren't allowed here (service animals are fine).";
  if (/food|eat|restaurant/.test(q)) { const f = l.nearby.find(n => n.type === "food"); return f ? `You have to try ${f.name}, only ${f.km} km away!` : "There are great local spots nearby — I'll leave a guide in the house."; }
  if (/discount|cheaper|price/.test(q)) return "Stays of 7 nights or more get 10% off automatically. Also check the price heatmap for cheaper dates!";
  return "Great question! I usually reply within an hour — happy to help with anything you need for your trip.";
}
