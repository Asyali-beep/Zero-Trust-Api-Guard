<?php
session_start();
header('Content-Type: application/json');

$receivedNonce = isset($_SERVER['HTTP_X_CSRF_NONCE']) ? $_SERVER['HTTP_X_CSRF_NONCE'] : '';
$customAuth = isset($_SERVER['HTTP_X_CUSTOM_AUTH']) ? $_SERVER['HTTP_X_CUSTOM_AUTH'] : '';

if ($customAuth !== 'Basic ZHVtbXk6cGFzc3dvcmQ=') {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized signature"]);
    exit;
}

if (empty($receivedNonce) || !isset($_SESSION['api_nonce']) || $_SESSION['api_nonce'] !== $receivedNonce) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid or expired nonce"]);
    exit;
}

unset($_SESSION['api_nonce']);

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['action']) && $input['action'] === 'approve_order') {
    echo json_encode([
        "status" => "success",
        "message" => "Order " . htmlspecialchars($input['order_id']) . " approved securely."
    ]);
} else {
    http_response_code(400);
    echo json_encode(["error" => "Bad request"]);
}
