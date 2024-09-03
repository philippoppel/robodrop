document.addEventListener("DOMContentLoaded", () => {
  // Funktionen zum Abrufen und Speichern von Seiten
  function getPages() {
    const pages = JSON.parse(localStorage.getItem('wikiPages')) || {};
    return pages;
  }

  function savePages(pages) {
    localStorage.setItem('wikiPages', JSON.stringify(pages));
  }

  function setCurrentPage(page) {
    localStorage.setItem('currentPage', page);
  }

  function getCurrentPage() {
    return localStorage.getItem('currentPage') || 'Robot Framework Basics';
  }

  // Funktionen zum Rendern von Seiten und Kommentaren
  function renderPage(page) {
    const pages = getPages();
    console.log('Alle Seiten:', pages); // Überprüfen, ob die Seiten korrekt geladen wurden

    if (!pages[page]) {
      console.warn('Die ausgewählte Seite existiert nicht.');
      document.getElementById('pageTitle').textContent = 'Seite nicht gefunden';
      document.getElementById('pageContent').innerHTML = 'Kein Inhalt verfügbar';
      return;
    }

    const currentPage = pages[page];
    console.log('Aktuelle Seite:', currentPage); // Überprüfen, ob die aktuelle Seite geladen wurde
    document.getElementById('pageTitle').textContent = page || 'Keine Seite gefunden';
    document.getElementById('pageContent').innerHTML = renderMarkdown(currentPage.content || 'Kein Inhalt verfügbar');
    renderComments(currentPage.comments || []);
  }

  function renderMarkdown(content) {
    const converter = new showdown.Converter();
    const html = converter.makeHtml(content);
    console.log('Konvertiertes HTML:', html); // Überprüfe, ob das HTML korrekt generiert wird
    return html;
  }


  function renderComments(comments) {
    const commentList = document.getElementById('commentList');

    if (!comments || comments.length === 0) {
      commentList.innerHTML = '<li>Keine Kommentare vorhanden.</li>';
      return;
    }

    commentList.innerHTML = ''; // Vorherige Kommentare entfernen

    comments.forEach((comment, index) => {
      const commentItem = document.createElement('li');
      const timestamp = new Date(comment.timestamp).toLocaleString();
      commentItem.innerHTML = `
      <strong>${comment.author}:</strong> ${comment.text} <em>${timestamp}</em>
      <button onclick="replyToComment(${index})">Antworten</button>`;

      if (comment.replies && comment.replies.length > 0) {
        const repliesList = document.createElement('ul');
        comment.replies.forEach(reply => {
          const replyTimestamp = new Date(reply.timestamp).toLocaleString();
          const replyItem = document.createElement('li');
          replyItem.classList.add('reply');
          replyItem.innerHTML = `<strong>${reply.author}:</strong> ${reply.text} <em>${replyTimestamp}</em>`;
          repliesList.appendChild(replyItem);
        });
        commentItem.appendChild(repliesList);
      }

      commentList.appendChild(commentItem);
    });
  }

  window.replyToComment = function(index) {
    const replyDetails = prompt('Gib deinen Namen und das Kommentar ein (Format: Name: Kommentar):');

    if (replyDetails) {
      const [author, ...replyTextArray] = replyDetails.split(':');
      const replyText = replyTextArray.join(':').trim();

      if (author && replyText) {
        const pages = getPages();
        const currentPage = getCurrentPage();

        if (!pages[currentPage].comments[index].replies) {
          pages[currentPage].comments[index].replies = [];
        }

        pages[currentPage].comments[index].replies.push({
          author: author.trim(),
          text: replyText,
          timestamp: Date.now()
        });
        savePages(pages);
        saveAndRenderPage(currentPage);
      } else {
        alert('Bitte gib sowohl einen Namen als auch einen Kommentar ein.');
      }
    }
  };

  function saveAndRenderPage(currentPage) {
    const pages = getPages();

    if (!pages[currentPage].comments) {
      pages[currentPage].comments = []; // Initialisiere das comments-Array, wenn es nicht existiert
    }

    savePages(pages);
    renderPage(currentPage);
  }





  function navigateToPage(page) {
    setCurrentPage(page); // Speichert die aktuelle Seite in LocalStorage
    renderPage(page); // Rendert die ausgewählte Seite
  }
  window.navigateToPage = navigateToPage;

  // Initialisierung der Beispieldaten
  function initializeStorage() {
    const pages = getPages();
    if (Object.keys(pages).length === 0) {
      pages["Beispielseite"] = {
        content: "# Willkommen zur Beispielseite\n\nDas ist der erste Inhalt dieser Seite.",
        comments: [
          { author: "Max Mustermann", text: "Interessante Seite!", timestamp: Date.now() }
        ]
      };
    }

    // Hinzufügen der Robot Framework-Seite
    pages["Robot Framework Basics"] = {
      content: "# Robot Framework Basics\n\n## Was ist das Robot Framework?\n\nDas **Robot Framework** ist ein generisches Test-Automatisierungs-Framework für akzeptanztestgetriebene Entwicklung (ATDD). Es verwendet keyword-driven testing, um Testfälle zu definieren, und bietet eine einfache Möglichkeit, Tests zu schreiben und auszuführen.\n\n## Grundlegende Befehle\n\n### 1. **Open Browser**\n\nDieser Befehl öffnet einen Browser und lädt eine spezifische URL.\n\n```robotframework\n*** Test Cases ***\nÖffne die Webseite\n    Open Browser    https://example.com    chrome\n```\n\n**Erklärung:**\n- `Open Browser` ist das Schlüsselwort, das den Browser öffnet.\n- `https://example.com` ist die URL, die geöffnet wird.\n- `chrome` spezifiziert den Browsertyp.\n\n### 2. **Click Element**\n\nDieser Befehl klickt auf ein Element auf der Webseite.\n\n```robotframework\n*** Test Cases ***\nKlicke auf den Button\n    Click Element    //button[@id='submit']\n```\n\n**Erklärung:**\n- `Click Element` ist das Schlüsselwort, das einen Klick simuliert.\n- `//button[@id='submit']` ist der XPath-Selektor des Elements, das angeklickt werden soll.\n\n### 3. **Input Text**\n\nDieser Befehl gibt Text in ein Eingabefeld ein.\n\n```robotframework\n*** Test Cases ***\nEingabe eines Namens\n    Input Text    //input[@name='username']    Max Mustermann\n```\n\n**Erklärung:**\n- `Input Text` gibt den Text in das Eingabefeld ein.\n- `//input[@name='username']` ist der XPath-Selektor des Eingabefelds.\n- `Max Mustermann` ist der Text, der eingegeben wird.\n\n### 4. **Submit Form**\n\nDieser Befehl sendet ein Formular ab.\n\n```robotframework\n*** Test Cases ***\nSende das Formular ab\n    Submit Form    //form[@id='loginForm']\n```\n\n**Erklärung:**\n- `Submit Form` sendet das Formular ab.\n- `//form[@id='loginForm']` ist der XPath-Selektor des Formulars.\n\n## Anwendung: Einfache Login-Sequenz\n\nHier ist ein vollständiger Testfall, der eine einfache Login-Sequenz durchführt.\n\n```robotframework\n*** Test Cases ***\nLogin Test\n    Open Browser    https://example.com/login    chrome\n    Input Text      //input[@name='username']    Max Mustermann\n    Input Text      //input[@name='password']    geheim\n    Click Element   //button[@id='loginButton']\n    Submit Form     //form[@id='loginForm']\n    [Teardown]      Close Browser\n```\n\n**Erklärung:**\n- Der Testfall öffnet eine Login-Seite, gibt die Zugangsdaten ein, klickt auf den Login-Button und sendet das Formular ab.\n- Am Ende wird der Browser geschlossen."
    };

    savePages(pages);
  }
// Initialisiere die Beispieldaten
  initializeStorage();

  // Rendere die Seitenliste und die aktuelle Seite
  renderPageList();
  navigateToPage(getCurrentPage()); // Lade die aktuelle Seite beim Start

  const addCommentBtn = document.getElementById('addCommentBtn');
  const commentAuthor = document.getElementById('commentAuthor');
  const newComment = document.getElementById('newComment');

  addCommentBtn.addEventListener('click', () => {
    const pages = getPages();
    const currentPage = getCurrentPage();

    if (!pages[currentPage].comments) {
      pages[currentPage].comments = [];
    }

    const author = commentAuthor.value.trim();
    const commentText = newComment.value.trim();

    if (!author || !commentText) {
      alert('Bitte gib sowohl einen Namen als auch einen Kommentar ein.');
      return;
    }

    const newCommentObj = {
      author: author,
      text: commentText,
      timestamp: Date.now(),
      replies: []
    };

    pages[currentPage].comments.push(newCommentObj);
    savePages(pages);
    renderPage(currentPage);

    newComment.value = '';
    commentAuthor.value = '';
  });

  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', (e) => {
    renderPageList(e.target.value);
  });

  function renderPageList(filter = '') {
    const pages = getPages();
    const filteredPages = Object.keys(pages).filter(page => {
      return page.toLowerCase().includes(filter.toLowerCase());
    });

    const pageList = document.getElementById('pageList');
    pageList.innerHTML = filteredPages.map(page => `<li onclick="navigateToPage('${page}')">${page}</li>`).join('');
  }
});
