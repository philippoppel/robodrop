document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const selectRobotButton = document.querySelector('.select-robot');
  const keywordFilter = document.getElementById('keywordFilter');
  let allKeywords = []; // Variable to store all keywords
  const workspace = document.getElementById('workspace');

  selectRobotButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', handleFileUpload);

  keywordFilter.addEventListener('input', filterKeywords); // Filterfunktion bei Eingabe

  // Call addKeywordButton to ensure the button is added to the palette
  addKeywordButton();
  function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;

      // Speichern des Datei-Inhalts für späteren Zugriff beim Exportieren
      localStorage.setItem('uploadedFileContent', content);

      // Neue Keywords aus der Datei parsen
      const importedKeywords = parseKeywords(content);

      // Benutzerdefinierte Keywords beibehalten und zusammenführen
      const customKeywords = allKeywords.filter(keyword => keyword.help && keyword.help.startsWith('TODO'));
      allKeywords = [...importedKeywords, ...customKeywords];

      renderKeywords(allKeywords); // Keywords neu rendern
    };

    reader.readAsText(file);
  }



  function parseKeywords(content) {
    const keywords = [];
    const lines = content.split('\n');
    let inKeywordsSection = false; // Track if we are in the *** Keywords *** section
    let currentKeyword = null;
    let currentComment = '';
    let currentKey = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Check if we are entering the *** Keywords *** section
      if (trimmedLine === '*** Keywords ***') {
        inKeywordsSection = true;
        currentComment = ''; // Reset for the start of the keywords section
        return; // Skip processing this line
      }

      // Exit the keywords section when we hit a new section or end of file
      if (inKeywordsSection && (trimmedLine.startsWith('***') && trimmedLine.endsWith('***'))) {
        inKeywordsSection = false;
        return;
      }

      if (!inKeywordsSection) {
        return; // Skip lines that are not within the *** Keywords *** section
      }

      if (trimmedLine.startsWith('#')) {
        // Handle comments (preceding lines starting with '#')
        currentComment += trimmedLine.slice(1).trim() + '\n';
      } else if (trimmedLine === '') {
        // Handle empty lines
        currentComment = ''; // Reset for next keyword block
      } else if (!line.startsWith(' ') && !line.startsWith('\t')) {
        // Start of a new keyword
        currentKeyword = {
          name: trimmedLine,
          args: [],
          steps: [],
          values: {},
          help: currentComment.trim()
        };
        keywords.push(currentKeyword);
        currentComment = ''; // Reset comment after assigning to a keyword
        currentKey = null;
      } else if (currentKeyword) {
        // Handle keyword settings or steps
        if (trimmedLine.startsWith('[Arguments]')) {
          currentKeyword.args = trimmedLine.split(/\s+/).slice(1); // Split arguments by whitespace and remove '[Arguments]'
          currentKey = 'args';
        } else if (trimmedLine.startsWith('[Documentation]')) {
          currentKeyword.help += '\n' + trimmedLine.replace('[Documentation]', '').trim();
          currentKey = 'help';
        } else if (trimmedLine.startsWith('[Return]')) {
          currentKeyword.returnValue = trimmedLine.split(/\s+/).slice(1); // Extract return values
          currentKey = 'return';
        } else if (currentKey === 'args' && /\$\{[^}]+}/.test(trimmedLine)) {
          // Handle multiline arguments
          const args = trimmedLine.match(/\$\{[^}]+}/g) || [];
          currentKeyword.args.push(...args);
        } else if (currentKey === 'help') {
          // Append multiline documentation
          currentKeyword.help += '\n' + trimmedLine;
        } else {
          // Handle keyword steps
          currentKeyword.steps.push(trimmedLine);
        }
      }
    });

    return keywords;
  }


  // function parseTestCases(content) {
  //   const lines = content.split('\n');
  //   let inTestCaseSection = false;
  //   const testCases = [];
  //   let currentTestCase = null;
  //
  //   lines.forEach(line => {
  //     const trimmedLine = line.trim();
  //
  //     // Detect the start of the Test Cases section
  //     if (trimmedLine.startsWith('*** Test Cases ***')) {
  //       inTestCaseSection = true;
  //     }
  //     // Handle the start of a new test case
  //     else if (inTestCaseSection && trimmedLine && !line.startsWith(' ') && !line.startsWith('\t')) {
  //       if (currentTestCase) {
  //         testCases.push(currentTestCase);
  //       }
  //       currentTestCase = { name: trimmedLine, commands: [] };
  //     }
  //     // Handle commands/steps within a test case
  //     else if (inTestCaseSection && currentTestCase && (line.startsWith(' ') || line.startsWith('\t'))) {
  //       const parts = trimmedLine.split(/\s{2,}/); // Split by 2 or more spaces
  //       if (parts.length > 0) {
  //         const command = parts.shift(); // Command is the first part
  //         const args = parts.length > 0 ? parts[0].split(/\s+/) : []; // Remaining parts are arguments
  //         currentTestCase.commands.push({ command, args });
  //       }
  //     }
  //   });
  //
  //   // Push the last test case if any
  //   if (currentTestCase) {
  //     testCases.push(currentTestCase);
  //   }
  //
  //   return testCases;
  // }

  function renderTestCases(commands) {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = ''; // Clear previous content

    commands.forEach(command => {
      const newItem = document.createElement('div');
      newItem.className = 'keyword-item';

      // Create and append the keyword-title element
      const keywordTitle = document.createElement('div');
      keywordTitle.className = 'keyword-title';
      keywordTitle.textContent = command.name;
      newItem.appendChild(keywordTitle);

      const paramsDiv = document.createElement('div');
      paramsDiv.className = 'keyword-params';

      // Ensure that arguments are correctly added and avoid duplication
      command.args.forEach(arg => {
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';

        const select = document.createElement('select');
        select.dataset.arg = arg;

        // Custom Option hinzufügen
        const customOption = document.createElement('option');
        customOption.value = '';
        customOption.textContent = 'Custom';
        select.appendChild(customOption);

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.placeholder = `Custom ${arg.replace('${', '').replace('}', '')}`;
        customInput.style.marginLeft = '10px';
        customInput.dataset.arg = arg;
        customInput.classList.add('custom-input');
        customInput.value = arg; // Set the default value to the argument

        select.addEventListener('change', () => {
          if (select.value === '') {
            customInput.classList.add('visible');
          } else {
            customInput.classList.remove('visible');
          }
        });

        inputContainer.appendChild(select);
        inputContainer.appendChild(customInput);

        paramsDiv.appendChild(inputContainer);
      });

      newItem.appendChild(paramsDiv);

      const actionButtons = document.createElement('div');
      actionButtons.className = 'action-buttons';

      const moveUpButton = document.createElement('button');
      moveUpButton.className = 'btn-move-up';
      moveUpButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
      moveUpButton.onclick = () => moveItem(newItem, -1);

      const moveDownButton = document.createElement('button');
      moveDownButton.className = 'btn-move-down';
      moveDownButton.innerHTML = '<i class="fas fa-arrow-down"></i>';
      moveDownButton.onclick = () => moveItem(newItem, 1);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-delete';
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.onclick = () => newItem.remove();

      actionButtons.appendChild(moveUpButton);
      actionButtons.appendChild(moveDownButton);
      actionButtons.appendChild(deleteButton);

      newItem.appendChild(actionButtons);

      workspace.appendChild(newItem);
    });
  }

  function renderKeywords(keywords) {
    const keywordContainer = document.getElementById('keywords');
    keywordContainer.innerHTML = ''; // Vorherige Keywords löschen

    keywords.forEach(keyword => {
      const keywordElement = document.createElement('div');
      keywordElement.className = 'draggable';
      keywordElement.draggable = true;
      keywordElement.textContent = keyword.name;
      keywordElement.dataset.name = keyword.name;
      keywordElement.dataset.args = JSON.stringify(keyword.args);
      keywordElement.dataset.values = JSON.stringify(keyword.values);
      keywordElement.dataset.help = keyword.help; // Hilfe-Text anhängen

      // Fragezeichen-Symbol hinzufügen
      const helpIcon = document.createElement('i');
      helpIcon.className = 'fas fa-info-circle help-icon';
      helpIcon.style.marginLeft = '10px';
      helpIcon.style.cursor = 'pointer';
      helpIcon.title = 'Klicke für Hilfe';
      helpIcon.addEventListener('click', function () {
        showHelpModal(keyword.help);
      });

      keywordElement.appendChild(helpIcon);
      keywordElement.addEventListener('dragstart', handleDragStart);

      keywordContainer.appendChild(keywordElement);
    });

    // Füge den Button nach den Keywords hinzu
    addKeywordButton();
  }


  function filterKeywords() {
    const filterText = keywordFilter.value.toLowerCase();
    const filteredKeywords = allKeywords.filter(keyword =>
      keyword.name.toLowerCase().includes(filterText)
    );
    renderKeywords(filteredKeywords);
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      name: e.target.dataset.name,
      args: JSON.parse(e.target.dataset.args),
      values: JSON.parse(e.target.dataset.values),
      help: e.target.dataset.help // Include help text in transfer data
    }));
  }

  function showHelpModal(helpText) {
    let modal = document.getElementById('help-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'help-modal';
      modal.className = 'help-modal';
      modal.innerHTML = `
        <div class="help-modal-content">
          <span class="help-modal-close">&times;</span>
          <p>${helpText}</p>
        </div>`;
      document.body.appendChild(modal);

      // Modal schließen, wenn X geklickt wird
      modal.querySelector('.help-modal-close').addEventListener('click', function () {
        modal.style.display = 'none';
      });

      // Modal schließen, wenn außerhalb des Modals geklickt wird
      window.addEventListener('click', function (event) {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    } else {
      modal.querySelector('p').textContent = helpText;
    }

    modal.style.display = 'block';
  }

  workspace.addEventListener('dragover', handleDragOver);
  workspace.addEventListener('drop', handleDrop);

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const newItem = document.createElement('div');
    newItem.className = 'keyword-item';

    // Create and append the keyword-title element
    const keywordTitle = document.createElement('div');
    keywordTitle.className = 'keyword-title';
    keywordTitle.textContent = data.name;
    newItem.appendChild(keywordTitle);

    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'keyword-params';

    // Determine the correct number of arguments based on the keyword
    if (data.name === "Sum Two Numbers") {
      data.args = ["${a}", "${b}"]; // Force two arguments
    } else if (data.name === "Custom Greeting") {
      data.args = ["${name}"]; // Force one argument
    }

    data.args.forEach(arg => {
      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.alignItems = 'center';

      // Create an input field for each argument with the variable name as placeholder
      const customInput = document.createElement('input');
      customInput.type = 'text';
      customInput.placeholder = arg; // Set the placeholder to the variable name
      customInput.style.marginLeft = '10px';
      customInput.dataset.arg = arg;
      customInput.classList.add('custom-input');

      inputContainer.appendChild(customInput);
      paramsDiv.appendChild(inputContainer);
    });

    newItem.appendChild(paramsDiv);

    // Action buttons (Move Up, Move Down, Delete)
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';

    const moveUpButton = document.createElement('button');
    moveUpButton.className = 'btn-move-up';
    moveUpButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    moveUpButton.onclick = () => moveItem(newItem, -1);

    const moveDownButton = document.createElement('button');
    moveDownButton.className = 'btn-move-down';
    moveDownButton.innerHTML = '<i class="fas fa-arrow-down"></i>';
    moveDownButton.onclick = () => moveItem(newItem, 1);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.onclick = () => newItem.remove();

    actionButtons.appendChild(moveUpButton);
    actionButtons.appendChild(moveDownButton);
    actionButtons.appendChild(deleteButton);

    newItem.appendChild(actionButtons);

    workspace.appendChild(newItem);
  }


  function moveItem(item, direction) {
    const items = Array.from(workspace.children);
    const index = items.indexOf(item);

    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    const referenceItem = items[newIndex];
    workspace.insertBefore(item, direction === -1 ? referenceItem : referenceItem.nextSibling);
  }

  function exportTestCase() {
    const testCaseName = document.getElementById('test-case-name').value.trim();
    const testCaseDoc = document.getElementById('test-case-doc').value.trim();
    const items = workspace.querySelectorAll('.keyword-item');
    let newTestCases = '';

    // Eingabevalidierung
    if (!testCaseName) {
      alert('Bitte geben Sie einen Namen für den Testfall ein.');
      return;
    }

    if (!testCaseDoc) {
      alert('Bitte geben Sie eine Dokumentation für den Testfall ein.');
      return;
    }

    if (items.length === 0) {
      alert('Der Testfall muss mindestens einen Schritt enthalten.');
      return;
    }

    // Füge den Testfallnamen und die Dokumentation hinzu
    newTestCases += `${testCaseName}\n    [Documentation]    ${testCaseDoc}\n`;

    items.forEach(item => {
      const titleElement = item.querySelector('.keyword-title');

      if (titleElement) {
        let command = `    ${titleElement.textContent}`;
        const inputs = item.querySelectorAll('input.custom-input');

        inputs.forEach(input => {
          if (input.value.trim() !== '') {
            command += `    ${input.value.trim()}`;
          }
        });

        if (command.trim() === `    ${titleElement.textContent}`) {
          alert(`Das Keyword "${titleElement.textContent}" enthält keine Argumente. Bitte fügen Sie die notwendigen Werte hinzu.`);
          return;
        }

        newTestCases += `${command}\n`;
      } else {
        alert('Ein Keyword-Titel fehlt. Bitte überprüfen Sie den Testfall.');
        return;
      }
    });

    // Überprüfe, ob tatsächlich Testschritte vorhanden sind
    if (newTestCases.trim() === `${testCaseName}\n    [Documentation]    ${testCaseDoc}`) {
      alert('Es wurden keine Testschritte hinzugefügt. Der Testfall kann nicht exportiert werden.');
      return;
    }

    // Den Inhalt des hochgeladenen Files abrufen
    const fileContent = localStorage.getItem('uploadedFileContent') || '';
    const updatedContent = appendTestCaseToFile(fileContent, newTestCases);

    downloadTestCase(updatedContent);
  }


  function appendTestCaseToFile(fileContent, newTestCases) {
    // Füge das Keyword am Ende der "*** Keywords ***"-Sektion hinzu
    let customKeywords = '';

    allKeywords.forEach(keyword => {
      if (keyword.help.startsWith('TODO')) {
        customKeywords += `\n${keyword.name}\n    [Documentation]    ${keyword.help}`;
        if (keyword.args.length > 0) {
          // Argumente korrekt als Variablen formatiert ausgeben
          const formattedArgs = keyword.args.map(arg => `\${${arg}}`).join('    ');
          customKeywords += `\n    [Arguments]    ${formattedArgs}`;
        }
        customKeywords += '\n\n'; // Füge zwei Leerzeilen nach jedem Keyword hinzu
      }
    });

    // Prüfen, ob eine "*** Keywords ***"-Sektion existiert
    if (fileContent.includes('*** Keywords ***')) {
      // Füge die benutzerdefinierten Keywords hinzu
      const keywordSection = fileContent.split('*** Keywords ***')[1];
      fileContent = fileContent.replace(keywordSection, customKeywords + keywordSection);
    } else {
      // Füge die Sektion am Ende hinzu
      fileContent += `\n\n*** Keywords ***\n${customKeywords.trim()}\n\n`;
    }

    return fileContent + '\n\n*** Test Cases ***\n' + newTestCases.trim() + '\n';
  }



  function downloadTestCase(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = 'testcase.robot';
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target = '_blank';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }


  function addKeywordButton() {
    const keywordContainer = document.getElementById('keywords');

    const addButton = document.createElement('button');
    addButton.className = 'btn-add-keyword';
    addButton.textContent = '+';
    addButton.onclick = openAddKeywordDialog;

    keywordContainer.appendChild(addButton);
  }

  function openAddKeywordDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h2>Neues Keyword hinzufügen</h2>
            <label for="keywordName">Name des Keywords:</label>
            <input type="text" id="keywordName" placeholder="Name" />

            <label for="keywordDescription">Beschreibung:</label>
            <textarea id="keywordDescription" placeholder="Beschreibung"></textarea>

            <label for="keywordArguments">Argumente (komma-getrennt):</label>
            <input type="text" id="keywordArguments" placeholder="arg1, arg2, ..." />

            <button class="btn-confirm">Hinzufügen</button>
            <button class="btn-cancel">Abbrechen</button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Event Listener für Buttons
    dialog.querySelector('.btn-confirm').onclick = () => {
      const name = document.getElementById('keywordName').value;
      const description = document.getElementById('keywordDescription').value;
      const args = document.getElementById('keywordArguments').value.split(',').map(arg => arg.trim());

      addCustomKeyword(name, description, args);
      dialog.remove(); // Dialog schließen
    };

    dialog.querySelector('.btn-cancel').onclick = () => dialog.remove(); // Dialog schließen
  }

  function addCustomKeyword(name, description, args) {
    if (!name || !description) return;

    // Entferne leere Argumente
    const cleanArgs = args.filter(arg => arg.trim() !== "");

    const newKeyword = {
      name: name,
      args: cleanArgs, // Benutze die bereinigten Argumente
      steps: [],
      values: {},
      help: `TODO: ${description}`
    };

    allKeywords.push(newKeyword);
    renderKeywords(allKeywords); // Palette aktualisieren
  }




  document.querySelector('.export-button').addEventListener('click', exportTestCase);
});
