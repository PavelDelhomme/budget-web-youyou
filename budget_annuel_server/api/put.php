<?php
require __DIR__ . '/bootstrap.php';

$user = user_required();
$year = (int)($_GET['year'] ?? 0);
if ($year < 1900 || $year > 2100) err('Année invalide');

$payload = json_input();
if (!is_array($payload)) err('Payload invalide');

$data = load_user($user);

$data['datasets'][(string)$year] = [
    'categories' => $payload['categories'] ?? [],
    'expenses'   => $payload['expenses'] ?? [],
    'subs'       => $payload['subs'] ?? [],
];

if (!in_array($year, $data['years'], true)) {
    $data['years'][] = $year;
    sort($data['years']);
}

save_user($user, $data);
ok(['ok' => true]);