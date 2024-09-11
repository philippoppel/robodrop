import re
import xml.etree.ElementTree as ET
import sys

# Fehlerkategorien und entsprechende RegEx-Muster
error_patterns = {
  "Datenbankfehler": r"(SQL|database connection|constraint violation)",
  "Netzwerkfehler": r"(timeout|connection lost|network unreachable)",
  "Anwendungsfehler": r"(NullPointerException|segmentation fault|invalid argument)",
  "Validierungsfehler": r"(Should Be Equal As Numbers|assertion|comparison failed)",  # Kategorie für Testfehler
}

# Logs aus XML-Datei einlesen und analysieren
def read_logs_from_xml(log_file_path):
  tree = ET.parse(log_file_path)
  root = tree.getroot()

  # Alle Fehler in den Tests und Errors erfassen
  errors = []

  # Erfasse Testfehler aus <status> tags
  for elem in root.iter('status'):
    if 'status' in elem.attrib and elem.attrib['status'] == 'FAIL':
      errors.append(elem.text if elem.text else elem.attrib.get('message', 'Unknown failure'))

  # Erfasse Errors aus dem <errors> Abschnitt
  for error in root.findall(".//errors/msg"):
    errors.append(error.text)

  return errors

# Log-Meldung kategorisieren
def categorize_log(log_message):
  for category, pattern in error_patterns.items():
    if re.search(pattern, log_message, re.IGNORECASE):
      return category
  return "Unbekannter Fehler"

# Logs analysieren
def analyze_logs(logs):
  categorized_errors = []

  for log in logs:
    category = categorize_log(log)
    categorized_errors.append((log, category))

  return categorized_errors

# Bericht erstellen
def generate_report(categorized_errors):
  report = {}

  for log, category in categorized_errors:
    if category not in report:
      report[category] = []
    report[category].append(log)

  return report

# Ergebnisse anzeigen oder in eine Datei schreiben
def write_report(report, output_file):
  with open(output_file, 'w') as f:
    for category, logs in report.items():
      f.write(f"\nKategorie: {category}\n")
      for log in logs:
        f.write(f"  - {log.strip()}\n")

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print("Usage: python analyze_logs.py <log_file>")
    sys.exit(1)

  log_file = sys.argv[1]
  logs = read_logs_from_xml(log_file)
  categorized_errors = analyze_logs(logs)
  report = generate_report(categorized_errors)
  write_report(report, "error_report.txt")
