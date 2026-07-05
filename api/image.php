<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function create_image_from_upload(string $path, int $type): GdImage
{
    return match ($type) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($path),
        IMAGETYPE_PNG => imagecreatefrompng($path),
        IMAGETYPE_WEBP => imagecreatefromwebp($path),
        default => throw new RuntimeException('Formato de imagen no soportado.'),
    };
}

function fix_jpeg_orientation(GdImage $image, string $path, int $type): GdImage
{
    if ($type !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) {
        return $image;
    }

    $exif = @exif_read_data($path);
    $orientation = (int)($exif['Orientation'] ?? 1);

    return match ($orientation) {
        3 => imagerotate($image, 180, 0),
        6 => imagerotate($image, -90, 0),
        8 => imagerotate($image, 90, 0),
        default => $image,
    };
}

function save_optimized(GdImage $image, string $basePath, int $targetBytes, int $quality): array
{
    $supportsWebp = function_exists('imagewebp');
    $extension = $supportsWebp ? 'webp' : 'jpg';
    $path = $basePath . '.' . $extension;
    $minQuality = $supportsWebp ? 50 : 58;
    $quality = max($minQuality, min(82, $quality));

    for ($q = $quality; $q >= $minQuality; $q -= 6) {
        if ($supportsWebp) {
            imagewebp($image, $path, $q);
        } else {
            imagejpeg($image, $path, $q);
        }
        clearstatcache(true, $path);
        if ((int)filesize($path) <= $targetBytes || $q <= $minQuality) {
            break;
        }
    }

    return [
        'path' => $path,
        'filename' => basename($path),
        'mime' => $supportsWebp ? 'image/webp' : 'image/jpeg',
        'bytes' => (int)filesize($path),
    ];
}

function process_property_photo(array $file, int $propertyId): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('No se pudo subir una foto.');
    }

    $maxBytes = (int)config_value('uploads.max_original_bytes', 10 * 1024 * 1024);
    if ((int)$file['size'] > $maxBytes) {
        throw new RuntimeException('La foto supera el máximo permitido.');
    }

    $info = getimagesize($file['tmp_name']);
    if ($info === false) {
        throw new RuntimeException('El archivo no parece ser una imagen válida.');
    }

    [$width, $height, $type] = $info;
    if (!in_array($type, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        throw new RuntimeException('Solo se aceptan JPG, PNG o WebP.');
    }

    $src = create_image_from_upload($file['tmp_name'], $type);
    $src = fix_jpeg_orientation($src, $file['tmp_name'], $type);
    $width = imagesx($src);
    $height = imagesy($src);

    $maxSide = (int)config_value('uploads.max_side_px', 480);
    $scale = min(1, $maxSide / max($width, $height));
    $newWidth = max(1, (int)round($width * $scale));
    $newHeight = max(1, (int)round($height * $scale));

    $dst = imagecreatetruecolor($newWidth, $newHeight);
    $white = imagecolorallocate($dst, 255, 255, 255);
    imagefill($dst, 0, 0, $white);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $dir = rtrim((string)config_value('uploads.dir'), '/');
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        throw new RuntimeException('No se pudo crear la carpeta de fotos.');
    }

    $base = sprintf(
        '%s/p%d-%s-%s',
        $dir,
        $propertyId,
        date('YmdHis'),
        bin2hex(random_bytes(4))
    );

    $saved = save_optimized(
        $dst,
        $base,
        (int)config_value('uploads.target_bytes', 120 * 1024),
        (int)config_value('uploads.quality', 70)
    );

    imagedestroy($src);
    imagedestroy($dst);

    return [
        'filename' => $saved['filename'],
        'original_name' => clean_text($file['name'] ?? 'foto', 180),
        'mime' => $saved['mime'],
        'width' => $newWidth,
        'height' => $newHeight,
        'size_bytes' => $saved['bytes'],
    ];
}
