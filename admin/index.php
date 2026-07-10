<?php
require_once __DIR__ . '/../api/bootstrap.php';
$csrf = csrf_token();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin · R3 Propiedades</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css" />
  <link rel="stylesheet" href="assets/admin.css" />
</head>
<body class="admin-shell">
  <main class="admin-wrap">
    <section id="loginView" class="admin-login" hidden>
      <div class="admin-card admin-login__card">
        <span class="brand__mark">R3</span>
        <p class="eyebrow">Panel privado</p>
        <h1>Editar propiedades</h1>
        <form id="loginForm" class="admin-form">
          <label>
            Usuario
            <input name="username" autocomplete="username" required />
          </label>
          <label>
            Clave
            <span class="password-field">
              <input name="password" type="password" autocomplete="current-password" required />
              <button id="togglePasswordBtn" class="password-toggle" type="button" aria-label="Mostrar clave" aria-pressed="false">Ver</button>
            </span>
          </label>
          <button class="admin-btn admin-btn--primary" type="submit">Entrar</button>
          <p id="loginError" class="admin-error" role="alert"></p>
        </form>
      </div>
    </section>

    <section id="appView" hidden>
      <header class="admin-top">
        <div>
          <p class="eyebrow">R3 Propiedades</p>
          <h1>Panel de propiedades</h1>
        </div>
        <div class="admin-top__actions">
          <a class="admin-btn admin-btn--ghost" href="../" target="_blank" rel="noopener">Ver sitio</a>
          <button id="logoutBtn" class="admin-btn admin-btn--ghost" type="button">Salir</button>
        </div>
      </header>

      <div class="admin-layout">
        <aside class="admin-card admin-list-panel">
          <div class="admin-list-head">
            <div>
              <h2>Propiedades</h2>
              <span id="propertyCount">0 publicadas · 0 ocultas</span>
            </div>
            <button id="newBtn" class="admin-btn admin-btn--primary" type="button">Nueva</button>
          </div>
          <div id="listFilters" class="list-filters" aria-label="Filtrar propiedades">
            <button class="is-active" type="button" data-filter="all">Todas</button>
            <button type="button" data-filter="visible">Visibles</button>
            <button type="button" data-filter="hidden">Ocultas</button>
            <button type="button" data-filter="available">Disponibles</button>
            <button type="button" data-filter="scheduled">Desde fecha</button>
            <button type="button" data-filter="unavailable">No disponibles</button>
          </div>
          <div id="propertyList" class="property-list"></div>
        </aside>

        <section class="admin-card admin-editor">
          <section id="dashboardView" class="admin-dashboard">
            <div class="dashboard-head">
              <div>
                <p class="eyebrow">Resumen operativo</p>
                <h2>Dashboard</h2>
                <p>Administra qué se ve en el sitio, cuándo está disponible y el orden en que aparece.</p>
              </div>
              <button id="newDashboardBtn" class="admin-btn admin-btn--primary" type="button">Nueva propiedad</button>
            </div>
            <div id="dashboardStats" class="dashboard-stats"></div>
            <div class="dashboard-table-head">
              <h3>Lista de propiedades</h3>
              <span>El orden menor aparece primero en la web.</span>
            </div>
            <div id="dashboardList" class="dashboard-list"></div>
          </section>

          <div id="editorView" hidden>
            <button id="backToDashboardTopBtn" class="admin-btn admin-btn--ghost editor-back" type="button">&larr; Volver al dashboard</button>
            <form id="propertyForm" class="admin-form">
              <input type="hidden" name="id" />
              <div class="editor-head">
                <div>
                  <p class="eyebrow">Ficha editable</p>
                  <h2 id="editorTitle">Nueva propiedad</h2>
                </div>
                <div class="status-row">
                  <label class="toggle"><input type="checkbox" name="visible" checked /> Visible</label>
                  <label class="toggle"><input type="checkbox" name="featured" /> Destacada</label>
                </div>
              </div>

              <div class="editor-grid">
                <div class="form-grid">
                  <label class="span-2">
                    Título
                    <input name="titleEs" required maxlength="180" />
                  </label>
                  <label>
                    Tipo
                    <select name="type">
                      <option value="temporada">Temporada</option>
                      <option value="anio">Año corrido</option>
                      <option value="venta">Venta</option>
                    </select>
                  </label>
                  <label>
                    Zona
                    <input name="zone" list="zones" maxlength="90" />
                    <datalist id="zones">
                      <option value="Concón"></option>
                      <option value="Reñaca"></option>
                      <option value="Viña del Mar"></option>
                    </datalist>
                  </label>
                  <label>
                    Dormitorios
                    <input name="bedrooms" type="number" min="0" max="20" />
                  </label>
                  <label>
                    Baños
                    <input name="bathrooms" type="number" min="0" max="20" />
                  </label>
                  <label>
                    M2
                    <input name="area" type="number" min="0" max="10000" />
                  </label>
                  <label>
                    Precio
                    <input name="price" type="number" min="0" max="999999999" />
                  </label>
                  <label>
                    Moneda
                    <select name="priceCurrency">
                      <option value="clp">CLP</option>
                      <option value="uf">UF</option>
                    </select>
                  </label>
                  <label class="toggle">
                    <input name="showPrice" type="checkbox" checked />
                    Mostrar precio
                  </label>
                  <label>
                    Unidad
                    <select name="priceUnit">
                      <option value="noche">Noche</option>
                      <option value="mes">Mes</option>
                    </select>
                  </label>
                  <label>
                    Orden en la web
                    <input name="sortOrder" type="number" min="0" max="9999" />
                  </label>
                  <label>
                    Disponibilidad
                    <select name="availabilityStatus">
                      <option value="available">Disponible ahora</option>
                      <option value="available_from">Disponible desde fecha</option>
                      <option value="unavailable">No disponible</option>
                    </select>
                  </label>
                  <label id="availableFromField">
                    Fecha disponible
                    <input name="availableFrom" type="date" />
                  </label>
                  <label class="span-2">
                    Link Airbnb / publicación opcional
                    <input name="airbnbUrl" type="url" placeholder="https://www.airbnb... o link de publicación" maxlength="500" />
                  </label>
                  <label class="span-2">
                    Descripción
                    <textarea name="descEs" rows="5" maxlength="3000"></textarea>
                  </label>
                  <details class="span-2 admin-details">
                    <summary>Textos en inglés opcionales</summary>
                    <div class="translation-tools">
                      <button id="translateBtn" class="admin-btn admin-btn--ghost" type="button">Sugerir traducción</button>
                      <p id="translateStatus" class="admin-status" role="status"></p>
                    </div>
                    <div class="form-grid">
                      <label>
                        Título EN
                        <input name="titleEn" maxlength="180" />
                      </label>
                      <label>
                        Descripción EN
                        <textarea name="descEn" rows="4" maxlength="3000"></textarea>
                      </label>
                    </div>
                  </details>
                </div>

                <aside class="preview-panel">
                  <div class="preview-panel__head">
                    <p class="eyebrow">Previsualización</p>
                    <span>Tarjeta pública</span>
                  </div>
                  <div id="propertyPreview"></div>
                </aside>
              </div>

              <div class="form-actions">
                <button class="admin-btn admin-btn--primary" type="submit">Guardar propiedad</button>
                <button id="backToDashboardBtn" class="admin-btn admin-btn--ghost" type="button">Volver al dashboard</button>
                <button id="deleteBtn" class="admin-btn admin-btn--danger" type="button" hidden>Eliminar</button>
                <p id="saveStatus" class="admin-status" role="status"></p>
              </div>
            </form>

            <section id="photoPanel" class="photo-panel" aria-busy="false">
              <div class="photo-panel__head">
                <div>
                  <h3>Fotos</h3>
                  <p>JPG, PNG o WebP. Máximo 12 fotos, 50 MB por foto y 50 MB por tanda.</p>
                </div>
                <label class="admin-btn admin-btn--ghost upload-btn">
                  Subir fotos
                  <input id="photoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden />
                </label>
              </div>
              <div id="photoProgress" class="photo-progress" role="status" aria-live="polite" hidden>
                <div class="photo-progress__top">
                  <strong id="photoProgressTitle">Preparando fotos</strong>
                  <span id="photoProgressPercent">0%</span>
                </div>
                <div class="photo-progress__bar" aria-hidden="true">
                  <span id="photoProgressBar"></span>
                </div>
                <p id="photoProgressDetail"></p>
              </div>
              <div id="photoGrid" class="photo-grid"></div>
              <p id="photoStatus" class="admin-status" role="status"></p>
            </section>
          </div>
        </section>
      </div>
    </section>
  </main>

  <script>
    window.R3_ADMIN = { csrf: <?php echo json_encode($csrf); ?> };
  </script>
  <script src="assets/admin.js"></script>
</body>
</html>
