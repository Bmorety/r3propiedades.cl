/* ============================================================
   R3 PROPIEDADES — Lógica del sitio
   · Selector de idioma ES / EN
   · Render y filtrado de propiedades
   · Enlaces de WhatsApp
   ============================================================ */

const WHATSAPP = "56999300592"; // +56 9 9930 0592 (sin signos)

/* ---------- Traducciones de la interfaz ---------- */
const I18N = {
  es: {
    "brand.tag": "Corretaje costero",
    "hero.eyebrow": "Concón · Reñaca · Viña del Mar",
    "hero.title": "Vive el verano <em>todo el año</em> frente al mar",
    "hero.lead": "Arriendo de departamentos por temporada y año corrido en las mejores zonas costeras de la Quinta Región.",
    "hero.cta1": "Ver propiedades",
    "hero.cta2": "Hablar con Rodrigo",
    "intro.eyebrow": "Corretaje boutique",
    "intro.title": "Conocemos cada rincón de la costa",
    "intro.text": "R3 Propiedades nace de la pasión de Rodrigo Rojas por el borde costero. Atención cercana, propiedades seleccionadas y un trato directo de principio a fin — sin letra chica.",
    "intro.stat1": "Comunas costeras",
    "intro.stat2": "Años en la zona",
    "intro.stat3": "Trato personal",
    "props.eyebrow": "Disponibles ahora",
    "props.title": "Propiedades en arriendo",
    "props.sub": "Filtra por dormitorios y tipo de arriendo para encontrar tu próximo hogar frente al mar.",
    "filter.type": "Tipo",
    "filter.all": "Todas",
    "filter.season": "Temporada",
    "filter.year": "Año corrido",
    "filter.rooms": "Dormitorios",
    "about.eyebrow": "Quién está detrás",
    "about.title": "Hola, soy Rodrigo",
    "about.p1": "Corredor de propiedades y enamorado de la costa. Deportista, activo y sociable: me vas a encontrar tanto cerrando un arriendo como trotando por la costanera de Concón.",
    "about.p2": "Creé R3 Propiedades para ofrecer lo que a mí me gustaría recibir: cercanía real, respuestas rápidas y cero letra chica. Aquí tratas siempre con la misma persona.",
    "about.badge": "Rodrigo Rojas R.",
    "about.t1": "🏃 Deportista",
    "about.t2": "🤝 Cercano",
    "about.t3": "🌊 Local de la costa",
    "contact.eyebrow": "Conversemos",
    "contact.title": "¿Buscas tu próximo lugar frente al mar?",
    "contact.sub": "Escríbeme por WhatsApp y te ayudo a encontrar la propiedad ideal, sea por temporada o año corrido.",
    "contact.waText": "Escribir por WhatsApp",
    "contact.email": "Enviar un correo",
    "nav.props": "Propiedades",
    "nav.about": "Rodrigo",
    "nav.contact": "Contacto",
    "footer.rights": "© 2026 R3 Propiedades · Rodrigo Rojas Rodríguez · Concón, Chile",
    // dinámicos
    "u.beds": "dorm.",
    "u.baths": "baños",
    "u.night": "noche",
    "u.month": "mes",
    "tag.temporada": "Temporada",
    "tag.anio": "Año corrido",
    "card.wa": "Consultar",
    "card.airbnb": "Airbnb",
    "card.photos": "Ver fotos",
    "availability.available": "Disponible ahora",
    "availability.available_from": "Disponible desde {date}",
    "availability.unavailable": "No disponible",
    "empty": "No hay propiedades con esos filtros. Prueba con otra combinación.",
    "wa.generic": "Hola Rodrigo, vi R3 Propiedades y me gustaría más información.",
    "wa.prop": "Hola Rodrigo, me interesa la propiedad \"{title}\" en {zone}. ¿Sigue disponible?"
  },
  en: {
    "brand.tag": "Coastal real estate",
    "hero.eyebrow": "Concón · Reñaca · Viña del Mar",
    "hero.title": "Live summer <em>all year long</em> by the sea",
    "hero.lead": "Apartment rentals — seasonal and year-round — in the best coastal areas of Chile's Fifth Region.",
    "hero.cta1": "View properties",
    "hero.cta2": "Chat with Rodrigo",
    "intro.eyebrow": "Boutique brokerage",
    "intro.title": "We know every corner of the coast",
    "intro.text": "R3 Propiedades was born from Rodrigo Rojas' passion for the coastline. Close attention, hand-picked properties and a direct deal from start to finish — no fine print.",
    "intro.stat1": "Coastal towns",
    "intro.stat2": "Years in the area",
    "intro.stat3": "Personal service",
    "props.eyebrow": "Available now",
    "props.title": "Properties for rent",
    "props.sub": "Filter by bedrooms and rental type to find your next home by the sea.",
    "filter.type": "Type",
    "filter.all": "All",
    "filter.season": "Seasonal",
    "filter.year": "Year-round",
    "filter.rooms": "Bedrooms",
    "about.eyebrow": "Who's behind it",
    "about.title": "Hi, I'm Rodrigo",
    "about.p1": "Real estate broker and coast lover. Athletic, active and social — you'll find me both closing a rental and jogging along Concón's boardwalk.",
    "about.p2": "I built R3 Propiedades to offer what I'd like to receive myself: real closeness, fast answers and zero fine print. Here you always deal with the same person.",
    "about.badge": "Rodrigo Rojas R.",
    "about.t1": "🏃 Athlete",
    "about.t2": "🤝 Approachable",
    "about.t3": "🌊 Coast local",
    "contact.eyebrow": "Let's talk",
    "contact.title": "Looking for your next place by the sea?",
    "contact.sub": "Message me on WhatsApp and I'll help you find the ideal property, seasonal or year-round.",
    "contact.waText": "Message on WhatsApp",
    "contact.email": "Send an email",
    "nav.props": "Properties",
    "nav.about": "Rodrigo",
    "nav.contact": "Contact",
    "footer.rights": "© 2026 R3 Propiedades · Rodrigo Rojas Rodríguez · Concón, Chile",
    "u.beds": "bed",
    "u.baths": "bath",
    "u.night": "night",
    "u.month": "month",
    "tag.temporada": "Seasonal",
    "tag.anio": "Year-round",
    "card.wa": "Enquire",
    "card.airbnb": "Airbnb",
    "card.photos": "Photos",
    "availability.available": "Available now",
    "availability.available_from": "Available from {date}",
    "availability.unavailable": "Not available",
    "empty": "No properties match those filters. Try another combination.",
    "wa.generic": "Hi Rodrigo, I saw R3 Propiedades and I'd like more information.",
    "wa.prop": "Hi Rodrigo, I'm interested in \"{title}\" in {zone}. Is it still available?"
  }
};

/* ---------- Estado ---------- */
let lang = localStorage.getItem("r3-lang") || "es";
let filters = { type: "all", bedrooms: "all" };
let allProperties = [];
let galleryState = { property: null, index: 0 };

const t = (key) => (I18N[lang] && I18N[lang][key]) || key;

/* ---------- Iconos SVG ---------- */
const ICON = {
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 17v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 17h20M2 17v3M22 17v3M6 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>',
  bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 12V5.5a1.5 1.5 0 0 1 3 0V6M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3zM5 19l-1 2M19 19l1 2"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3h18v18H3zM3 9h18M9 3v18"/></svg>'
};

/* ---------- Formato de precio CLP ---------- */
const fmtPrice = (n) => "$" + n.toLocaleString("es-CL") + " CLP";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeProperty(p) {
  const photos = Array.isArray(p.photos) ? p.photos : [];
  return {
    ...p,
    title: p.title || { es: "", en: "" },
    desc: p.desc || { es: "", en: "" },
    image: p.image || photos[0]?.url || "assets/hero.jpg",
    photos,
    photoCount: Number(p.photoCount ?? photos.length),
    availabilityStatus: p.availabilityStatus || "",
    availableFrom: p.availableFrom || "",
    airbnbUrl: p.airbnbUrl || p.airbnb_url || "",
    showPrice: p.showPrice !== false
  };
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function availabilityText(property) {
  if (!property.availabilityStatus) return "";
  if (property.availabilityStatus === "unavailable") return t("availability.unavailable");
  if (property.availabilityStatus === "available_from") {
    return t("availability.available_from").replace("{date}", formatDate(property.availableFrom) || "");
  }
  return t("availability.available");
}

function isLocalDev() {
  return ["localhost", "127.0.0.1", "::1", ""].includes(window.location.hostname);
}

function loadLocalDemoProperties() {
  if (!isLocalDev()) return Promise.resolve([]);
  if (Array.isArray(window.R3_PROPERTIES)) return Promise.resolve(window.R3_PROPERTIES);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "data/properties.js";
    script.onload = () => resolve(Array.isArray(window.R3_PROPERTIES) ? window.R3_PROPERTIES : []);
    script.onerror = () => resolve([]);
    document.head.appendChild(script);
  });
}

async function loadProperties() {
  try {
    const response = await fetch("api/public-properties.php", { cache: "no-store" });
    const data = await response.json();
    if (response.ok && data.ok && Array.isArray(data.properties)) {
      allProperties = data.properties.map(normalizeProperty);
      return;
    }
  } catch (error) {
    // El respaldo de datos demo solo corre en desarrollo local.
  }
  const demoProperties = await loadLocalDemoProperties();
  allProperties = demoProperties.map(normalizeProperty);
}

/* ---------- WhatsApp link ---------- */
function waLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/* ============================================================
   IDIOMA
   ============================================================ */
function applyLang(code) {
  lang = code;
  document.documentElement.lang = code;
  localStorage.setItem("r3-lang", code);

  // textos simples
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  // textos con HTML (ej. <em>)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });

  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.lang === code)
  );

  updateWaLinks();
  renderProperties();
}

/* Enlaces de WhatsApp genéricos (hero, contacto, botón flotante) */
function updateWaLinks() {
  const link = waLink(t("wa.generic"));
  ["waHero", "waContact", "waFab"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = link;
  });
}

/* ============================================================
   PROPIEDADES
   ============================================================ */
function matchesFilters(p) {
  const okType = filters.type === "all" || p.type === filters.type;
  const okBeds =
    filters.bedrooms === "all" ||
    (filters.bedrooms === "3" ? p.bedrooms >= 3 : p.bedrooms === Number(filters.bedrooms));
  return okType && okBeds;
}

function propCard(p) {
  const isSeason = p.type === "temporada";
  const unit = p.priceUnit === "noche" ? t("u.night") : t("u.month");
  const title = p.title[lang] || p.title.es || "";
  const desc = p.desc[lang] || p.desc.es || "";
  const waMsg = t("wa.prop")
    .replace("{title}", title)
    .replace("{zone}", p.zone);
  const hasGallery = Number(p.photoCount || p.photos?.length || 0) > 1;
  const airbnb = p.airbnbUrl
    ? `<a class="card__airbnb" href="${esc(p.airbnbUrl)}" target="_blank" rel="noopener">${t("card.airbnb")}</a>`
    : "";
  const availability = availabilityText(p);
  const price = p.showPrice
    ? `<div class="price"><b>${fmtPrice(p.price)}</b><span>/ ${unit}</span></div>`
    : "";

  return `
    <article class="card">
      <div class="card__media">
        <img src="${esc(p.image)}" alt="${esc(title)}" loading="lazy" />
        <span class="card__tag ${isSeason ? "card__tag--temporada" : ""}">${t("tag." + p.type)}</span>
        <span class="card__zone">📍 ${esc(p.zone)}</span>
        ${hasGallery ? `<button class="card__photos" type="button" data-gallery="${esc(p.id)}">${t("card.photos")}</button>` : ""}
      </div>
      <div class="card__body">
        ${availability ? `<span class="card__availability card__availability--${esc(p.availabilityStatus)}">${esc(availability)}</span>` : ""}
        <h3 class="card__title">${esc(title)}</h3>
        <p class="card__desc">${esc(desc)}</p>
        <div class="card__specs">
          <span class="spec">${ICON.bed} ${p.bedrooms} ${t("u.beds")}</span>
          <span class="spec">${ICON.bath} ${p.bathrooms} ${t("u.baths")}</span>
          <span class="spec">${ICON.area} ${p.area} m²</span>
        </div>
        <div class="card__foot">
          ${price}
          <div class="card__actions">
            ${airbnb}
            <a class="card__wa" href="${waLink(waMsg)}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.94 1.34-.5.04-.97.22-3.27-.68-2.75-1.08-4.5-3.88-4.64-4.06-.14-.18-1.12-1.49-1.12-2.84s.71-2.01.96-2.29c.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.56.81 1.94.88 2.08.07.14.12.3.02.48-.1.18-.15.29-.29.45-.14.16-.3.36-.43.48-.14.14-.29.29-.12.57.17.27.74 1.22 1.59 1.98 1.1.98 2.02 1.28 2.3 1.42.28.14.45.12.61-.07.16-.18.7-.81.89-1.09.18-.27.37-.23.62-.14.25.09 1.6.76 1.87.9.27.14.46.2.53.32.07.11.07.66-.17 1.34z"/></svg>
              ${t("card.wa")}
            </a>
          </div>
        </div>
      </div>
    </article>`;
}

function renderProperties() {
  const grid = document.getElementById("propGrid");
  if (!grid) return;
  const data = allProperties.filter(matchesFilters);
  grid.innerHTML = data.length
    ? data.map(propCard).join("")
    : `<p class="empty">${t("empty")}</p>`;
  bindGalleryButtons();
}

function ensureGallery() {
  let modal = document.getElementById("galleryModal");
  if (modal) return modal;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="gallery" id="galleryModal" hidden>
      <button class="gallery__close" type="button" aria-label="Cerrar">×</button>
      <button class="gallery__nav gallery__nav--prev" type="button" aria-label="Anterior">‹</button>
      <img class="gallery__img" alt="" />
      <button class="gallery__nav gallery__nav--next" type="button" aria-label="Siguiente">›</button>
      <p class="gallery__caption"></p>
    </div>
  `);

  modal = document.getElementById("galleryModal");
  modal.querySelector(".gallery__close").addEventListener("click", closeGallery);
  modal.querySelector(".gallery__nav--prev").addEventListener("click", () => moveGallery(-1));
  modal.querySelector(".gallery__nav--next").addEventListener("click", () => moveGallery(1));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeGallery();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") moveGallery(-1);
    if (event.key === "ArrowRight") moveGallery(1);
  });
  return modal;
}

async function loadGalleryPhotos(property) {
  if (property.galleryLoaded || property.photos.length >= property.photoCount) {
    return property.photos;
  }

  const response = await fetch(`api/public-gallery.php?property_id=${encodeURIComponent(property.id)}`, {
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok || !data.ok || !Array.isArray(data.photos)) {
    throw new Error(data.error || "No se pudieron cargar las fotos.");
  }
  property.photos = data.photos;
  property.galleryLoaded = true;
  return property.photos;
}

async function openGallery(id) {
  const property = allProperties.find((p) => String(p.id) === String(id));
  if (!property) return;

  const modal = ensureGallery();
  modal.hidden = false;
  modal.querySelector(".gallery__caption").textContent = "Cargando fotos...";

  try {
    await loadGalleryPhotos(property);
    if (!property.photos?.length) return;
    galleryState = { property, index: 0 };
    updateGallery();
  } catch (error) {
    modal.querySelector(".gallery__caption").textContent = error.message;
  }
}

function updateGallery() {
  const modal = ensureGallery();
  const { property, index } = galleryState;
  const photo = property.photos[index];
  const title = property.title[lang] || property.title.es || "";
  modal.querySelector(".gallery__img").src = photo.url;
  modal.querySelector(".gallery__img").alt = title;
  modal.querySelector(".gallery__caption").textContent = `${title} · ${index + 1}/${property.photos.length}`;
}

function moveGallery(delta) {
  const { property, index } = galleryState;
  if (!property) return;
  galleryState.index = (index + delta + property.photos.length) % property.photos.length;
  updateGallery();
}

function closeGallery() {
  ensureGallery().hidden = true;
}

function bindGalleryButtons() {
  document.querySelectorAll("[data-gallery]").forEach((button) => {
    button.addEventListener("click", () => openGallery(button.dataset.gallery));
  });
}

/* ============================================================
   EVENTOS
   ============================================================ */
function bindEvents() {
  // Idioma
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.addEventListener("click", () => applyLang(b.dataset.lang))
  );
  // Filtros (delegación por grupo)
  document.querySelectorAll(".filter-group").forEach((group) => {
    const key = group.dataset.filter;
    group.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        group.querySelectorAll(".pill").forEach((p) => p.classList.remove("is-active"));
        pill.classList.add("is-active");
        filters[key] = pill.dataset.value;
        renderProperties();
      });
    });
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadProperties();
  applyLang(lang); // también renderiza propiedades + actualiza WhatsApp
});
