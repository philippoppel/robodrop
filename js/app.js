document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const selectRobotButton = document.querySelector('.upload-button');
  const keywordFilter = document.getElementById('keywordFilter');
  const addKeywordBtn = document.getElementById('addKeyword');
  const resetStateButton = document.getElementById('resetState');
  const workspace = document.getElementById('workspace');
  const testCaseName = document.getElementById('test-case-name');
  const testCaseDoc = document.getElementById('test-case-doc');

  // Tooltips für Buttons
  selectRobotButton.title = 'Lade eine Datei im .robot-Format hoch';
  addKeywordBtn.title = 'Füge ein neues Keyword hinzu';
  resetStateButton.title = 'Setze den aktuellen Zustand zurück';
  document.querySelector('.export-button').title = 'Exportiere den aktuellen Testfall';
  document.getElementById('add-test-case').title = 'Erstelle einen neuen Testfall';
  testCaseName.title = 'Gebe dem Testfall einen Namen';
  testCaseDoc.title = 'Beschreibe, was der Testfall prüft';


  let allKeywords = [], testCases = [], currentTestCaseId = null;
  document.querySelector('.export-button').addEventListener('click', exportTestCase);

  keywordFilter.addEventListener('input', () => {
    const keywords = allKeywords || [];
    const filteredKeywords = (allKeywords || []).filter(k => k.name.toLowerCase().includes(keywordFilter.value.toLowerCase()));
    renderKeywords(filteredKeywords);
  });

  const saveStateButton = document.getElementById('saveStateButton');
  saveStateButton.addEventListener('click', () => {
    saveState();
    showSaveFeedback();
  });

  function showSaveFeedback() {
    const feedbackElement = document.getElementById('saveFeedback');
    feedbackElement.style.opacity = '1'; // Sichtbar machen

    // Nach 2 Sekunden das Feedback wieder ausblenden
    setTimeout(() => {
      feedbackElement.style.opacity = '0';
    }, 500);
  }



  workspace.addEventListener('dragover', (e) => e.preventDefault());

  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error('Fehler beim Parsen der Drag-and-Drop-Daten:', error);
      return;
    }

    const newItem = createCommandElement(data); // Erstelle das Element inkl. Buttons und Listener
    workspace.appendChild(newItem);

    const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase.commands.push({ ...data, values: data.args.map(() => '') });
      saveState();
    }
  });

  function saveState() {
    if (currentTestCaseId) {
      const currentTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
      if (currentTestCase) {
        saveCurrentTestCaseValues(currentTestCase);
      }
    }

    const state = {
      testCases, // Testfälle
      keywords: allKeywords // Keywords
    };
    localStorage.setItem('appState', JSON.stringify(state));
  }



  function loadState() {
    const savedState = JSON.parse(localStorage.getItem('appState')) || { testCases: [], keywords: [] };
    testCases = savedState.testCases || [];
    allKeywords = savedState.keywords || [];

    renderTestCaseList();
    renderKeywords(allKeywords);

    if (testCases.length) {
      selectTestCase(currentTestCaseId || testCases[0].id); // Wähle den gespeicherten oder den ersten Testfall aus
    }
  }






  function renderKeywords(keywords) {
    const keywordContainer = document.getElementById('keywords');
    keywordContainer.innerHTML = ''; // Vorherige Keywords löschen

    keywords.forEach(keyword => {
      if (!keyword.name || keyword.name.trim() === '') return;

      const keywordElement = document.createElement('div');
      keywordElement.className = 'draggable';
      keywordElement.draggable = true;
      keywordElement.textContent = keyword.name;

      keywordElement.dataset.name = keyword.name;
      keywordElement.dataset.args = JSON.stringify(keyword.args || []);
      keywordElement.dataset.values = JSON.stringify(keyword.values || {});
      keywordElement.dataset.help = keyword.help || 'Keine Hilfe verfügbar';

      const actionButtons = document.createElement('div');
      actionButtons.className = 'action-buttons';

      // Tooltip Container
      const tooltipContainer = document.createElement('div');
      tooltipContainer.className = 'tooltip-container';

      // Info-Icon Button
      const helpIcon = document.createElement('button');
      helpIcon.className = 'btn-info';
      helpIcon.innerHTML = '<i class="fas fa-info-circle"></i>';

      // Tooltip Content
      const tooltipContent = document.createElement('div');
      tooltipContent.className = 'tooltip-content';
      tooltipContent.textContent = keyword.help || 'Keine Hilfe verfügbar';

      tooltipContainer.appendChild(helpIcon);
      tooltipContainer.appendChild(tooltipContent);


      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-delete';
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.title = 'Löschen';
      deleteButton.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm(`Möchten Sie das Keyword "${keyword.name}" wirklich löschen?`)) {
          allKeywords = allKeywords.filter(k => k !== keyword);
          renderKeywords(allKeywords);
          saveState();
        }
      });

      keywordFilter.title = 'Filtere Keywords nach Namen';  // Tooltip hinzufügen

      actionButtons.appendChild(tooltipContainer);
      actionButtons.appendChild(deleteButton);
      keywordElement.appendChild(actionButtons);

      keywordElement.addEventListener('dragstart', handleDragStart);
      keywordContainer.appendChild(keywordElement);
    });
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




  const renderTestCaseList = () => {
    const testCaseList = document.getElementById('test-case-list');
    testCaseList.innerHTML = '';
    testCases.forEach(tc => {
      const testCaseItem = document.createElement('div');
      testCaseItem.className = 'test-case-item';
      testCaseItem.dataset.id = tc.id; // Setze eine data-id für das spätere Auswählen

      // Markiere den ausgewählten Testfall
      if (tc.id === currentTestCaseId) {
        testCaseItem.classList.add('selected-test-case');
      }

      testCaseItem.textContent = tc.name || 'Neuer Testfall';
      testCaseItem.onclick = () => selectTestCase(tc.id);

      const actions = document.createElement('div');
      actions.className = 'test-case-actions';

      const duplicateBtn = document.createElement('button');
      duplicateBtn.className = 'btn-duplicate';
      duplicateBtn.innerHTML = '<i class="fas fa-copy"></i>';
      duplicateBtn.title = 'Dupliziere diesen Testfall';
      duplicateBtn.onclick = (e) => { e.stopPropagation(); duplicateTestCase(tc.id); };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.title = 'Lösche diesen Testfall';
      deleteBtn.onclick = (e) => { e.stopPropagation(); deleteTestCase(tc.id); };

      actions.appendChild(duplicateBtn);
      actions.appendChild(deleteBtn);
      testCaseItem.appendChild(actions);
      testCaseList.appendChild(testCaseItem);
    });
  };

  function renderTestCaseCommands(commands) {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = ''; // Clear the current workspace

    commands.forEach(command => {
      const newItem = createCommandElement(command);
      workspace.appendChild(newItem);
    });
  }


  const openAddKeywordDialog = () => {
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
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.btn-confirm').onclick = () => {
      const name = document.getElementById('keywordName').value.trim();
      const description = document.getElementById('keywordDescription').value.trim();
      const args = document.getElementById('keywordArguments').value.split(',').map(arg => arg.trim()).filter(arg => arg);
      if (name && description) addCustomKeyword(name, description, args);
      dialog.remove();
    };
    dialog.querySelector('.btn-cancel').onclick = () => dialog.remove();
  };

  const addCustomKeyword = (name, description, args) => {
    const formattedArgs = args.map(arg => `\${${arg}}`);
    const newKeyword = {
      name,
      args: formattedArgs,
      steps: [`Log    Hello, ${formattedArgs.join(' and ')}!`],
      help: `TODO: ${description}`
    };

    allKeywords.push(newKeyword);
    renderKeywords(allKeywords);
    saveState(); // Zustand speichern
  };

  const addTestCase = () => {
    const id = `test-case-${Date.now()}`;
    testCases.push({ id, name: '', doc: '', commands: [] });
    renderTestCaseList();
    selectTestCase(id);
    saveState();
  };

  const duplicateTestCase = (id) => {
    const tc = testCases.find(t => t.id === id);
    if (tc) {
      const newName = tc.name + ' (Kopie)';
      testCases.push({ ...tc, id: `test-case-${Date.now()}`, name: newName, commands: tc.commands.map(cmd => ({ ...cmd })) });
      renderTestCaseList();
      selectTestCase(testCases[testCases.length - 1].id);
    }
  };

  const deleteTestCase = (id) => {
    testCases = testCases.filter(tc => tc.id !== id);
    if (currentTestCaseId === id) currentTestCaseId = null;
    renderTestCaseList();
    saveState();  // Speichere den aktuellen Zustand, um die Änderung festzuhalten
  };


  function selectTestCase(id) {
    // Speichere die aktuellen Eingabewerte des aktuellen Testfalls
    if (currentTestCaseId) {
      const currentTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
      if (currentTestCase) {
        saveCurrentTestCaseValues(currentTestCase);
      }
    }

    currentTestCaseId = id;
    const selectedTestCase = testCases.find(tc => tc.id === id);

    if (selectedTestCase) {
      document.getElementById('test-case-name').value = selectedTestCase.name;
      document.getElementById('test-case-doc').value = selectedTestCase.doc;
      renderTestCaseCommands(selectedTestCase.commands);
    }

    // Entferne die Markierung von allen Testfällen
    const testCaseItems = document.querySelectorAll('.test-case-item');
    testCaseItems.forEach(item => {
      item.classList.remove('selected-test-case');
    });

    // Füge die Markierung zum aktuell ausgewählten Testfall hinzu
    const currentItem = document.querySelector(`.test-case-item[data-id="${id}"]`);
    if (currentItem) {
      currentItem.classList.add('selected-test-case');
    }

    saveState();  // Speichern des aktuellen Zustands, um die Markierung festzuhalten
  }


  const moveItem = (item, direction) => {
    const items = Array.from(workspace.children);
    const index = items.indexOf(item);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    workspace.insertBefore(item, direction === -1 ? items[newIndex] : items[newIndex].nextSibling);
  };

  function handleDragStart(e) {
    const dataToTransfer = {
      name: e.target.dataset.name,
      args: JSON.parse(e.target.dataset.args || '[]'),
      help: e.target.dataset.help || ''
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dataToTransfer));

    const dragImage = e.target.cloneNode(true);
    dragImage.style.width = `${e.target.offsetWidth}px`;
    dragImage.style.height = `${e.target.offsetHeight}px`;
    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';

    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }

  const showHelpModal = (helpText) => {
    let modal = document.getElementById('help-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'help-modal';
      modal.className = 'help-modal';
      modal.innerHTML = `<div class="help-modal-content"><span class="help-modal-close">&times;</span><p>${helpText}</p></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.help-modal-close').onclick = () => modal.style.display = 'none';
      window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } else modal.querySelector('p').textContent = helpText;
    modal.style.display = 'block';
  };

  selectRobotButton.addEventListener('click', () => fileInput.click());
  resetStateButton.addEventListener('click', () => confirm('Möchten Sie wirklich den Zustand zurücksetzen?') && resetState());
  fileInput.addEventListener('change', handleFileUpload);
  keywordFilter.addEventListener('input', () => renderKeywords(allKeywords.filter(k => k.name.toLowerCase().includes(keywordFilter.value.toLowerCase()))));
  addKeywordBtn.addEventListener('click', openAddKeywordDialog);
  document.getElementById('add-test-case').addEventListener('click', addTestCase);
  testCaseName.addEventListener('input', (e) => updateTestCaseField('name', e.target.value));
  testCaseDoc.addEventListener('input', (e) => updateTestCaseField('doc', e.target.value));

  loadState();

  function handleFileUpload(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      localStorage.setItem('uploadedFileContent', content);

      const { keywords, testCases: parsedTestCases } = parseRobotFile(content);

      allKeywords = [...keywords, ...allKeywords.filter(k => k.help?.startsWith('TODO'))];
      testCases = [...testCases, ...parsedTestCases];  // Test Cases korrekt hinzufügen

      renderKeywords(allKeywords);
      renderTestCaseList();
      saveState(); // Zustand speichern
    };
    reader.readAsText(event.target.files[0]);
  }

  function parseRobotFile(content) {
    const keywords = [];
    const testCases = [];
    const lines = content.split('\n');
    let section = null;
    let currentKeyword = null;
    let currentTestCase = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Erkennung der Sektionen
      if (trimmedLine.startsWith('***')) {
        if (trimmedLine.includes('Keywords')) {
          section = 'keywords';
        } else if (trimmedLine.includes('Test Cases')) {
          section = 'testCases';
        } else {
          section = null;
        }
        return;
      }

      // Verarbeitung von Keywords
      if (section === 'keywords') {
        if (line.startsWith(' ') || line.startsWith('\t')) {
          if (currentKeyword) {
            if (trimmedLine.startsWith('[Arguments]')) {
              currentKeyword.args = trimmedLine.split(/\s+/).slice(1);  // Extrahiere die Argumente
            } else if (trimmedLine.startsWith('[Documentation]')) {
              currentKeyword.help = trimmedLine.replace('[Documentation]', '').trim();
            } else {
              currentKeyword.steps.push(trimmedLine);
            }
          }
        } else {
          if (currentKeyword && currentKeyword.name.trim()) {
            keywords.push(currentKeyword);
          }
          currentKeyword = {
            name: trimmedLine,
            args: [],
            steps: [],
            help: ''
          };
        }
      }

      // Verarbeitung von Testfällen
      if (section === 'testCases') {
        if (line.startsWith(' ') || line.startsWith('\t')) {
          if (currentTestCase) {
            if (trimmedLine.startsWith('[Documentation]')) {
              currentTestCase.doc = trimmedLine.replace('[Documentation]', '').trim();
            } else if (trimmedLine) {
              const commandParts = trimmedLine.split(/\s{2,}/);  // Trennen bei mindestens 2 Leerzeichen
              const commandName = commandParts.shift();
              const commandArgs = commandParts.length > 0 ? commandParts : [];

              currentTestCase.commands.push({
                name: commandName,
                args: commandArgs,
                values: commandArgs  // Setze die Argumente als Werte, die später modifiziert werden können
              });
            }
          }
        } else {
          if (currentTestCase && currentTestCase.name.trim()) {
            testCases.push(currentTestCase);
          }
          currentTestCase = {
            id: `test-case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: trimmedLine,
            doc: '',
            commands: []
          };
        }
      }
    });

    // Füge das letzte Keyword oder den letzten Testfall hinzu
    if (currentKeyword && currentKeyword.name.trim()) {
      keywords.push(currentKeyword);
    }

    if (currentTestCase && currentTestCase.name.trim()) {
      testCases.push(currentTestCase);
    }

    return { keywords, testCases };
  }

  function updateTestCaseField(field, value) {
    const selectedTestCase = testCases.find(tc => tc.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase[field] = value;
      renderTestCaseList();
      saveState();
    }
  }

  function resetState() {
    localStorage.removeItem('appState');
    testCases = [];
    allKeywords = [];
    renderTestCaseList();
    renderKeywords([]);
    addTestCase();
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
      customInput.style.marginLeft = '10px';
      customInput.classList.add('custom-input');

      // Verwende gespeicherten Wert oder Argument-Platzhalter
      if (command.values && command.values[index]) {
        customInput.value = command.values[index];
      } else {
        customInput.placeholder = arg;
      }

      // Speichere den Zustand bei jeder Eingabe
      customInput.addEventListener('input', () => {
        command.values[index] = customInput.value.trim();
        saveState();
      });

      inputContainer.appendChild(customInput);
      paramsDiv.appendChild(inputContainer);
    });

    newItem.appendChild(paramsDiv);

    return newItem;
  }

  function exportTestCase() {
    let newTestCases = '';
    let isValid = true;
    saveState(); // Speichere den aktuellen Zustand

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
    // Prüfen, ob bereits eine Testfall-Sektion existiert
    const hasTestCasesSection = fileContent.includes('*** Test Cases ***');

    if (hasTestCasesSection) {
      // Trenne den Abschnitt mit den Testfällen ab
      const [beforeTestCases] = fileContent.split('*** Test Cases ***');
      fileContent = beforeTestCases.trim();  // Entferne den Test Cases Abschnitt
    }

    // Alle neuen Testfälle in die Datei einfügen
    return `${fileContent}\n\n*** Test Cases ***\n${newTestCases}`.trim();
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
});
