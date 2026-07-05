<?php
declare(strict_types=1);

require_once __DIR__ . '/image.php';

require_admin();
require_csrf();

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

function photo_count(int $propertyId): int
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM property_photos WHERE property_id = ?');
    $stmt->execute([$propertyId]);
    return (int)$stmt->fetchColumn();
}

function fetch_photo(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM property_photos WHERE id = ?');
    $stmt->execute([$id]);
    $photo = $stmt->fetch();
    return $photo ?: null;
}

if ($method === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    $photo = fetch_photo($id);
    if (!$photo) {
        json_response(['ok' => false, 'error' => 'Foto no encontrada.'], 404);
    }

    db()->prepare('DELETE FROM property_photos WHERE id = ?')->execute([$id]);
    $path = rtrim((string)config_value('uploads.dir'), '/') . '/' . $photo['filename'];
    if (is_file($path)) {
        @unlink($path);
    }
    json_response(['ok' => true]);
}

if ($method === 'POST' && ($_POST['action'] ?? '') === 'reorder') {
    $ids = json_decode((string)($_POST['ids'] ?? '[]'), true);
    if (!is_array($ids)) {
        json_response(['ok' => false, 'error' => 'Orden no valido.'], 400);
    }
    $stmt = db()->prepare('UPDATE property_photos SET sort_order = ? WHERE id = ?');
    foreach (array_values($ids) as $index => $id) {
        $stmt->execute([$index + 1, (int)$id]);
    }
    json_response(['ok' => true]);
}

$propertyId = (int)($_POST['property_id'] ?? 0);
if ($propertyId <= 0) {
    json_response(['ok' => false, 'error' => 'Guarda la propiedad antes de subir fotos.'], 422);
}

$stmt = db()->prepare('SELECT id FROM properties WHERE id = ?');
$stmt->execute([$propertyId]);
if (!$stmt->fetch()) {
    json_response(['ok' => false, 'error' => 'Propiedad no encontrada.'], 404);
}

$files = $_FILES['photos'] ?? null;
if (!$files || !is_array($files['name'])) {
    json_response(['ok' => false, 'error' => 'Selecciona al menos una foto.'], 422);
}

$maxPhotos = (int)config_value('uploads.max_photos_per_property', 12);
$incoming = count($files['name']);
if (photo_count($propertyId) + $incoming > $maxPhotos) {
    json_response(['ok' => false, 'error' => "Maximo $maxPhotos fotos por propiedad."], 422);
}

$currentOrder = photo_count($propertyId);
$insert = db()->prepare(
    "INSERT INTO property_photos
      (property_id, filename, original_name, mime, width, height, size_bytes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

$saved = [];
try {
    for ($i = 0; $i < $incoming; $i++) {
        $file = [
            'name' => $files['name'][$i],
            'type' => $files['type'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'error' => $files['error'][$i],
            'size' => $files['size'][$i],
        ];
        $photo = process_property_photo($file, $propertyId);
        $insert->execute([
            $propertyId,
            $photo['filename'],
            $photo['original_name'],
            $photo['mime'],
            $photo['width'],
            $photo['height'],
            $photo['size_bytes'],
            ++$currentOrder,
        ]);
        $saved[] = [
            'id' => (int)db()->lastInsertId(),
            'url' => upload_public_url($photo['filename']),
            'filename' => $photo['filename'],
            'width' => $photo['width'],
            'height' => $photo['height'],
            'sizeBytes' => $photo['size_bytes'],
            'sortOrder' => $currentOrder,
        ];
    }
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 422);
}

json_response(['ok' => true, 'photos' => $saved]);
