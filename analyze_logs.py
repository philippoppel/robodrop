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

  # Erfasse Testfehler und Testinformationen
  report_data = []

  for test_case in root.iter('test'):
    test_info = {
      'id': test_case.attrib.get('id', 'Unknown ID'),
      'name': test_case.attrib.get('name', 'Unknown Test'),
      'status': None,
      'steps': []
    }

    # Loop through each keyword (kw) inside the test
    for kw in test_case.iter('kw'):
      step_info = {
        'name': kw.attrib.get('name', 'Unknown Step'),
        'status': None,
        'messages': []
      }

      # Fetch the status and message for each step
      for status in kw.iter('status'):
        step_info['status'] = status.attrib.get('status', 'Unknown status')

      for msg in kw.iter('msg'):
        step_info['messages'].append(msg.text.strip() if msg.text else "No message")

      test_info['steps'].append(step_info)

    # Get the overall test case status
    for status in test_case.iter('status'):
      test_info['status'] = status.attrib.get('status', 'Unknown')

    report_data.append(test_info)

  return report_data

# Log-Meldung kategorisieren
def categorize_log(log_message):
  for category, pattern in error_patterns.items():
    if re.search(pattern, log_message, re.IGNORECASE):
      return category
  return "Unbekannter Fehler"

# Report generieren
def generate_human_friendly_report(report_data):
  report = []

  for test in report_data:
    report.append(f"Test Case ID: {test['id']}")
    report.append(f"Test Name: {test['name']}")
    report.append(f"Test Status: {test['status'].upper()}")
    report.append(f"Steps Executed:")

    for step in test['steps']:
      step_status = step['status'].upper()
      report.append(f"  - Step: {step['name']}")
      report.append(f"    Status: {step_status}")
      if step_status == 'FAIL':
        # For failed steps, categorize and explain the failure
        for message in step['messages']:
          error_category = categorize_log(message)
          report.append(f"    Error Category: {error_category}")
          report.append(f"    Message: {message}")
      else:
        # Show information for passed steps
        for message in step['messages']:
          report.append(f"    Info: {message}")

    report.append("\n")

  return "\n".join(report)

# Ergebnisse anzeigen oder in eine Datei schreiben
def write_report_to_file(report_content, output_file):
  with open(output_file, 'w') as f:
    f.write(report_content)

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print("Usage: python analyze_logs.py <log_file>")
    sys.exit(1)

  log_file = sys.argv[1]
  report_data = read_logs_from_xml(log_file)
  human_friendly_report = generate_human_friendly_report(report_data)
  write_report_to_file(human_friendly_report, "error_report.txt")
