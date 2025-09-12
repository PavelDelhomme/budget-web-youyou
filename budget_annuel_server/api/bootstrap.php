<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

// Directory where data files are stored
define('DATA_DIR', __DIR__ . '/../data');
if (!is_dir(DATA_DIR)) {
    // Ensure the data directory exists
    mkdir(DATA_DIR, 0775, true);
}

// Helper to read JSON body
function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

// Output helper for success
function ok($data) {
    echo json_encode($data);
    exit;
}

// Output helper for errors
function err($message, $code=400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

// Sanitize email for filename
function sanitize_email(string $email): string {
    $email = strtolower(trim($email));
    return preg_replace('/[^a-z0-9._-]+/','_', $email);
}

// Ensure user is authenticated; return their email
function user_required(): string {
    if (empty($_SESSION['user'])) err('Not authenticated', 401);
    return (string)$_SESSION['user'];
}

// Determine file path for user data
function user_file(string $email): string {
    $safe = sanitize_email($email);
    return DATA_DIR . "/{$safe}.json";
}

// Load user data; if missing create with defaults
function load_user(string $email): array {
    $f = user_file($email);
    if (!file_exists($f)) {
        // initialize default data
        $init = ['years' => [2026,2027,2028,2029,2030], 'datasets' => []];
        file_put_contents($f, json_encode($init, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
        return $init;
    }
    $j = json_decode((string)file_get_contents($f), true);
    return is_array($j) ? $j : ['years' => [2026,2027,2028,2029,2030], 'datasets' => []];
}

// Save user data to file
function save_user(string $email, array $data): void {
    $f = user_file($email);
    file_put_contents($f, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
}