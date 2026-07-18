<?php
session_start();
header('Content-Type: application/json');

$customAuth = isset($_SERVER['HTTP_X_CUSTOM_AUTH']) ? $_SERVER['HTTP_X_CUSTOM_AUTH'] : '';

if ($customAuth !== 'Basic ZHVtbXk6cGFzc3dvcmQ=') {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized signature"]);
    exit;
}

$nonce = bin2hex(random_bytes(128));
$_SESSION['api_nonce'] = $nonce;

echo json_encode([
    "api_guard" => $nonce,
    "user_authentication" => "Bearer dummy_user_token_123"
]);
