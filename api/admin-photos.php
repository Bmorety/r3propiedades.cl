<?php
declare(strict_types=1);

require_once __DIR__ . '/image.php';

function upload_limit_mb(int $bytes): int
{
    return (int)round($bytes / (1024 * 1024));
}

require_admin();

$maxBatchBytes = (int)config_value('uploads.max_batch_bytes', 50 * 1024 * 1024);
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if (($_SERVER['REQUEST_METHOD'] ?? 'POST') === 'POST' && $contentLength > $maxBatchBytes + (2 * 1024 * 1024) && empty($_POST)) {
    json_response([
        'ok' => false,
        'error' => 'La tanda supera el máximo de ' . upload_limit_mb($maxBatchBytes) . ' MB. Sube menos fotos a la vez.',
    ], 422);
}

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

function reorder_property_photos(int $propertyId, array $orderedIds): void
{
    $stmt = db()->prepare('UPDATE property_photos SET sort_order = ? WHERE id = ? AND property_id = ?');
    foreach (array_values($orderedIds) as $index => $id) {
        $stmt->execute([$index + 1, (int)$id, $propertyId]);
    }
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
    $propertyId = (int)($_POST['property_id'] ?? 0);
    if ($propertyId <= 0) {
        json_response(['ok' => false, 'error' => 'Propiedad no válida.'], 400);
    }
    reorder_property_photos($propertyId, $ids);
    json_response(['ok' => true]);
}

if ($method === 'POST' && ($_POST['action'] ?? '') === 'make_cover') {
    $id = (int)($_POST['id'] ?? 0);
    $photo = fetch_photo($id);
    if (!$photo) {
        json_response(['ok' => false, 'error' => 'Foto no encontrada.'], 404);
    }

    $stmt = db()->prepare(
        'SELECT id FROM property_photos WHERE property_id = ? ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([(int)$photo['property_id']]);
    $ids = array_map('intval', array_column($stmt->fetchAll(), 'id'));
    $ordered = array_values(array_unique(array_merge([$id], array_filter($ids, fn(int $item): bool => $item !== $id))));
    reorder_property_photos((int)$photo['property_id'], $ordered);

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

$incomingBytes = array_sum(array_map('intval', $files['size'] ?? []));
if ($incomingBytes > $maxBatchBytes) {
    json_response(['ok' => false, 'error' => 'La tanda supera el máximo de ' . upload_limit_mb($maxBatchBytes) . ' MB. Sube menos fotos a la vez.'], 422);
}

$maxPhotos = (int)config_value('uploads.max_photos_per_property', 12);
$incoming = count($files['name']);
if (photo_count($propertyId) + $incoming > $maxPhotos) {
    json_response(['ok' => false, 'error' => "Máximo $maxPhotos fotos por propiedad."], 422);
}

$pdo = db();
$currentOrder = photo_count($propertyId);
$insert = $pdo->prepare(
    "INSERT INTO property_photos
      (property_id, filename, original_name, mime, width, height, size_bytes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

$saved = [];
$createdPaths = [];
try {
    $pdo->beginTransaction();
    for ($i = 0; $i < $incoming; $i++) {
        $file = [
            'name' => $files['name'][$i],
            'type' => $files['type'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'error' => $files['error'][$i],
            'size' => $files['size'][$i],
        ];
        $photo = process_property_photo($file, $propertyId);
        $createdPaths[] = rtrim((string)config_value('uploads.dir'), '/') . '/' . $photo['filename'];
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
            'id' => (int)$pdo->lastInsertId(),
            'url' => upload_public_url($photo['filename']),
            'filename' => $photo['filename'],
            'width' => $photo['width'],
            'height' => $photo['height'],
            'sizeBytes' => $photo['size_bytes'],
            'sortOrder' => $currentOrder,
        ];
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($createdPaths as $path) {
        if (is_file($path)) {
            @unlink($path);
        }
    }
    json_response(['ok' => false, 'error' => $e->getMessage()], 422);
}

json_response(['ok' => true, 'photos' => $saved]);
