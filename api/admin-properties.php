<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function admin_property_payload(array $p, array $photos): array
{
    return [
        'id' => (int)$p['id'],
        'slug' => $p['slug'],
        'type' => $p['type'],
        'zone' => $p['zone'],
        'bedrooms' => (int)$p['bedrooms'],
        'bathrooms' => (int)$p['bathrooms'],
        'area' => (int)$p['area'],
        'price' => (int)$p['price'],
        'priceUnit' => $p['price_unit'],
        'title' => ['es' => $p['title_es'], 'en' => $p['title_en']],
        'desc' => ['es' => $p['desc_es'], 'en' => $p['desc_en']],
        'featured' => (bool)$p['featured'],
        'visible' => (bool)$p['visible'],
        'airbnbUrl' => $p['airbnb_url'] ?? '',
        'sortOrder' => (int)$p['sort_order'],
        'photos' => $photos,
    ];
}

function fetch_admin_properties(): array
{
    $properties = db()->query(
        "SELECT * FROM properties ORDER BY visible DESC, featured DESC, sort_order ASC, id DESC"
    )->fetchAll();

    $photosByProperty = [];
    if ($properties) {
        $ids = array_column($properties, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = db()->prepare(
            "SELECT * FROM property_photos
             WHERE property_id IN ($placeholders)
             ORDER BY sort_order ASC, id ASC"
        );
        $stmt->execute($ids);
        foreach ($stmt->fetchAll() as $photo) {
            $photosByProperty[(int)$photo['property_id']][] = [
                'id' => (int)$photo['id'],
                'url' => upload_public_url($photo['filename']),
                'filename' => $photo['filename'],
                'width' => (int)$photo['width'],
                'height' => (int)$photo['height'],
                'sizeBytes' => (int)$photo['size_bytes'],
                'sortOrder' => (int)$photo['sort_order'],
            ];
        }
    }

    return array_map(
        fn(array $p): array => admin_property_payload($p, $photosByProperty[(int)$p['id']] ?? []),
        $properties
    );
}

if ($method === 'GET') {
    json_response(['ok' => true, 'properties' => fetch_admin_properties()]);
}

require_csrf();
$input = json_input();
$action = $input['action'] ?? 'save';

if ($action === 'delete') {
    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        json_response(['ok' => false, 'error' => 'Propiedad no valida.'], 400);
    }

    $stmt = db()->prepare('SELECT filename FROM property_photos WHERE property_id = ?');
    $stmt->execute([$id]);
    $files = $stmt->fetchAll();

    db()->prepare('DELETE FROM properties WHERE id = ?')->execute([$id]);

    $dir = rtrim((string)config_value('uploads.dir'), '/');
    foreach ($files as $file) {
        $path = $dir . '/' . $file['filename'];
        if (is_file($path)) {
            @unlink($path);
        }
    }

    json_response(['ok' => true, 'properties' => fetch_admin_properties()]);
}

if ($action !== 'save') {
    json_response(['ok' => false, 'error' => 'Accion no valida.'], 400);
}

$id = (int)($input['id'] ?? 0);
$titleEs = clean_text($input['title']['es'] ?? '', 180);
if ($titleEs === '') {
    json_response(['ok' => false, 'error' => 'El titulo en espanol es obligatorio.'], 422);
}

$type = in_array(($input['type'] ?? ''), ['temporada', 'anio'], true) ? $input['type'] : 'temporada';
$priceUnit = in_array(($input['priceUnit'] ?? ''), ['noche', 'mes'], true) ? $input['priceUnit'] : 'noche';
$airbnb = clean_text($input['airbnbUrl'] ?? '', 500);
if ($airbnb !== '' && !filter_var($airbnb, FILTER_VALIDATE_URL)) {
    json_response(['ok' => false, 'error' => 'El link de Airbnb debe ser una URL valida.'], 422);
}

$data = [
    'slug' => clean_text($input['slug'] ?? '', 100),
    'type' => $type,
    'zone' => clean_text($input['zone'] ?? '', 90),
    'bedrooms' => max(0, min(20, (int)($input['bedrooms'] ?? 0))),
    'bathrooms' => max(0, min(20, (int)($input['bathrooms'] ?? 0))),
    'area' => max(0, min(10000, (int)($input['area'] ?? 0))),
    'price' => max(0, min(999999999, (int)($input['price'] ?? 0))),
    'price_unit' => $priceUnit,
    'title_es' => $titleEs,
    'title_en' => clean_text($input['title']['en'] ?? '', 180),
    'desc_es' => clean_long_text($input['desc']['es'] ?? '', 3000),
    'desc_en' => clean_long_text($input['desc']['en'] ?? '', 3000),
    'featured' => bool01($input['featured'] ?? false),
    'visible' => bool01($input['visible'] ?? true),
    'airbnb_url' => $airbnb,
    'sort_order' => max(0, min(9999, (int)($input['sortOrder'] ?? 100))),
];

if ($data['slug'] === '') {
    $data['slug'] = slugify($titleEs);
} else {
    $data['slug'] = slugify($data['slug']);
}

try {
    if ($id > 0) {
        $stmt = db()->prepare(
            "UPDATE properties SET
              slug = ?, type = ?, zone = ?, bedrooms = ?, bathrooms = ?, area = ?, price = ?,
              price_unit = ?, title_es = ?, title_en = ?, desc_es = ?, desc_en = ?,
              featured = ?, visible = ?, airbnb_url = ?, sort_order = ?
             WHERE id = ?"
        );
        $stmt->execute([
            $data['slug'], $data['type'], $data['zone'], $data['bedrooms'], $data['bathrooms'],
            $data['area'], $data['price'], $data['price_unit'], $data['title_es'],
            $data['title_en'], $data['desc_es'], $data['desc_en'], $data['featured'],
            $data['visible'], $data['airbnb_url'], $data['sort_order'], $id,
        ]);
    } else {
        $stmt = db()->prepare(
            "INSERT INTO properties
              (slug, type, zone, bedrooms, bathrooms, area, price, price_unit,
               title_es, title_en, desc_es, desc_en, featured, visible, airbnb_url, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['slug'], $data['type'], $data['zone'], $data['bedrooms'], $data['bathrooms'],
            $data['area'], $data['price'], $data['price_unit'], $data['title_es'],
            $data['title_en'], $data['desc_es'], $data['desc_en'], $data['featured'],
            $data['visible'], $data['airbnb_url'], $data['sort_order'],
        ]);
        $id = (int)db()->lastInsertId();
    }

    json_response(['ok' => true, 'id' => $id, 'properties' => fetch_admin_properties()]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_response(['ok' => false, 'error' => 'Ya existe una propiedad con ese slug.'], 422);
    }
    json_response(['ok' => false, 'error' => 'No se pudo guardar la propiedad.'], 500);
}
