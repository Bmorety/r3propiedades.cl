<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    $properties = db()->query(
        "SELECT id, slug, type, zone, bedrooms, bathrooms, area, price, price_unit,
                title_es, title_en, desc_es, desc_en, featured, visible, airbnb_url, sort_order
         FROM properties
         WHERE visible = 1
         ORDER BY featured DESC, sort_order ASC, id DESC"
    )->fetchAll();

    $ids = array_column($properties, 'id');
    $photosByProperty = [];
    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = db()->prepare(
            "SELECT id, property_id, filename, width, height, size_bytes, sort_order
             FROM property_photos
             WHERE property_id IN ($placeholders)
             ORDER BY sort_order ASC, id ASC"
        );
        $stmt->execute($ids);
        foreach ($stmt->fetchAll() as $photo) {
            $photosByProperty[(int)$photo['property_id']][] = [
                'id' => (int)$photo['id'],
                'url' => upload_public_url($photo['filename']),
                'width' => (int)$photo['width'],
                'height' => (int)$photo['height'],
                'sizeBytes' => (int)$photo['size_bytes'],
            ];
        }
    }

    $data = array_map(function (array $p) use ($photosByProperty): array {
        $photos = $photosByProperty[(int)$p['id']] ?? [];
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
            'image' => $photos[0]['url'] ?? '',
            'photos' => $photos,
            'title' => ['es' => $p['title_es'], 'en' => $p['title_en'] ?: $p['title_es']],
            'desc' => ['es' => $p['desc_es'], 'en' => $p['desc_en'] ?: $p['desc_es']],
            'featured' => (bool)$p['featured'],
            'airbnbUrl' => $p['airbnb_url'] ?: '',
        ];
    }, $properties);

    header('Cache-Control: public, max-age=60');
    json_response(['ok' => true, 'properties' => $data]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'No se pudieron cargar las propiedades.'], 500);
}
