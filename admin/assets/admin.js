const state = {
  csrf: window.R3_ADMIN.csrf,
  properties: [],
  currentId: null,
};

const $ = (selector) => document.querySelector(selector);
const form = $("#propertyForm");

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
    throw new Error(data.error || "Ocurrio un error.");
  }
  if (data.csrf) state.csrf = data.csrf;
  return data;
}

function blankProperty() {
  return {
    id: "",
    type: "temporada",
    zone: "Concon",
    bedrooms: 2,
    bathrooms: 1,
    area: 0,
    price: 0,
    priceUnit: "noche",
    title: { es: "", en: "" },
    desc: { es: "", en: "" },
    featured: false,
    visible: true,
    airbnbUrl: "",
    sortOrder: 100,
    photos: [],
  };
}

function getCurrentProperty() {
  return state.properties.find((p) => Number(p.id) === Number(state.currentId)) || null;
}

function renderList() {
  const list = $("#propertyList");
  const visible = state.properties.filter((p) => p.visible).length;
  $("#propertyCount").textContent = `${visible} publicadas`;

  list.innerHTML = state.properties.map((p) => `
    <button class="property-item ${Number(p.id) === Number(state.currentId) ? "is-active" : ""}" type="button" data-id="${p.id}">
      <b>${p.title.es || "Sin titulo"}</b>
      <span>${p.zone || "Sin zona"} · ${p.bedrooms || 0} dorm. · ${p.photos.length} fotos</span>
      <small>${p.visible ? "Visible" : "Oculta"}${p.featured ? " · Destacada" : ""}</small>
    </button>
  `).join("");

  list.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectProperty(Number(button.dataset.id)));
  });
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
  form.airbnbUrl.value = property.airbnbUrl || "";
  form.descEs.value = property.desc.es || "";
  form.descEn.value = property.desc.en || "";
  form.visible.checked = property.visible !== false;
  form.featured.checked = Boolean(property.featured);
  $("#editorTitle").textContent = property.id ? property.title.es || "Editar propiedad" : "Nueva propiedad";
  $("#deleteBtn").hidden = !property.id;
  renderPhotos(property.photos || []);
}

function renderPhotos(photos) {
  const grid = $("#photoGrid");
  const canUpload = Boolean(form.id.value);
  $("#photoInput").disabled = !canUpload;

  if (!canUpload) {
    grid.innerHTML = `<p class="admin-status">Guarda la propiedad antes de subir fotos.</p>`;
    return;
  }

  if (!photos.length) {
    grid.innerHTML = `<p class="admin-status">Sin fotos todavia.</p>`;
    return;
  }

  grid.innerHTML = photos.map((photo) => `
    <article class="photo-tile">
      <img src="../${photo.url}" alt="" loading="lazy" />
      <footer>
        <small>${photo.width}x${photo.height} · ${formatBytes(photo.sizeBytes)}</small>
        <button type="button" data-delete-photo="${photo.id}">Borrar</button>
      </footer>
    </article>
  `).join("");

  grid.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.addEventListener("click", () => deletePhoto(Number(button.dataset.deletePhoto)));
  });
}

function selectProperty(id) {
  state.currentId = id;
  const property = getCurrentProperty() || blankProperty();
  fillForm(property);
  renderList();
  $("#saveStatus").textContent = "";
  $("#photoStatus").textContent = "";
}

async function loadProperties() {
  const data = await api("../api/admin-properties.php");
  state.properties = data.properties || [];
  if (!state.currentId && state.properties[0]) {
    state.currentId = state.properties[0].id;
  }
  renderList();
  fillForm(getCurrentProperty() || blankProperty());
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
    airbnbUrl: form.airbnbUrl.value,
    sortOrder: Number(form.sortOrder.value || 100),
  };
}

async function saveProperty(event) {
  event.preventDefault();
  $("#saveStatus").textContent = "Guardando...";
  try {
    const data = await api("../api/admin-properties.php", {
      method: "POST",
      body: JSON.stringify(propertyFromForm()),
    });
    state.properties = data.properties || [];
    state.currentId = data.id;
    renderList();
    fillForm(getCurrentProperty());
    $("#saveStatus").textContent = "Guardado.";
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
    state.currentId = state.properties[0]?.id || null;
    renderList();
    fillForm(getCurrentProperty() || blankProperty());
    $("#saveStatus").textContent = "Eliminado.";
  } catch (error) {
    $("#saveStatus").textContent = error.message;
  }
}

async function uploadPhotos() {
  const files = Array.from($("#photoInput").files || []);
  const propertyId = Number(form.id.value || 0);
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
    await loadProperties();
    $("#photoStatus").textContent = "Fotos listas a 480 px.";
  } catch (error) {
    $("#photoStatus").textContent = error.message;
  } finally {
    $("#photoInput").value = "";
  }
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

async function init() {
  const auth = await api("../api/admin-auth.php");
  state.csrf = auth.csrf || state.csrf;
  $("#loginView").hidden = auth.authenticated;
  $("#appView").hidden = !auth.authenticated;
  if (auth.authenticated) {
    await loadProperties();
  }
}

$("#loginForm").addEventListener("submit", async (event) => {
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

$("#newBtn").addEventListener("click", () => {
  state.currentId = null;
  fillForm(blankProperty());
  renderList();
});

form.addEventListener("submit", saveProperty);
$("#deleteBtn").addEventListener("click", deleteProperty);
$("#photoInput").addEventListener("change", uploadPhotos);

init().catch((error) => {
  $("#loginView").hidden = false;
  $("#loginError").textContent = error.message;
});
