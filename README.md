# R3 Propiedades · r3propiedades.cl

Sitio web de **Rodrigo Rojas Rodríguez** — arriendo de departamentos por **temporada** y **año corrido** en **Concón, Reñaca y Viña del Mar**.

Hecho en **HTML / CSS / JS + PHP/MySQL** (sin frameworks), pensado para publicarse en **Bluehosting** con un panel privado para editar propiedades y fotos.

## ✨ Características

- 🎨 **3 temas de color** conmutables en vivo (Arena & Mar profundo · Atardecer en Reñaca · Turquesa Pacífico).
- 🌐 **Bilingüe** Español / Inglés con selector.
- 🏠 **Listado de propiedades** filtrable por dormitorios (1 / 2 / 3+) y tipo (temporada / año corrido).
- 🔐 **Panel privado** en `/admin` para crear, editar, ocultar y eliminar propiedades.
- 📷 **Subida de fotos optimizada**: maximo 12 por propiedad, lado largo 480 px, WebP si PHP/GD lo soporta.
- 🖼️ **Carga liviana en el landing**: cada tarjeta carga solo la foto principal; la galeria completa se pide al abrirla.
- 🔗 Campo opcional para link de **Airbnb** por propiedad.
- 💬 Botones de **WhatsApp** con mensaje pre-cargado por propiedad.
- 📱 Diseño responsive y accesible.

## 📁 Estructura

```
r3propiedades.cl/
├── index.html            ← página principal
├── styles.css            ← estilos y los 3 temas
├── script.js             ← lógica (temas, idioma, filtros, WhatsApp)
├── admin/                ← panel privado
├── api/                  ← API PHP publica y privada
├── database/             ← SQL para crear tablas
├── uploads/properties/   ← fotos optimizadas generadas en produccion
├── data/
│   └── properties.js     ← respaldo local si no hay API
└── README.md
```

## 🚀 Instalar en Bluehosting

1. Crea una base MySQL desde cPanel/phpMyAdmin.
2. Importa [`database/schema.sql`](database/schema.sql).
3. Copia `api/config.sample.php` como `api/config.php`.
4. Completa host, nombre de base, usuario y clave MySQL.
5. Genera una clave de admin:

```bash
php -r "echo password_hash('TU_CLAVE_SEGURA', PASSWORD_DEFAULT), PHP_EOL;"
```

6. Pega ese hash en `admin.password_hash` dentro de `api/config.php`.
7. Sube el proyecto al hosting y entra a `/admin`.

> `api/config.php` no se sube al repositorio porque contiene credenciales.

## ✏️ Campos editables

| Campo | Qué es |
|------|--------|
| `type` | `"temporada"` o `"anio"` (año corrido) |
| `zone` | comuna o sector |
| `bedrooms` / `bathrooms` | nº de dormitorios / baños |
| `area` | superficie en m² |
| `price` / `priceUnit` | valor (sin puntos) y `"noche"` o `"mes"` |
| `photos` | hasta 12 fotos optimizadas automaticamente |
| portada | la primera foto del orden es la imagen principal |
| `airbnbUrl` | link opcional a publicacion de Airbnb |
| `title` / `desc` | texto en `{ es, en }` |

## ▶️ Ver localmente

Para revisar la web estatica sin PHP/MySQL:

```bash
cd r3propiedades.cl
python3 -m http.server 8000
# abre http://localhost:8000
```

En ese modo usa `data/properties.js` como respaldo. Para probar `/admin` y la API se necesita un servidor PHP con MySQL.

## 📷 Politica de fotos

- Maximo 12 fotos por propiedad.
- Maximo 10 MB por archivo original al subir.
- Se guarda solo una version liviana de 480 px en el lado mas largo.
- El original pesado no queda guardado.
- Si PHP tiene soporte WebP, se guarda WebP; si no, JPEG optimizado.
- En el panel se pueden subir varias fotos a la vez y marcar cualquiera como principal.
- En la pagina publica se carga solo la principal; el resto se solicita al abrir la galeria.

---

📷 Las fotos actuales de respaldo son provisorias. Las reales se administran desde `/admin`.
