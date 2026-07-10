# R3 Propiedades · r3propiedades.cl

Sitio web de **Rodrigo Rojas Rodríguez** — arriendo de departamentos por **temporada**, **año corrido** y propiedades en **venta** en **Concón, Reñaca y Viña del Mar**.

Hecho en **HTML / CSS / JS + PHP/MySQL** (sin frameworks), pensado para publicarse en **Bluehosting** con un panel privado para editar propiedades y fotos.

## ✨ Características

- 🎨 **Identidad visual azul profundo + dorado** inspirada en la costa.
- 🌐 **Bilingüe** Español / Inglés con selector.
- 🏠 **Listado de propiedades** filtrable por dormitorios (1 / 2 / 3+) y tipo (temporada / año corrido / venta).
- 🔐 **Panel privado** en `/admin` para crear, editar, ocultar y eliminar propiedades.
- 📷 **Subida de fotos optimizada**: máximo 12 por propiedad, lado largo 480 px, WebP si PHP/GD lo soporta.
- 🖼️ **Carga liviana en el landing**: cada tarjeta carga solo la foto principal; la galería completa se pide al abrirla.
- 🔗 Campo opcional para link de **Airbnb** por propiedad.
- 💬 Botones de **WhatsApp** con mensaje pre-cargado por propiedad.
- 🌎 Sugerencia automática de traducción ES → EN en el admin usando MyMemory.
- 📱 Diseño responsive y accesible.

## 📁 Estructura

```
r3propiedades.cl/
├── AGENTS.md             ← notas tecnicas para futuras IAs/agentes
├── index.html            ← página principal
├── styles.css            ← estilos del tema azul profundo + dorado
├── script.js             ← lógica (idioma, filtros, WhatsApp)
├── admin/                ← panel privado
├── api/                  ← API PHP pública y privada
├── database/             ← SQL para crear tablas y migraciones
├── uploads/properties/   ← fotos optimizadas generadas en producción
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
> Para continuar trabajo con IA/agentes, leer tambien [`AGENTS.md`](AGENTS.md).

### Traducciones opcionales

El botón **Sugerir traducción** del admin usa MyMemory. No requiere cuenta ni API key para uso básico.
Opcionalmente se puede completar `translation.mymemory_email` en `api/config.php` para asociar las llamadas a un email de contacto.

## ✏️ Campos editables

| Campo | Qué es |
|------|--------|
| `type` | `"temporada"`, `"anio"` (año corrido) o `"venta"` |
| `zone` | comuna o sector |
| `bedrooms` / `bathrooms` | nº de dormitorios / baños |
| `area` | superficie en m² |
| `price` / `priceUnit` | valor (sin puntos) y `"noche"`, `"mes"` o `"uf"` para ventas |
| `showPrice` | muestra u oculta el precio público |
| `availabilityStatus` / `availableFrom` | disponibilidad actual, desde fecha o no disponible |
| `photos` | hasta 12 fotos optimizadas automáticamente |
| portada | la primera foto del orden es la imagen principal |
| `airbnbUrl` | link opcional a publicación de Airbnb |
| `title` / `desc` | texto en `{ es, en }` |

## ▶️ Ver localmente

Para revisar la web estática sin PHP/MySQL:

```bash
cd r3propiedades.cl
python3 -m http.server 8000
# abre http://localhost:8000
```

En ese modo usa `data/properties.js` como respaldo. Para probar `/admin` y la API se necesita un servidor PHP con MySQL.

## 📷 Politica de fotos

- Máximo 12 fotos por propiedad.
- Máximo 50 MB por archivo original al subir.
- Máximo 50 MB por tanda de subida.
- Se guarda solo una versión liviana de 480 px en el lado más largo.
- El original pesado no queda guardado.
- Si PHP tiene soporte WebP, se guarda WebP; si no, JPEG optimizado.
- En el panel se pueden subir varias fotos a la vez y marcar cualquiera como principal.
- En la página pública se carga solo la principal; el resto se solicita al abrir la galería.

---

📷 Las fotos actuales de respaldo son provisorias. Las reales se administran desde `/admin`.
