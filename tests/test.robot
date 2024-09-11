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
    Should Be Equal As Strings    ${status.stdout}    Skript erfolgreich ausgeführt

Verursache Fehler
    Log    Löse Fehler aus
    Should Be True    1=2    Validierungsfehler

*** Test Cases ***
Demo-Testfall1
    [Documentation]  Testet, ob die Karte erfolgreich verbunden, gelesen und entfernt wird.
    Verbinde Karte Mit Leser    Ordinationskarte
    Lese Karte Aus    Ordinationskarte
    Prüfe Karte Erkannt    Ordinationskarte
    Starte Kartenleser Neu

Demo-Testfall2
    [Documentation]  Testet, ob die Karte erfolgreich verbunden, gelesen und entfernt wird.
    Verursache Fehler
