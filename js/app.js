document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const selectRobotButton = document.querySelector('.select-robot');
  const keywordFilter = document.getElementById('keywordFilter');
  const addKeywordBtn = document.getElementById('addKeyword');
  const resetStateButton = document.getElementById('resetState');
  const workspace = document.getElementById('workspace');
  const testCaseName = document.getElementById('test-case-name');
  const testCaseDoc = document.getElementById('test-case-doc');

  const resizeBar = document.getElementById('resize-bar');
  const keywordPalette = document.getElementById('keyword-palette');
  const editor = document.getElementById('editor');
  let isResizing = false;

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  resizeBar.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', debounce((e) => {
    if (!isResizing) return;

    const containerOffsetLeft = document.querySelector('.container').offsetLeft;
    const mouseX = e.clientX - containerOffsetLeft;

    const minWidth = 200; // Mindestbreite der Sidebar
    const maxWidth = window.innerWidth - 300; // Mindestbreite des Editors

    if (mouseX >= minWidth && mouseX <= maxWidth) {
      keywordPalette.style.width = `${mouseX}px`;
      editor.style.width = `${window.innerWidth - mouseX - 5}px`; // Direkt in Pixeln
    }
  }, 10)); // Debounce-Zeit von 10ms

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  });
  let allKeywords = [], testCases = [], currentTestCaseId = null;
  document.querySelector('.export-button').addEventListener('click', exportTestCase);

  keywordFilter.addEventListener('input', () => {
    const keywords = allKeywords || [];
    const filteredKeywords = (allKeywords || []).filter(k => k.name.toLowerCase().includes(keywordFilter.value.toLowerCase()));
    renderKeywords(filteredKeywords);
  });

  setInterval(() => {
    saveState();
  }, 10000);

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

    const newItem = createCommandElement(data);
    workspace.appendChild(newItem);

    const selectedTestCase = testCases.find(testCase => testCase.id === currentTestCaseId);
    if (selectedTestCase) {
      selectedTestCase.commands.push({ ...data, values: data.args.map(() => '') });
      saveState();
    }
  });

  const saveState = () => {
    const state = {
      testCases, // Testfälle
      keywords: allKeywords // Keywords
    };
    localStorage.setItem('appState', JSON.stringify(state));
  };

  const loadState = () => {
    const savedState = JSON.parse(localStorage.getItem('appState')) || { testCases: [], keywords: [] };
    testCases = savedState.testCases || [];
    allKeywords = savedState.keywords || [];

    renderTestCaseList();
    renderKeywords(allKeywords);

    if (testCases.length) selectTestCase(testCases[0].id);
  };



  function renderKeywords(keywords) {
    const keywordContainer = document.getElementById('keywords');
    keywordContainer.innerHTML = ''; // Vorherige Keywords löschen

    keywords.forEach(keyword => {
      // Skip empty or undefined keyword names
      if (!keyword.name || keyword.name.trim() === '') return;

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
      if (tc.id === currentTestCaseId) testCaseItem.classList.add('selected');
      testCaseItem.textContent = tc.name || 'Neuer Testfall';
      testCaseItem.onclick = () => selectTestCase(tc.id);
      const actions = document.createElement('div');
      actions.className = 'test-case-actions';
      const duplicateBtn = document.createElement('button');
      duplicateBtn.className = 'btn-duplicate';
      duplicateBtn.innerHTML = '<i class="fas fa-copy"></i>';
      duplicateBtn.onclick = (e) => { e.stopPropagation(); duplicateTestCase(tc.id); };
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
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
  };

  const selectTestCase = (id) => {
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
  };


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
      args: JSON.parse(e.target.dataset.args),
      help: e.target.dataset.help
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dataToTransfer));
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

      // Neue Keywords aus der Datei parsen und mit bestehenden zusammenführen
      const importedKeywords = parseKeywords(content);
      allKeywords = [...importedKeywords, ...allKeywords.filter(k => k.help?.startsWith('TODO'))];

      renderKeywords(allKeywords);
      saveState(); // Zustand speichern
    };
    reader.readAsText(event.target.files[0]);
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

      if (inKeywordsSection && trimmedLine.startsWith('***') && trimmedLine.endsWith('***')) {
        inKeywordsSection = false;
        return;
      }

      if (!inKeywordsSection) return;

      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        if (currentKeyword && currentKeyword.name.trim()) {
          keywords.push(currentKeyword);
        }
        currentKeyword = {
          name: trimmedLine,
          args: [],
          steps: [],
          returnValues: [],
          help: ''
        };
      } else if (currentKeyword) {
        if (trimmedLine.startsWith('[Arguments]')) {
          currentKeyword.args = trimmedLine.split(/\s+/).slice(1);
        } else if (trimmedLine.startsWith('[Documentation]')) {
          currentKeyword.help = trimmedLine.replace('[Documentation]', '').trim();
        } else if (trimmedLine.startsWith('[Return]')) {
          currentKeyword.returnValues = trimmedLine.split(/\s+/).slice(1);
        } else {
          currentKeyword.steps.push(trimmedLine);
        }
      }
    });

    if (currentKeyword && currentKeyword.name.trim()) {
      keywords.push(currentKeyword);
    }

    return keywords;
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
          const formattedArgs = keyword.args.join('    ');
          customKeywords += `\n    [Arguments]    ${formattedArgs}`;
        }
        customKeywords += '\n\n'; // Füge zwei Leerzeilen nach jedem Keyword hinzu
      }
    });

    if (fileContent.includes('*** Keywords ***')) {
      const keywordSection = fileContent.split('*** Keywords ***')[1];
      fileContent = fileContent.replace(keywordSection, customKeywords + keywordSection);
    } else {
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
});
