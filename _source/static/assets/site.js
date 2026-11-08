/* ---- Site settings: edit these before going live ---- */
const SITE = {
  email: "info@techreliancemw.online",
  whatsapp: "",                       // TODO: international format without +, e.g. 2659XXXXXXXX
  timeZone: "Africa/Blantyre",
  // Supabase project "Tech-Reliance Web". The publishable key is safe in the browser:
  // the leads table only allows anonymous INSERT (row level security), never read.
  supabaseUrl: "https://bifryasxcnzntwiiqohm.supabase.co",
  supabaseKey: "sb_publishable_2LbzjJu747TDjhkqGgFtuQ_OHOFkKQE"
};

(function chrome() {
  const btn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.textContent = "Menu"; btn.focus();
      }
    });
  }
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  const line = [SITE.email].concat(SITE.whatsapp ? ["WhatsApp +" + SITE.whatsapp] : []).join(", ");
  document.querySelectorAll("[data-contact-line]").forEach(el => el.textContent = line);
  document.querySelectorAll("[data-email]").forEach(el => { el.textContent = SITE.email; el.href = "mailto:" + SITE.email; });
})();

(function breachClock() {
  const timeEl = document.getElementById("clock-time");
  if (!timeEl) return;
  const start = Date.now(), total = 72 * 3600 * 1000, day = 24 * 3600 * 1000;
  const fills = ["d1", "d2", "d3"].map(id => document.getElementById(id));
  const dl = document.getElementById("clock-deadline");
  try {
    dl.textContent = new Intl.DateTimeFormat("en-GB", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      hour12: false, timeZone: SITE.timeZone
    }).format(new Date(start + total)) + " (Malawi time)";
  } catch (e) { /* fallback text stays */ }
  const pad = n => String(n).padStart(2, "0");
  function tick() {
    const left = Math.max(0, total - (Date.now() - start));
    const s = Math.floor(left / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    timeEl.innerHTML = pad(h) + '<span class="unit">h</span>' + pad(m) + '<span class="unit">m</span>' + pad(sec) + '<span class="unit">s</span>';
    timeEl.setAttribute("aria-label", h + " hours " + m + " minutes left");
    const used = total - left;
    fills.forEach((f, i) => { f.style.transform = "scaleX(" + Math.min(1, Math.max(0, (day - (used - i * day)) / day)) + ")"; });
  }
  tick();
  setInterval(tick, 1000);
})();

(function bookingForm() {
  const form = document.getElementById("book-form");
  if (!form) return;
  const err = document.getElementById("f-error");
  const result = document.getElementById("result");
  const submit = form.querySelector('button[type="submit"]');

  // Preselect the service from the link, e.g. contact.html#readiness-sprint
  const hash = location.hash.replace("#", "");
  const svc = document.getElementById("f-service");
  if (hash && svc && [...svc.options].some(o => o.value === hash)) svc.value = hash;

  function fallbackLinks(d) {
    const body = ["Exposure check request", "Name: " + d.name, "Organisation: " + d.organisation, "Email: " + d.email,
      "Phone: " + (d.phone || "-"), "Sector: " + d.sector, "People whose data we hold: " + d.data_subjects,
      "Interested in: " + d.service, "Notes: " + (d.message || "-")].join("\n");
    const mail = document.getElementById("send-email");
    mail.href = "mailto:" + SITE.email + "?subject=" + encodeURIComponent("Exposure check: " + d.organisation) + "&body=" + encodeURIComponent(body);
    const wa = document.getElementById("send-wa");
    if (SITE.whatsapp) { wa.href = "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(body); wa.hidden = false; }
    else { wa.hidden = true; }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    ["f-name", "f-org", "f-email"].forEach(id => document.getElementById(id).removeAttribute("aria-invalid"));
    const problems = [];
    if (!d.name.trim()) problems.push(["f-name", "your name"]);
    if (!d.organisation.trim()) problems.push(["f-org", "your organisation"]);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) problems.push(["f-email", "a valid work email"]);
    if (!form.querySelector("#f-consent").checked) problems.push(["f-consent", "your consent to be contacted"]);
    if (problems.length) {
      const names = problems.map(p => p[1]);
      const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
      err.textContent = "Add " + list + " to send your request.";
      problems.forEach(p => document.getElementById(p[0]).setAttribute("aria-invalid", "true"));
      document.getElementById(problems[0][0]).focus();
      return;
    }
    err.textContent = "";
    // Honeypot: bots fill the hidden field; pretend success and drop it.
    if (d.website) { showResult("sent"); return; }

    const payload = {
      name: d.name.trim().slice(0, 120), organisation: d.organisation.trim().slice(0, 160),
      email: d.email.trim().slice(0, 200), phone: (d.phone || "").trim().slice(0, 40) || null,
      sector: d.sector, data_subjects: d.data_subjects, service: d.service,
      message: (d.message || "").trim().slice(0, 2000) || null,
      source_page: location.pathname.slice(0, 200), consent: true
    };
    submit.disabled = true; submit.textContent = "Sending…";
    try {
      const res = await fetch(SITE.supabaseUrl + "/rest/v1/leads", {
        method: "POST",
        // Publishable keys go on the apikey header only (never Authorization: Bearer).
        headers: { "Content-Type": "application/json", "apikey": SITE.supabaseKey, "Prefer": "return=minimal" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      showResult("sent");
    } catch (ex) {
      fallbackLinks(Object.assign({}, d));
      showResult("fallback");
    } finally {
      submit.disabled = false; submit.textContent = "Request my check";
    }
  });

  function showResult(kind) {
    result.querySelectorAll("[data-kind]").forEach(el => el.hidden = el.dataset.kind !== kind);
    result.classList.add("show");
    result.focus();
  }
})();
