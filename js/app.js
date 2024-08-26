document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const selectRobotButton = document.querySelector('.select-robot');
  const keywordFilter = document.getElementById('keywordFilter');
  let allKeywords = [];
  const workspace = document.getElementById('workspace');
  const addKeywordBtn = document.getElementById('addKeyword');
  const resetStateButton = document.getElementById('resetState');
  let testCases = [];
  let currentTestCaseId = null;

  // Initialisiere die Event Listener
  selectRobotButton.addEventListener('click', () => {
    fileInput.click();
  });

  resetStateButton.addEventListener('click', () => {
    if (confirm('Möchten Sie wirklich den Zustand zurücksetzen? Dies wird alle gespeicherten Daten löschen.')) {
      resetState();
    }
  });

  fileInput.addEventListener('change', handleFileUpload);
  keywordFilter.addEventListener('input', filterKeywords);
  addKeywordBtn.addEventListener('click', openAddKeywordDialog);
  document.getElementById('add-test-case').addEventListener('click', addTestCase);
  document.querySelector('.export-button').addEventListener('click', exportTestCase);
  document.getElementById('test-case-name').addEventListener('input', (e) => {
    const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase.name = e.target.value;
      renderTestCaseList();
      saveState(); // Speichern nach Änderung des Namens
    }
  });
  document.getElementById('test-case-doc').addEventListener('input', (e) => {
    const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase.doc = e.target.value;
      saveState(); // Speichern nach Änderung der Dokumentation
    }
  });

  // Lade den gespeicherten Zustand beim Initialisieren
  loadState();

  function saveState() {
    const state = {
      testCases: testCases,
      keywords: allKeywords
    };
    localStorage.setItem('appState', JSON.stringify(state));
  }

  function loadState() {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const state = JSON.parse(savedState);
      testCases = state.testCases || [];
      allKeywords = state.keywords || [];
      renderTestCaseList();
      renderKeywords(allKeywords);
      if (testCases.length > 0) {
        selectTestCase(testCases[0].id);
      }
    } else {
      console.log('No state found');
      addTestCase(); // Füge einen neuen Testfall hinzu, falls kein Zustand geladen wird
    }
  }

  function resetState() {
    localStorage.removeItem('appState');
    testCases = [];
    allKeywords = [];
    renderTestCaseList();
    renderKeywords([]);
    clearTestCaseEditor();
    addTestCase();
  }

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
    let inKeywordsSection = false;
    let currentKeyword = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      if (trimmedLine === '*** Keywords ***') {
        inKeywordsSection = true;
        return;
      }

      if (inKeywordsSection && (trimmedLine.startsWith('***') && trimmedLine.endsWith('***'))) {
        inKeywordsSection = false;
        return;
      }

      if (!inKeywordsSection) return;

      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        if (currentKeyword) {
          keywords.push(currentKeyword);
        }
        currentKeyword = {
          name: trimmedLine,
          args: [],
          steps: [],
          returnValues: [],
          help: '' // Stelle sicher, dass die `help`-Eigenschaft vorhanden ist
        };
      } else if (currentKeyword) {
        if (trimmedLine.startsWith('[Arguments]')) {
          currentKeyword.args = trimmedLine.split(/\s+/).slice(1); // Argumente auslesen
        } else if (trimmedLine.startsWith('[Documentation]')) {
          currentKeyword.help = trimmedLine.replace('[Documentation]', '').trim(); // Dokumentation in `help` speichern
        } else if (trimmedLine.startsWith('[Return]')) {
          currentKeyword.returnValues = trimmedLine.split(/\s+/).slice(1); // Rückgabewerte auslesen
        } else {
          currentKeyword.steps.push(trimmedLine); // Schritte hinzufügen
        }
      }
    });

    if (currentKeyword) {
      keywords.push(currentKeyword);
    }

    return keywords;
  }

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
      if (!keyword.name) return;

      const keywordElement = document.createElement('div');
      keywordElement.className = 'draggable';
      keywordElement.draggable = true;
      keywordElement.textContent = keyword.name;

      keywordElement.dataset.name = keyword.name;
      keywordElement.dataset.args = JSON.stringify(keyword.args || []); // Sicherstellen, dass args ein Array ist
      keywordElement.dataset.values = JSON.stringify(keyword.values || {});
      keywordElement.dataset.help = keyword.help || 'Keine Hilfe verfügbar'; // Setze einen Standardwert, wenn keine Hilfe vorhanden

      const helpIcon = document.createElement('i');
      helpIcon.className = 'fas fa-info-circle help-icon';
      helpIcon.style.marginLeft = '10px';
      helpIcon.style.cursor = 'pointer';
      helpIcon.title = 'Klicke für Hilfe';
      helpIcon.addEventListener('click', function () {
        showHelpModal(keyword.help || 'Keine Hilfe verfügbar');
      });

      keywordElement.appendChild(helpIcon);
      keywordElement.addEventListener('dragstart', handleDragStart);

      keywordContainer.appendChild(keywordElement);
    });
  }

  function filterKeywords() {
    const filterText = keywordFilter.value.toLowerCase();
    const filteredKeywords = allKeywords.filter(keyword =>
      keyword.name.toLowerCase().includes(filterText)
    );
    renderKeywords(filteredKeywords);
  }

  function handleDragStart(e) {
    const keywordName = e.target.dataset.name || '';
    const keywordArgs = e.target.dataset.args || '[]'; // Default to an empty array if undefined
    const keywordValues = e.target.dataset.values || '{}'; // Default to an empty object if undefined
    const keywordHelp = e.target.dataset.help || '';

    // Erstellen des Objekts mit abgesicherten Werten
    const dataToTransfer = {
      name: keywordName,
      args: JSON.parse(keywordArgs),
      values: JSON.parse(keywordValues),
      help: keywordHelp
    };

    // Setze die Daten für den Drag-Vorgang
    e.dataTransfer.setData('text/plain', JSON.stringify(dataToTransfer));
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

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) {
      console.error('Leere oder ungültige Drag-and-Drop-Daten!');
      return;
    }

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error('Fehler beim Parsen der Drag-and-Drop-Daten:', error);
      return;
    }

    if (!data.name || !Array.isArray(data.args)) {
      console.error('Fehlende oder ungültige Daten:', data);
      return;
    }

    const newItem = createCommandElement(data);
    workspace.appendChild(newItem);

    // Aktualisiere die tatsächlichen Eingabewerte (falls vom Benutzer geändert)
    const argsValues = [];
    newItem.querySelectorAll('input.custom-input').forEach(input => {
      argsValues.push(input.value.trim());
    });

    const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase.commands.push({
        ...data,
        values: argsValues  // Speichern der tatsächlichen Eingabewerte
      });
    }
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
    let newTestCases = '';
    let isValid = true;

    testCases.forEach(testCase => {
      const testCaseName = testCase.name.trim();
      const testCaseDoc = testCase.doc.trim();

      if (!testCaseName) {
        alert('Einer der Testfälle hat keinen Namen. Bitte geben Sie jedem Testfall einen Namen.');
        isValid = false;
        return;
      }

      if (!testCaseDoc) {
        alert(`Der Testfall "${testCaseName}" hat keine Dokumentation. Bitte geben Sie eine Dokumentation an.`);
        isValid = false;
        return;
      }

      if (testCase.commands.length === 0) {
        alert(`Der Testfall "${testCaseName}" enthält keine Schritte. Bitte fügen Sie Schritte hinzu.`);
        isValid = false;
        return;
      }

      newTestCases += `${testCaseName}\n    [Documentation]    ${testCaseDoc}\n`;

      testCase.commands.forEach(command => {
        let commandLine = `    ${command.name}`;
        command.args.forEach((arg, index) => {
          // Verwende den tatsächlich eingegebenen Wert oder den Platzhalter
          const value = command.values && command.values[index] ? command.values[index] : arg;
          commandLine += `    ${value}`;
        });
        newTestCases += `${commandLine}\n`;
      });

      newTestCases += '\n'; // Leere Zeile zwischen Testfällen
    });

    if (!isValid) {
      return; // Breche den Export ab, wenn die Validierung fehlschlägt
    }

    const fileContent = localStorage.getItem('uploadedFileContent') || '';
    const updatedContent = appendTestCaseToFile(fileContent, newTestCases.trim());

    downloadTestCase(updatedContent);
  }

  function appendTestCaseToFile(fileContent, newTestCases) {
    let customKeywords = '';

    allKeywords.forEach(keyword => {
      const helpText = keyword.help || ''; // Sicherstellen, dass help definiert ist
      if (helpText.startsWith('TODO')) {
        customKeywords += `\n${keyword.name}\n    Log    ${helpText}`;
        if (keyword.args.length > 0) {
          // Argumente korrekt als Variablen formatiert ausgeben
          const formattedArgs = keyword.args.join('    ');
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
      const name = document.getElementById('keywordName').value.trim();
      const description = document.getElementById('keywordDescription').value.trim();
      const args = document.getElementById('keywordArguments').value.split(',').map(arg => arg.trim()).filter(arg => arg !== '');

      // Eingabevalidierung
      if (!name) {
        alert('Bitte geben Sie einen Namen für das Keyword ein.');
        return;
      }

      if (!description) {
        alert('Bitte geben Sie eine Beschreibung für das Keyword ein.');
        return;
      }

      addCustomKeyword(name, description, args);
      dialog.remove(); // Dialog schließen
    };

    dialog.querySelector('.btn-cancel').onclick = () => dialog.remove(); // Dialog schließen
  }

  function addCustomKeyword(name, description, args) {
    const formattedArgs = args.map(arg => `\${${arg}}`); // Argumente als ${arg} formatieren
    const newKeyword = {
      name: name,
      args: formattedArgs, // Verwende die formatierten Argumente
      steps: [`Log    Hello, ${formattedArgs.join(' and ')}! Welcome to the testing framework.`],
      values: {},
      help: `TODO: ${description}`
    };

    allKeywords.push(newKeyword);
    renderKeywords(allKeywords); // Palette aktualisieren
    saveState(); // Zustand nach der Änderung speichern
  }

  function addTestCase() {
    const id = `test-case-${Date.now()}`;
    const newTestCase = {
      id,
      name: '',
      doc: '',
      commands: []
    };

    testCases.push(newTestCase);
    renderTestCaseList();
    selectTestCase(id);
    saveState(); // Zustand nach der Änderung speichern
  }

  function saveState() {
    const state = {
      testCases: testCases, // Testfälle
      keywords: allKeywords // Keywords
    };
    console.log('Saving state:', state); // Logging
    localStorage.setItem('appState', JSON.stringify(state));
  }

  function renderTestCaseList() {
    const testCaseList = document.getElementById('test-case-list');
    testCaseList.innerHTML = '';

    testCases.forEach(testCase => {
      const testCaseItem = document.createElement('div');
      testCaseItem.className = 'test-case-item';
      if (testCase.id === currentTestCaseId) {
        testCaseItem.classList.add('selected');
      }

      testCaseItem.textContent = testCase.name || 'Neuer Testfall';

      const actions = document.createElement('div');
      actions.className = 'test-case-actions';

      const duplicateBtn = document.createElement('button');
      duplicateBtn.className = 'btn-duplicate';
      duplicateBtn.innerHTML = '<i class="fas fa-copy"></i>';
      duplicateBtn.onclick = (e) => {
        e.stopPropagation();
        duplicateTestCase(testCase.id);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTestCase(testCase.id);
      };

      actions.appendChild(duplicateBtn);
      actions.appendChild(deleteBtn);
      testCaseItem.appendChild(actions);

      testCaseItem.onclick = () => selectTestCase(testCase.id);
      testCaseList.appendChild(testCaseItem);
    });
  }

  function selectTestCase(id) {
    // Speichere die aktuellen Eingabewerte des aktuellen Testfalls
    if (currentTestCaseId) {
      const currentTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
      if (currentTestCase) {
        saveCurrentTestCaseValues(currentTestCase);
      }
    }

    currentTestCaseId = id;
    const selectedTestCase = testCases.find(testCase => testCase.id === id);

    if (selectedTestCase) {
      document.getElementById('test-case-name').value = selectedTestCase.name;
      document.getElementById('test-case-doc').value = selectedTestCase.doc;
      renderTestCaseCommands(selectedTestCase.commands);
      renderTestCaseList();
    }
  }

  function saveCurrentTestCaseValues(testCase) {
    const workspaceItems = document.querySelectorAll('.keyword-item');

    workspaceItems.forEach((item, index) => {
      const command = testCase.commands[index];
      if (command) {
        const inputs = item.querySelectorAll('input.custom-input');
        command.values = Array.from(inputs).map(input => input.value.trim());
      }
    });
  }

  function duplicateTestCase(id) {
    const testCaseToDuplicate = testCases.find(testCase => testCase.id === id);

    // Speicher die aktuellen Eingabewerte, bevor der Testfall dupliziert wird
    if (currentTestCaseId === id) {
      saveCurrentTestCaseValues(testCaseToDuplicate);
    }

    if (testCaseToDuplicate) {
      let newName = `${testCaseToDuplicate.name} (Kopie)`;
      let counter = 1;
      while (testCases.some(tc => tc.name === newName)) {
        newName = `${testCaseToDuplicate.name} (Kopie ${counter++})`;
      }

      const duplicate = {
        ...testCaseToDuplicate,
        id: `test-case-${Date.now()}`,
        name: newName,
        commands: testCaseToDuplicate.commands.map(cmd => ({
          ...cmd,
          values: cmd.values ? [...cmd.values] : [] // Werte kopieren, sicherstellen, dass sie existieren
        }))
      };

      // Konsolenüberprüfung
      console.log('Original:', testCaseToDuplicate);
      console.log('Duplicate:', duplicate);

      testCases.push(duplicate);
      renderTestCaseList();
      selectTestCase(duplicate.id);
    }
  }

  function deleteTestCase(id) {
    testCases = testCases.filter(testCase => testCase.id !== id);
    if (currentTestCaseId === id) {
      currentTestCaseId = null;
      clearTestCaseEditor();
    }
    renderTestCaseList();
  }

  function clearTestCaseEditor() {
    document.getElementById('test-case-name').value = '';
    document.getElementById('test-case-doc').value = '';
    document.getElementById('workspace').innerHTML = '';
  }

  function renderTestCaseCommands(commands) {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = ''; // Clear the current workspace

    commands.forEach(command => {
      const newItem = createCommandElement(command);
      workspace.appendChild(newItem);
    });
  }

  function createCommandElement(command) {
    const newItem = document.createElement('div');
    newItem.className = 'keyword-item';

    const keywordTitle = document.createElement('div');
    keywordTitle.className = 'keyword-title';
    keywordTitle.textContent = command.name;
    newItem.appendChild(keywordTitle);

    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'keyword-params';

    command.args.forEach((arg, index) => {
      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.alignItems = 'center';

      const customInput = document.createElement('input');
      customInput.type = 'text';
      customInput.placeholder = arg;
      customInput.style.marginLeft = '10px';
      customInput.dataset.arg = arg;
      customInput.classList.add('custom-input');

      // Lade den gespeicherten Wert oder zeige den Platzhalter an
      customInput.value = command.values && command.values[index] ? command.values[index] : '';

      inputContainer.appendChild(customInput);
      paramsDiv.appendChild(inputContainer);
    });

    newItem.appendChild(paramsDiv);

    // Action buttons
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
    deleteButton.onclick = () => {
      newItem.remove();
      const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
      if (selectedTestCase) {
        selectedTestCase.commands = selectedTestCase.commands.filter(cmd => cmd !== command);
      }
    };

    actionButtons.appendChild(moveUpButton);
    actionButtons.appendChild(moveDownButton);
    actionButtons.appendChild(deleteButton);

    newItem.appendChild(actionButtons);

    return newItem;
  }
});
