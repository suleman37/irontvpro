<?php
// download.php — Téléchargement sécurisé des APK
// Place ce fichier à la racine, et les APK dans /apk/

declare(strict_types=1);

// --- CONFIG ---------------------------------------------------------
$APK_DIR = __DIR__ . '/apk/';                   // dossier des APK
$LOG_DIR = __DIR__ . '/logs/';                  // dossier logs (optionnel)
$ALLOWED = [                                    // liste blanche
  'iron-tv-pro.apk'     => 'iron-tv-pro.apk',
  'iron-tv-max.apk'     => 'iron-tv-max.apk',
  'nox-iptv.apk'        => 'nox-iptv.apk',
  'xciptv-player.apk'   => 'xciptv-player.apk',
  'bob-player.apk'      => 'bob-player.apk',
  'ibo-player-pro.apk'  => 'ibo-player-pro.apk',
  'ibo-player.apk'      => 'ibo-player.apk',
];
// -------------------------------------------------------------------

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 0');

$file = $_GET['file'] ?? '';
$file = basename($file); // neutralise chemins

if (!isset($ALLOWED[$file])) {
  http_response_code(404);
  echo "Fichier introuvable.";
  exit;
}

$path = realpath($APK_DIR . $ALLOWED[$file]);
if (!$path || !is_file($path)) {
  http_response_code(404);
  echo "Fichier indisponible.";
  exit;
}

// (Optionnel) log basique CSV
try {
  if (!is_dir($LOG_DIR)) @mkdir($LOG_DIR, 0755, true);
  $logline = sprintf(
    "%s,%s,%s,%s\n",
    date('c'),
    $_SERVER['REMOTE_ADDR'] ?? '-',
    $_SERVER['HTTP_USER_AGENT'] ?? '-',
    $file
  );
  @file_put_contents($LOG_DIR . 'downloads.csv', $logline, FILE_APPEND | LOCK_EX);
} catch (\Throwable $e) { /* silencieux */ }

// Envoi avec support des gros fichiers
$size = filesize($path);
$filenameOut = $file;

// Headers
header('Content-Description: File Transfer');
header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="'.$filenameOut.'"');
header('Content-Length: ' . $size);
header('Cache-Control: private, max-age=3600');
header('Accept-Ranges: bytes');

// Lecture sécurisée
$chunk = 8192;
$handle = fopen($path, 'rb');
if ($handle === false) {
  http_response_code(500);
  echo "Erreur d’accès au fichier.";
  exit;
}
while (!feof($handle)) {
  echo fread($handle, $chunk);
  @ob_flush();
  flush();
}
fclose($handle);
exit;
