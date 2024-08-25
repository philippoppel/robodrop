*** Keywords ***

# Öffnet die angegebene Webseite im Chrome-Browser.
# Beispiel: Öffne Webseite    google.com
Öffne Webseite
    [Arguments]    ${url}  # Erwartet die URL der Webseite als Argument.
    [Values]       google.com    example.com    myapp.com  # Beispiele für URLs.
    Open Browser    ${url}    Chrome  # Öffnet den Browser und navigiert zur URL.

# Gibt Text in ein Textfeld ein, das durch ${feld} identifiziert wird.
# Beispiel: Gebe Text ein    username    Max
Gebe Text ein
    [Arguments]    ${feld}, ${text}  # Erwartet das Textfeld und den einzugebenden Text als Argumente.
    [Values]       ${feld}=username    password    email  # Beispiele für Felder.
                   ${text}=Max    secret    test@example.com  # Beispiele für Texteingaben.
    Input Text    ${feld}    ${text}  # Gibt den Text in das spezifizierte Feld ein.

# Klickt auf einen Button, der durch den Text oder die ID identifiziert wird.
# Beispiel: Klicke auf    login
Klicke auf
    [Arguments]    ${button_text_or_id}  # Erwartet den Text oder die ID des Buttons als Argument.
    [Values]       login    submit    cancel  # Beispiele für Buttons.
    Click Button    xpath=//button[contains(text(), '${button_text_or_id}')]  # Klickt auf den Button.

# Überprüft, ob der angegebene Text auf der aktuellen Seite vorhanden ist.
# Beispiel: Überprüfe Text    Welcome
Überprüfe Text
    [Arguments]    ${text}  # Erwartet den Text, der überprüft werden soll.
    [Values]       Welcome    Error    Success  # Beispiele für erwartete Texte.
    Page Should Contain    ${text}  # Überprüft, ob der Text auf der Seite vorhanden ist.

# Bewegt einen Roboterarm basierend auf der Aktion, die als Argument angegeben wird.
# Beispiel: Bewege Roboterarm    move x y z
Bewege Roboterarm
    [Arguments]    ${aktion}  # Erwartet die Aktion für den Roboterarm als Argument.
    [Values]       move x y z    grip    release  # Beispiele für Aktionen.
    Post Request    http://robotarm.local/move    {"action": "${aktion}"}  # Sendet eine POST-Anfrage mit der Aktion.

# Schließt den Browser.
# Diese Funktion ist nützlich, um am Ende eines Tests die Browser-Instanz zu beenden.
Schließe Browser
    Close Browser

# Überprüft, ob ein Element durch seinen XPath auf der Seite vorhanden ist.
# Beispiel: Überprüfe Element    //div[@class='success']
Überprüfe Element
    [Arguments]    ${xpath}  # Erwartet den XPath des Elements als Argument.
    Element Should Be Visible    ${xpath}  # Überprüft, ob das Element sichtbar ist.

# Warte eine bestimmte Anzahl von Sekunden.
# Diese Funktion kann nützlich sein, um sicherzustellen, dass ein Element geladen ist.
# Beispiel: Warte    5
Warte
    [Arguments]    ${sekunden}  # Erwartet die Anzahl der Sekunden als Argument.
    Sleep    ${sekunden}  # Wartet die angegebene Anzahl von Sekunden.
