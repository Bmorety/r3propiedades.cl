const state = {
  csrf: window.R3_ADMIN.csrf,
  properties: [],
  currentId: null,
  mode: "dashboard",
  filter: "all",
  pendingPhotoFiles: [],
  pendingPhotoUrls: [],
  photoBusy: false,
  needsReauth: false,
};

const PHOTO_LIMIT = 12;
const PHOTO_MAX_BYTES = 50 * 1024 * 1024;
const PHOTO_BATCH_MAX_BYTES = 50 * 1024 * 1024;
const PHOTO_ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PHOTO_ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

const $ = (selector) => document.querySelector(selector);
const form = $("#propertyForm");
const loginForm = $("#loginForm");
const loginPasswordInput = loginForm?.querySelector('input[name="password"]');
const togglePasswordBtn = $("#togglePasswordBtn");

class AdminRequestError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
    this.needsReauth = status === 401 || status === 419;
  }
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatMegabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function photoCountText(count) {
  return `${count} foto${count === 1 ? "" : "s"}`;
}

function formatPrice(value) {
  const number = Number(value || 0);
  return number > 0 ? `$${number.toLocaleString("es-CL")} CLP` : "Precio por definir";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": state.csrf,
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    const error = new AdminRequestError(data.error || "Ocurrió un error.", response.status);
    if (error.needsReauth && options.reauth !== false) {
      showLoginForReauth(error);
    }
    throw error;
  }
  if (data.csrf) state.csrf = data.csrf;
  return data;
}

function isReauthError(error) {
  return Boolean(error?.needsReauth);
}

function reauthMessage(error) {
  return error?.status === 419
    ? "Tu sesión expiró. Ingresa de nuevo para continuar."
    : "Por seguridad necesitamos que ingreses de nuevo para continuar.";
}

function showLoginForReauth(error) {
  state.needsReauth = true;
  setPhotoBusy(false);
  $("#appView").hidden = true;
  $("#loginView").hidden = false;
  $("#loginError").textContent = reauthMessage(error);
  if (loginPasswordInput) {
    loginPasswordInput.value = "";
    loginPasswordInput.focus();
  }
}

function parseAdminResponse(response, fallbackMessage) {
  return response.json().then((data) => {
    if (!response.ok || data.ok === false) {
      throw new AdminRequestError(data.error || fallbackMessage, response.status);
    }
    if (data.csrf) state.csrf = data.csrf;
    return data;
  });
}

function blankProperty() {
  return {
    id: "",
    type: "temporada",
    zone: "Concón",
    bedrooms: 2,
    bathrooms: 1,
    area: 0,
    price: 0,
    priceUnit: "noche",
    showPrice: true,
    title: { es: "", en: "" },
    desc: { es: "", en: "" },
    featured: false,
    visible: true,
    availabilityStatus: "available",
    availableFrom: "",
    airbnbUrl: "",
    sortOrder: nextSortOrder(),
    photos: [],
  };
}

function clearPendingPhotos() {
  state.pendingPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
  state.pendingPhotoFiles = [];
  state.pendingPhotoUrls = [];
  $("#photoInput").value = "";
}

function isAcceptedPhoto(file) {
  return PHOTO_ACCEPTED_TYPES.has(file.type) || PHOTO_ACCEPTED_EXTENSIONS.test(file.name || "");
}

function currentSavedPhotoCount(propertyId = Number(form.id.value || 0)) {
  const property = state.properties.find((item) => Number(item.id) === Number(propertyId));
  return property?.photos?.length || 0;
}

function pendingPhotoBytes() {
  return state.pendingPhotoFiles.reduce((total, file) => total + file.size, 0);
}

function preparePhotoFiles(files, usedSlots = 0, usedBatchBytes = 0) {
  const errors = [];
  const accepted = [];
  const slots = Math.max(0, PHOTO_LIMIT - usedSlots);
  let batchBytes = usedBatchBytes;

  files.forEach((file) => {
    if (!isAcceptedPhoto(file)) {
      errors.push(`${file.name}: formato no compatible.`);
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      errors.push(`${file.name}: supera ${formatMegabytes(PHOTO_MAX_BYTES)}.`);
      return;
    }
    if (accepted.length >= slots) {
      errors.push(`${file.name}: supera el máximo de ${PHOTO_LIMIT} fotos por propiedad.`);
      return;
    }
    if (batchBytes + file.size > PHOTO_BATCH_MAX_BYTES) {
      errors.push(`${file.name}: supera el máximo de ${formatMegabytes(PHOTO_BATCH_MAX_BYTES)} por tanda.`);
      return;
    }
    accepted.push(file);
    batchBytes += file.size;
  });

  if (!slots && files.some(isAcceptedPhoto)) {
    errors.push(`Esta propiedad ya tiene el máximo de ${PHOTO_LIMIT} fotos.`);
  }

  const notice = errors.length > 1
    ? `${errors[0]} ${errors.length - 1} archivo${errors.length === 2 ? "" : "s"} más no se subieron.`
    : errors[0] || "";

  return { accepted, notice };
}

function syncPhotoBusyControls() {
  const photoInput = $("#photoInput");
  const uploadBtn = $(".upload-btn");
  const panel = $("#photoPanel");
  const isBusy = state.photoBusy;

  if (photoInput) photoInput.disabled = isBusy;
  uploadBtn?.classList.toggle("is-disabled", isBusy);
  uploadBtn?.setAttribute("aria-disabled", isBusy ? "true" : "false");
  panel?.classList.toggle("is-busy", isBusy);
  panel?.setAttribute("aria-busy", isBusy ? "true" : "false");

  $("#photoGrid")?.querySelectorAll("button").forEach((button) => {
    if (isBusy) {
      button.dataset.photoWasDisabled = button.disabled ? "true" : "false";
      button.disabled = true;
      return;
    }
    if ("photoWasDisabled" in button.dataset) {
      button.disabled = button.dataset.photoWasDisabled === "true";
      delete button.dataset.photoWasDisabled;
    }
  });
}

function setPhotoBusy(isBusy, message = "") {
  state.photoBusy = isBusy;
  syncPhotoBusyControls();
  if (message) $("#photoStatus").textContent = message;
}

function updatePhotoProgress({ title, detail = "", percent = null, stateClass = "" }) {
  const progress = $("#photoProgress");
  if (!progress) return;

  progress.hidden = false;
  progress.classList.remove("is-processing", "is-success", "is-error");
  if (stateClass) progress.classList.add(stateClass);
  $("#photoProgressTitle").textContent = title;
  $("#photoProgressDetail").textContent = detail;

  if (percent === null) {
    $("#photoProgressPercent").textContent = "";
    $("#photoProgressBar").style.width = "100%";
    progress.classList.add("is-processing");
    return;
  }

  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  $("#photoProgressPercent").textContent = `${safePercent}%`;
  $("#photoProgressBar").style.width = `${safePercent}%`;
}

function sendPhotoForm(body, onUploadProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "../api/admin-photos.php");
    request.withCredentials = true;

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onUploadProgress(event.loaded, event.total);
    });

    request.addEventListener("load", () => {
      let data = null;
      try {
        data = JSON.parse(request.responseText || "{}");
      } catch (error) {
        reject(new Error("El servidor respondió con un formato inesperado."));
        return;
      }

      if (request.status < 200 || request.status >= 300 || data.ok === false) {
        const error = new AdminRequestError(data.error || "No se pudieron subir las fotos.", request.status);
        if (error.needsReauth) {
          showLoginForReauth(error);
        }
        reject(error);
        return;
      }
      resolve(data);
    });

    request.addEventListener("error", () => reject(new Error("No se pudo conectar con el servidor.")));
    request.addEventListener("timeout", () => reject(new Error("La subida tardó demasiado. Intenta con menos fotos.")));
    request.timeout = 180000;
    request.send(body);
  });
}

function queuePendingPhotos(files) {
  if (state.photoBusy) return;

  const { accepted, notice } = preparePhotoFiles(files, state.pendingPhotoFiles.length, pendingPhotoBytes());
  if (!accepted.length) {
    $("#photoStatus").textContent = notice || `Máximo ${PHOTO_LIMIT} fotos por propiedad.`;
    return;
  }

  state.pendingPhotoFiles.push(...accepted);
  state.pendingPhotoUrls.push(...accepted.map((file) => URL.createObjectURL(file)));

  const ready = `${photoCountText(state.pendingPhotoFiles.length)} lista${state.pendingPhotoFiles.length === 1 ? "" : "s"} para subir al guardar (${formatMegabytes(pendingPhotoBytes())} en esta tanda).`;
  $("#photoStatus").textContent = notice ? `${ready} ${notice}` : ready;

  renderPhotos([]);
  renderPreview();
}

function removePendingPhoto(index) {
  const [url] = state.pendingPhotoUrls.splice(index, 1);
  if (url) URL.revokeObjectURL(url);
  state.pendingPhotoFiles.splice(index, 1);
  $("#photoStatus").textContent = state.pendingPhotoFiles.length
    ? `${state.pendingPhotoFiles.length} foto${state.pendingPhotoFiles.length === 1 ? "" : "s"} pendiente${state.pendingPhotoFiles.length === 1 ? "" : "s"}.`
    : "";
  renderPhotos([]);
  renderPreview();
}

function nextSortOrder() {
  if (!state.properties.length) return 100;
  const max = Math.max(...state.properties.map((p) => Number(p.sortOrder || 0)));
  return Math.min(9999, max + 10);
}

function typeLabel(type) {
  return type === "anio" ? "Año corrido" : "Temporada";
}

function availabilityLabel(property) {
  if (property.availabilityStatus === "unavailable") return "No disponible";
  if (property.availabilityStatus === "available_from") {
    return property.availableFrom ? `Disponible desde ${formatDate(property.availableFrom)}` : "Disponible desde fecha";
  }
  return "Disponible ahora";
}

function availabilityClass(property) {
  if (property.availabilityStatus === "unavailable") return "is-unavailable";
  if (property.availabilityStatus === "available_from") return "is-scheduled";
  return "is-available";
}

function getCurrentProperty() {
  return state.properties.find((p) => Number(p.id) === Number(state.currentId)) || null;
}

function propertyMatchesFilter(property) {
  if (state.filter === "visible") return property.visible;
  if (state.filter === "hidden") return !property.visible;
  if (state.filter === "available") return property.availabilityStatus === "available";
  if (state.filter === "scheduled") return property.availabilityStatus === "available_from";
  if (state.filter === "unavailable") return property.availabilityStatus === "unavailable";
  return true;
}

function sortedProperties(properties = state.properties) {
  return [...properties].sort((a, b) => {
    const order = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (order !== 0) return order;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function renderList() {
  const list = $("#propertyList");
  const visible = state.properties.filter((p) => p.visible).length;
  const hidden = state.properties.length - visible;
  $("#propertyCount").textContent = `${visible} publicadas · ${hidden} ocultas`;

  $("#listFilters").querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });

  const filtered = sortedProperties(state.properties.filter(propertyMatchesFilter));
  if (!filtered.length) {
    list.innerHTML = `<p class="admin-status property-empty">No hay propiedades en este filtro.</p>`;
    return;
  }

  list.innerHTML = filtered.map((p) => `
    <button class="property-item ${Number(p.id) === Number(state.currentId) ? "is-active" : ""}" type="button" data-id="${p.id}">
      <b>${esc(p.title.es || "Sin título")}</b>
      <span>${esc(p.zone || "Sin zona")} · ${typeLabel(p.type)} · ${p.photos.length} fotos</span>
      <small class="${availabilityClass(p)}">${p.visible ? "Visible" : "Oculta"} · ${availabilityLabel(p)}</small>
    </button>
  `).join("");

  list.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectProperty(Number(button.dataset.id)));
  });
}

function renderDashboard() {
  const total = state.properties.length;
  const visible = state.properties.filter((p) => p.visible).length;
  const hidden = total - visible;
  const available = state.properties.filter((p) => p.availabilityStatus === "available").length;
  const scheduled = state.properties.filter((p) => p.availabilityStatus === "available_from").length;
  const unavailable = state.properties.filter((p) => p.availabilityStatus === "unavailable").length;

  $("#dashboardStats").innerHTML = [
    ["Total", total],
    ["Visibles", visible],
    ["Ocultas", hidden],
    ["Disponibles ahora", available],
    ["Desde fecha", scheduled],
    ["No disponibles", unavailable],
  ].map(([label, value]) => `
    <article class="dashboard-stat">
      <b>${value}</b>
      <span>${label}</span>
    </article>
  `).join("");

  const list = $("#dashboardList");
  if (!state.properties.length) {
    list.innerHTML = `
      <div class="dashboard-empty">
        <h4>Aún no hay propiedades</h4>
        <p>Crea la primera ficha, guarda, y después podrás subir fotos y ordenar el catálogo.</p>
        <button class="admin-btn admin-btn--primary" type="button" data-create-first>Nueva propiedad</button>
      </div>
    `;
    list.querySelector("[data-create-first]").addEventListener("click", startNewProperty);
    return;
  }

  list.innerHTML = sortedProperties().map((p) => `
    <div class="dashboard-row">
      <button class="row-title" type="button" data-open="${p.id}">
        <b>${esc(p.title.es || "Sin título")}</b>
        <small>${esc(p.zone || "Sin zona")} · ${typeLabel(p.type)} · Orden ${Number(p.sortOrder || 0)}</small>
      </button>
      <span class="row-badges">
        <select class="row-availability" data-availability-id="${p.id}" aria-label="Cambiar disponibilidad">
          <option value="available" ${p.availabilityStatus === "available" ? "selected" : ""}>Disponible ahora</option>
          <option value="available_from" ${p.availabilityStatus === "available_from" ? "selected" : ""}>Desde fecha</option>
          <option value="unavailable" ${p.availabilityStatus === "unavailable" ? "selected" : ""}>No disponible</option>
        </select>
        <button type="button" class="status-pill ${p.visible ? "is-visible" : "is-hidden"}" data-visible-id="${p.id}">${p.visible ? "Visible" : "Oculta"}</button>
      </span>
    </div>
  `).join("");

  list.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => selectProperty(Number(button.dataset.open)));
  });

  list.querySelectorAll("[data-availability-id]").forEach((select) => {
    select.addEventListener("change", () => updateAvailabilityFromDashboard(Number(select.dataset.availabilityId), select));
  });

  list.querySelectorAll("[data-visible-id]").forEach((button) => {
    button.addEventListener("click", () => toggleVisibleFromDashboard(Number(button.dataset.visibleId)));
  });
}

async function quickUpdateProperty(id, changes) {
  const property = state.properties.find((p) => Number(p.id) === Number(id));
  if (!property) return;

  const payload = {
    action: "save",
    id: property.id,
    slug: property.slug,
    type: property.type,
    zone: property.zone,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    price: property.price,
    priceUnit: property.priceUnit,
    showPrice: property.showPrice !== false,
    title: property.title,
    desc: property.desc,
    featured: property.featured,
    visible: property.visible,
    availabilityStatus: property.availabilityStatus,
    availableFrom: property.availableFrom,
    airbnbUrl: property.airbnbUrl,
    sortOrder: property.sortOrder,
    ...changes,
  };

  const data = await api("../api/admin-properties.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.properties = data.properties || state.properties;
  renderList();
  renderDashboard();
  if (state.mode === "editor" && Number(state.currentId) === Number(id)) {
    fillForm(getCurrentProperty());
  }
}

async function toggleVisibleFromDashboard(id) {
  const property = state.properties.find((p) => Number(p.id) === id);
  if (!property) return;
  try {
    await quickUpdateProperty(id, { visible: !property.visible });
  } catch (error) {
    if (isReauthError(error)) return;
    alert(error.message);
  }
}

async function updateAvailabilityFromDashboard(id, select) {
  const property = state.properties.find((p) => Number(p.id) === id);
  if (!property) return;
  const status = select.value;
  let availableFrom = property.availableFrom || "";

  if (status === "available_from") {
    const input = prompt("Fecha disponible (AAAA-MM-DD):", availableFrom || "");
    if (input === null) {
      select.value = property.availabilityStatus;
      return;
    }
    availableFrom = input.trim();
  } else {
    availableFrom = "";
  }

  try {
    await quickUpdateProperty(id, { availabilityStatus: status, availableFrom });
  } catch (error) {
    if (isReauthError(error)) return;
    alert(error.message);
    select.value = property.availabilityStatus;
  }
}

function showDashboard() {
  state.mode = "dashboard";
  state.currentId = null;
  $("#dashboardView").hidden = false;
  $("#editorView").hidden = true;
  $("#saveStatus").textContent = "";
  $("#photoStatus").textContent = "";
  renderList();
  renderDashboard();
}

function showEditor() {
  state.mode = "editor";
  $("#dashboardView").hidden = true;
  $("#editorView").hidden = false;
}

function toggleAvailableFrom() {
  const field = $("#availableFromField");
  const needsDate = form.availabilityStatus.value === "available_from";
  field.hidden = !needsDate;
  form.availableFrom.required = needsDate;
  if (!needsDate) form.availableFrom.value = "";
}

function formSnapshot() {
  const savedPhotos = getCurrentProperty()?.photos || [];
  const pendingPhotos = state.pendingPhotoUrls.map((url, index) => ({
    id: `pending-${index}`,
    url,
    pending: true,
  }));

  return {
    id: form.id.value || "",
    type: form.type.value || "temporada",
    zone: form.zone.value || "",
    bedrooms: Number(form.bedrooms.value || 0),
    bathrooms: Number(form.bathrooms.value || 0),
    area: Number(form.area.value || 0),
    price: Number(form.price.value || 0),
    priceUnit: form.priceUnit.value || "noche",
    showPrice: form.showPrice.checked,
    title: { es: form.titleEs.value || "", en: form.titleEn.value || "" },
    desc: { es: form.descEs.value || "", en: form.descEn.value || "" },
    featured: form.featured.checked,
    visible: form.visible.checked,
    availabilityStatus: form.availabilityStatus.value || "available",
    availableFrom: form.availableFrom.value || "",
    airbnbUrl: form.airbnbUrl.value || "",
    sortOrder: Number(form.sortOrder.value || 100),
    photos: savedPhotos.length ? savedPhotos : pendingPhotos,
  };
}

function renderPreview(property = formSnapshot()) {
  const preview = $("#propertyPreview");
  const coverPhoto = property.photos?.[0];
  const cover = coverPhoto ? (coverPhoto.pending ? coverPhoto.url : `../${coverPhoto.url}`) : "../assets/hero.jpg";
  const title = property.title.es || "Título de la propiedad";
  const desc = property.desc.es || "La descripción aparecerá aquí tal como se verá en la tarjeta pública.";
  const unit = property.priceUnit === "mes" ? "mes" : "noche";
  const price = property.showPrice === false
    ? "Precio a consultar"
    : `${formatPrice(property.price)} <small>/ ${unit}</small>`;

  preview.innerHTML = `
    <article class="preview-card">
      <div class="preview-card__media">
        <img src="${esc(cover)}" alt="" />
        <span>${typeLabel(property.type)}</span>
      </div>
      <div class="preview-card__body">
        <i class="status-pill ${availabilityClass(property)}">${availabilityLabel(property)}</i>
        <h3>${esc(title)}</h3>
        <p>${esc(desc)}</p>
        <dl>
          <div><dt>Dorm.</dt><dd>${property.bedrooms}</dd></div>
          <div><dt>Baños</dt><dd>${property.bathrooms}</dd></div>
          <div><dt>M2</dt><dd>${property.area}</dd></div>
        </dl>
        <strong>${price}</strong>
      </div>
    </article>
  `;
}

function fillForm(property) {
  form.id.value = property.id || "";
  form.titleEs.value = property.title.es || "";
  form.titleEn.value = property.title.en || "";
  form.type.value = property.type || "temporada";
  form.zone.value = property.zone || "";
  form.bedrooms.value = property.bedrooms || 0;
  form.bathrooms.value = property.bathrooms || 0;
  form.area.value = property.area || 0;
  form.price.value = property.price || 0;
  form.priceUnit.value = property.priceUnit || "noche";
  form.showPrice.checked = property.showPrice !== false;
  form.sortOrder.value = property.sortOrder || 100;
  form.availabilityStatus.value = property.availabilityStatus || "available";
  form.availableFrom.value = property.availableFrom || "";
  form.airbnbUrl.value = property.airbnbUrl || "";
  form.descEs.value = property.desc.es || "";
  form.descEn.value = property.desc.en || "";
  form.visible.checked = property.visible !== false;
  form.featured.checked = Boolean(property.featured);
  $("#editorTitle").textContent = property.id ? property.title.es || "Editar propiedad" : "Nueva propiedad";
  $("#deleteBtn").hidden = !property.id;
  toggleAvailableFrom();
  renderPreview(property);
  renderPhotos(property.photos || []);
}

function renderPhotos(photos) {
  const grid = $("#photoGrid");
  const canUpload = Boolean(form.id.value);

  if (!canUpload && state.pendingPhotoFiles.length) {
    grid.innerHTML = state.pendingPhotoFiles.map((file, index) => `
      <article class="photo-tile photo-tile--pending ${index === 0 ? "is-cover" : ""}">
        <img src="${esc(state.pendingPhotoUrls[index])}" alt="" />
        <footer>
          <small>${esc(file.name)} · pendiente</small>
          <div class="photo-actions">
            <button type="button" data-remove-pending="${index}">Quitar</button>
          </div>
        </footer>
      </article>
    `).join("");

    grid.querySelectorAll("[data-remove-pending]").forEach((button) => {
      button.addEventListener("click", () => removePendingPhoto(Number(button.dataset.removePending)));
    });
    syncPhotoBusyControls();
    return;
  }

  if (!photos.length) {
    grid.innerHTML = canUpload
      ? `<p class="admin-status">Sin fotos todavía.</p>`
      : `<p class="admin-status">Puedes seleccionar fotos ahora; se subirán cuando guardes la propiedad.</p>`;
    syncPhotoBusyControls();
    return;
  }

  grid.innerHTML = photos.map((photo, index) => `
    <article class="photo-tile ${index === 0 ? "is-cover" : ""}">
      <img src="../${photo.url}" alt="" loading="lazy" />
      <footer>
        <small>${photo.width}x${photo.height} · ${formatBytes(photo.sizeBytes)}</small>
        <div class="photo-actions">
          <button type="button" data-cover-photo="${photo.id}" ${index === 0 ? "disabled" : ""}>
            ${index === 0 ? "Principal" : "Usar principal"}
          </button>
          <button type="button" data-delete-photo="${photo.id}">Borrar</button>
        </div>
      </footer>
    </article>
  `).join("");

  grid.querySelectorAll("[data-cover-photo]").forEach((button) => {
    button.addEventListener("click", () => makeCover(Number(button.dataset.coverPhoto)));
  });

  grid.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.addEventListener("click", () => deletePhoto(Number(button.dataset.deletePhoto)));
  });
  syncPhotoBusyControls();
}

function selectProperty(id) {
  clearPendingPhotos();
  state.currentId = id;
  const property = getCurrentProperty() || blankProperty();
  showEditor();
  fillForm(property);
  renderList();
  renderDashboard();
  $("#saveStatus").textContent = "";
  $("#photoStatus").textContent = "";
}

function startNewProperty() {
  clearPendingPhotos();
  state.currentId = null;
  showEditor();
  fillForm(blankProperty());
  renderList();
  renderDashboard();
  $("#saveStatus").textContent = "";
  $("#photoStatus").textContent = "";
}

async function loadProperties() {
  const data = await api("../api/admin-properties.php");
  state.properties = data.properties || [];

  if (state.mode === "editor" && state.currentId && getCurrentProperty()) {
    fillForm(getCurrentProperty());
  } else if (state.mode === "editor" && !state.currentId) {
    fillForm(blankProperty());
  } else {
    showDashboard();
  }

  renderList();
  renderDashboard();
}

function propertyFromForm() {
  return {
    action: "save",
    id: Number(form.id.value || 0),
    type: form.type.value,
    zone: form.zone.value,
    bedrooms: Number(form.bedrooms.value || 0),
    bathrooms: Number(form.bathrooms.value || 0),
    area: Number(form.area.value || 0),
    price: Number(form.price.value || 0),
    priceUnit: form.priceUnit.value,
    showPrice: form.showPrice.checked,
    title: { es: form.titleEs.value, en: form.titleEn.value },
    desc: { es: form.descEs.value, en: form.descEn.value },
    featured: form.featured.checked,
    visible: form.visible.checked,
    availabilityStatus: form.availabilityStatus.value,
    availableFrom: form.availableFrom.value,
    airbnbUrl: form.airbnbUrl.value,
    sortOrder: Number(form.sortOrder.value || 100),
  };
}

async function saveProperty(event) {
  event.preventDefault();
  const pendingCount = state.pendingPhotoFiles.length;
  $("#saveStatus").textContent = pendingCount ? "Guardando propiedad y fotos..." : "Guardando...";
  try {
    const data = await api("../api/admin-properties.php", {
      method: "POST",
      body: JSON.stringify(propertyFromForm()),
    });
    state.properties = data.properties || [];
    state.currentId = data.id;
    state.mode = "editor";

    if (pendingCount) {
      await uploadPhotos(state.pendingPhotoFiles, data.id, false);
      clearPendingPhotos();
      await loadProperties();
    }

    renderList();
    renderDashboard();
    fillForm(getCurrentProperty());
    $("#saveStatus").textContent = pendingCount ? "Propiedad y fotos guardadas." : "Guardado.";
  } catch (error) {
    if (isReauthError(error)) return;
    $("#saveStatus").textContent = error.message;
  }
}

async function deleteProperty() {
  const property = getCurrentProperty();
  if (!property || !confirm(`Eliminar "${property.title.es}" y sus fotos?`)) return;
  $("#saveStatus").textContent = "Eliminando...";
  try {
    const data = await api("../api/admin-properties.php", {
      method: "POST",
      body: JSON.stringify({ action: "delete", id: property.id }),
    });
    state.properties = data.properties || [];
    showDashboard();
    $("#saveStatus").textContent = "Eliminado.";
  } catch (error) {
    if (isReauthError(error)) return;
    $("#saveStatus").textContent = error.message;
  }
}

async function uploadPhotos(filesArg = null, propertyIdArg = null, reload = true) {
  if (state.photoBusy) return null;

  const selectedFiles = filesArg || Array.from($("#photoInput").files || []);
  const propertyId = Number(propertyIdArg || form.id.value || 0);
  if (!selectedFiles.length || !propertyId) return null;

  const { accepted, notice } = preparePhotoFiles(selectedFiles, currentSavedPhotoCount(propertyId));
  if (!accepted.length) {
    $("#photoStatus").textContent = notice || `Selecciona fotos JPG, PNG o WebP de hasta ${formatMegabytes(PHOTO_MAX_BYTES)}.`;
    $("#photoInput").value = "";
    return null;
  }

  const totalBytes = accepted.reduce((total, file) => total + file.size, 0);
  const totalLabel = formatMegabytes(totalBytes);
  setPhotoBusy(true, `Subiendo ${photoCountText(accepted.length)} (${totalLabel})...`);
  updatePhotoProgress({
    title: "Preparando subida",
    detail: `${photoCountText(accepted.length)} seleccionada${accepted.length === 1 ? "" : "s"} · ${totalLabel} en total.`,
    percent: 0,
  });

  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("property_id", propertyId);
  accepted.forEach((file) => body.append("photos[]", file));

  try {
    const data = await sendPhotoForm(body, (loaded, total) => {
      const percent = total ? (loaded / total) * 100 : 0;
      const loadedLabel = formatMegabytes(loaded);
      const transferTotalLabel = formatMegabytes(total || totalBytes);
      const isComplete = percent >= 100;
      updatePhotoProgress({
        title: isComplete ? "Optimizando fotos" : "Subiendo fotos",
        detail: isComplete
          ? "La subida terminó. El servidor está redimensionando y comprimiendo las imágenes."
          : `${loadedLabel} de ${transferTotalLabel} enviados.`,
        percent,
        stateClass: isComplete ? "is-processing" : "",
      });
    });

    updatePhotoProgress({
      title: reload ? "Actualizando galería" : "Fotos procesadas",
      detail: reload ? "Guardando los cambios visibles en el panel." : "Las fotos quedaron optimizadas en el servidor.",
      percent: 100,
      stateClass: "is-processing",
    });
    if (reload) {
      await loadProperties();
    }

    const ready = `${photoCountText(accepted.length)} lista${accepted.length === 1 ? "" : "s"} a 480 px.`;
    $("#photoStatus").textContent = notice ? `${ready} ${notice}` : ready;
    updatePhotoProgress({
      title: "Fotos listas",
      detail: notice ? `${ready} ${notice}` : ready,
      percent: 100,
      stateClass: "is-success",
    });
    return data;
  } catch (error) {
    if (isReauthError(error)) throw error;
    $("#photoStatus").textContent = error.message;
    updatePhotoProgress({
      title: "No se pudo completar la subida",
      detail: error.message,
      percent: 100,
      stateClass: "is-error",
    });
    throw error;
  } finally {
    setPhotoBusy(false);
    $("#photoInput").value = "";
  }
}

function handlePhotoInputChange() {
  if (state.photoBusy) return;

  const files = Array.from($("#photoInput").files || []);
  if (!files.length) return;

  if (!form.id.value) {
    queuePendingPhotos(files);
    $("#photoInput").value = "";
    return;
  }

  uploadPhotos(files).catch(() => {});
}

async function deletePhoto(id) {
  if (state.photoBusy) return;
  if (!confirm("Eliminar esta foto?")) return;
  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("action", "delete");
  body.append("id", id);

  setPhotoBusy(true, "Eliminando foto...");
  try {
    const response = await fetch("../api/admin-photos.php", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    await parseAdminResponse(response, "No se pudo borrar la foto.");
    await loadProperties();
    $("#photoStatus").textContent = "Foto eliminada.";
  } catch (error) {
    if (isReauthError(error)) {
      showLoginForReauth(error);
      return;
    }
    $("#photoStatus").textContent = error.message;
  } finally {
    setPhotoBusy(false);
  }
}

async function makeCover(id) {
  if (state.photoBusy) return;

  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("action", "make_cover");
  body.append("id", id);

  setPhotoBusy(true, "Actualizando foto principal...");
  try {
    const response = await fetch("../api/admin-photos.php", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    await parseAdminResponse(response, "No se pudo cambiar la foto principal.");
    await loadProperties();
    $("#photoStatus").textContent = "Foto principal actualizada.";
  } catch (error) {
    if (isReauthError(error)) {
      showLoginForReauth(error);
      return;
    }
    $("#photoStatus").textContent = error.message;
  } finally {
    setPhotoBusy(false);
  }
}

async function init() {
  const auth = await api("../api/admin-auth.php", { reauth: false });
  state.csrf = auth.csrf || state.csrf;
  $("#loginView").hidden = auth.authenticated;
  $("#appView").hidden = !auth.authenticated;
  if (auth.authenticated) {
    await loadProperties();
  }
}

function bindPasswordToggle() {
  if (!loginPasswordInput || !togglePasswordBtn) return;

  togglePasswordBtn.addEventListener("click", () => {
    const showPassword = loginPasswordInput.type === "password";
    loginPasswordInput.type = showPassword ? "text" : "password";
    togglePasswordBtn.textContent = showPassword ? "Ocultar" : "Ver";
    togglePasswordBtn.setAttribute("aria-label", showPassword ? "Ocultar clave" : "Mostrar clave");
    togglePasswordBtn.setAttribute("aria-pressed", showPassword ? "true" : "false");
  });
}

async function suggestTranslation() {
  const button = $("#translateBtn");
  const status = $("#translateStatus");
  const title = form.titleEs.value.trim();
  const desc = form.descEs.value.trim();

  if (!title && !desc) {
    status.textContent = "Escribe titulo o descripcion en espanol primero.";
    return;
  }

  const hasEnglishText = form.titleEn.value.trim() || form.descEn.value.trim();
  if (hasEnglishText && !confirm("Esto reemplazara los textos en ingles actuales. Continuar?")) {
    return;
  }

  button.disabled = true;
  status.textContent = "Generando sugerencia...";
  try {
    const data = await api("../api/admin-translate.php", {
      method: "POST",
      body: JSON.stringify({ title, desc }),
    });
    form.titleEn.value = data.title || "";
    form.descEn.value = data.desc || "";
    status.textContent = "Sugerencia lista. Puedes editarla antes de guardar.";
    renderPreview();
  } catch (error) {
    if (isReauthError(error)) return;
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#loginError").textContent = "";
  try {
    const data = await api("../api/admin-auth.php", {
      method: "POST",
      reauth: false,
      body: JSON.stringify({
        action: "login",
        username: event.currentTarget.username.value,
        password: event.currentTarget.password.value,
      }),
    });
    state.csrf = data.csrf || state.csrf;
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    if (state.needsReauth) {
      state.needsReauth = false;
      if (state.mode === "editor") {
        $("#saveStatus").textContent = "Sesión reiniciada. Revisa y guarda nuevamente.";
      } else {
        await loadProperties();
      }
    } else {
      await loadProperties();
    }
  } catch (error) {
    $("#loginError").textContent = error.message;
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("../api/admin-auth.php", {
    method: "POST",
    body: JSON.stringify({ action: "logout" }),
  });
  location.reload();
});

$("#newBtn").addEventListener("click", startNewProperty);
$("#newDashboardBtn").addEventListener("click", startNewProperty);
$("#backToDashboardBtn").addEventListener("click", showDashboard);
$("#backToDashboardTopBtn").addEventListener("click", showDashboard);

$("#listFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  renderList();
});

form.addEventListener("submit", saveProperty);
form.addEventListener("input", () => renderPreview());
form.addEventListener("change", () => {
  toggleAvailableFrom();
  renderPreview();
});
$("#deleteBtn").addEventListener("click", deleteProperty);
$("#photoInput").addEventListener("change", handlePhotoInputChange);
$("#translateBtn").addEventListener("click", suggestTranslation);

bindPasswordToggle();
init().catch((error) => {
  $("#loginView").hidden = false;
  if (!isReauthError(error)) {
    $("#loginError").textContent = error.message;
  }
});
