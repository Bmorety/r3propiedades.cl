const state = {
  csrf: window.R3_ADMIN.csrf,
  properties: [],
  currentId: null,
  mode: "dashboard",
  filter: "all",
  pendingPhotoFiles: [],
  pendingPhotoUrls: [],
};

const $ = (selector) => document.querySelector(selector);
const form = $("#propertyForm");
const loginForm = $("#loginForm");
const loginPasswordInput = loginForm?.querySelector('input[name="password"]');
const togglePasswordBtn = $("#togglePasswordBtn");

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
    throw new Error(data.error || "Ocurrió un error.");
  }
  if (data.csrf) state.csrf = data.csrf;
  return data;
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

function queuePendingPhotos(files) {
  const slots = Math.max(0, 12 - state.pendingPhotoFiles.length);
  const accepted = files.slice(0, slots);
  state.pendingPhotoFiles.push(...accepted);
  state.pendingPhotoUrls.push(...accepted.map((file) => URL.createObjectURL(file)));

  if (accepted.length < files.length) {
    $("#photoStatus").textContent = "Máximo 12 fotos por propiedad.";
  } else {
    $("#photoStatus").textContent = `${state.pendingPhotoFiles.length} foto${state.pendingPhotoFiles.length === 1 ? "" : "s"} lista${state.pendingPhotoFiles.length === 1 ? "" : "s"} para subir al guardar.`;
  }

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
    <button class="dashboard-row" type="button" data-id="${p.id}">
      <span class="row-title">
        <b>${esc(p.title.es || "Sin título")}</b>
        <small>${esc(p.zone || "Sin zona")} · ${typeLabel(p.type)} · Orden ${Number(p.sortOrder || 0)}</small>
      </span>
      <span class="row-badges">
        <i class="status-pill ${p.visible ? "is-visible" : "is-hidden"}">${p.visible ? "Visible" : "Oculta"}</i>
        <i class="status-pill ${availabilityClass(p)}">${availabilityLabel(p)}</i>
      </span>
    </button>
  `).join("");

  list.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectProperty(Number(button.dataset.id)));
  });
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
        <strong>${formatPrice(property.price)} <small>/ ${unit}</small></strong>
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
    return;
  }

  if (!photos.length) {
    grid.innerHTML = canUpload
      ? `<p class="admin-status">Sin fotos todavía.</p>`
      : `<p class="admin-status">Puedes seleccionar fotos ahora; se subirán cuando guardes la propiedad.</p>`;
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
    $("#saveStatus").textContent = error.message;
  }
}

async function uploadPhotos(filesArg = null, propertyIdArg = null, reload = true) {
  const files = filesArg || Array.from($("#photoInput").files || []);
  const propertyId = Number(propertyIdArg || form.id.value || 0);
  if (!files.length || !propertyId) return;

  $("#photoStatus").textContent = "Subiendo y optimizando...";
  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("property_id", propertyId);
  files.forEach((file) => body.append("photos[]", file));

  try {
    const response = await fetch("../api/admin-photos.php", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "No se pudieron subir las fotos.");
    if (reload) await loadProperties();
    $("#photoStatus").textContent = "Fotos listas a 480 px.";
  } catch (error) {
    $("#photoStatus").textContent = error.message;
    throw error;
  } finally {
    $("#photoInput").value = "";
  }
}

function handlePhotoInputChange() {
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
  if (!confirm("Eliminar esta foto?")) return;
  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("action", "delete");
  body.append("id", id);

  $("#photoStatus").textContent = "Eliminando foto...";
  try {
    const response = await fetch("../api/admin-photos.php", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "No se pudo borrar la foto.");
    await loadProperties();
    $("#photoStatus").textContent = "Foto eliminada.";
  } catch (error) {
    $("#photoStatus").textContent = error.message;
  }
}

async function makeCover(id) {
  const body = new FormData();
  body.append("csrf", state.csrf);
  body.append("action", "make_cover");
  body.append("id", id);

  $("#photoStatus").textContent = "Actualizando foto principal...";
  try {
    const response = await fetch("../api/admin-photos.php", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "No se pudo cambiar la foto principal.");
    await loadProperties();
    $("#photoStatus").textContent = "Foto principal actualizada.";
  } catch (error) {
    $("#photoStatus").textContent = error.message;
  }
}

async function init() {
  const auth = await api("../api/admin-auth.php");
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

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#loginError").textContent = "";
  try {
    const data = await api("../api/admin-auth.php", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        username: event.currentTarget.username.value,
        password: event.currentTarget.password.value,
      }),
    });
    state.csrf = data.csrf || state.csrf;
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    await loadProperties();
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

bindPasswordToggle();
init().catch((error) => {
  $("#loginView").hidden = false;
  $("#loginError").textContent = error.message;
});
