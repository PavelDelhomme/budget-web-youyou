<?php
require __DIR__ . '/bootstrap.php';

$in = json_input();
$email = $in['email'] ?? '';
$password = $in['password'] ?? '';

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Email invalide');

/*
 * Note: This example does not implement actual password verification.
 * In a real application, you would hash and verify passwords here.
 */

// Set session user
$_SESSION['user'] = $email;

// Ensure user data exists
$data = load_user($email);

ok(['email' => $email, 'years' => $data['years']]);