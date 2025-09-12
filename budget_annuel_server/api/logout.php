<?php
require __DIR__ . '/bootstrap.php';

// Destroy session
session_destroy();

ok(['done' => true]);