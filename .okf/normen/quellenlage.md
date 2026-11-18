---
type: Reference
title: Quellenlage der Normen
description: Welche Normtexte im Original gelesen wurden, woher sie stammen und was offen bleibt.
tags: [quellen, normen]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T12:40:00Z }
stale_after: 2027-11-18T00:00:00Z
sources:
  - id: iteh-samples
    resource: https://standards.iteh.ai/
    title: iTeh Standards, kostenlose Leseproben von ISO-, EN- und SIST-Normen
---

# Wie gelesen wurde

ISO- und DIN-Volltexte sind kostenpflichtig. Gelesen wurden die frei zugänglichen Leseproben der
Originale bei iTeh.[^iteh-samples] Sie enthalten meist Anwendungsbereich, Begriffe und die ersten
Abschnitte mit den Tabellen. OIML R 4 ist frei und wurde vollständig gelesen. Die Texte wurden mit
`pdftotext` ausgelesen; ältere Normen sind OCR und stellenweise fehlerhaft.

# Gelesen

| Norm | Ausgabe | Konzept |
|---|---|---|
| ISO 384 | 1978 | [ISO 384](/normen/iso-384-messgeraete.md) |
| ISO 385 | 2005 | [ISO 385](/normen/iso-385-buerette.md) |
| ISO 648 | 1977 | [ISO 648](/normen/iso-648-vollpipette.md) |
| ISO 1042 | 1981 und 1998, OIML R 4 | [ISO 1042](/normen/iso-1042-messkolben.md) |
| ISO 1769 | 1975 | [ISO 1769](/normen/iso-1769-pipetten-farbcode.md) |
| ISO 1773 | 1997 | [ISO 1773](/normen/iso-1773-kolben.md) |
| ISO 3819 | 2015 | [ISO 3819](/normen/iso-3819-becherglas.md) |
| ISO 3864 | 1984 | [Sicherheitsfarben](/normen/sicherheitsfarben.md) |
| ISO 4788 | 2005 | [ISO 4788](/normen/iso-4788-messzylinder.md) |
| ISO 6414 | 2020 | [ISO 6414](/normen/iso-6414-glaszeichnung.md) |
| ISO 10628-2 | 2012 | [ISO 10628-2](/normen/iso-10628-fliessschema.md) |
| EN 13792 | 2002 | [EN 13792](/normen/en-13792-armaturen.md) |
| ISO 386 | 1977 (zurückgezogen) | [ISO 386](/normen/iso-386-thermometer.md) |
| ISO 4800 | 1998, vollständig als IS 1575:2003 | [ISO 4800](/normen/iso-4800-scheidetrichter.md) |
| ISO 4142 | 2002 | [ISO 4142](/normen/iso-4142-reagenzglas.md) |
| ISO 4798 | 1997 | [ISO 4798](/normen/iso-4798-trichter.md) |
| ISO 5456-3 | 1996, vollständig als IS 15021-3 | [ISO 5456-3](/normen/iso-5456-3-schraegbilder.md) |
| ISO 4797 | 2015, nur Inhaltsverzeichnis | [ISO 1773](/normen/iso-1773-kolben.md) |

# Offen

- **ISO 1042:1998, Tabelle:** nicht in der Leseprobe; Werte aus 1981 und OIML R 4. Eine Revision ISO/DIS 1042:2026 ist im Entwurf.
- **ISO 648:2008:** nur die Ausgabe 1977 gelesen.
- **EN 1089-3:** nur über die Zusammenfassung BCGA TIS 6, siehe [Gasflaschen](/normen/en-1089-3-gasflaschen.md).
- **ISO 4787, ISO 383, ISO 4797, ISO 3585, ISO 7010-Zeichen:** nicht frei lesbar; nur über Verweise in anderen Normen belegt.
- **ISO 4799 (Kühler):** keine Leseprobe gefunden; der Liebig- und der Rückflusskühler bleiben ohne Normdetails.
- **ISO 386, Abschnitt 9 (Striche und Ziffern am Thermometer):** nicht in der Leseprobe; ISO 1770 ist zurückgezogen.
- **Kolbenprober:** keine Norm gefunden; die Skala folgt dem Muster von ISO 384.
- ISO 385 und ISO 1773 sind laut Normverzeichnissen in periodischer Überprüfung (Stand 2024).

[^iteh-samples]: iTeh Standards, Leseproben
