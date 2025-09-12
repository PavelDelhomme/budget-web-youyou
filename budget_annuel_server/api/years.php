<?php
require __DIR__ . '/bootstrap.php';

$user = user_required();
$data = load_user($user);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    ok(['email' => $user, 'years' => $data['years']]);
}

if ($method === 'POST') {
    $in = json_input();
    $y = (int)($in['year'] ?? 0);
    if ($y < 1900 || $y > 2100) err('Année invalide');
    if (!in_array($y, $data['years'], true)) {
        $data['years'][] = $y;
    }
    sort($data['years']);
    save_user($user, $data);
    ok(['years' => $data['years']]);
}

if ($method === 'DELETE') {
    $y = (int)($_GET['year'] ?? 0);
    // remove from years
    $data['years'] = array_values(array_filter($data['years'], fn($v) => (int)$v !== $y));
    // remove dataset if exists
    if (isset($data['datasets'][(string)$y])) unset($data['datasets'][(string)$y]);
    save_user($user, $data);
    ok(['years' => $data['years']]);
}

err('Méthode non supportée', 405);