<?php
require __DIR__ . '/bootstrap.php';

$user = user_required();
$year = (int)($_GET['year'] ?? 0);
if ($year < 1900 || $year > 2100) err('Année invalide');

$data = load_user($user);
$ds = $data['datasets'][(string)$year] ?? null;

if (!$ds) {
    // Provide default dataset
    $ds = [
        'categories' => [
            ['id' => 'achats', 'name' => 'Achats & Loisirs', 'target' => 2400],
            ['id' => 'alimentation', 'name' => 'Alimentation', 'target' => 2400],
        ],
        'expenses' => [],
        'subs' => [],
    ];
}
ok($ds);