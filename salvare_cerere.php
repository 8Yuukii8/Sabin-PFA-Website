
<?php
header("Content-Type: application/json; charset=utf-8");

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . "/PHPMailer/Exception.php";
require_once __DIR__ . "/PHPMailer/PHPMailer.php";
require_once __DIR__ . "/PHPMailer/SMTP.php";

function raspuns($succes, $mesaj) {
    echo json_encode([
        "succes" => $succes,
        "mesaj" => $mesaj
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// PERMITEM DOAR CERERI POST

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    raspuns(false, "Metoda nepermisa.");
}

// PRELUAREA DATELOR DIN FORMULAR

$tip = trim($_POST["tip_lucrare"] ?? "");
$nume = trim($_POST["nume"] ?? "");
$telefon = trim($_POST["telefon"] ?? "");
$email = trim($_POST["email"] ?? "");
$locatie = trim($_POST["locatie"] ?? "");
$buget = $_POST["buget"] ?? "";
$detalii = trim($_POST["detalii"] ?? "");

// VALIDAREA DATELOR

if (
    $tip === "" ||
    mb_strlen($nume) < 3 ||
    !preg_match('/^[0-9]{10,15}$/', $telefon) ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    $locatie === "" ||
    !is_numeric($buget) ||
    (float)$buget <= 0 ||
    $detalii === ""
) {
    http_response_code(400);
    raspuns(false, "Date incomplete sau invalide.");
}

// CONFIGURAREA LIMITELOR PENTRU FISIERE

$maxFisiere = 5;
$maxDimensiune = 5 * 1024 * 1024;
$maxTotal = 20 * 1024 * 1024;

$tipuriPermise = [
    "image/jpeg" => ["jpg", "jpeg"],
    "image/png" => ["png"],
    "image/webp" => ["webp"],
    "application/pdf" => ["pdf"]
];

$fisiereValide = [];
$dimensiuneTotala = 0;

// PRELUAREA FOTOGRAFIILOR SI DOCUMENTELOR

if (isset($_FILES["fisiere"])) {
    $upload = $_FILES["fisiere"];

    if (!is_array($upload["name"])) {
        http_response_code(400);
        raspuns(false, "Format de incarcare invalid.");
    }

    foreach ($upload["name"] as $i => $numeFisier) {

        $eroare = $upload["error"][$i];

        if ($eroare === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        if ($eroare !== UPLOAD_ERR_OK) {
            http_response_code(400);
            raspuns(false, "Un fisier nu a putut fi incarcat.");
        }

        if (count($fisiereValide) >= $maxFisiere) {
            http_response_code(400);
            raspuns(false, "Poti incarca maximum 5 fisiere.");
        }

        $temporar = $upload["tmp_name"][$i];
        $dimensiune = (int)$upload["size"][$i];

        if (
            $dimensiune <= 0 ||
            $dimensiune > $maxDimensiune
        ) {
            http_response_code(400);
            raspuns(false, "Fiecare fisier poate avea maximum 5 MB.");
        }

        if (!is_uploaded_file($temporar)) {
            http_response_code(400);
            raspuns(false, "Fisier incarcat invalid.");
        }

        $dimensiuneTotala += $dimensiune;

        if ($dimensiuneTotala > $maxTotal) {
            http_response_code(400);
            raspuns(false, "Fisierele depasesc 20 MB in total.");
        }

        // VERIFICAM TIPUL REAL AL FISIERULUI

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($temporar);

        if (!isset($tipuriPermise[$mime])) {
            http_response_code(400);
            raspuns(
                false,
                "Sunt permise doar fisiere JPG, PNG, WEBP si PDF."
            );
        }

        $extensie = strtolower(
            pathinfo($numeFisier, PATHINFO_EXTENSION)
        );

        if (!in_array(
            $extensie,
            $tipuriPermise[$mime],
            true
        )) {
            http_response_code(400);
            raspuns(false, "Extensia fisierului nu este valida.");
        }

        $fisiereValide[] = [
            "nume" => $numeFisier,
            "temporar" => $temporar,
            "extensie" => $extensie
        ];
    }
}

// SALVAREA FISIERELOR INTR-UN FOLDER PRIVAT

$folderFisiere = dirname(__DIR__, 2) . "/private_uploads";

if (!is_dir($folderFisiere)) {
    if (
        !mkdir($folderFisiere, 0700, true) &&
        !is_dir($folderFisiere)
    ) {
        http_response_code(500);
        raspuns(false, "Nu se poate crea folderul pentru fisiere.");
    }
}

$atasamente = [];

foreach ($fisiereValide as $fisier) {

    try {
        $numeNou = bin2hex(random_bytes(16))
                 . "." . $fisier["extensie"];

    } catch (Throwable $e) {
        http_response_code(500);
        raspuns(false, "Eroare la pregatirea fisierelor.");
    }

    $caleFinala = $folderFisiere . "/" . $numeNou;

    if (!move_uploaded_file(
        $fisier["temporar"],
        $caleFinala
    )) {
        foreach ($atasamente as $atasament) {
            @unlink($atasament["cale"]);
        }

        http_response_code(500);
        raspuns(false, "Fisierul nu a putut fi salvat.");
    }

    $atasamente[] = [
        "cale" => $caleFinala,
        "nume" => $fisier["nume"]
    ];
}

// SALVAREA CERERII IN BAZA DE DATE

try {
    require_once __DIR__ . "/db.php";

    $sql = "INSERT INTO cereri
            (tip_lucrare, nume, telefon, email,
             locatie, buget, detalii)
            VALUES (?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    $buget = (float)$buget;

    $stmt->bind_param(
        "sssssds",
        $tip,
        $nume,
        $telefon,
        $email,
        $locatie,
        $buget,
        $detalii
    );

    $stmt->execute();

    $cerereId = $conn->insert_id;
    $stmt->close();

} catch (Throwable $e) {

    error_log(
        "Eroare baza de date: " . $e->getMessage()
    );

    foreach ($atasamente as $atasament) {
        @unlink($atasament["cale"]);
    }

    http_response_code(500);
    raspuns(false, "Cererea nu a putut fi salvata.");
}

// TRIMITEREA EMAILULUI CU ATASAMENTE

try {
    $config = require dirname(__DIR__, 2) . "/mail_config.php";

    $mail = new PHPMailer(true);

    $mail->isSMTP();

    $mail->Host = $config["smtp_host"];
    $mail->SMTPAuth = true;
    $mail->Username = $config["smtp_user"];
    $mail->Password = $config["smtp_password"];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int)$config["smtp_port"];
    $mail->CharSet = "UTF-8";

    // EXPEDITOR

    $mail->setFrom(
        $config["smtp_user"],
        $config["smtp_from_name"]
    );

    // DESTINATAR

    $mail->addAddress($config["smtp_to"]);

    // RASPUNS DIRECT CATRE CLIENT

    $mail->addReplyTo($email, $nume);

    // CONTINUTUL EMAILULUI

    $mail->isHTML(false);

    $mail->Subject =
        "Cerere noua #$cerereId - Sabin PFA";

    $mail->Body =
        "CERERE NOUA - SABIN PFA\n\n" .
        "Numar cerere: $cerereId\n\n" .
        "Tip lucrare: $tip\n" .
        "Nume client: $nume\n" .
        "Telefon: $telefon\n" .
        "Email client: $email\n" .
        "Locatie: $locatie\n" .
        "Buget estimativ: $buget lei\n\n" .
        "DETALII LUCRARE:\n" .
        "$detalii\n\n" .
        "Numar fisiere atasate: " .
        count($atasamente) . "\n\n" .
        "Cererea a fost salvata in baza de date.";

    // ADAUGAREA FOTOGRAFIILOR IN EMAIL

    foreach ($atasamente as $atasament) {
        $mail->addAttachment(
            $atasament["cale"],
            $atasament["nume"]
        );
    }

    // TRIMITEREA EMAILULUI

    $mail->send();

    raspuns(
        true,
        "Cererea a fost salvata si emailul a fost trimis cu succes!"
    );

} catch (Throwable $e) {

    error_log(
        "Eroare trimitere email: " . $e->getMessage()
    );

    raspuns(
        true,
        "Cererea a fost salvata, dar emailul nu a putut fi trimis."
    );
}
