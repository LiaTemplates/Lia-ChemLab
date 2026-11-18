---
type: Standard
title: ISO 384 – Grundsätze für Volumenmessgeräte
description: Klassen, Ex/In, Bezugstemperatur, Ablesen am Meniskus und die Regeln für Skalenstriche und Ziffern aller Volumenmessgeräte aus Glas.
resource: https://www.iso.org/standard/4365.html
tags: [norm, messgeraete, skala, meniskus]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-18T11:20:00Z }
stale_after: 2027-11-18T00:00:00Z
sources:
  - id: iso-384-1978
    resource: https://cdn.standards.iteh.ai/samples/4365/3473152c9c2349c186e73e9612ad0a39/ISO-384-1978.pdf
    title: ISO 384:1978, Leseprobe (Abschnitte 1–10)
    author: process:iso-tc48
---

# Inhalt

ISO 384 legt die Grundsätze fest, nach denen alle Volumenmessgeräte aus Glas genormt werden
(Bürette, Messkolben, Messzylinder, Pipette). Gelesen in der Ausgabe 1978, auf die ISO 385:2005
und ISO 4788:2005 ausdrücklich verweisen.

# Ablesen am Meniskus (5.4)

- Methode a: Die Oberkante des Strichs berührt waagerecht den tiefsten Punkt des Meniskus, das Auge liegt in derselben Ebene.[^iso-384-1978]
- Bei Quecksilber wird der höchste Punkt des Meniskus auf die Unterkante des Strichs gestellt.[^iso-384-1978]
- Methode b: Mitte des Strichs; das Auge sieht vorderen und hinteren Teil des Rings im tiefsten Punkt zusammenlaufen.

# Skalenstriche (8 und 9)

| Regel | Fundstelle |
|---|---|
| Striche sauber, dauerhaft, gleich dick, senkrecht zur Achse | 8.1, 8.4 |
| Striche nur auf zylindrischen Teilen, mindestens 10 mm von Durchmesseränderungen | 8.5 |
| Geräte ohne Skala: Strich ganz um den Umfang, Lücke höchstens 10 % | 8.6 |
| Teilung aus der Reihe 1 – 2 – 5 (mal Zehnerpotenz) | 6.3.2 |
| Muster I: kurze Striche etwa 50 % des Umfangs, mittlere etwa 65 %, lange ganz herum | 9.2.2 |
| Muster II/III: kurze 10–20 % des Umfangs, mittlere 1,5 × kurze, lange ganz herum bzw. ≥ 2 × kurze | 9.2.3, 9.2.4 |

# Folge der Striche (9.3)

- **Teilung 1 (bzw. 0,1, 10 …):** jeder 10. Strich lang, ein mittlerer in der Mitte dazwischen, vier kurze zwischen mittlerem und langem.
- **Teilung 2:** jeder 5. Strich lang, vier kurze dazwischen.
- **Teilung 5:** jeder 10. Strich lang, vier mittlere gleichmäßig dazwischen, ein kurzer zwischen zwei mittleren.

# Ziffern (10.4)

- Mindestens jeder 10. Strich wird beziffert.
- Ziffern nur an langen Strichen, **direkt über dem Strich und etwas rechts** der benachbarten kurzen Striche.
- Normalerweise nur ein Ziffernsatz.

# Folge für ChemLab

Alle Skalen in ChemLab sollen nach 9.3 und 10.4 gezeichnet werden; die Lupe zum Ablesen folgt 5.4.
Siehe [Zeichensprache](/gestaltung/zeichensprache.md).

[^iso-384-1978]: ISO 384:1978, Abschnitt 5.4
