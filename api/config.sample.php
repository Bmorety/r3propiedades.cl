<?php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'r3propiedades',
        'user' => 'r3_user',
        'pass' => 'CAMBIAR_PASSWORD_DB',
        'charset' => 'utf8mb4',
    ],

    // Generar con:
    // php -r "echo password_hash('TU_CLAVE_SEGURA', PASSWORD_DEFAULT), PHP_EOL;"
    'admin' => [
        'username' => 'rodrigo',
        'password_hash' => '$2y$10$CAMBIAR_ESTE_HASH',
    ],

    // Opcional: MyMemory puede usar email para contacto/limites, pero no es obligatorio.
    'translation' => [
        'mymemory_email' => '',
    ],

    'uploads' => [
        'dir' => __DIR__ . '/../uploads/properties',
        'url' => 'uploads/properties',
        'max_original_bytes' => 50 * 1024 * 1024,
        'max_batch_bytes' => 50 * 1024 * 1024,
        'max_photos_per_property' => 12,
        'max_side_px' => 480,
        'target_bytes' => 120 * 1024,
        'quality' => 70,
    ],
];
