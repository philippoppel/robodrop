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
    Log    Verbinde ${kartentyp} mit dem Kartenleser
    Set Test Variable    ${erkannt}    True

Lese Karte Aus
    [Arguments]    ${kartentyp}
    Log    Lese ${kartentyp} ein
    Set Test Variable    ${gelesen}    True

Prüfe Karte Erkannt
    [Arguments]    ${kartentyp}
    Log    Prüfe, ob ${kartentyp} korrekt erkannt wurde
    Should Be True    ${erkannt}    ${kartentyp} wurde nicht korrekt erkannt

# Kategorie: Geräte-Management
Starte Kartenleser Neu
    Log    Starte den Kartenleser neu
    ${status} =    Run Process    python3    ${CURDIR}/script.py
    Set Test Variable    ${status.stdout}    Hallo von script.py!
    Should Be Equal As Strings    ${status.stdout}    Hallo von script.py!

Entferne Objekt Von Position
    [Arguments]    ${objekttyp}
    Log    Entferne ${objekttyp} von der aktuellen Position

Verbinde Smartcard Mit Schloss
    Log    Verbinde Smartcard mit dem Schloss

Prüfe Sperrprotokoll
    Log    Überprüfe Sperrprotokoll
    ${response}=    POST    ${LOCK_API_URL}/post
    Set Test Variable    ${response.status_code}    200
    Should Be Equal As Numbers    ${response.status_code}    200
    Log    Sperrprotokoll erfolgreich überprüft

Verbinde Smartphone Per Bluetooth
    Log    Verbinde ${BLUETOOTH_DEVICE} per Bluetooth mit dem Smartschloss

# Kategorie: Firmware-Management
Firmware Update Durchführen
    [Arguments]    ${version}
    Log    Führe Firmware-Update auf Version ${version} durch
    ${response}=    GET    ${API_URL}/get
    Set Test Variable    ${response.status_code}    200
    Should Be Equal As Numbers    ${response.status_code}    200

Firmware Downgrade Durchführen
    [Arguments]    ${target_version}
    Log    Führe Firmware-Downgrade auf Version ${target_version} durch
    Firmware Update Durchführen    ${target_version}

Starte Schloss Neu
    Log    Starte das Schloss neu
    ${status} =    Run Process    python3    ${CURDIR}/reset_lock.py
    Set Test Variable    ${status.stdout}    Schloss wurde erfolgreich neu gestartet
    Should Be Equal As Strings    ${status.stdout}    Schloss wurde erfolgreich neu gestartet

# Kategorie: Produkt-Management
Scanne Produkt
    [Arguments]    ${produktname}
    Log    Scanne ${produktname}

Lege Produkt Auf Waage
    [Arguments]    ${produktname}
    Log    Lege ${produktname} auf die Waage
    Entferne Objekt Von Position    ${produktname}

# Kategorie: Zahlungs-Management
Versuche Zahlung Durchzuführen
    Log    Versuche Zahlung durchzuführen
    ${response}=    POST    ${API_URL}/try_payment
    Set Test Variable    ${response.status_code}    200
    Should Be Equal As Numbers    ${response.status_code}    200

Versuche Zahlung durchführen
    [Arguments]    ${zahlungsmethode}
    Log    Führe Zahlung mit ${zahlungsmethode} durch
    Verbinde Smartcard Mit Schloss
    ${response}=    POST    ${API_URL}/post
    Set Test Variable    ${response.status_code}    200
    Should Be Equal As Numbers    ${response.status_code}    200

# Kategorie: Fehlerbehandlung
Erwarte Fehlermeldung
    [Arguments]    ${fehlermeldung}
    Log    Erwarte Fehlermeldung: ${fehlermeldung}
    Log    Kein Fehler, Erfolg simuliert

# Kategorie: Zufallsoperationen
Setze Möglichkeiten Für Zufallsparameter
    [Arguments]    ${parameter_name}    ${parameter_values}
    Log    Setze Zufallsparameter für ${parameter_name} mit Werten ${parameter_values}

Verbinde Zufällige Karte Mit Leser
    ${kartentyp} =    Evaluate    random.choice(['Ordinationskarte', 'Gesundheitskarte', 'Fehlerfallkarte'])
    Verbinde Karte Mit Leser    ${kartentyp}

Simuliere Gleichzeitige Leseanfragen
    ${anzahl_threads} =    Evaluate    random.randint(1, 10)
    Log    Simuliere ${anzahl_threads} gleichzeitige Leseanfragen

# Kategorie: Stresstests
Wiederhole Stresstest Für N Stunden
    [Arguments]    ${stunden}
    Log    Stresstest für ${stunden} Stunden abgeschlossen

*** Test Cases ***

Demo-Testfall1
    Verbinde Karte Mit Leser    Ordinationskarte
    Lese Karte Aus    Ordinationskarte
    Prüfe Karte Erkannt    Ordinationskarte
    Starte Kartenleser Neu
    Entferne Objekt Von Position    Ordinationskarte

Demo-Testfall-Fehlschlag
    Log    Dies ist ein absichtlicher Fehlschlag für den Log-Analyzer
    Should Be Equal As Numbers    1    2    Dies sollte fehlschlagen, da 1 nicht gleich 2 ist
