*** Settings ***
Library    SeleniumLibrary
Library    MyLibrary.py
Library    Process
Library    RequestsLibrary

*** Variables ***
${LOGIN_URL}    https://the-internet.herokuapp.com/login
${USERNAME}     tomsmith
${PASSWORD}     SuperSecretPassword!
${API_URL}      https://httpbin.org
${APP_SERVER_URL}  http://localhost:4723
${LOCK_API_URL}    https://httpbin.org
${APP_SERVER_URL}  http://localhost:4723
${FIRMWARE_OLD}    1.1
${FIRMWARE_NEW}    1.2
${FIRMWARE_NEXT}   1.3
${BLUETOOTH_DEVICE}   MySmartphone

*** Keywords ***

# Kategorie: Kartenoperationen
Verbinde Karte Mit Leser
    [Arguments]    ${kartentyp}
    [Documentation]    Verbindet eine angegebene Karte mit dem Kartenleser. Mögliche Werte für ${kartentyp}: `Ordinationskarte`, `Gesundheitskarte`, 'Fehlerfallkarte'.
    Log    Verbinde ${kartentyp} mit dem Kartenleser

# Kategorie: Kartenoperationen
Lese Karte Aus
    [Arguments]    ${kartentyp}
    [Documentation]    Liest eine angegebene Karte aus, um zu überprüfen, ob der Kartenleser die Karte korrekt erkennt. Mögliche Werte für ${kartentyp}: `Ordinationskarte`, `Gesundheitskarte`, 'Fehlerfallkarte'.
    Log    Lese ${kartentyp} ein

# Kategorie: Geräte-Management
Starte Kartenleser Neu
    [Documentation]    Startet den Kartenleser neu, um das System in den Grundzustand zu versetzen.
    Log    Starte den Kartenleser neu
    ${status} =    Run Process    python3    ${CURDIR}/script.py
    Should Be Equal As Strings    ${status.stdout}    Hallo von script.py!

# Kategorie: Geräte-Management
Entferne Objekt Von Position
    [Arguments]    ${objekttyp}
    [Documentation]    Entfernt ein angegebenes Objekt aus der aktuellen Position und bringt es zurück an den ursprünglichen Ort. Mögliche Werte für ${objekttyp}: `Gesundheitskarte`, `Ordinationskarte`, 'Fehlerfallkarte', `NFC-Karte`, Name eines Produkts.
    Log    Entferne ${objekttyp} von der aktuellen Position

# Kategorie: Geräte-Management
Verbinde Smartcard Mit Schloss
    [Documentation]    Verbindet die Smartcard mit dem Schloss, um das Schloss zu sperren.
    Log    Verbinde Smartcard mit dem Schloss

# Kategorie: Geräte-Management
Prüfe Sperrprotokoll
    [Documentation]    Überprüft, ob das Schloss korrekt gesperrt wurde, indem das Sperrprotokoll über die API abgefragt wird.
    Log    Überprüfe Sperrprotokoll
    ${response}=      POST    ${LOCK_API_URL}/post
    Should Be Equal As Numbers    ${response.status_code}    200
    Log    Sperrprotokoll erfolgreich überprüft
    Log    ${response.json()}

# Kategorie: Geräte-Management
Verbinde Smartphone Per Bluetooth
    [Documentation]    Verbindet das Smartphone per Bluetooth mit dem Smartschloss. Mögliche Werte für ${BLUETOOTH_DEVICE}: Name des Geräts, z.B. `MySmartphone`.
    Log    Verbinde ${BLUETOOTH_DEVICE} per Bluetooth mit dem Smartschloss

# Kategorie: Firmware-Management
Firmware Update Durchführen
    [Arguments]    ${version}
    [Documentation]    Führt ein Firmware-Update auf die angegebene Version durch. Mögliche Werte für ${version}: `1.1`, `1.2`, `1.3` oder andere verfügbare Versionen.
    Log    Führe Firmware-Update auf Version ${version} durch
    ${response}=    GET    ${API_URL}/get
    Should Be Equal As Numbers    ${response.status_code}    200
    Log    Firmware-Update erfolgreich durchgeführt auf Version ${version}
    Log    ${response.json()}

# Kategorie: Firmware-Management
Firmware Downgrade Durchführen
    [Arguments]    ${target_version}
    [Documentation]    Führt ein Downgrade der Firmware auf die angegebene Version durch. Mögliche Werte für ${target_version}: `1.1`, `1.2`, `1.3` oder andere verfügbare Versionen.
    Log    Führe Firmware-Downgrade auf Version ${target_version} durch
    Firmware Update Durchführen    ${target_version}

# Kategorie: Geräte-Management
Starte Schloss Neu
    [Documentation]    Startet das Schloss neu, um sicherzustellen, dass es korrekt arbeitet.
    Log    Starte das Schloss neu
    ${status} =    Run Process    python3    ${CURDIR}/reset_lock.py
    Should Be Equal As Strings    ${status.stdout}    Schloss wurde erfolgreich neu gestartet

# Kategorie: Produkt-Management
Scanne Produkt
    [Arguments]    ${produktname}
    [Documentation]    Simuliert das Scannen eines Produkts durch den Barcode-Scanner. Mögliche Werte für ${produktname}: Name eines Produkts, z.B. `Apfel`, `Banane`.
    Log    Scanne ${produktname}
    Verbinde Karte Mit Leser    ${produktname}

# Kategorie: Produkt-Management
Lege Produkt Auf Waage
    [Arguments]    ${produktname}
    [Documentation]    Simuliert das Platzieren eines Produkts auf die Waage. Mögliche Werte für ${produktname}: Name eines Produkts, z.B. `Apfel`, `Banane`.
    Log    Lege ${produktname} auf die Waage
    Entferne Objekt Von Position    ${produktname}

# Kategorie: Zahlungs-Management
Versuche Zahlung Durchzuführen
    [Documentation]    Simuliert den Versuch, die Zahlung durchzuführen, basierend auf den aktuellen Bedingungen des Self-Checkout-Systems.
    Log    Versuche Zahlung durchzuführen
    ${response}=    POST    ${API_URL}/try_payment
    Should Be Equal As Numbers    ${response.status_code}    200
    Log    Zahlungsvorgang abgeschlossen oder Fehlermeldung erwartet
    Log    ${response.json()}

# Kategorie: Zahlungs-Management
Versuche Zahlung durchführen
    [Arguments]    ${zahlungsmethode}
    [Documentation]    Simuliert die Zahlung mit der angegebenen Zahlungsmethode. Mögliche Werte für ${zahlungsmethode}: `Kreditkarte`, `NFC`, `Bargeld`.
    Log    Führe Zahlung mit ${zahlungsmethode} durch
    Verbinde Smartcard Mit Schloss
    ${response}=    POST    ${API_URL}/post
    Should Be Equal As Numbers    ${response.status_code}    200
    Log    Zahlung erfolgreich durchgeführt
    Log    ${response.json()}

# Kategorie: Fehlerbehandlung
Erwarte Fehlermeldung
    [Arguments]    ${fehlermeldung}
    [Documentation]    Überprüft, ob eine spezifische Fehlermeldung angezeigt wird, wenn die Bedingungen nicht erfüllt sind. Mögliche Werte für ${fehlermeldung}: Text der erwarteten Fehlermeldung, z.B. `Gewicht höher als erwartet`.
    Log    Erwarte Fehlermeldung: ${fehlermeldung}

# Kategorie: Zufallsoperationen
Setze Möglichkeiten Für Zufallsparameter
    [Arguments]    ${parameter_name}    ${parameter_values}
    [Documentation]    Setzt die möglichen Werte für einen Zufallsparameter. Mögliche Werte für Winkel: [0, 45, 90] Grad. Mögliche Werte für Verbindungsdauer: 1-10 Sekunden. Mögliche Werte für gleichzeitige Verbindungen: 1-10.
    Log    Setze Zufallsparameter für ${parameter_name} mit Werten ${parameter_values}

# Kategorie: Zufallsoperationen
Verbinde Zufällige Karte Mit Leser
    [Documentation]    Verbindet eine zufällig ausgewählte Karte mit dem Kartenleser bei einem zufälligen Winkel und für eine zufällige Dauer. Mögliche Karten: `Ordinationskarte`, `Gesundheitskarte`, `Fehlerfallkarte`. Mögliche Winkel: [0, 45, 90] Grad. Mögliche Verbindungsdauer: 1-10 Sekunden.
    ${kartentyp} =    Evaluate    random.choice(['Ordinationskarte', 'Gesundheitskarte', 'Fehlerfallkarte'])
    ${winkel} =    Evaluate    random.choice([0, 45, 90])
    ${dauer} =    Evaluate    random.randint(1, 10)
    Verbinde Karte Mit Leser    ${kartentyp}
    Log    Verbinde ${kartentyp} mit Winkel ${winkel}° und für ${dauer} Sekunden
    Warte X Sekunden    ${dauer}
    Entferne Objekt Von Position    ${kartentyp}
    Log    ${kartentyp} wurde erfolgreich entfernt nach ${dauer} Sekunden

# Kategorie: Zufallsoperationen
Simuliere Gleichzeitige Leseanfragen
    [Documentation]    Schickt eine zufällige Anzahl gleichzeitiger Leseanfragen, um das System unter Last zu testen. Mögliche Anzahl gleichzeitiger Verbindungen: 1-10.
    ${anzahl_threads} =    Evaluate    random.randint(1, 10)
    Log    Simuliere ${anzahl_threads} gleichzeitige Leseanfragen
    FOR    ${i}    IN RANGE    ${anzahl_threads}
        Verbinde Zufällige Karte Mit Leser
        Log    Gleichzeitige Leseanfrage ${i} abgeschlossen
    END

# Kategorie: Stresstests
Wiederhole Stresstest Für N Stunden
    [Arguments]    ${stunden}
    [Documentation]    Wiederholt den Stresstest für die angegebene Anzahl von Stunden, um die Belastbarkeit des Systems zu prüfen. Die Dauer des Stresstests kann variabel festgelegt werden.
    ${start_time} =    Get Time    epoch
    ${end_time} =    Evaluate    ${start_time} + ${stunden} * 3600
    WHILE    Get Time epoch < ${end_time}
        Simuliere Gleichzeitige Leseanfragen
        Log    Wiederhole Stresstest weiter...
    END
    Log    ${stunden} Stunden Stresstest abgeschlossen

*** Test Cases ***

Demo-Testfall
    [Documentation]    Demonstration eines einfachen Testfalls mit einem Roboterarm
    Verbinde Karte Mit Leser    Ordinationskarte
    Lese Karte Aus    Ordinationskarte
    Prüfe Karte Erkannt    Ordinationskarte
    Starte Kartenleser Neu
    Entferne Objekt Von Position    Ordinationskarte
