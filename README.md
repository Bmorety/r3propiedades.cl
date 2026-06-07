# R3 Propiedades · r3propiedades.cl

Sitio web de **Rodrigo Rojas Rodríguez** — arriendo de departamentos por **temporada** y **año corrido** en **Concón, Reñaca y Viña del Mar**.

Hecho en **HTML / CSS / JS puro** (sin frameworks), pensado para publicarse en **GitHub Pages** y luego conectarse a una base de datos **MySQL** en Bluehosting.

## ✨ Características

- 🎨 **3 temas de color** conmutables en vivo (Arena & Mar profundo · Atardecer en Reñaca · Turquesa Pacífico).
- 🌐 **Bilingüe** Español / Inglés con selector.
- 🏠 **Listado de propiedades** filtrable por dormitorios (1 / 2 / 3+) y tipo (temporada / año corrido).
- 💬 Botones de **WhatsApp** con mensaje pre-cargado por propiedad.
- 📱 Diseño responsive y accesible.

## 📁 Estructura

```
r3propiedades.cl/
├── index.html            ← página principal
├── styles.css            ← estilos y los 3 temas
├── script.js             ← lógica (temas, idioma, filtros, WhatsApp)
├── data/
│   └── properties.js     ← ⭐ BASE DE DATOS DRAFT de propiedades (editar aquí)
└── README.md
```

## ✏️ Cómo editar / agregar propiedades (por ahora)

Mientras no exista el panel de administración, las propiedades se editan en
[`data/properties.js`](data/properties.js). Cada propiedad es un bloque entre `{ }`.
Para agregar una, copia un bloque existente y cambia los valores. Campos:

| Campo | Qué es |
|------|--------|
| `type` | `"temporada"` o `"anio"` (año corrido) |
| `zone` | `"Concón"`, `"Reñaca"` o `"Viña del Mar"` |
| `bedrooms` / `bathrooms` | nº de dormitorios / baños |
| `area` | superficie en m² |
| `price` / `priceUnit` | valor (sin puntos) y `"noche"` o `"mes"` |
| `image` | URL de la foto |
| `title` / `desc` | texto en `{ es, en }` |

> 🔜 **Futuro:** este archivo será reemplazado por una API que lee las propiedades
> desde MySQL (phpMyAdmin / Bluehosting), con un panel donde Rodrigo entra con su
> correo/clave y edita sin tocar código.

## ▶️ Ver localmente

Como el sitio carga datos por archivo, conviene levantar un servidor local:

```bash
cd r3propiedades.cl
python3 -m http.server 8000
# abre http://localhost:8000
```

## 🚀 Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube estos archivos.
2. **Settings → Pages → Source:** rama `main`, carpeta `/ (root)`.
3. El sitio quedará en `https://<usuario>.github.io/<repo>/`.
4. Para usar el dominio **r3propiedades.cl**, agrega un archivo `CNAME` con el dominio
   y configura el DNS en Bluehosting (registro `CNAME`/`A` apuntando a GitHub Pages).

---

📷 Las fotos actuales son de **Unsplash** (uso libre) y son provisionales — se
reemplazarán por fotos reales de las propiedades.
