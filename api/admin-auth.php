<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_response([
        'ok' => true,
        'authenticated' => is_admin(),
        'csrf' => csrf_token(),
    ]);
}

$input = json_input();
$action = $input['action'] ?? '';

if ($action === 'login') {
    $username = clean_text($input['username'] ?? '', 80);
    $password = (string)($input['password'] ?? '');
    $expectedUser = (string)config_value('admin.username');
    $expectedHash = (string)config_value('admin.password_hash');

    if (hash_equals($expectedUser, $username) && password_verify($password, $expectedHash)) {
        session_regenerate_id(true);
        $_SESSION['r3_admin'] = true;
        json_response(['ok' => true, 'authenticated' => true, 'csrf' => csrf_token()]);
    }

    json_response(['ok' => false, 'error' => 'Usuario o clave incorrectos.'], 401);
}

if ($action === 'logout') {
    require_csrf();
    $_SESSION = [];
    session_destroy();
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Acción no válida.'], 400);
