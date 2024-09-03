document.addEventListener('DOMContentLoaded', () => {
  const executions = [
    {
      id: 1,
      name: "Testlauf 1",
      status: "erfolgreich",
      logs: ["Schritt 1: Roboterarm initialisiert", "Schritt 2: Objekt erfasst", "Schritt 3: Objekt bewegt"],
      errorCategory: null,
      timestamp: Date.now()
    },
    {
      id: 2,
      name: "Testlauf 2",
      status: "in test",
      logs: [],
      errorCategory: null,
      timestamp: Date.now() - 3600000 // 1 Stunde vorher
    },
    {
      id: 3,
      name: "Testlauf 3",
      status: "fehlgeschlagen",
      logs: ["Schritt 1: Roboterarm initialisiert", "Fehler: Hardwareproblem erkannt"],
      errorCategory: "Hardwarefehler",
      timestamp: Date.now() - 7200000 // 2 Stunden vorher
    }
  ];

  const executionList = document.getElementById('executionList');
  const executionTitle = document.getElementById('executionTitle');
  const executionDetails = document.getElementById('executionDetails');
  const statusFilter = document.getElementById('statusFilter');

  function renderExecutions(filteredExecutions) {
    executionList.innerHTML = '';
    filteredExecutions.forEach(execution => {
      const listItem = document.createElement('li');

      const statusIcon = document.createElement('span');
      statusIcon.className = `status-icon ${getStatusClass(execution.status)}`;

      const statusText = document.createElement('span');
      statusText.className = 'status-text';
      const timestamp = new Date(execution.timestamp).toLocaleString();
      statusText.textContent = `${execution.name} (${execution.status}) - ${timestamp}`;

      listItem.appendChild(statusIcon);
      listItem.appendChild(statusText);

      listItem.addEventListener('click', () => displayExecutionDetails(execution));
      executionList.appendChild(listItem);
    });

    if (filteredExecutions.length > 0) {
      displayExecutionDetails(filteredExecutions[0]);
    }
  }

  function getStatusClass(status) {
    if (status === "erfolgreich") return "status-success";
    if (status === "in test") return "status-in-test";
    return "status-failed";
  }

  function displayExecutionDetails(execution) {
    executionTitle.textContent = execution.name;

    if (execution.status === "erfolgreich") {
      executionDetails.innerHTML = `
        <h3 class="success">Status: Erfolgreich</h3>
        <h4>Logs:</h4>
        <ul>${execution.logs.map(log => `<li>${log}</li>`).join('')}</ul>
      `;
    } else if (execution.status === "in test") {
      executionDetails.innerHTML = `
        <h3 class="in-test">Status: In Test</h3>
        <p>Der Test läuft gerade...</p>
      `;
    } else if (execution.status === "fehlgeschlagen") {
      executionDetails.innerHTML = `
        <h3 class="failed">Status: Fehlgeschlagen</h3>
        <h4>Fehlerkategorie: ${execution.errorCategory}</h4>
        <h4>Logs:</h4>
        <ul>${execution.logs.map(log => `<li>${log}</li>`).join('')}</ul>
        <button class="create-ticket-btn" onclick="alert('Ticket erstellt!')">In Jira Ticket erstellen</button>
      `;
    }
  }

  statusFilter.addEventListener('change', () => {
    const selectedStatus = statusFilter.value;
    const filteredExecutions = selectedStatus === 'all'
      ? executions
      : executions.filter(execution => execution.status === selectedStatus);
    renderExecutions(filteredExecutions);
  });

  // Initial Rendering
  renderExecutions(executions);

  // Schließen des Modal-Fensters
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
  });
});
