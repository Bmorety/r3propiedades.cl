<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$propertyId = (int)($_GET['property_id'] ?? 0);
if ($propertyId <= 0) {
    json_response(['ok' => false, 'error' => 'Propiedad no valida.'], 400);
}

try {
    $stmt = db()->prepare('SELECT id FROM properties WHERE id = ? AND visible = 1');
    $stmt->execute([$propertyId]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'Propiedad no encontrada.'], 404);
    }

    $stmt = db()->prepare(
        "SELECT id, filename, width, height, size_bytes
         FROM property_photos
         WHERE property_id = ?
         ORDER BY sort_order ASC, id ASC"
    );
    $stmt->execute([$propertyId]);

    $photos = array_map(fn(array $photo): array => [
        'id' => (int)$photo['id'],
        'url' => upload_public_url($photo['filename']),
        'width' => (int)$photo['width'],
        'height' => (int)$photo['height'],
        'sizeBytes' => (int)$photo['size_bytes'],
    ], $stmt->fetchAll());

    header('Cache-Control: public, max-age=60');
    json_response(['ok' => true, 'photos' => $photos]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'No se pudieron cargar las fotos.'], 500);
}
