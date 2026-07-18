<?php
function enforceRateLimit($maxRequests = 5, $timeWindow = 10) {
    if (!isset($_SESSION['request_history'])) {
        $_SESSION['request_history'] = [];
    }

    $currentTime = time();
    $history = $_SESSION['request_history'];

    $history = array_filter($history, function($timestamp) use ($currentTime, $timeWindow) {
        return ($currentTime - $timestamp) < $timeWindow;
    });

    if (count($history) >= $maxRequests) {
        http_response_code(429);
        echo json_encode(["error" => "Rate limit exceeded. Try again later."]);
        exit;
    }

    $history[] = $currentTime;
    $_SESSION['request_history'] = $history;
}
