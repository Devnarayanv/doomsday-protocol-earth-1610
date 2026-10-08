/* =========================================================
   utils.js — helpers: formatting, dates, pricing, modal, toast
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- dates (all handled as local "YYYY-MM-DD" strings) ---------- */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON = MONTHS.map(m => m.slice(0, 3));

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function todayISO() { return toISO(new Date()); }
function addDays(iso, n) { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
function nightsBetween(a, b) { return Math.round((fromISO(b) - fromISO(a)) / 86400000); }
function fmtShort(iso) { const d = fromISO(iso); return `${MON[d.getMonth()]} ${d.getDate()}`; }
function fmtRange(a, b) {
  if (!a) return "";
  if (!b) return fmtShort(a);
  const da = fromISO(a), db = fromISO(b);
  return da.getMonth() === db.getMonth() ? `${MON[da.getMonth()]} ${da.getDate()} – ${db.getDate()}` : `${fmtShort(a)} – ${fmtShort(b)}`;
}
function datesInRange(a, b) {
  const out = [];
  for (let d = a; d < b; d = addDays(d, 1)) out.push(d);
  return out;
}

/* ---------- dynamic nightly pricing (powers the Cheapest-Dates Heatmap) ---------- */
function nightlyPrice(listing, iso) {
  const d = fromISO(iso);
  const dow = d.getDay();
  const month = d.getMonth();
  let factor = 1;
  if (dow === 5 || dow === 6) factor += 0.18;                 // weekend premium
  if ([11, 0, 4, 5].includes(month)) factor += 0.12;          // peak months (Dec, Jan, May, Jun)
  if ([6, 7].includes(month)) factor -= 0.08;                 // monsoon / off-season dip
  const noise = hash01(listing.id * 100000 + d.getFullYear() * 400 + month * 32 + d.getDate());
  factor += (noise - 0.5) * 0.24;
  return Math.round((listing.price * factor) / 50) * 50;
}

/** Booked dates per listing — generated so the calendar shows realistic unavailability */
function bookedDates(listing) {
  const rnd = seeded(listing.id * 13);
  const set = new Set();
  let cursor = todayISO();
  for (let i = 0; i < 6; i++) {
    cursor = addDays(cursor, 4 + Math.floor(rnd() * 14));
    const len = 2 + Math.floor(rnd() * 4);
    for (let j = 0; j < len; j++) set.add(addDays(cursor, j));
    cursor = addDays(cursor, len);
  }
  // the user's own bookings also block dates
  Store.get("bookings").filter(b => b.listingId === listing.id && b.status !== "cancelled")
    .forEach(b => datesInRange(b.checkIn, b.checkOut).forEach(d => set.add(d)));
  return set;
}

function priceBreakdown(listing, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut);
  const nightly = datesInRange(checkIn, checkOut).map(d => nightlyPrice(listing, d));
  const subtotal = nightly.reduce((a, b) => a + b, 0);
  const weeklyDiscount = nights >= 7 ? Math.round(subtotal * 0.1) : 0;
  const cleaning = listing.cleaningFee;
  const service = Math.round((subtotal - weeklyDiscount) * 0.14);
  const taxes = Math.round((subtotal - weeklyDiscount + cleaning) * 0.12);
  return { nights, nightly, subtotal, avg: Math.round(subtotal / nights), weeklyDiscount, cleaning, service, taxes,
    total: subtotal - weeklyDiscount + cleaning + service + taxes };
}

/** Price shown on cards: per night, or the total for the searched dates (when "display total" is on) */
function cardPrice(listing, search) {
  if (search.checkIn && search.checkOut) {
    const b = priceBreakdown(listing, search.checkIn, search.checkOut);
    return Store.get("showTotal")
      ? { main: inr(b.total), sub: `total for ${b.nights} night${b.nights > 1 ? "s" : ""}` }
      : { main: inr(b.avg), sub: "night" };
  }
  if (Store.get("showTotal")) {
    const total = listing.price * 5 + listing.cleaningFee + listing.price * 5 * 0.26;
    return { main: inr(total), sub: "total for 5 nights" };
  }
  return { main: inr(listing.price), sub: "night" };
}

/* ---------- toast ---------- */
function toast(msg, icon = "fa-circle-check") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${msg}</span>`;
  $("#toasts").appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 2800);
}

/* ---------- modal ---------- */
function openModal(html, { wide = false, full = false, onClose } = {}) {
  closeModal();
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `<div class="modal ${wide ? "wide" : ""} ${full ? "full" : ""}" role="dialog" aria-modal="true">
      <button class="icon-btn modal-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      ${html}
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => wrap.classList.add("show"));
  const close = () => { closeModal(); onClose && onClose(); };
  wrap.addEventListener("mousedown", e => { if (e.target === wrap) close(); });
  $(".modal-close", wrap).addEventListener("click", close);
  return $(".modal", wrap);
}
function closeModal() {
  $$(".modal-backdrop").forEach(m => m.remove());
  document.body.classList.remove("no-scroll");
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function initials(name) {
  return (name || "?").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
function avatarColor(name) {
  const colors = ["#e0565b", "#3b82c4", "#2a9d8f", "#e9a23b", "#8e5bd3", "#d9487c", "#4c8c4a", "#c0703a"];
  let h = 0;
  for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
function avatar(name, size = 40) {
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${avatarColor(name)};font-size:${size * 0.4}px">${esc(initials(name))}</span>`;
}

function stars(n) {
  return `<i class="fa-solid fa-star"></i> ${Number(n).toFixed(2).replace(/0$/, "")}`;
}

function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs] = raw.split("?");
  return { path, parts: path.split("/").filter(Boolean), query: Object.fromEntries(new URLSearchParams(qs || "")) };
}
function buildQuery(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "" && v !== 0) p.set(k, v); });
  const s = p.toString();
  return s ? "?" + s : "";
}

/** "★ 4.9 · 312 reviews", or "★ New" for listings without reviews yet */
function ratingLine(l, withCount = true) {
  if (!l.reviewCount) return `<i class="fa-solid fa-star"></i> New`;
  return withCount ? `${stars(l.rating)} · ${l.reviewCount} review${l.reviewCount > 1 ? "s" : ""}` : stars(l.rating);
}
