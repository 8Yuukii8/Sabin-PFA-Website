
<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "constructii_pfa";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Eroare la conectarea bazei de date.");
}

$conn->set_charset("utf8mb4");
?>
