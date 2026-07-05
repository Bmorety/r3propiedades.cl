# Notas para agentes IA

Este proyecto es un sitio PHP/MySQL sin framework para `r3propiedades.cl`. Antes de cambiar el flujo de fotos, leer estos puntos para no deshacer decisiones recientes.

## Subida de fotos

- El panel privado esta en `admin/`; la API privada de fotos esta en `api/admin-photos.php`; el procesamiento GD esta en `api/image.php`.
- Formatos aceptados: JPG/JPEG, PNG y WebP.
- Limites intencionales de la app:
  - 12 fotos maximo por propiedad.
  - 50 MB maximo por archivo original.
  - 50 MB maximo por tanda de subida.
  - Salida optimizada a 480 px en el lado largo.
  - Objetivo de salida aproximado: 120 KB por foto optimizada.
- El original pesado no se conserva. Solo se usa como entrada para generar una version liviana.
- El navegador prevalida formato, peso por foto, peso total de tanda y cupos disponibles. El backend repite validaciones porque es la fuente de verdad.
- Mientras se suben/optimizan/eliminan/cambia portada, el panel bloquea acciones de fotos y muestra estado al usuario. No quitar ese bloqueo sin reemplazarlo por feedback equivalente.
- La subida usa `XMLHttpRequest` en `admin/assets/admin.js` porque permite mostrar progreso real de transferencia (`upload.onprogress`). No reemplazar por `fetch` salvo que se mantenga progreso equivalente.
- `api/admin-photos.php` usa transaccion y limpia archivos creados si una tanda falla a medio camino. Mantener esta propiedad para evitar registros/archivos parciales.

## Configuracion de produccion

- `api/config.sample.php` es solo plantilla versionada. El archivo real `api/config.php` vive en produccion y no debe subirse porque contiene credenciales.
- En produccion, `api/config.php` debe incluir:

```php
'max_original_bytes' => 50 * 1024 * 1024,
'max_batch_bytes' => 50 * 1024 * 1024,
```

- Se reviso el hosting con `phpinfo()` y el servidor estaba sobrado:
  - `upload_max_filesize = 512M`
  - `post_max_size = 1024M`
  - `memory_limit = 2048M`
  - `max_execution_time = 600`
  - `max_input_time = 400`
- Se creo `.user.ini` en produccion como posible techo local, pero no es parte del repo. Si se deja, valores razonables son:

```ini
upload_max_filesize=64M
post_max_size=64M
memory_limit=256M
max_execution_time=120
max_input_time=120
```

La razon de usar 64M en PHP y 50 MB en la app es dejar margen para overhead de `multipart/form-data`.

## Seguridad operativa

- Si se crea `phpinfo.php` para diagnostico, borrarlo inmediatamente despues. No dejarlo publico.
- No versionar `api/config.php`, `.user.ini`, dumps de base de datos ni fotos reales subidas por clientes.
- Si se cambian limites de fotos, actualizar juntos: `api/config.sample.php`, `admin/assets/admin.js`, `admin/index.php`, `api/image.php`, `api/admin-photos.php` y README.
