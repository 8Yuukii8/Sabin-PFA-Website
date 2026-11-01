
let stats = JSON.parse(localStorage.getItem("stats")) || {};

const romaniaCities = [
    "Timisoara", "Arad", "Lugoj", "Resita", "Deva",
    "Hunedoara", "Oradea", "Cluj-Napoca", "Alba Iulia",
    "Sibiu", "Brasov", "Bucuresti", "Iasi", "Constanta",
    "Craiova", "Pitesti", "Ploiesti", "Targu Mures",
    "Baia Mare", "Satu Mare", "Suceava", "Bacau",
    "Galati", "Braila", "Buzau", "Focsani",
    "Drobeta-Turnu Severin", "Targu Jiu",
    "Ramnicu Valcea", "Slatina", "Zalau",
    "Bistrita", "Piatra Neamt", "Botosani", "Vaslui"
];

// STATISTICI

function countControl(name) {
    if (!stats[name]) {
        stats[name] = 0;
    }

    stats[name]++;
    localStorage.setItem("stats", JSON.stringify(stats));
    showStats();
}

function showStats() {
    const statsDiv = document.getElementById("stats");

    if (!statsDiv) {
        return;
    }

    statsDiv.innerHTML = "";

    for (let key in stats) {
        statsDiv.innerHTML +=
            `<p>${key}: ${stats[key]} accesari</p>`;
    }
}

function resetStats() {
    localStorage.removeItem("stats");
    stats = {};
    showStats();
}

// PERSONALIZARE - AFISARE CULOARE

function updateColorLabel(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);

    if (!input || !label) {
        return;
    }

    label.innerText = input.value;
}

// CAUTARE ORASE

function filterCities(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(suggestionsId);

    if (!input || !suggestionsBox) {
        return;
    }

    const value = input.value.trim().toLowerCase();
    let results = [];

    if (value === "") {
        results = romaniaCities.slice(0, 5);
    } else {
        results = romaniaCities
            .filter(city => city.toLowerCase().includes(value))
            .slice(0, 5);
    }

    if (results.length === 0) {
        suggestionsBox.innerHTML =
            `<div class="city-suggestion-empty">Nu s-au gasit rezultate</div>`;
        suggestionsBox.style.display = "block";
        return;
    }

    suggestionsBox.innerHTML = "";

    results.forEach(city => {
        suggestionsBox.innerHTML += `
            <div class="city-suggestion-item"
                 onclick="selectCity('${inputId}', '${suggestionsId}', '${city}')">
                ${city}
            </div>
        `;
    });

    suggestionsBox.style.display = "block";
}

function selectCity(inputId, suggestionsId, city) {
    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(suggestionsId);

    if (!input || !suggestionsBox) {
        return;
    }

    input.value = city;
    suggestionsBox.style.display = "none";
    countControl("Selectare oras");
}

function hideSuggestions(suggestionsId) {
    setTimeout(() => {
        const suggestionsBox = document.getElementById(suggestionsId);

        if (suggestionsBox) {
            suggestionsBox.style.display = "none";
        }
    }, 150);
}

// MUTAREA CAMPURILOR

function moveUp(button) {
    const item = button.closest(".control-item");
    const previous = item.previousElementSibling;

    if (previous) {
        item.parentElement.insertBefore(item, previous);
        countControl("Buton muta sus");
    }
}

function moveDown(button) {
    const item = button.closest(".control-item");
    const next = item.nextElementSibling;

    if (next) {
        item.parentElement.insertBefore(next, item);
        countControl("Buton muta jos");
    }
}

// AFISAREA FORMULARULUI SPECIAL

function toggleSpecialForm() {
    const lucrare = document.getElementById("lucrare");
    const normalForm = document.getElementById("normalForm");
    const specialForm = document.getElementById("specialForm");

    if (!lucrare || !normalForm || !specialForm) {
        return;
    }

    if (lucrare.value === "Cerere specială") {
        normalForm.classList.add("d-none");
        specialForm.classList.remove("d-none");

        countControl("Afisare formular cerere speciala");
    } else {
        normalForm.classList.remove("d-none");
        specialForm.classList.add("d-none");
    }
}

// ROMANIA SAU STRAINATATE

function toggleForeignLocation() {
    const zonaSpeciala = document.getElementById("zonaSpeciala");
    const orasRomaniaBox = document.getElementById("orasRomaniaBox");
    const strainatateBox = document.getElementById("strainatateBox");

    if (!zonaSpeciala || !orasRomaniaBox || !strainatateBox) {
        return;
    }

    if (zonaSpeciala.value === "Străinătate") {
        orasRomaniaBox.classList.add("d-none");
        strainatateBox.classList.remove("d-none");

        countControl("Afisare locatie strainatate");
    } else {
        orasRomaniaBox.classList.remove("d-none");
        strainatateBox.classList.add("d-none");
    }
}

// ERORI FORMULAR

function markFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);

    if (field) {
        field.classList.add("input-error");

        const controlBox =
            field.closest(".control-item") ||
            field.closest(".col-md-6") ||
            field.closest(".col-12");

        if (controlBox) {
            const label = controlBox.querySelector("label");

            if (label && !label.querySelector(".required-star")) {
                label.innerHTML +=
                    '<span class="required-star">*</span>';
            }
        }
    }

    if (error) {
        error.innerText = message;
    }
}

function clearFieldErrors() {
    const errorElements = document.querySelectorAll(".error");
    const inputElements =
        document.querySelectorAll("input, textarea, select");
    const stars = document.querySelectorAll(".required-star");

    errorElements.forEach(error => {
        error.innerText = "";
    });

    inputElements.forEach(input => {
        input.classList.remove("input-error");
    });

    stars.forEach(star => {
        star.remove();
    });

    const generalError = document.getElementById("formGeneralError");

    if (generalError) {
        generalError.classList.add("d-none");
    }
}

function focusFirstInvalidField() {
    const firstInvalid = document.querySelector(".input-error");

    if (firstInvalid) {
        firstInvalid.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        setTimeout(() => {
            firstInvalid.focus();
        }, 400);
    }
}

// VALIDAREA FISIERELOR
// Maximum 5 fisiere, 5 MB fiecare, 20 MB total
// Tipuri: JPG, PNG, WEBP, PDF

function valideazaFisiere(input, errorId) {
    if (!input || input.files.length === 0) {
        return true;
    }

    const maxFisiere = 5;
    const maxDimensiune = 5 * 1024 * 1024;
    const maxTotal = 20 * 1024 * 1024;

    const extensiiPermise = [
        "jpg", "jpeg", "png", "webp", "pdf"
    ];

    if (input.files.length > maxFisiere) {
        markFieldError(
            input.id,
            errorId,
            "Poti incarca maximum 5 fisiere."
        );
        return false;
    }

    let dimensiuneTotala = 0;

    for (const fisier of input.files) {
        const extensie = fisier.name
            .split(".")
            .pop()
            .toLowerCase();

        if (!extensiiPermise.includes(extensie)) {
            markFieldError(
                input.id,
                errorId,
                "Sunt permise doar fisiere JPG, PNG, WEBP si PDF."
            );
            return false;
        }

        if (fisier.size === 0 || fisier.size > maxDimensiune) {
            markFieldError(
                input.id,
                errorId,
                "Fiecare fisier trebuie sa aiba maximum 5 MB."
            );
            return false;
        }

        dimensiuneTotala += fisier.size;
    }

    if (dimensiuneTotala > maxTotal) {
        markFieldError(
            input.id,
            errorId,
            "Fisierele nu pot depasi 20 MB in total."
        );
        return false;
    }

    return true;
}

// VALIDAREA FORMULARULUI

function validateBookingForm(event) {
    event.preventDefault();

    let valid = true;

    const lucrare = document.getElementById("lucrare").value;
    const successMessage = document.getElementById("successMessage");
    const generalError = document.getElementById("formGeneralError");

    clearFieldErrors();

    if (successMessage) {
        successMessage.innerText = "";
    }

    if (lucrare === "") {
        markFieldError(
            "lucrare",
            "eroareLucrare",
            "Alege tipul lucrarii."
        );
        valid = false;
    }

    // FORMULAR NORMAL

    if (lucrare !== "Cerere specială") {
        const nume = document.getElementById("nume").value.trim();
        const telefon = document.getElementById("telefon").value.trim();
        const email = document.getElementById("email").value.trim();
        const locatie = document.getElementById("locatie").value.trim();
        const buget = document.getElementById("buget").value;
        const mesaj = document.getElementById("mesaj").value.trim();
        const fisiere = document.getElementById("fisiere");

        if (nume.length < 3) {
            markFieldError(
                "nume",
                "eroareNume",
                "Numele trebuie sa aiba minim 3 caractere."
            );
            valid = false;
        }

        if (!/^[0-9]{10,15}$/.test(telefon)) {
            markFieldError(
                "telefon",
                "eroareTelefon",
                "Telefonul trebuie sa contina intre 10 si 15 cifre."
            );
            valid = false;
        }

        if (!email.includes("@") || !email.includes(".")) {
            markFieldError(
                "email",
                "eroareEmail",
                "Email-ul trebuie sa fie valid."
            );
            valid = false;
        }

        if (locatie.length < 3) {
            markFieldError(
                "locatie",
                "eroareLocatie",
                "Alege sau scrie localitatea lucrarii."
            );
            valid = false;
        }

        if (buget === "" || Number(buget) <= 0) {
            markFieldError(
                "buget",
                "eroareBuget",
                "Bugetul trebuie sa fie mai mare decat 0."
            );
            valid = false;
        }

        if (mesaj.length < 10) {
            markFieldError(
                "mesaj",
                "eroareMesaj",
                "Mesajul trebuie sa contina minim 10 caractere."
            );
            valid = false;
        }

        // FISIERE FORMULAR NORMAL

        if (!valideazaFisiere(fisiere, "eroareFisiere")) {
            valid = false;
        }
    }

    // FORMULAR SPECIAL

    if (lucrare === "Cerere specială") {
        const numeSpecial =
            document.getElementById("numeSpecial").value.trim();

        const telefonSpecial =
            document.getElementById("telefonSpecial").value.trim();

        const emailSpecial =
            document.getElementById("emailSpecial").value.trim();

        const zonaSpeciala =
            document.getElementById("zonaSpeciala").value;

        const orasSpecialRomania =
            document.getElementById("orasSpecialRomania").value.trim();

        const locatieStrainatate =
            document.getElementById("locatieStrainatate").value.trim();

        const tipSpecial =
            document.getElementById("tipSpecial").value;

        const termenSpecial =
            document.getElementById("termenSpecial").value;

        const suprafataSpeciala =
            document.getElementById("suprafataSpeciala").value;

        const autorizatieSpeciala =
            document.getElementById("autorizatieSpeciala").value;

        const bugetSpecial =
            document.getElementById("bugetSpecial").value;

        const descriereSpeciala =
            document.getElementById("descriereSpeciala").value.trim();

        const fisiereSpeciale =
            document.getElementById("fisiereSpeciale");

        if (numeSpecial.length < 3) {
            markFieldError(
                "numeSpecial",
                "eroareNumeSpecial",
                "Numele trebuie sa aiba minim 3 caractere."
            );
            valid = false;
        }

        if (!/^[0-9]{10,15}$/.test(telefonSpecial)) {
            markFieldError(
                "telefonSpecial",
                "eroareTelefonSpecial",
                "Telefonul trebuie sa contina intre 10 si 15 cifre."
            );
            valid = false;
        }

        if (!emailSpecial.includes("@") ||
            !emailSpecial.includes(".")) {
            markFieldError(
                "emailSpecial",
                "eroareEmailSpecial",
                "Email-ul trebuie sa fie valid."
            );
            valid = false;
        }

        if (zonaSpeciala === "") {
            markFieldError(
                "zonaSpeciala",
                "eroareZonaSpeciala",
                "Alege daca lucrarea este in Romania sau in strainatate."
            );
            valid = false;
        }

        if (
            zonaSpeciala === "România" &&
            orasSpecialRomania.length < 3
        ) {
            markFieldError(
                "orasSpecialRomania",
                "eroareOrasSpecialRomania",
                "Alege sau scrie orasul din Romania."
            );
            valid = false;
        }

        if (
            zonaSpeciala === "Străinătate" &&
            locatieStrainatate.length < 3
        ) {
            markFieldError(
                "locatieStrainatate",
                "eroareLocatieStrainatate",
                "Scrie tara si orasul din strainatate."
            );
            valid = false;
        }

        if (tipSpecial === "") {
            markFieldError(
                "tipSpecial",
                "eroareTipSpecial",
                "Alege tipul cererii speciale."
            );
            valid = false;
        }

        if (termenSpecial === "") {
            markFieldError(
                "termenSpecial",
                "eroareTermenSpecial",
                "Alege termenul dorit."
            );
            valid = false;
        }

        if (
            suprafataSpeciala === "" ||
            Number(suprafataSpeciala) <= 0
        ) {
            markFieldError(
                "suprafataSpeciala",
                "eroareSuprafataSpeciala",
                "Suprafata trebuie sa fie mai mare decat 0."
            );
            valid = false;
        }

        if (autorizatieSpeciala === "") {
            markFieldError(
                "autorizatieSpeciala",
                "eroareAutorizatieSpeciala",
                "Alege daca exista autorizatie."
            );
            valid = false;
        }

        if (
            bugetSpecial === "" ||
            Number(bugetSpecial) <= 0
        ) {
            markFieldError(
                "bugetSpecial",
                "eroareBugetSpecial",
                "Bugetul trebuie sa fie mai mare decat 0."
            );
            valid = false;
        }

        if (descriereSpeciala.length < 20) {
            markFieldError(
                "descriereSpeciala",
                "eroareDescriereSpeciala",
                "Descrierea trebuie sa contina minim 20 de caractere."
            );
            valid = false;
        }

        // FISIERE FORMULAR SPECIAL

        if (!valideazaFisiere(
            fisiereSpeciale,
            "eroareFisiereSpeciale"
        )) {
            valid = false;
        }
    }

    countControl("Buton trimite rezervare");

    if (!valid) {
        if (generalError) {
            generalError.classList.remove("d-none");
        }

        focusFirstInvalidField();
        return false;
    }

    countControl("Rezervare valida");

    // TRIMITERE CATRE PHP
    salveazaCererea();

    return false;
}

// SALVAREA CERERII SI TRIMITEREA FISIERELOR

async function salveazaCererea() {
    const lucrare = document.getElementById("lucrare").value;
    const special = lucrare === "Cerere specială";

    const valoare = (id) =>
        document.getElementById(id).value.trim();

    // FormData permite trimiterea datelor si a fisierelor
    const date = new FormData();

    date.append("tip_lucrare", lucrare);

    if (special) {
        const zona = valoare("zonaSpeciala");

        const locatie = zona === "România"
            ? valoare("orasSpecialRomania")
            : valoare("locatieStrainatate");

        const detalii = [
            "Tip: " + valoare("tipSpecial"),
            "Zona: " + zona,
            "Termen: " + valoare("termenSpecial"),
            "Suprafata: " + valoare("suprafataSpeciala"),
            "Autorizatie: " + valoare("autorizatieSpeciala"),
            "Descriere: " + valoare("descriereSpeciala")
        ].join("\n");

        date.append("nume", valoare("numeSpecial"));
        date.append("telefon", valoare("telefonSpecial"));
        date.append("email", valoare("emailSpecial"));
        date.append("locatie", locatie);
        date.append("buget", valoare("bugetSpecial"));
        date.append("detalii", detalii);

    } else {
        date.append("nume", valoare("nume"));
        date.append("telefon", valoare("telefon"));
        date.append("email", valoare("email"));
        date.append("locatie", valoare("locatie"));
        date.append("buget", valoare("buget"));
        date.append("detalii", valoare("mesaj"));
    }

    // ADAUGAREA FOTOGRAFIILOR SI DOCUMENTELOR

    const inputFisiere = document.getElementById(
        special ? "fisiereSpeciale" : "fisiere"
    );

    if (inputFisiere) {
        for (const fisier of inputFisiere.files) {
            date.append("fisiere[]", fisier);
        }
    }

    const mesaj = document.getElementById("successMessage");
    const formular = document.getElementById("bookingForm");
    const buton = formular.querySelector('button[type="submit"]');

    if (buton) {
        buton.disabled = true;
    }

    if (mesaj) {
        mesaj.innerText = "Se trimite cererea...";
        mesaj.style.color = "";
    }

    try {
        const response = await fetch("salvare_cerere.php", {
            method: "POST",
            body: date
        });

        const rezultat = await response.json();

        if (!response.ok || !rezultat.succes) {
            throw new Error(
                rezultat.mesaj || "Eroare la trimiterea cererii."
            );
        }

        if (mesaj) {
            mesaj.innerText = rezultat.mesaj;
            mesaj.style.color =
                rezultat.mesaj.includes("nu a putut fi trimis")
                    ? "#b36b00"
                    : "green";
        }

        formular.reset();

        toggleSpecialForm();
        toggleForeignLocation();

    } catch (eroare) {
        if (mesaj) {
            mesaj.innerText = "Eroare: " + eroare.message;
            mesaj.style.color = "red";
        }

    } finally {
        if (buton) {
            buton.disabled = false;
        }
    }
}

// PERSONALIZAREA SITE-ULUI

function applyTheme() {
    const bgColorInput = document.getElementById("bgColor");
    const textColorInput = document.getElementById("textColor");
    const fontSizeInput = document.getElementById("fontSize");

    if (!bgColorInput || !textColorInput || !fontSizeInput) {
        return;
    }

    localStorage.setItem("bgColor", bgColorInput.value);
    localStorage.setItem("textColor", textColorInput.value);
    localStorage.setItem("fontSize", fontSizeInput.value);

    loadTheme();
}

function loadTheme() {
    const bgColor = localStorage.getItem("bgColor");
    const textColor = localStorage.getItem("textColor");
    const fontSize = localStorage.getItem("fontSize");

    if (bgColor) {
        document.body.style.backgroundColor = bgColor;

        const bgInput = document.getElementById("bgColor");
        const bgLabel = document.getElementById("bgColorValue");

        if (bgInput) {
            bgInput.value = bgColor;
        }

        if (bgLabel) {
            bgLabel.innerText = bgColor;
        }
    }

    if (textColor) {
        document.body.style.color = textColor;

        const textInput = document.getElementById("textColor");
        const textLabel = document.getElementById("textColorValue");

        if (textInput) {
            textInput.value = textColor;
        }

        if (textLabel) {
            textLabel.innerText = textColor;
        }
    }

    if (fontSize) {
        document.body.style.fontSize = fontSize;

        const fontInput = document.getElementById("fontSize");

        if (fontInput) {
            fontInput.value = fontSize;
        }
    }
}

function resetTheme() {
    localStorage.removeItem("bgColor");
    localStorage.removeItem("textColor");
    localStorage.removeItem("fontSize");

    document.body.style.backgroundColor = "";
    document.body.style.color = "";
    document.body.style.fontSize = "";

    const bgInput = document.getElementById("bgColor");
    const textInput = document.getElementById("textColor");
    const fontInput = document.getElementById("fontSize");
    const bgLabel = document.getElementById("bgColorValue");
    const textLabel = document.getElementById("textColorValue");

    if (bgInput) {
        bgInput.value = "#f6f6f6";
    }

    if (textInput) {
        textInput.value = "#222222";
    }

    if (fontInput) {
        fontInput.value = "16px";
    }

    if (bgLabel) {
        bgLabel.innerText = "#f6f6f6";
    }

    if (textLabel) {
        textLabel.innerText = "#222222";
    }
}

// SELECTAREA SERVICIULUI DIN URL

function loadSelectedServiceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const selectedLucrare = params.get("lucrare");

    if (!selectedLucrare) {
        return;
    }

    const lucrareSelect = document.getElementById("lucrare");

    if (!lucrareSelect) {
        return;
    }

    lucrareSelect.value = selectedLucrare;
    toggleSpecialForm();

    countControl("Serviciu selectat din meniu");
}

// MENIU ACTIV LA SCROLL

function initActiveMenuOnScroll() {
    const navLinks = document.querySelectorAll(
        ".nav-menu > li > a[data-section]"
    );

    if (navLinks.length === 0) {
        return;
    }

    const sections = [
        {
            id: "acasa",
            element: document.getElementById("acasa")
        },
        {
            id: "servicii",
            element: document.getElementById("servicii")
        },
        {
            id: "cum-functioneaza",
            element: document.getElementById("cum-functioneaza")
        }
    ].filter(section => section.element !== null);

    if (sections.length === 0) {
        return;
    }

    function updateActiveMenu() {
        let currentSection = sections[0].id;
        const scrollPosition = window.scrollY + 170;

        sections.forEach(section => {
            if (scrollPosition >= section.element.offsetTop) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            if (link.dataset.section === currentSection) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    window.addEventListener("scroll", updateActiveMenu);
    updateActiveMenu();
}

// INITIALIZAREA SITE-ULUI

showStats();
loadTheme();
loadSelectedServiceFromUrl();
initActiveMenuOnScroll();
