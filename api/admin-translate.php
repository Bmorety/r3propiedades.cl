<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

require_admin();
require_csrf();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['ok' => false, 'error' => 'Metodo no permitido.'], 405);
}

$input = json_input();
$title = clean_text($input['title'] ?? '', 180);
$desc = clean_long_text($input['desc'] ?? '', 3000);

if ($title === '' && $desc === '') {
    json_response(['ok' => false, 'error' => 'Escribe titulo o descripcion en espanol primero.'], 422);
}

function split_translation_text(string $text, int $maxLength = 450): array
{
    $text = trim($text);
    if ($text === '') {
        return [];
    }

    $parts = preg_split('/(?<=[.!?])\s+/u', $text) ?: [$text];
    $chunks = [];
    $current = '';

    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '') {
            continue;
        }

        if (mb_strlen($part) > $maxLength) {
            if ($current !== '') {
                $chunks[] = $current;
                $current = '';
            }
            for ($offset = 0; $offset < mb_strlen($part); $offset += $maxLength) {
                $chunks[] = mb_substr($part, $offset, $maxLength);
            }
            continue;
        }

        $candidate = $current === '' ? $part : $current . ' ' . $part;
        if (mb_strlen($candidate) > $maxLength) {
            $chunks[] = $current;
            $current = $part;
        } else {
            $current = $candidate;
        }
    }

    if ($current !== '') {
        $chunks[] = $current;
    }

    return $chunks;
}

function mymemory_fetch(string $url): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT => 'R3PropiedadesAdmin/1.0',
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'timeout' => 12,
                'header' => "User-Agent: R3PropiedadesAdmin/1.0\r\n",
            ],
        ]);
        $body = @file_get_contents($url, false, $context);
        $status = 200;
    }

    if (!is_string($body) || $body === '' || $status >= 400) {
        json_response(['ok' => false, 'error' => 'No se pudo conectar con el traductor.'], 502);
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        json_response(['ok' => false, 'error' => 'El traductor respondio con un formato inesperado.'], 502);
    }

    return $data;
}

function translate_text(string $text): string
{
    $chunks = split_translation_text($text);
    if (!$chunks) {
        return '';
    }

    $email = trim((string)config_value('translation.mymemory_email', ''));
    $translated = [];

    foreach ($chunks as $chunk) {
        $params = [
            'q' => $chunk,
            'langpair' => 'es|en',
        ];
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $params['de'] = $email;
        }

        $url = 'https://api.mymemory.translated.net/get?' . http_build_query($params);
        $data = mymemory_fetch($url);
        $text = (string)($data['responseData']['translatedText'] ?? '');
        if ($text === '') {
            json_response(['ok' => false, 'error' => 'El traductor no devolvio una propuesta.'], 502);
        }
        $translated[] = $text;
    }

    return trim(implode(' ', $translated));
}

json_response([
    'ok' => true,
    'title' => mb_substr(translate_text($title), 0, 180),
    'desc' => mb_substr(translate_text($desc), 0, 3000),
]);
