*** Settings ***
Library    SeleniumLibrary
Library    MyLibrary.py
Suite Setup    Open Browser To Login Page
Suite Teardown    Close Browser

*** Variables ***
${LOGIN_URL}    https://the-internet.herokuapp.com/login
${USERNAME}     tomsmith
${PASSWORD}     SuperSecretPassword!

*** Keywords ***
Open Browser To Login Page
    [Documentation]    Öffnet den Browser und navigiert zur Login-Seite.
    Open Browser    ${LOGIN_URL}    firefox
    Maximize Browser Window

Input Username And Password
    [Documentation]    Gibt den Benutzernamen und das Passwort in die entsprechenden Felder ein.
    Input Text    id=username    ${USERNAME}
    Input Text    id=password    ${PASSWORD}

Submit Login
    [Documentation]    Klickt auf den "Anmelden"-Button, um das Formular abzuschicken.
    Click Button    xpath=//button[@type='submit']

Verify Login Successful
    [Documentation]    Überprüft, ob die Anmeldung erfolgreich war, indem nach einer Bestätigungsmeldung gesucht wird.
    Page Should Contain    You logged into a secure area!

Wave Arm
    [Documentation]    Bewegt den Arm durch eine Reihe von vorgegebenen Positionen.
    Move Arm    [90, 90, 135, 180, 90]
    Move Arm    [40, 90, 135, 180, 90]
    Move Arm    [40, 90, 135, 180, 45]
    Move Arm    [40, 90, 135, 180, 90]

Custom Greeting
    [Documentation]    Zeigt eine benutzerdefinierte Begrüßung im Terminal an.
    [Arguments]    ${name}
    Log    Hello, ${name}! Welcome to the testing framework.

Sum Two Numbers
    [Documentation]    Berechnet die Summe von zwei Zahlen und gibt das Ergebnis zurück.
    [Arguments]    ${a}    ${b}
    ${result}=    Evaluate    ${a} + ${b}
    [Return]    ${result}

*** Test Cases ***
*** Test Cases ***
Login And Wave
    Sum Two Numbers    1    2
    Sum Two Numbers    2    3
    Custom Greeting    alo
