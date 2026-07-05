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
    $coversByProperty = [];
    $photoCounts = [];
    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = db()->prepare(
            "SELECT property_id, COUNT(*) AS total
             FROM property_photos
             WHERE property_id IN ($placeholders)
             GROUP BY property_id"
        );
        $stmt->execute($ids);
        foreach ($stmt->fetchAll() as $row) {
            $photoCounts[(int)$row['property_id']] = (int)$row['total'];
        }

        $stmt = db()->prepare(
            "SELECT p1.id, p1.property_id, p1.filename, p1.width, p1.height, p1.size_bytes
             FROM property_photos p1
             WHERE p1.property_id IN ($placeholders)
               AND NOT EXISTS (
                 SELECT 1 FROM property_photos p2
                 WHERE p2.property_id = p1.property_id
                   AND (p2.sort_order < p1.sort_order OR (p2.sort_order = p1.sort_order AND p2.id < p1.id))
               )"
        );
        $stmt->execute($ids);
        foreach ($stmt->fetchAll() as $photo) {
            $coversByProperty[(int)$photo['property_id']] = [
                'id' => (int)$photo['id'],
                'url' => upload_public_url($photo['filename']),
                'width' => (int)$photo['width'],
                'height' => (int)$photo['height'],
                'sizeBytes' => (int)$photo['size_bytes'],
            ];
        }
    }

    $data = array_map(function (array $p) use ($coversByProperty, $photoCounts): array {
        $cover = $coversByProperty[(int)$p['id']] ?? null;
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
            'image' => $cover['url'] ?? '',
            'photoCount' => $photoCounts[(int)$p['id']] ?? 0,
            'photos' => $cover ? [$cover] : [],
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
