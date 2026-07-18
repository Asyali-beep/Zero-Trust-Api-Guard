<?php
session_start();
header('Content-Type: application/json');

$_SESSION['user_active'] = true; 
$_SESSION['user_id'] = 42;

if (!isset($_SESSION['user_active']) || $_SESSION['user_active'] !== true) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

echo json_encode(["status" => "active"]);
