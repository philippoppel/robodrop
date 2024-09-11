*** Settings ***
Library    SeleniumLibrary
Library    RequestsLibrary
Library    Process


*** Keywords ***

Verbinde Karte Mit Leser
    [Arguments]    ${kartentyp}
    Log    Verbinde die ${kartentyp} mit dem Kartenleser
    Set Test Variable    ${erkannt}    True

Lese Karte Aus
    [Arguments]    ${kartentyp}
    Log    Lese die ${kartentyp} ein
    Set Test Variable    ${gelesen}    True

Prüfe Karte Erkannt
    [Arguments]    ${kartentyp}
    Log    Überprüfe, ob die ${kartentyp} korrekt erkannt wurde
    Should Be True    ${erkannt}    Die ${kartentyp} wurde nicht korrekt erkannt

Starte Kartenleser Neu
    Log    Starte den Kartenleser neu
    ${status} =    Run Process    python3    ${CURDIR}/script.py
    Should Be Equal As Strings    ${status.stdout}    Skript erfolgreich ausgeführt

*** Test Cases ***

# Testfall 1: Erfolgreiche Kartenleseroperation
[Documentation]  Testet, ob die Karte erfolgreich verbunden, gelesen und entfernt wird.
Demo-Testfall1
    Verbinde Karte Mit Leser    Ordinationskarte
    Lese Karte Aus    Ordinationskarte
    Prüfe Karte Erkannt    Ordinationskarte
    Starte Kartenleser Neu
