const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const waLink = text => `https://wa.me/${STUDIO.whatsapp}?text=${encodeURIComponent(text)}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MEMBER_COLORS = ["#C8453C", "#4E9660", "#3D6DB3", "#DDAE36"];

function bindBasics() {
  const msg = `Merhaba, ${STUDIO.name} hakkında bilgi almak ve ders ayırtmak istiyorum.`;
  document.querySelectorAll(".js-wa").forEach(a => { a.href = waLink(msg); });
  $("#call-link").href = `tel:+${STUDIO.whatsapp}`;
  $("#maps-link").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO.mapsQuery)}`;
  $("#year").textContent = new Date().getFullYear();
  $("#info").innerHTML = `
    <div><dt>Adres</dt><dd>${esc(STUDIO.address)}</dd></div>
    <div><dt>Saatler</dt><dd>Her gün ${String(STUDIO.open).padStart(2, "0")}:00 – ${STUDIO.close}:00</dd></div>
    <div><dt>Telefon ve WhatsApp</dt><dd><span class="phone" id="phone-text">${esc(STUDIO.phone)}</span><button class="copy" type="button" id="copy-phone">Kopyala</button></dd></div>
    <div><dt>Instagram</dt><dd><a href="https://instagram.com/${esc(STUDIO.instagram)}" target="_blank" rel="noopener">@${esc(STUDIO.instagram)}</a></dd></div>`;
  $("#copy-phone").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(STUDIO.phone); e.target.textContent = "Kopyalandı"; }
    catch { const r = document.createRange(); r.selectNodeContents($("#phone-text")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });
}

/* ================= FOTOĞRAF PARALLAX ================= */
function initPhoto() {
  const sec = $("#studyo"), img = $("#photo-img");
  const update = () => {
    const r = sec.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    img.style.setProperty("--py", `${(p - 0.5) * -8}%`);
  };
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  update();
}

/* ================= EKİP ================= */
function initTeam() {
  const members = STUDIO.team.filter(m => m.photo);
  if (!members.length) return;
  $("#team").innerHTML = members.map((m, i) => `
    <figure class="member" style="--i:${i};--c:${MEMBER_COLORS[i % MEMBER_COLORS.length]}">
      <img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">
      <figcaption>
        <svg viewBox="0 0 34 14" aria-hidden="true"><path d="${COIL_PATH}"/></svg>
        <h3>${esc(m.name)}</h3><span>${esc(m.role)}</span>
      </figcaption>
    </figure>`).join("");
  $("#ekip").hidden = false;
  $('.nav a[href="#ekip"]').hidden = false;
}

/* ================= TEST + SAAT SEÇİCİ ================= */
const booking = (() => {
  const state = { name: "", format: STUDIO.formats[0], day: 0, time: null };
  const dayDate = o => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + o); return d; };
  const dayLabel = o => o === 0 ? "Bugün" : o === 1 ? "Yarın" : DAY_NAMES[dayDate(o).getDay()].slice(0, 3);
  const hoursFor = o => {
    const first = o === 0 ? Math.max(STUDIO.open, new Date().getHours() + 1) : STUDIO.open;
    const list = [];
    for (let h = first; h < STUDIO.close; h++) list.push(`${String(h).padStart(2, "0")}:00`);
    return list;
  };
  if (!hoursFor(0).length) state.day = 1;   // after the last slot, open on tomorrow instead of an empty today
  const whenText = () => { const d = dayDate(state.day); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAY_NAMES[d.getDay()]}`; };
  const message = () => {
    const hi = state.name ? `Merhaba, ben ${state.name}.` : "Merhaba,";
    return state.time
      ? `${hi} ${whenText()} ${state.time} için ${state.format} pilates dersi ayırtmak istiyorum.`
      : `${hi} ${whenText()} için ${state.format} pilates dersi ayırtmak istiyorum. Uygun saatleri öğrenebilir miyim?`;
  };
  function renderSummary() {
    $("#summary").innerHTML = `<b>${esc(state.format)}</b><span>${esc(whenText())}</span><span class="${state.time ? "" : "todo"}">${state.time ? esc(state.time) : "Saat seçilmedi"}</span>`;
    const btn = $("#book-btn");
    btn.href = waLink(message());
    btn.textContent = state.time ? "WhatsApp'tan ayırt" : "Uygun saatleri sor";
  }
  function render() {
    $("#f-format").innerHTML = STUDIO.formats.map(f => `<button type="button" class="chip" data-format="${esc(f)}" aria-pressed="${f === state.format}">${esc(f)}</button>`).join("");
    $("#f-day").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = dayDate(i);
      return `<button type="button" class="chip" data-day="${i}" aria-pressed="${i === state.day}"${hoursFor(i).length ? "" : " disabled"}>${dayLabel(i)}<small>${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}</small></button>`;
    }).join("");
    const hours = hoursFor(state.day);
    if (!hours.includes(state.time)) state.time = null;
    $("#f-time").innerHTML = hours.length
      ? hours.map(h => `<button type="button" class="chip" data-time="${h}" aria-pressed="${h === state.time}">${h}</button>`).join("")
      : `<p class="fine">Bugün için saat kalmadı, yarını seç.</p>`;
    renderSummary();
  }
  $("#booking").addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    if (b.dataset.format) state.format = b.dataset.format;
    if (b.dataset.day) state.day = Number(b.dataset.day);
    if (b.dataset.time) state.time = b.dataset.time;
    render();
  });
  $("#f-name").addEventListener("input", e => { state.name = e.target.value.trim(); renderSummary(); });
  return { render, set(p) { Object.assign(state, p); render(); } };
})();

const RESULTS = {
  hamile: { title: "Hamile pilatesi", format: "Bireysel", text: "Doktor onayıyla, hamileliğinin dönemine uygun, pelvik taban ve nefes odaklı bireysel program." },
  klinik: { title: "Bel ve boyun programı", format: "Bireysel", text: "Bel fıtığı, boyun ve sırt ağrıları için hareketlerin sana göre seçildiği, birebir ilerleyen dersler." },
  double: { title: "Double ders", format: "Double", text: "Arkadaşın, eşin ya da annenle birlikte, iki kişiye özel ilgiyle." },
  grup: { title: "Grup reformer", format: "Grup", text: "Küçük grupta, enerjisi yüksek ve motive edici dersler. Düzenli ilerlemenin en keyifli yolu." },
  bireysel: { title: "Bireysel ders", format: "Bireysel", text: "Tamamen sana özel program ve saat. Eğitmenin sadece seninle ilgilenir." }
};
const QUESTIONS = [
  { q: "Şu an hamile misin ya da yakın zamanda doğum yaptın mı?", a: [["Evet", "hamile"], ["Hayır", null]] },
  { q: "Bel fıtığı, boyun ya da sırt ağrın var mı?", a: [["Evet, düzenli ağrım var", "klinik"], ["Hayır ya da ara sıra", null]] },
  { q: "Derste en çok ne istersin?", a: [["Arkadaşımla birlikte gelmek", "double"], ["Grubun enerjisi ve motivasyonu", "grup"], ["Tamamen bana özel ilgi", "bireysel"]] }
];
const quiz = { step: 0, result: null };
function renderQuiz() {
  const el = $("#quiz");
  const bar = `<div class="progress">${QUESTIONS.map((_, i) => `<i class="${quiz.result || i <= quiz.step ? "on" : ""}"></i>`).join("")}</div>`;
  if (quiz.result) {
    const r = RESULTS[quiz.result];
    el.innerHTML = `${bar}<div class="result">
      <h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>
      <a class="btn btn-light" href="${waLink(`Merhaba, sitenizdeki testte bana ${r.title} önerildi. Bilgi almak istiyorum.`)}" target="_blank" rel="noopener">Sonucu WhatsApp'tan gönder</a>
      <button class="linkish" type="button" data-use="${r.format}">Bu formatla saat seç</button>
      <button class="linkish" type="button" data-restart>Testi baştan al</button></div>`;
    return;
  }
  const Q = QUESTIONS[quiz.step];
  el.innerHTML = `${bar}<p class="step">${quiz.step + 1} / ${QUESTIONS.length}</p><h3>${esc(Q.q)}</h3>
    <div class="options">${Q.a.map(([label], i) => `<button class="opt" type="button" data-i="${i}">${esc(label)}</button>`).join("")}</div>`;
}
$("#quiz").addEventListener("click", e => {
  const opt = e.target.closest(".opt");
  if (opt) { const val = QUESTIONS[quiz.step].a[Number(opt.dataset.i)][1]; if (val) quiz.result = val; else quiz.step += 1; return renderQuiz(); }
  const use = e.target.closest("[data-use]");
  if (use) { booking.set({ format: use.dataset.use }); $("#booking").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if (e.target.closest("[data-restart]")) { quiz.step = 0; quiz.result = null; renderQuiz(); }
});

/* ================= YORUMLAR ================= */
function initReviews() {
  let i = 0, timer = null;
  const text = $("#q-text"), who = $("#q-who"), dots = $("#q-dots");
  const paint = () => {
    const r = STUDIO.reviews[i];
    text.textContent = `“${r.text}”`;
    who.innerHTML = `${esc(r.who)} <span>· Google yorumu</span>`;
    dots.innerHTML = STUDIO.reviews.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  };
  const show = n => {
    i = (n + STUDIO.reviews.length) % STUDIO.reviews.length;
    text.classList.add("fade");
    setTimeout(() => { paint(); text.classList.remove("fade"); }, 250);
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); };
  $("#q-prev").addEventListener("click", () => { show(i - 1); auto(); });
  $("#q-next").addEventListener("click", () => { show(i + 1); auto(); });
  paint();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) auto();
}

bindBasics();
initTeam();
booking.render();
renderQuiz();
initReviews();
initPhoto();
initReformer();
